import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const CannedResponseForm: React.FC = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (id) {
      const fetchResponse = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${API}/api/canned-responses/${id}`);
          const { title, body, category, keywords } = res.data;
          setTitle(title);
          setBody(body);
          setCategory(category);
          setKeywords(keywords.join(", "));
        } catch (err) {
          setError("Failed to load canned response for editing.");
        } finally {
          setLoading(false);
        }
      };
      fetchResponse();
    }
  }, [id, API]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const responseData = {
      title,
      body,
      category,
      keywords: keywords.split(",").map((k) => k.trim()),
    };

    try {
      if (id) {
        await axios.put(`${API}/api/canned-responses/${id}`, responseData);
      } else {
        await axios.post(`${API}/api/canned-responses`, responseData);
      }
      navigate("/canned-responses");
    } catch (err) {
      setError("Failed to save the canned response.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {id ? "Edit Canned Response" : "Create Canned Response"}
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
          <label htmlFor="body" className="block text-gray-700 font-medium mb-2">
            Body
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={10}
            required
          ></textarea>
        </div>
        <div className="mb-4">
          <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
            Category
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
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
            onClick={() => navigate("/canned-responses")}
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

export default CannedResponseForm;
