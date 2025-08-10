import React, { useEffect, useState } from "react";
import axios from "axios";
import { UseSocket } from "../context/SocketContext";
import baseUrl from "../util/baseUrl";
// Lucide React Icons
import {
  Activity,
  User,
  Star,
  BellRing,
  Pause,
  Users,
  CircleCheck,
  CircleX,
  Clock,
  Trash,
  PlusCircle,
  Phone,
  PhoneOff,
  Timer,
  TrendingUp,
  BarChart3,
  Calendar,
  Globe,
} from "lucide-react";

// Agent interface matching your backend response
interface Agent {
  id: string;
  username: string;
  extension: string;
  first_name: string;
  last_name: string;
  full_name: string;
  name: string;
  email: string;
  queues: string[];
  deviceState: string;
  liveStatus: string;
  status: string;
  lastActivity: string;
  contacts: string;
  transport: string;
  dailyStats: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    averageTalkTime: number;
    averageWrapTime: number;
    averageHoldTime: number;
    averageRingTime: number;
    longestIdleTime: number;
  };
  overallStats: {
    totalCalls: number;
    answeredCalls: number;
    missedCalls: number;
    averageTalkTime: number;
    averageWrapTime: number;
    averageHoldTime: number;
    averageRingTime: number;
    longestIdleTime: number;
  };
}

