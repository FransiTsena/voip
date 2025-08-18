import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEdit, FiTrash2, FiPlus, FiXCircle } from "react-icons/fi";

type Article = {
  _id: string;
  title: string;
  content: string;
  keywords: string[];
};

const KnowledgeBase: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API}/api/kb/search`);
        setArticles(res.data);
      } catch (err: any) {
        console.error("Error fetching articles:", err);
        setError("Failed to load articles.");
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [API]);

  const handleDeleteClick = (article: Article) => {
    setArticleToDelete(article);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    try {
      await axios.delete(`${API}/api/kb/${articleToDelete._id}`);
      setArticles(articles.filter((a) => a._id !== articleToDelete._id));
      setShowConfirmModal(false);
      setArticleToDelete(null);
    } catch (err: any) {
      console.error("Error deleting article:", err);
      setError(`Failed to delete article: ${err.response?.data?.message || err.message}`);
      setShowConfirmModal(false);
      setArticleToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setArticleToDelete(null);
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 p-4 bg-white shadow rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Knowledge Base</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-base font-medium transition-colors duration-200 flex items-center"
          onClick={() => navigate("/kb/new")}
        >
          <FiPlus className="mr-2" />
          Create Article
        </button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading articles...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Title</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Keywords</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">
                    No articles found. Click "Create Article" to add one.
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article._id} className="hover:bg-blue-50 transition-colors">
                    <td className="py-3 px-4 border-b text-gray-800">{article.title}</td>
                    <td className="py-3 px-4 border-b text-gray-600">{article.keywords.join(", ")}</td>
                    <td className="py-3 px-4 border-b">
                      <button
                        className="text-blue-600 hover:text-blue-800 mr-3 p-1 rounded-full hover:bg-blue-100 transition-colors"
                        onClick={() => navigate(`/kb/edit/${article._id}`)}
                        title="Edit"
                      >
                        <FiEdit size={18} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                        title="Delete"
                        onClick={() => handleDeleteClick(article)}
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showConfirmModal && articleToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4 transform transition-all scale-100 opacity-100">
            <div className="text-center">
              <FiXCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the article "<strong>{articleToDelete.title}</strong>"? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={cancelDelete}
                className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
