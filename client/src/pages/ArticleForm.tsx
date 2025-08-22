import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const ArticleForm: React.FC = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (id) {
      const fetchArticle = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${API}/api/kb/${id}`);
          const { title, content, keywords } = res.data;
          setTitle(title);
          setContent(content);
          setKeywords(keywords.join(", "));
        } catch (err) {
          setError("Failed to load article for editing.");
        } finally {
          setLoading(false);
        }
      };
      fetchArticle();
    }
  }, [id, API]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const articleData = {
      title,
      content,
      keywords: keywords.split(",").map((k) => k.trim()),
    };

    try {
      if (id) {
        await axios.put(`${API}/api/kb/${id}`, articleData);
      } else {
        await axios.post(`${API}/api/kb`, articleData);
      }
      navigate("/kb");
    } catch (err) {
      setError("Failed to save the article.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {id ? "Edit Article" : "Create Article"}
      </h2>
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-md mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 font-medium mb-2">
            Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="content" className="block text-gray-700 font-medium mb-2">
            Content
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={10}
            required
          ></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor="keywords" className="block text-gray-700 font-medium mb-2">
            Keywords (comma-separated)
          </label>
          <input
            type="text"
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate("/kb")}
            className="text-gray-600 mr-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ArticleForm;
