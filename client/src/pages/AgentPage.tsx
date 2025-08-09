import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSave, FiXCircle, FiTrash2, FiLoader } from 'react-icons/fi';

// --- IMPORT YOUR TAB COMPONENTS ---
import AdvancedSettings from '../components/AGENT/AgentAdvancedSetting';
import FindMeFollowMeSettings from '../components/AGENT/FindMeFollowMeSetting';
import GeneralSettings from '../components/AGENT/GeneralSettings';
import OtherSettings from '../components/AGENT/OtherSettingsComponent';
import PinSetsSettings from '../components/AGENT/PingToSetSetting';
import VoicemailSettings from '../components/AGENT/VoiceMailSetting';

// --- IMPORTS FOR TYPES AND COMMON COMPONENTS ---
// Assuming AgentFormData and initialAgentFormData are imported from here
import { AgentFormData, initialAgentFormData } from '../types/agent';

// Assuming FormRow is now an external component and correctly imported
import FormRow from '../components/AGENT/FormRow';

// --- API Base URL ---
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const AgentForm: React.FC = () => {
  // *** CHANGE 1: Use 'id' from useParams instead of 'userExtension' ***
  const { id } = useParams<{ id: string }>(); // 'id' will be the MongoDB _id
  const navigate = useNavigate();

  const [formData, setFormData] = useState<AgentFormData>(initialAgentFormData);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [activeTab, setActiveTab] = useState<string>('General');
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // *** CHANGE 2: 'isEditing' now depends on the presence of 'id' ***
  const isEditing = useMemo(() => !!id, [id]);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!isEditing) {
        setFormData(initialAgentFormData);
        setInitialLoading(false);
        return;
      }

      setInitialLoading(true);
      setFetchError(null);
      try {
        // *** CHANGE 3: Fetch using '/api/agent/dev/:id' ***
        const response = await axios.get<AgentFormData>(`${API_URL}/api/agent/ex/${id}`);
        // Ensure that fetched data is merged with defaults
        setFormData({ ...initialAgentFormData, ...response.data });
        setInitialLoading(false);
      } catch (err: any) {
        console.error('Error fetching agent data:', err);
        const errorMessage = err.response?.data?.message || err.message || 'Failed to load agent data.';
        setFetchError(errorMessage);
        setInitialLoading(false);
      }
    };

    fetchAgentData();
  }, [isEditing, id]); // *** CHANGE 4: Dependency array uses 'id' ***

  const handleChange = useCallback((name: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setMessageType(null);

    // Basic client-side validation for required fields
    if (!formData.userExtension || !formData.displayName || !formData.secret) {
      setMessage('User Extension, Display Name, and Secret are required.');
      setMessageType('error');
      setTimeout(() => { setMessage(null); setMessageType(null); }, 3000);
      return;
    }

    const method = isEditing ? 'put' : 'post';
    // *** CHANGE 5: Update URL for PUT (editing) to use '/api/agent/dev/:id' ***
    // POST (creation) remains '/api/agent/register'
    const url = isEditing
      ? `${API_URL}/api/agent/${id}` // Use 'id' for existing agent update
      : `${API_URL}/api/agent/register`;  // For new agent registration

    try {
      const response = await axios[method](url, formData);
      if (response.status === 200 || response.status === 201) {
        setMessage(`Agent ${isEditing ? 'updated' : 'created'} successfully!`);
        setMessageType('success');
        if (!isEditing) {
          // *** CHANGE 6: After creating, navigate using the returned _id if available ***
          // Assuming your /api/agent/register endpoint returns the newly created agent's data, including _id
          if (response.data._id) {
            navigate(`/agent/dev/${response.data._id}`); // Navigate to the new agent's edit page by its _id
          } else {
            // Fallback if _id is not returned immediately for new agents (less ideal)
            navigate(`/agents/list`); // Or some other appropriate page
            console.warn("New agent's _id not returned by registration endpoint. Cannot navigate to its edit page.");
          }
        }
      } else {
        setMessage(response.data.message || `Failed to ${isEditing ? 'update' : 'create'} agent.`);
        setMessageType('error');
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Network error or unexpected issue. Please try again.');
      }
      setMessageType('error');
    }
    setTimeout(() => { setMessage(null); setMessageType(null); }, 3000);
  };

  const handleReset = useCallback(() => {
    setFormData(isEditing ? formData : initialAgentFormData);
    setMessage('Form reset successfully!');
    setMessageType('success');
    setTimeout(() => { setMessage(null); setMessageType(null); }, 3000);
  }, [isEditing, formData]);

  const handleDelete = useCallback(async () => {
    // *** CHANGE 7: Ensure 'id' exists for deletion ***
    if (!isEditing || !id) {
      setMessage('Cannot delete: No agent selected or not in edit mode.');
      setMessageType('error');
      return;
    }

    if (window.confirm(`Are you sure you want to delete agent with ID ${id}? This action cannot be undone.`)) {
      setMessage(null);
      setMessageType(null);
      try {
        // *** CHANGE 8: Delete using '/api/agent/dev/:id' ***
        await axios.delete(`${API_URL}/api/agent/dev/${id}`);
        setMessage('Agent deleted successfully!');
        setMessageType('success');
        navigate('/agents/list'); // Redirect to a list of agents after successful deletion
      } catch (error: any) {
        setMessage(error.response?.data?.message || 'Failed to delete agent.');
        setMessageType('error');
      }
      setTimeout(() => { setMessage(null); setMessageType(null); }, 3000);
    }
  }, [isEditing, id, navigate]); // *** CHANGE 9: Dependency array uses 'id' ***

  const renderTabContent = useMemo(() => {
    const commonProps = {
      formData,
      handleChange,
      FormRow,
    };

    switch (activeTab) {
      case 'General':
        return <GeneralSettings {...commonProps} />;
      case 'Voicemail':
        // *** IMPORTANT: Make sure these components accept commonProps if they need FormRow, formData, or handleChange ***
        return <VoicemailSettings />;
      case 'Find Me/Follow Me':
        return <FindMeFollowMeSettings />;
      case 'Advanced':
        return <AdvancedSettings  {...commonProps} />;
      case 'Pin Sets':
        return <PinSetsSettings />;
      case 'Other':
        return <OtherSettings  />;
      default:
        return null;
    }
  }, [activeTab, formData, handleChange]);

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 font-sans flex justify-center items-center">
        <div className="flex items-center text-blue-600 text-lg">
          <FiLoader className="animate-spin mr-3 text-3xl" />
          Loading agent data...
        </div>
      </div>
    );
  }

  if (fetchError && isEditing) {
    return (
      <div className="min-h-screen bg-gray-100 p-8 font-sans flex justify-center items-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <FiXCircle className="inline-block mr-2" />
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline ml-2">{fetchError}</span>
          <p className="mt-2 text-sm">Please check the URL or try again later.</p>
          <button
            onClick={() => navigate('/agents/list')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Agent List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans flex justify-center items-start">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl overflow-hidden">
        {/* Header Tabs */}
        <div className="flex bg-gray-50 border-b border-gray-200">
          {['General', 'Voicemail', 'Find Me/Follow Me', 'Advanced', 'Pin Sets', 'Other'].map((tabName) => (
            <button
              key={tabName}
              onClick={() => setActiveTab(tabName)}
              className={`px-6 py-3 text-sm font-semibold focus:outline-none transition-colors duration-200
                ${activeTab === tabName
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent'
                }`}
            >
              {tabName}
            </button>
          ))}
        </div>

        {/* Message Display (Success/Error) */}
        {message && (
          <div className={`p-3 text-center rounded-md mx-6 mt-4 ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {isEditing ? `Edit Agent: ${formData.userExtension || 'Loading...'}` : 'Add New Agent'}
          </h2>

          {renderTabContent}

          {/* Form Actions (Submit, Reset, Delete) */}
          <div className="flex justify-end space-x-4 mt-8 p-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              <FiXCircle className="inline-block mr-2" /> Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              <FiSave className="inline-block mr-2" /> {isEditing ? 'Update Agent' : 'Create Agent'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                <FiTrash2 className="inline-block mr-2" /> Delete Agent
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgentForm;