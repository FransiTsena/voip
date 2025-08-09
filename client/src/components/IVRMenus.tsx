import { useState, useEffect } from 'react'
import {FiTrash } from 'react-icons/fi'
import axios from 'axios'
import { useNavigate } from 'react-router-dom';
import type { IVROption } from './types'

type IVRMenu = {
  _id: string
  name: string
  greeting: string
  description: string
  options: IVROption[]
  createdAt: string
}

export default function IVRMenus() {
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [menus, setMenus] = useState<IVRMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate();

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

  const deleteMenu = async (id: string) => {
    console.log(id);
    if (!window.confirm('Are you sure you want to delete this menu?')) return
    try {
      await axios.delete(`${API}/api/ivr/menu/${id}`)
      setMenus(menus.filter(menu => menu._id !== id))
    } catch (err) {
      setError('Failed to delete menu')
      console.error(err)
    }
  }

  // const handleEdit = (id: string) => {
  //   // Add edit logic here
  // }

  const handleDelete = (id: string) => {
    deleteMenu(id)
  }

  if (loading) return <div className="flex justify-center p-8">Loading IVR menus...</div>
  if (error) return <div className="text-red-500 p-4">{error}</div>

  return (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold text-gray-800 mr-2">IVR Menus</h1>
        <button
          onClick={() => navigate('/new-ivr')}
          className="bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors text-xs font-medium shadow-sm"
        >
          + Add IVR Menu
        </button>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
        {menus.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No IVR menus found. Create your first one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-4 py-2 text-right font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {menus.map((menu) => (
                  <tr key={menu._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900 text-sm">{menu.name}</div>
                      <div className="text-gray-500 text-xs">
                        {menu.description || 'No description'}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => navigate(`/ivr-menu/edit/${menu._id}`)}
                          className="text-blue-600 hover:text-blue-900 px-2 py-1 rounded text-xs font-medium border border-blue-100 bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(menu._id)}
                          className="text-red-600 hover:text-red-900 px-2 py-1 rounded text-xs font-medium border border-red-100 bg-red-50"
                        >
                          <FiTrash className="h-4 w-4" />
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
    </div>
  )
}