const Agent: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [statsView, setStatsView] = useState<"daily" | "overall">("daily");
  const agentsPerPage = 10;
  const { socket } = UseSocket();

  // Helper function to get status badge styles
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return "bg-green-500 text-white";
      case "busy":
        return "bg-red-500 text-white";
      case "away":
        return "bg-yellow-500 text-white";
      case "offline":
        return "bg-gray-500 text-white";
      case "ringing":
        return "bg-blue-500 text-white";
      case "paused":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Helper function to format time in seconds to MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to get status icon
  const getStatusIcon = (status: string, liveStatus: string) => {
    if (liveStatus === "Ringing") return <BellRing className="w-5 h-5" />;

    switch (status.toLowerCase()) {
      case "online":
        return <CircleCheck className="w-5 h-5 text-green-600" />;
      case "busy":
        return <CircleX className="w-5 h-5 text-red-600" />;
      case "away":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "offline":
        return <User className="w-5 h-5 text-gray-600" />;
      case "ringing":
        return <BellRing className="w-5 h-5 text-blue-600" />;
      case "paused":
        return <Pause className="w-5 h-5 text-purple-600" />;
      default:
        return <User className="w-5 h-5 text-gray-600" />;
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${baseUrl}/api/agent/extension/real-time`
      );
      const data = response.data;

      console.log("📡 Fetched agents from API:", data);

      if (data.success && Array.isArray(data.agents)) {
        setAgents(data.agents);
        console.log(`✅ Loaded ${data.agents.length} agents from API`);
      } else {
        console.warn("⚠️ Invalid API response format:", data);
        setAgents([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching agents:", err);
      setError("Failed to fetch agents. Please try again.");
      setLoading(false);
    }
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
    console.log("🚀 Agent component mounted, fetching initial data...");
    fetchAgents();

    if (!socket) {
      console.warn("⚠️ Socket not available");
      return;
    }

    console.log("🔌 Setting up socket listeners...");

    const handleAgentData = (data: Agent[]) => {
      console.log("📡 Received real-time agent data via socket:", data);
      console.log(`📊 Received ${data.length} agents via socket`);

      if (Array.isArray(data) && data.length > 0) {
        setAgents(data);
        setLoading(false);
        setError(null);
        console.log("✅ Updated agents from socket data");
      } else {
        console.warn("⚠️ Received empty or invalid socket data:", data);
      }
    };

    // Listen to the real-time agent data from your backend
    socket.on("agentStatusWithStats", handleAgentData);

    // Listen for individual status updates
    socket.on("agentStatusUpdate", (data) => {
      console.log("🔄 Individual agent status update:", data);
    });

    // Request current agent list immediately
    console.log("📤 Requesting agent list via socket...");
    socket.emit("requestAgentList");

    return () => {
      console.log("🧹 Cleaning up socket listeners...");
      socket.off("agentStatusWithStats", handleAgentData);
      socket.off("agentStatusUpdate");
    };
  }, [socket]);

  // Calculate agent summary based on current agents state
  const agentSummary = React.useMemo(() => {
    const summary = {
      online: 0,
      busy: 0,
      away: 0,
      ringing: 0,
      paused: 0,
      offline: 0,
    };

    agents.forEach((agent) => {
      const status = agent.status.toLowerCase();
      const liveStatus = agent.liveStatus.toLowerCase();

      if (status === "online") summary.online++;
      else if (status === "busy") summary.busy++;
      else if (status === "offline") summary.offline++;
      else if (liveStatus === "ringing") summary.ringing++;
      else if (liveStatus === "paused") summary.paused++;
      else if (liveStatus === "away") summary.away++;
      else summary.offline++; // Default unknown to offline
    });

    return {
      ...summary,
      total: agents.length,
    };
  }, [agents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg">Loading agents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex flex-col justify-center items-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8">
          <CircleX className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button
            onClick={fetchAgents}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg shadow-md flex items-center mx-auto font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <Activity className="mr-2 w-5 h-5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Users className="w-8 h-8 mr-3 text-indigo-600" />
                Agent Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Monitor agent status and performance in real-time
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchAgents}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <Activity className="mr-2 w-4 h-4" /> Refresh
              </button>
              <button
                onClick={handleOpenModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-md flex items-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <PlusCircle className="mr-2 w-4 h-4" /> Add Agent
              </button>
            </div>
          </div>
        </div>

        {/* Agent Status Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
            Agent Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(agentSummary).map(
              ([status, count]) =>
                status !== "total" && (
                  <div
                    key={status}
                    className="bg-gray-50 rounded-lg p-4 text-center"
                  >
                    <div className="flex justify-center mb-2">
                      {getStatusIcon(status, status)}
                    </div>
                    <p className="text-sm text-gray-500 capitalize">{status}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                )
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-lg font-bold text-gray-800">
              Total Agents: {agentSummary.total}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === "cards"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Cards View
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  viewMode === "table"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Table View
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStatsView("daily")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                  statsView === "daily"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Calendar className="w-4 h-4 mr-1" />
                Daily Stats
              </button>
              <button
                onClick={() => setStatsView("overall")}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                  statsView === "overall"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Globe className="w-4 h-4 mr-1" />
                Overall Stats
              </button>
            </div>
          </div>
        </div>

        {/* Agent List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
            <Activity className="w-6 h-6 mr-3 text-indigo-600" />
            Agent Details ({statsView === "daily" ? "Daily" : "Overall"} Stats)
          </h2>

          {viewMode === "cards" ? (
            // Cards View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAgents.map((agent) => {
                const stats =
                  statsView === "daily" ? agent.dailyStats : agent.overallStats;

                return (
                  <div
                    key={agent.id}
                    className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                  >
                    {/* Agent Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {agent.full_name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Ext: {agent.extension}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                          agent.status
                        )}`}
                      >
                        {agent.status}
                      </span>
                    </div>

                    {/* Live Status */}
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        Live Status:{" "}
                        <span className="font-medium">{agent.liveStatus}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Device: {agent.deviceState}
                      </p>
                      {agent.contacts && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          Contact: {agent.contacts}
                        </p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-1" />
                          Total Calls
                        </span>
                        <span className="font-semibold text-green-600">
                          {stats.totalCalls}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <CircleCheck className="w-4 h-4 mr-1" />
                          Answered Calls
                        </span>
                        <span className="font-semibold text-emerald-600">
                          {stats.answeredCalls}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <PhoneOff className="w-4 h-4 mr-1" />
                          Missed Calls
                        </span>
                        <span className="font-semibold text-red-600">
                          {stats.missedCalls}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <Timer className="w-4 h-4 mr-1" />
                          Avg Talk Time
                        </span>
                        <span className="font-semibold text-blue-600">
                          {formatTime(stats.averageTalkTime)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-1" />
                          Avg Hold Time
                        </span>
                        <span className="font-semibold text-orange-600">
                          {formatTime(stats.averageHoldTime)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="flex items-center text-sm text-gray-600">
                          <BellRing className="w-4 h-4 mr-1" />
                          Avg Ring Time
                        </span>
                        <span className="font-semibold text-purple-600">
                          {formatTime(stats.averageRingTime)}
                        </span>
                      </div>

                      {/* Success Rate */}
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center text-sm text-gray-600">
                            <TrendingUp className="w-4 h-4 mr-1" />
                            Answer Rate
                          </span>
                          <span className="font-semibold text-indigo-600">
                            {stats.totalCalls > 0
                              ? `${(
                                  (stats.answeredCalls / stats.totalCalls) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Table View
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Calls
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Answered
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Missed
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Answer Rate
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedAgents.map((agent) => {
                    const stats =
                      statsView === "daily"
                        ? agent.dailyStats
                        : agent.overallStats;
                    const successRate =
                      stats.totalCalls > 0
                        ? (
                            ((stats.totalCalls - stats.missedCalls) /
                              stats.totalCalls) *
                            100
                          ).toFixed(1)
                        : "0";

                    return (
                      <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {agent.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Ext: {agent.extension}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(
                              agent.status
                            )}`}
                          >
                            {agent.status}
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {agent.liveStatus}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {stats.totalCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">
                          {stats.answeredCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                          {stats.missedCalls}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {stats.totalCalls > 0
                                ? `${(
                                    (stats.answeredCalls / stats.totalCalls) *
                                    100
                                  ).toFixed(1)}%`
                                : "0%"}
                            </div>
                            <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${
                                    stats.totalCalls > 0
                                      ? (
                                          (stats.answeredCalls /
                                            stats.totalCalls) *
                                          100
                                        ).toFixed(1)
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => handlePageChange(i + 1)}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                    currentPage === i + 1
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Modal for Adding Agent */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-8 m-4">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-gray-100 rounded-full p-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                aria-label="Close"
              >
                <Trash className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold text-center mb-6 text-gray-800">
                Register New Agent
              </h3>
              {/* Add your registration form component here */}
              <div className="text-center text-gray-500">
                Registration form component goes here
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Agent;
