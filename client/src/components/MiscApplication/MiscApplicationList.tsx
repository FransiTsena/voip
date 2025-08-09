import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiLoader, FiAlertCircle, FiInfo, FiTrash2 } from 'react-icons/fi';

// Define the interfaces for the data received from the backend
interface Destination {
  type: 'extension' | 'ivr' | 'queue' | 'recording';
  id: string; // Keep 'id' in the interface as the backend sends it, even if not displayed
}

interface MiscApplication {
  _id: string; // MongoDB document ID
  name: string;
  featureCode: string;
  destination: Destination; // This is now an object with type and id
  createdAt: string; // Or Date, depending on how you deserialize
  updatedAt: string; // Or Date
}

// Base API URL from environment variables, defaulting for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const MiscApplicationList = () => {
  const navigate = useNavigate();
  const [miscApplications, setMiscApplications] = useState<MiscApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [appToDelete, setAppToDelete] = useState<MiscApplication | null>(null);

  const fetchMiscApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get<{ data: MiscApplication[] } | MiscApplication[]>(`${API_URL}/api/misc`);
      setMiscApplications(Array.isArray(response.data) ? response.data : response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching Misc Applications:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch applications.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMiscApplications();
  }, []);

  const handleDeleteClick = (app: MiscApplication) => {
    setAppToDelete(app);
    setShowConfirmModal(true);
    setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!appToDelete) return;

    setDeleteLoading(true);
    setShowConfirmModal(false);
    try {
      await axios.delete(`${API_URL}/api/misc/${appToDelete._id}`);
      setMiscApplications(prevApps => prevApps.filter(app => app._id !== appToDelete._id));
      setAppToDelete(null);
      setDeleteError('');
    } catch (err: any) {
      console.error('Error deleting Misc Application:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete application.';
      setDeleteError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setAppToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <FiLoader className="animate-spin text-blue-500 text-4xl" />
        <p className="ml-3 text-lg text-gray-700">Loading Misc Applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center">
          <FiAlertCircle className="text-xl mr-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (miscApplications.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-md flex items-center">
          <FiInfo className="text-xl mr-2" />
          <p>No Misc Applications found. Create one to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 font-sans">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">All Misc Applications</h2>

        <button
          className="mb-6 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow transition-colors duration-200"
          onClick={() => navigate('/new-misc-application')}

        >
          + Create New Misc
        </button>

        {deleteLoading && (
          <div className="flex items-center justify-center p-3 mb-4 bg-yellow-50 text-yellow-700 rounded-md text-sm">
            <FiLoader className="animate-spin mr-2" /> Deleting application...
          </div>
        )}
        {deleteError && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm flex items-center">
            <span className="mr-2 text-lg">⚠️</span> {deleteError}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              {/* Corrected whitespace: th tags immediately follow tr opening */}
              <tr className="bg-gray-100 border-b border-gray-200 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">
                <th className="px-6 py-3 rounded-tl-lg">Name</th>
                <th className="px-6 py-3">Feature Code</th>
                <th className="px-6 py-3">Destination Type</th>
                <th className="px-6 py-3 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {miscApplications.map((app) => (
                // Corrected whitespace: td tags immediately follow tr opening
                <tr key={app._id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{app.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{app.featureCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {app.destination?.type ? app.destination.type.toUpperCase() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    <button
                      onClick={() => handleDeleteClick(app)}
                      className="text-red-600 hover:text-red-800 transition-colors duration-200"
                      title="Delete Application"
                      disabled={deleteLoading}
                    >
                      <FiTrash2 className="inline-block text-lg" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && appToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the Misc Application "<strong>{appToDelete.name}</strong>" (Feature Code: {appToDelete.featureCode}, Destination Type: {appToDelete.destination?.type?.toUpperCase() || 'N/A'})? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors duration-200"
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

export default MiscApplicationList;