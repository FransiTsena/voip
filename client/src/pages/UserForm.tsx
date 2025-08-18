import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

const UserForm: React.FC = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("agent");
  const [userExtension, setUserExtension] = useState("");
  const [queues, setQueues] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    if (isEditing) {
      const fetchUser = async () => {
        setLoading(true);
        try {
          const res = await axios.get(`${API}/api/users/${id}`, { withCredentials: true });
          const { displayName, email, role, userExtension, profile } = res.data;
          setDisplayName(displayName);
          setEmail(email);
          setRole(role);
          if (userExtension) setUserExtension(userExtension);
          if (profile && profile.queues) setQueues(profile.queues.join(", "));
        } catch (err) {
          setError("Failed to load user for editing.");
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    }
  }, [id, isEditing, API]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const userData: any = {
      displayName,
      email,
      role,
    };

    if (password) {
        userData.password = password;
    }

    if (role === 'agent') {
      userData.userExtension = userExtension;
      userData.queues = queues.split(",").map((q) => q.trim());
    }

    try {
      if (isEditing) {
        await axios.put(`${API}/api/users/${id}`, userData, { withCredentials: true });
      } else {
        await axios.post(`${API}/api/auth/register`, userData, { withCredentials: true });
      }
      navigate(role === 'agent' ? '/agents' : '/supervisors');
    } catch (err) {
      setError("Failed to save the user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        {isEditing ? "Edit User" : "Create User"}
      </h2>
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-md mb-4">{error}</div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="displayName" className="block text-gray-700 font-medium mb-2">
            Display Name
          </label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
            Password {isEditing ? "(leave blank to keep current password)" : ""}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-md"
            required={!isEditing}
          />
        </div>
        <div className="mb-4">
          <label htmlFor="role" className="block text-gray-700 font-medium mb-2">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 border rounded-md"
          >
            <option value="agent">Agent</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {role === 'agent' && (
          <>
            <div className="mb-4">
              <label htmlFor="userExtension" className="block text-gray-700 font-medium mb-2">
                User Extension
              </label>
              <input
                type="text"
                id="userExtension"
                value={userExtension}
                onChange={(e) => setUserExtension(e.target.value)}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="queues" className="block text-gray-700 font-medium mb-2">
                Queues (comma-separated)
              </label>
              <input
                type="text"
                id="queues"
                value={queues}
                onChange={(e) => setQueues(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </>
        )}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
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

export default UserForm;
