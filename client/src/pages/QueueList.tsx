import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, XCircle } from 'lucide-react'; // Using lucide-react for modern icons

type Queue = {
  _id: string;
  name: string;
  strategy?: string;
  description?: string;
};

const QueueList: React.FC = () => {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [queueToDelete, setQueueToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueues();
  }, []);

  const fetchQueues = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/queue`);
      // Ensure res.data is an array. If it's an object with a 'queue' key (as seen in IVR component), adjust here.
      setQueues(Array.isArray(res.data) ? res.data : res.data.queue || []);
    } catch (err) {
      console.error("Error fetching queues:", err);
      setError('Failed to fetch queues');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setQueueToDelete(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!queueToDelete) return; // Should not happen if modal is shown correctly
    try {
      await axios.delete(`${API}/api/queue/${encodeURIComponent(queueToDelete)}`);
      setQueues(queues.filter(q => q._id !== queueToDelete));
      setShowConfirmModal(false);
      setQueueToDelete(null);
      // Optionally, show a success toast/message here
    } catch (err) {
      setError('Failed to delete queue');
      setShowConfirmModal(false);
      setQueueToDelete(null);
      // Optionally, show an error toast/message here
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setQueueToDelete(null);
  };

  const handleEdit = (queueId: string) => {
    navigate(`/queues/edit/${encodeURIComponent(queueId)}`);
  };

  if (loading) return <div className="flex justify-center p-8 text-lg text-gray-600">Loading queues...</div>;
  if (error) return <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4 text-center text-sm">{error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center mb-4 justify-between">
  <h1 className="text-lg font-semibold text-gray-800">Queues</h1>
  <button
    onClick={() => navigate('/queue/dev')}
    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-base font-medium transition-colors duration-200"
  >
    Add Queue
  </button>
</div>

      <div className="bg-white shadow-lg border border-gray-100 overflow-hidden">
        {queues.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-lg">No queues found. Click "Add New Queue" to get started!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Strategy</th>
                  <th className="px-6 py-3 text-left font-bold text-gray-600 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {queues.map((queue) => (
                  <tr key={queue._id || queue.name} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900 text-base">{queue.name}</td>
                    <td className="px-6 py-4 text-gray-700 text-sm">{queue.strategy || 'ringall'}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{queue.description || 'No description provided'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(queue._id)}
                          className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-all duration-200 shadow-md transform hover:scale-110"
                          title="Edit Queue"
                          aria-label={`Edit ${queue.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(queue._id || '')}
                          className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-200 shadow-md transform hover:scale-110"
                          title="Delete Queue"
                          aria-label={`Delete ${queue.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4 transform transition-all scale-100 opacity-100">
            <div className="text-center">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the queue "<strong>{queueToDelete}</strong>"? This action cannot be undone.
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

export default QueueList;
