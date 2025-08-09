import React, { useEffect, useState } from "react";
import axios from "axios";
import { UseSocket } from "../context/SocketContext";
import baseUrl from "../util/baseUrl";
import RegistrationForm from "../forms/AgentRegistrationForm";

// Lucide React Icons
import {
  Activity, // Used for refresh and header
  User,
  Star,
  BellRing,
  Pause,
  Users,
  CircleCheck, // For online
  CircleX, // For busy
  Clock, // For away
  Trash, // For modal close, not agent deletion
  PlusCircle, // For add
} from "lucide-react";

// Updated Agent interface to match new backend response
interface Agent {
  exten: string;
  aor?: string;
  state?: string; // This might be a general state, AMI deviceState is more specific
  contacts: string;
  transport: string;
  identifyBy?: string;
  deviceState: string; // e.g., 'NOT_INUSE', 'INUSE', 'RINGING', 'UNAVAILABLE', 'BUSY'
}

const Dashboard = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const agentsPerPage = 10;
  const { socket } = UseSocket();

  // Helper function to map AMI deviceState to a more user-friendly status
  const mapAgentStatusForDisplay = (deviceState: string): string => {
    console.log(deviceState )
    switch (deviceState) {
      case 'Not in use':
        return 'online'; // Agent is available
      case 'InUse':
      case 'Busy':
        return 'busy'; // Agent is on a call or otherwise occupied
      case 'Ringing':
        return 'ringing'; // Agent's phone is ringing
      case 'Unavailable':
        return 'offline'; // Agent is not registered/available
      default:
        return 'unknown'; // Fallback for unhandled states
    }
  };

  // Helper function to get status badge styles
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500 text-white';
      case 'busy':
        return 'bg-red-500 text-white';
      case 'away':
        return 'bg-yellow-500 text-white';
      case 'offline':
        return 'bg-gray-500 text-white';
      case 'ringing':
        return 'bg-blue-500 text-white';
      case 'paused':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${baseUrl}/api/agent/real-time`);
      const data = response.data;
      if (Array.isArray(data)) {
        setAgents(data);
      } else {
        setAgents([]);
      }
      setLoading(false);
    } catch (err) {
      setError("Failed to fetch agents. Please try again.");
      setLoading(false);
      console.error("Error fetching agents:", err);
    }
  };

  // Delete handler (stub, since backend does not support deletion)
  const handleDelete = async (_objectName: string) => {
    // This function is still here but the button to trigger it is removed from the UI.
    console.log("Agent deletion is not handled in Asterisk-only mode for:", _objectName);
    alert("Agent deletion is not handled in Asterisk-only mode."); // Fallback for quick demo, replace with custom modal
  };

  const handleOpenModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  const totalPages = Math.ceil(agents.length / agentsPerPage);
  const paginatedAgents = agents.slice(
    (currentPage - 1) * agentsPerPage,
    currentPage * agentsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  useEffect(() => {
    fetchAgents();
    if (!socket) return;
    setLoading(true);

    const handleQueueMembers = (data: any[]) => {
      // Map backend data to Agent interface (fields from your example)
      const mappedAgents: Agent[] = data.map((member) => ({
        exten: member.ObjectName,
        aor: member.Aor,
        state: member.DeviceState, // Assuming deviceState is the primary state indicator
        contacts: member.Contacts,
        transport: member.Transport,
        identifyBy: member.Auths,
        deviceState: member.DeviceState,
      }));
      setAgents(mappedAgents);
      setLoading(false);
      setError(null);
    };

    // Handler for the socket event (backend emits just the array)
    const socketHandler = (msg: any) => {
      if (Array.isArray(msg)) {
        handleQueueMembers(msg);
      }
    };

    socket.on("endpointList", socketHandler);
    socket.emit && socket.emit("PJSIPShowEndpoints");
    return () => {
      socket.off("endpointList", socketHandler);
    };
  }, [socket]);

  // Calculate agent summary based on current agents state
  const agentSummary = React.useMemo(() => {
    const summary = {
      online: 0,
      busy: 0,
      away: 0, // Not directly from deviceState, needs custom logic/backend field
      ringing: 0,
      paused: 0, // Not directly from deviceState, needs custom logic/backend field
      offline: 0,
    };

    agents.forEach(agent => {
      const displayStatus = mapAgentStatusForDisplay(agent.deviceState);
      if (displayStatus === 'online') summary.online++;
      else if (displayStatus === 'busy') summary.busy++;
      else if (displayStatus === 'ringing') summary.ringing++;
      else if (displayStatus === 'offline') summary.offline++;
      // For 'away' and 'paused', you would need specific backend data
      // For demonstration, let's assume some agents are manually set to away/paused
      // if (agent.customStatus === 'away') summary.away++;
      // if (agent.customStatus === 'paused') summary.paused++;
    });

    // Add some dummy counts for away/paused if they don't naturally occur from deviceState
    // Remove these lines if your backend provides these states
    // These lines are for demonstration if 'away'/'paused' statuses aren't from deviceState
    if (summary.online > 0 && agents.length > 0) {
      summary.online = Math.max(0, summary.online - 1); // Adjust for dummy away/paused
      summary.away = 1; // Dummy away agent
      summary.paused = 1; // Dummy paused agent
    }


    return {
      ...summary,
      total: agents.length,
    };
  }, [agents]);


  if (loading) {
    return (
      <div className="min-h-screen bg-white p-6 flex justify-center items-center">
        <p className="text-gray-700 text-lg">Loading agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-6 flex flex-col justify-center items-center">
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <button
          onClick={fetchAgents}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md flex items-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <Activity className="mr-2 text-lg" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6 font-inter antialiased flex justify-center items-start">
      <div className="w-full max-w-4xl flex flex-col gap-6"> {/* Changed to flex-col for vertical stacking */}
        {/* Agent Status Summary Card (Top Section) */}
        <div className="bg-gray-100 rounded-xl shadow-lg p-6 flex flex-col">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-blue-600" /> Agent Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"> {/* Responsive grid for summary */}
            {Object.entries(agentSummary).map(([status, count]) => (
              status !== 'total' && (
                <div key={status} className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                  {status === 'online' && <CircleCheck className="w-6 h-6 text-green-600" />}
                  {status === 'busy' && <CircleX className="w-6 h-6 text-red-600" />}
                  {status === 'away' && <Clock className="w-6 h-6 text-yellow-600" />}
                  {status === 'ringing' && <BellRing className="w-6 h-6 text-blue-600" />}
                  {status === 'paused' && <Pause className="w-6 h-6 text-purple-600" />}
                  {status === 'offline' && <User className="w-6 h-6 text-gray-600" />}
                  <div>
                    <p className="text-sm text-gray-500 capitalize">{status}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              )
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-300 text-center">
            <p className="text-lg font-bold text-gray-800">Total Agents: {agentSummary.total}</p>
          </div>
        </div>

        {/* Agent List Section (Below the summary - now cards with dark theme) */}
        <div className="bg-gray-800 rounded-xl shadow-lg p-6"> {/* Dark background for this section */}
          {/* Header */}
          <div className="flex justify-between items-center text-gray-200 mb-6 pb-4 border-b border-gray-700"> {/* Darker header text and border */}
            <h2 className="text-2xl font-semibold flex items-center">
              <Activity className="w-6 h-6 mr-3 text-blue-400" /> Agent Status Details
            </h2>
            <div className="flex gap-4">
              <button
                onClick={fetchAgents}
                className="relative overflow-hidden group bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl shadow-md flex items-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <span className="absolute left-0 top-0 w-full h-full bg-indigo-400 opacity-0 group-active:opacity-20 transition-opacity duration-200" />
                <Activity className="mr-2 text-lg" /> Refresh
              </button>
              <button
                onClick={handleOpenModal}
                className="relative overflow-hidden group bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow-md flex items-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <span className="absolute left-0 top-0 w-full h-full bg-emerald-400 opacity-0 group-active:opacity-20 transition-opacity duration-200" />
                <PlusCircle className="mr-2 text-lg" /> Add +
              </button>
            </div>
          </div>

          {/* Agent List as Cards */}
          <div className="space-y-4">
            {paginatedAgents.map((agent) => {
              const displayStatus = mapAgentStatusForDisplay(agent.deviceState);
              // Dummy values for calls, duration, rating as they are not in Agent interface
              const dummyCalls = Math.floor(Math.random() * 30);
              const dummyDuration = `${Math.floor(Math.random() * 10)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
              const dummyRating = (Math.random() * (5 - 3) + 3).toFixed(1); // Between 3.0 and 5.0

              return (
                <div
                  key={agent.exten}
                  className="bg-gray-700 rounded-lg p-4 flex items-center justify-between transition-all duration-200 hover:bg-gray-600 cursor-pointer" // Darker card background
                >
                  <div className="flex items-center space-x-4">
                    <User className="w-8 h-8 text-gray-400" /> {/* Icon color for dark theme */}
                    <div>
                      <p className="text-lg font-medium text-gray-100"> {/* Text color for dark theme */}
                        {agent.exten} <span className="text-gray-400">[{agent.exten}]</span> {/* Extension in brackets */}
                      </p>
                      <div className="flex items-center space-x-2 text-sm">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(
                            displayStatus
                          )}`}
                        >
                          {displayStatus}
                        </span>
                        <span className="text-gray-400">{dummyCalls} calls</span> {/* Text color for dark theme */}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-xl font-semibold text-gray-100">{dummyDuration}</span> {/* Text color for dark theme */}
                    <div className="flex items-center text-gray-400"> {/* Text color for dark theme */}
                      <Star className="w-5 h-5 text-yellow-400 mr-1" fill="currentColor" /> {/* Star color */}
                      <span className="text-lg font-medium">{dummyRating}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded-lg bg-gray-600 text-gray-200 hover:bg-gray-500 disabled:opacity-50" // Darker pagination buttons
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-3 py-1 rounded-lg ${currentPage === i + 1
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-200 hover:bg-gray-600" // Darker pagination buttons
                    }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded-lg bg-gray-600 text-gray-200 hover:bg-gray-500 disabled:opacity-50" // Darker pagination buttons
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Modal Popup for Registration Form */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-lg mx-auto bg-white/90 rounded-2xl border border-gray-200 p-8 animate-slide-up">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white/70 rounded-full p-2 shadow focus:outline-none focus:ring-2 focus:ring-red-300 transition"
                aria-label="Close"
              >
                <Trash className="text-xl" /> {/* Using Trash icon for close */}
              </button>
              <h3 className="text-2xl font-bold text-center mb-6 text-indigo-800 drop-shadow">
                Register New Agent
              </h3>
              <RegistrationForm />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
