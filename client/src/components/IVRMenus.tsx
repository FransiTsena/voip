import { useState, useEffect } from 'react'
import { FiTrash2, FiPlus, FiEdit, FiLoader, FiAlertCircle, FiInfo } from 'react-icons/fi'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';

// Define the interfaces for the data received from the backend
interface IVROption {
  // Assuming IVROption type is defined elsewhere, but for this component, we don't need its details
  // I will just keep the placeholder here to avoid a type error
  optionKey: string;
  destination: string;
}

type IVRMenu = {
  _id: string
  name: string
  greeting: string
  description: string
  options: IVROption[]
  createdAt: string
}

export default function IVRMenus() {
  const API = import.meta.env.VITE_API_URL || 'https://localhost:4000';
  const [menus, setMenus] = useState<IVRMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate();
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [menuToDelete, setMenuToDelete] = useState<IVRMenu | null>(null);

  useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API}/api/ivr/menu`)
      setMenus(response.data)
    } catch (err) {
      setError('Failed to fetch IVR menus')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (menu: IVRMenu) => {
    setMenuToDelete(menu);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!menuToDelete) return;
    try {
      await axios.delete(`${API}/api/ivr/menu/${menuToDelete._id}`)
      setMenus(menus.filter(menu => menu._id !== menuToDelete._id))
    } catch (err) {
      setError('Failed to delete menu')
      console.error(err)
    } finally {
      setShowConfirmModal(false);
      setMenuToDelete(null);
    }
  }

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setMenuToDelete(null);
  }

  // --- UI States: Loading, Error, Empty ---
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <FiLoader className="animate-spin text-blue-500 text-5xl" />
        <p className="ml-4 text-xl text-gray-700">Loading IVR menus...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center shadow-inner">
          <FiAlertCircle className="text-2xl mr-3" />
          <p className="text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">IVR Menus</h1>
          <button
            onClick={() => navigate('/new-ivr')}
            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105"
          >
            <FiPlus className="mr-2" /> Add IVR Menu
          </button>
        </div>

        {menus.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col justify-center items-center min-h-[250px]">
            <div className="p-6 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg flex items-center shadow-inner">
              <FiInfo className="text-2xl mr-3" />
              <p className="text-lg font-medium">No IVR menus found. Create your first one!</p>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl shadow-lg">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menus.map((menu) => (
                  <tr key={menu._id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-md text-gray-800 font-medium">
                      {menu.name}
                    </td>
                    <td className="px-6 py-4 text-md text-gray-600">
                      {menu.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/ivr-menu/edit/${menu._id}`)}
                          className="text-blue-500 hover:text-blue-700 transition-colors duration-200 p-2 rounded-full hover:bg-blue-50"
                          title="Edit Menu"
                        >
                          <FiEdit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(menu)}
                          className="text-red-500 hover:text-red-700 transition-colors duration-200 p-2 rounded-full hover:bg-red-50"
                          title="Delete Menu"
                        >
                          <FiTrash2 className="h-5 w-5" />
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

      {/* Confirmation Modal */}
      {showConfirmModal && menuToDelete && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full">
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Confirm Deletion</h3>
            <p className="text-gray-700 mb-6 leading-relaxed">
              Are you sure you want to delete the IVR menu "<strong>{menuToDelete.name}</strong>"? This action cannot be undone.
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
  )
}
