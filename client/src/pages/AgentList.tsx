import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiEdit, FiTrash2, FiXCircle } from "react-icons/fi";

type Agent = {
  _id: string;
  userExtension: string;
  displayName: string;
};

const AgentList: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API}/api/agent`);
        const data = Array.isArray(res.data)
          ? res.data
          : res.data.extensions || [];
        const filtered = data.map((a: any) => ({
          _id: a._id,
          userExtension: a.userExtension,
          displayName: a.displayName,
        }));
        setAgents(filtered);
      } catch (err: any) {
        console.error("Error fetching agents:", err);
        setError("Failed to load agents.");
      } finally {
        setLoading(false);
      }
    };
    fetchAgents();
  }, [API]);

  const handleDeleteClick = (agent: Agent) => {
    setAgentToDelete(agent);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!agentToDelete) return;
    try {
      await axios.delete(`${API}/api/agent/${agentToDelete._id}`);
      setAgents(agents.filter(a => a._id !== agentToDelete._id));
      setShowConfirmModal(false);
      setAgentToDelete(null);
    } catch (err: any) {
      console.error("Error deleting agent:", err);
      setError(`Failed to delete agent: ${err.response?.data?.message || err.message}`);
      setShowConfirmModal(false);
      setAgentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setAgentToDelete(null);
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-4 bg-white shadow rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Agents</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-base font-medium transition-colors duration-200"
          onClick={() => navigate("/agent/dev")}
        >
          Create Extension
        </button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading agents...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Name</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Extension</th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {agents.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-gray-500">
                    No agents found. Click "Create Extension" to add one.
                  </td>
                </tr>
              ) : agents.map((agent) => (
                <tr key={agent._id} className="hover:bg-blue-50 transition-colors">
                  <td className="py-3 px-4 border-b text-gray-800">{agent.displayName}</td>
                  <td className="py-3 px-4 border-b text-gray-600">{agent.userExtension}</td>
                  <td className="py-3 px-4 border-b">
                    <button
                      className="text-blue-600 hover:text-blue-800 mr-3 p-1 rounded-full hover:bg-blue-100 transition-colors"
                      onClick={() => navigate(`/agent/dev/${agent._id}`)}
                      title="Edit"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-100 transition-colors"
                      title="Delete"
                      onClick={() => handleDeleteClick(agent)}
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showConfirmModal && agentToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4 transform transition-all scale-100 opacity-100">
            <div className="text-center">
              <FiXCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete agent "<strong>{agentToDelete.displayName}</strong>" (Extension: {agentToDelete.userExtension})? This action cannot be undone.
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

export default AgentList;
