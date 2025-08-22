import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiLoader, FiAlertCircle, FiInfo, FiTrash2, FiPlus } from 'react-icons/fi';

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

  // Shared classes for consistent card styling
  const cardClasses = "bg-white rounded-xl shadow-lg p-8 font-sans";

  // Loading, error, and empty states with improved styling
  if (loading) {
    return (
      <div className={`${cardClasses} flex justify-center items-center h-64`}>
        <FiLoader className="animate-spin text-blue-500 text-5xl" />
        <p className="ml-4 text-xl text-gray-700">Loading applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardClasses} flex justify-center items-center h-64`}>
        <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center shadow-inner">
          <FiAlertCircle className="text-2xl mr-3" />
          <p className="text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (miscApplications.length === 0) {
    return (
      <div className={`${cardClasses} flex flex-col justify-center items-center h-64`}>
        <div className="p-6 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg flex items-center shadow-inner">
          <FiInfo className="text-2xl mr-3" />
          <p className="text-lg font-medium">No applications found. Create one to get started!</p>
        </div>
        <button
          className="mt-6 flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
          onClick={() => navigate('/new-misc-application')}
        >
          <FiPlus className="mr-2" /> Create New Application
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          {/* Main title */}
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Misc Applications</h1>

          {/* Create New Button */}
          <button
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
            onClick={() => navigate('/new-misc-application')}
          >
            <FiPlus className="mr-2" /> Create New
          </button>
        </div>

        {/* Delete status messages */}
        {deleteLoading && (
          <div className="flex items-center justify-center p-4 mb-6 bg-yellow-50 text-yellow-700 rounded-lg text-lg shadow-sm">
            <FiLoader className="animate-spin mr-3" /> Deleting application...
          </div>
        )}
        {deleteError && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 rounded-lg text-lg flex items-center shadow-sm">
            <FiAlertCircle className="mr-3 text-xl" /> {deleteError}
          </div>
        )}

        {/* The main table container with styling */}
        <div className="overflow-hidden rounded-xl shadow-lg">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Feature Code</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Destination Type</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {miscApplications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-800 font-medium">{app.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-600">{app.featureCode}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-600">
                    {app.destination?.type ? app.destination.type.toUpperCase() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-md text-gray-600">
                    <button
                      onClick={() => handleDeleteClick(app)}
                      className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
                      title="Delete Application"
                      disabled={deleteLoading}
                    >
                      <FiTrash2 className="inline-block text-xl" />
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
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to delete the application named "<strong>{appToDelete.name}</strong>"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors duration-200 font-medium shadow-md"
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
