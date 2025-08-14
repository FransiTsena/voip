import React, { useState, useCallback, useEffect } from 'react';
import QueueAgentsTab from '../components/QUEUE/QueueAgentsTab';
import CapacityOptionsTab from '../components/QUEUE/QueueCapacityOptionForm';
import TimingAgentOptionsTab from '../components/QUEUE/TimeingAgentForm';
import axios from 'axios';
import { useParams } from 'react-router-dom'; // Import useParams

// Import all types and options from the new file
import {
  QueueFormData,
  Agent,
  TimingAgentFormData,
  CapacityFormData,

} from '../types/queueTypes'; // Adjust path as necessary

// Corrected import for GeneralSettings (from QUEUE folder)
import GeneralSettings from '../components/QUEUE/GeneralSettings';
import CallerAnnouncements from '../components/QUEUE/CallerAnnouncements';
import AdvancedOption from '../components/QUEUE/AdvancedOption';
import RecetQueueStats from '../components/QUEUE/RecetQueueStats';




const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';


const QueueForm: React.FC = () => {
  // Use useParams to get the queueId from the URL
  const { id } = useParams<{ id: string }>(); // 'id' will be the queue ID from the URL like /queues/edit/:id

  // State to hold the ID of the queue being edited.
  // This will now be initialized from the URL parameter.
  const [queueId] = useState<string | null>(id || null);

  const [formData, setFormData] = useState<QueueFormData>({
    queueNumber: '',
    queueName: '',
    queueNoAnswer: 'No',
    callConfirm: 'No',
    callConfirmAnnounce: 'Default',
    cidNamePrefix: '',
    waitTimePrefix: 'No',
    alertInfo: 'None',
    ringerVolumeOverride: '',
    ringerVolumeOverrideMode: 'No',
    restrictDynamicAgents: 'No',
    agentRestrictions: 'Call as Dialed',
    ringStrategy: 'ringall',
    autofill: 'No',
    skipBusyAgents: 'No',
    queueWeight: 0,
    musicOnHoldClass: 'inherit',
    joinAnnouncement: 'None',
    callRecording: 'no',
    markCallsAnsweredElsewhere: 'No',
    failOverDestination: 'playRecordings',
  });

  // State for messages (e.g., success/error)
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);
  const [loadingQueueData, setLoadingQueueData] = useState<boolean>(false);


  // State for active tab
  const [activeTab, setActiveTab] = useState<string>('General Settings');

  // Fetch agents from backend API
  const [allAgents, setAllAgents] = useState<Agent[]>([]); // Initially empty

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/agent`);
        // Map the response to your Agent type used in the UI
        const agents = response.data.map((a: any) => ({
          id: a._id,
          name: a.displayName,
          extension: a.userExtension,
        }));
        setAllAgents(agents);
      } catch (error) {
        console.error('Error fetching agents:', error);
        setAllAgents([]); // fallback to empty list
      }
    };
    fetchAgents();
  }, []);

  // States for Queue Agents tab (managed by QueueAgentsTab component, but parent holds the data)
  // allAgents is now set by API above
  const [selectedQueueAgents, setSelectedQueueAgents] = useState<Agent[]>([]); // Initially no agents selected

  // State for Timing & Agent Options tab
  const [timingAgentFormData, setTimingAgentFormData] = useState<TimingAgentFormData>({
    maxWaitTime: 'Unlimited',
    maxWaitTimeMode: 'Strict',
    agentTimeout: '15',
    agentTimeoutRestart: 'No',
    retry: '5',
    wrapUpTime: '0',
    memberDelay: '0',
    agentAnnouncement: 'None',
    reportHoldTime: 'No',
    autoPause: 'No',
    autoPauseOnBusy: 'No',
    autoPauseOnUnavailable: 'No',
    autoPauseDelay: 0,
  });

  // State for Capacity Options tab
  const [capacityFormData, setCapacityFormData] = useState<CapacityFormData>({
    maxCallers: 100,
    joinEmpty: 'Yes',
    leaveEmpty: 'No',
    penaltyMembersLimit: 'Honor Penalties',
  });

  // Effect to fetch queue data if in edit mode
  useEffect(() => {
    const fetchQueueData = async () => {
      if (queueId) { // Use the queueId from useParams
        setLoadingQueueData(true);
        try {
          // Assuming your backend endpoint for fetching a single queue by ID is /api/queue/:id
          const response = await axios.get(`${backendUrl}/api/queue/${queueId}`);
          const fetchedQueue = response.data;
          console.log(fetchedQueue);
          // Populate formData
          setFormData({
            queueNumber: fetchedQueue.generalSettings?.queueNumber || '', // Use generalSettings.queueNumber
            queueName: fetchedQueue.name || '',
            queueNoAnswer: fetchedQueue.generalSettings?.queueNoAnswer || 'No',
            callConfirm: fetchedQueue.generalSettings?.callConfirm || 'No',
            callConfirmAnnounce: fetchedQueue.generalSettings?.callConfirmAnnounce || 'Default',
            cidNamePrefix: fetchedQueue.generalSettings?.cidNamePrefix || '',
            waitTimePrefix: fetchedQueue.generalSettings?.waitTimePrefix || 'No',
            alertInfo: fetchedQueue.generalSettings?.alertInfo || 'None',
            ringerVolumeOverride: fetchedQueue.generalSettings?.ringerVolumeOverride || '',
            ringerVolumeOverrideMode: fetchedQueue.generalSettings?.ringerVolumeOverrideMode || 'No',
            restrictDynamicAgents: fetchedQueue.generalSettings?.restrictDynamicAgents || 'No',
            agentRestrictions: fetchedQueue.generalSettings?.agentRestrictions || 'Call as Dialed',
            ringStrategy: fetchedQueue.generalSettings?.ringStrategy || 'ringall',
            autofill: fetchedQueue.generalSettings?.autofill || 'No',
            skipBusyAgents: fetchedQueue.generalSettings?.skipBusyAgents || 'No',
            queueWeight: fetchedQueue.generalSettings?.queueWeight || 0,
            musicOnHoldClass: fetchedQueue.generalSettings?.musicOnHoldClass || 'inherit',
            joinAnnouncement: fetchedQueue.generalSettings?.joinAnnouncement || 'None',
            callRecording: fetchedQueue.generalSettings?.callRecording || 'no',
            markCallsAnsweredElsewhere: fetchedQueue.generalSettings?.markCallsAnsweredElsewhere || 'No',
            failOverDestination: fetchedQueue.generalSettings?.failOverDestination || 'playRecordings',
          });

          // Populate selectedQueueAgents
          setSelectedQueueAgents(fetchedQueue.queueAgents || []);

          // Populate timingAgentFormData
          setTimingAgentFormData({
            maxWaitTime: fetchedQueue.timingAgentOptions?.maxWaitTime || 'Unlimited',
            maxWaitTimeMode: fetchedQueue.timingAgentOptions?.maxWaitTimeMode || 'Strict',
            agentTimeout: fetchedQueue.timingAgentOptions?.agentTimeout || '15',
            agentTimeoutRestart: fetchedQueue.timingAgentOptions?.agentTimeoutRestart || 'No',
            retry: fetchedQueue.timingAgentOptions?.retry || '5',
            wrapUpTime: fetchedQueue.timingAgentOptions?.wrapUpTime || '0',
            memberDelay: fetchedQueue.timingAgentOptions?.memberDelay || '0',
            agentAnnouncement: fetchedQueue.timingAgentOptions?.agentAnnouncement || 'None',
            reportHoldTime: fetchedQueue.timingAgentOptions?.reportHoldTime || 'No',
            autoPause: fetchedQueue.timingAgentOptions?.autoPause || 'No',
            autoPauseOnBusy: fetchedQueue.timingAgentOptions?.autoPauseOnBusy || 'No',
            autoPauseOnUnavailable: fetchedQueue.timingAgentOptions?.autoPauseOnUnavailable || 'No',
            autoPauseDelay: fetchedQueue.timingAgentOptions?.autoPauseDelay || 0,
          });

          // Populate capacityFormData
          setCapacityFormData({
            maxCallers: fetchedQueue.capacityOptions?.maxCallers || 100,
            joinEmpty: fetchedQueue.capacityOptions?.joinEmpty || 'Yes',
            leaveEmpty: fetchedQueue.capacityOptions?.leaveEmpty || 'No',
            penaltyMembersLimit: fetchedQueue.capacityOptions?.penaltyMembersLimit || 'Honor Penalties',
          });

        } catch (error) {
          console.error('Error fetching queue data:', error);
          setMessage('Failed to load queue data.');
          setMessageType('error');
        } finally {
          setLoadingQueueData(false);
        }
      }
    };

    fetchQueueData();
  }, [queueId]); // Re-run when queueId changes


  // Handle input changes for text, number, and select fields
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  }, []); // Empty dependency array means this function is created once

  // Handle button group changes (Yes/No, Force/Don't Care/No, etc.)
  // Memoize these callbacks for stability
  const handleQueueNoAnswerChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, queueNoAnswer: value }));
  }, []);

  const handleCallConfirmChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, callConfirm: value }));
  }, []);

  const handleWaitTimePrefixChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, waitTimePrefix: value }));
  }, []);

  const handleRingerVolumeOverrideModeChange = useCallback((value: 'Force' | 'Don\'t Care' | 'No') => {
    setFormData(prev => ({ ...prev, ringerVolumeOverrideMode: value }));
  }, []);

  const handleRestrictDynamicAgentsChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, restrictDynamicAgents: value }));
  }, []);

  const handleAgentRestrictionsChange = useCallback((value: 'Call as Dialed' | 'No Follow-Me or Call Forward' | 'Extensions Only') => {
    setFormData(prev => ({ ...prev, agentRestrictions: value }));
  }, []);

  const handleAutofillChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, autofill: value }));
  }, []);

  const handleSkipBusyAgentsChange = useCallback((value: 'Yes' | 'No' | 'Yes + (ringinuse=no)' | 'Queue calls only (ringinuse=no)') => {
    setFormData(prev => ({ ...prev, skipBusyAgents: value }));
  }, []);

  // const handleJoinAnnouncementChange = useCallback((value: string) => {
  //   setFormData(prev => ({ ...prev, joinAnnouncement: value }));
  // }, []);

  const handleCallRecordingChange = useCallback((value: 'force' | 'yes' | 'dontcare' | 'no' | 'never') => {
    setFormData(prev => ({ ...prev, callRecording: value }));
  }, []);

  const handleMarkCallsAnsweredElsewhereChange = useCallback((value: 'Yes' | 'No') => {
    setFormData(prev => ({ ...prev, markCallsAnsweredElsewhere: value }));
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setMessage(null);
  setMessageType(null);

  const payload = {
    generalSettings: formData,
    queueAgents: selectedQueueAgents,
    timingAgentOptions: timingAgentFormData,
    capacityOptions: capacityFormData,
  };

  try {
   
    if (queueId) {
      // Update existing queue
      await axios.put(`${backendUrl}/api/queue/${queueId}`, payload, {
        withCredentials: true,
      });
      setMessage("Queue updated successfully!");
    } else {
      // Create new queue
      await axios.post(`${backendUrl}/api/queue`, payload, {
        withCredentials: true,
      });
      setMessage("Queue created successfully!");
    }

    setMessageType("success");
    // Optionally reset form or redirect here

  } catch (error: any) {
    console.error("Queue submit error:", error);
    setMessage(error?.response?.data?.error || "Failed to process queue");
    setMessageType("error");
  }

  setTimeout(() => {
    setMessage(null);
    setMessageType(null);
  }, 3000);
};

  const handleReset = () => {
    setFormData({
      queueNumber: '',
      queueName: '',
      queueNoAnswer: 'No',
      callConfirm: 'No',
      callConfirmAnnounce: 'Default',
      cidNamePrefix: '',
      waitTimePrefix: 'No',
      alertInfo: 'None',
      ringerVolumeOverride: '',
      ringerVolumeOverrideMode: 'No',
      restrictDynamicAgents: 'No',
      agentRestrictions: 'Call as Dialed',
      ringStrategy: 'ringall',
      autofill: 'No',
      skipBusyAgents: 'No',
      queueWeight: 0,
      musicOnHoldClass: 'inherit',
      joinAnnouncement: 'None',
      callRecording: 'no',
      markCallsAnsweredElsewhere: 'No',
      failOverDestination: 'playRecordings',
    });
    // Reset agent-related states
    setSelectedQueueAgents([]);
    // Removed setAllAgents(dummyAgents); as allAgents is now fetched from API
    setTimingAgentFormData({
      maxWaitTime: 'Unlimited',
      maxWaitTimeMode: 'Strict',
      agentTimeout: '15',
      agentTimeoutRestart: 'No',
      retry: '5',
      wrapUpTime: '0',
      memberDelay: '0',
      agentAnnouncement: 'None',
      reportHoldTime: 'No',
      autoPause: 'No',
      autoPauseOnBusy: 'No',
      autoPauseOnUnavailable: 'No',
      autoPauseDelay: 0,
    });
    setCapacityFormData({
      maxCallers: 100,
      joinEmpty: 'Yes',
      leaveEmpty: 'No',
      penaltyMembersLimit: 'Honor Penalties',
    });
    setMessage('Form reset successfully!');
    setMessageType('success');
    setTimeout(() => {
      setMessage(null);
      setMessageType(null);
    }, 3000);
  };

  const handleDelete = async () => { // Made async to handle API call
    if (window.confirm("Are you sure you want to delete this queue? This action cannot be undone.")) {
      if (queueId) {
        try {
          await axios.delete(`${backendUrl}/api/queue/${queueId}`);
          setMessage('Queue deleted successfully!');
          setMessageType('success');
          // Optionally redirect to queue list after successful deletion
          // navigate('/queues'); // You'd need to import useNavigate from 'react-router-dom'
        } catch (error: any) {
          setMessage(error?.response?.data?.error || 'Failed to delete queue');
          setMessageType('error');
        }
      } else {
        setMessage('No queue ID to delete.');
        setMessageType('error');
      }
      setTimeout(() => {
        setMessage(null);
        setMessageType(null);
      }, 3000);
    }
  };

  if (loadingQueueData) {
    return (
      <div className="min-h-screen bg-gray-100 p-4 font-sans flex justify-center items-center">
        <div className="text-lg text-gray-600">Loading queue data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans flex justify-center items-start">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl mx-auto px-4 sm:px-8 overflow-hidden">
        {/* Header Tabs */}
        <div className="flex bg-gray-50 border-b border-gray-200">
          {['General Settings', 'Queue Agents', 'Timing & Agent Options', 'Capacity Options', 'Caller Announcements', 'Advanced Options', 'Reset Queue Stats'].map((tabName) => (
            <button
              key={tabName}
              onClick={() => setActiveTab(tabName)}
              className={`px-4 py-2 text-xs font-semibold focus:outline-none transition-colors duration-200
                ${activeTab === tabName
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 border-b-2 border-transparent'
                }`}
            >
              {tabName}
            </button>
          ))}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 text-center rounded-md mx-6 mt-4 ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        {/* Form Content - Conditional Rendering based on activeTab */}
        <form onSubmit={handleSubmit} className="p-6">
         
          {activeTab === 'General Settings' && (
            <GeneralSettings
              formData={formData}
              handleChange={handleChange}
              handleQueueNoAnswerChange={handleQueueNoAnswerChange}
              handleCallConfirmChange={handleCallConfirmChange}
              handleWaitTimePrefixChange={handleWaitTimePrefixChange}
              handleRingerVolumeOverrideModeChange={handleRingerVolumeOverrideModeChange}
              handleRestrictDynamicAgentsChange={handleRestrictDynamicAgentsChange}
              handleAgentRestrictionsChange={handleAgentRestrictionsChange}
              handleAutofillChange={handleAutofillChange}
              handleSkipBusyAgentsChange={handleSkipBusyAgentsChange}
              handleCallRecordingChange={handleCallRecordingChange}
              handleMarkCallsAnsweredElsewhereChange={handleMarkCallsAnsweredElsewhereChange}
            />
          )}

          {activeTab === 'Queue Agents' && (
            <QueueAgentsTab
              initialAllAgents={allAgents}
              initialSelectedQueueAgents={selectedQueueAgents}
              onSelectedQueueAgentsChange={setSelectedQueueAgents}
              onAllAgentsChange={setAllAgents}
            />
          )}

          {activeTab === 'Timing & Agent Options' && (
            <TimingAgentOptionsTab
              formData={timingAgentFormData}
              handleChange={(name, value) => setTimingAgentFormData(prev => ({ ...prev, [name]: value }))}
            />
          )}

          {activeTab === 'Capacity Options' && (
            <CapacityOptionsTab
              formData={capacityFormData}
              handleChange={(name, value) => setCapacityFormData(prev => ({ ...prev, [name]: value }))}
            />
          )}

          {activeTab === 'Caller Announcements' && (
            <CallerAnnouncements/>
          )}

          {activeTab === 'Advanced Options' && (
            <AdvancedOption/>
          )}

          {activeTab === 'Reset Queue Stats' && (
            <RecetQueueStats/>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8 p-4 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
            >
              {queueId ? 'Update Queue' : 'Create Queue'}
            </button>
            {queueId && ( // Only show delete button if in edit mode
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default QueueForm;
