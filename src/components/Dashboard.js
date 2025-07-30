import React, { useState, useEffect } from 'react';
import { fetchAgentDailyStats } from '../store/agentStats';
import { FaPhoneAlt, FaBell, FaUserTag, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useSIP } from './SIPProvider';
import { SIPProvider } from './SIPProvider';
import CallPopup from './CallPopup';
import useStore from '../store/store';
import TicketList from './TicketList';
import TicketDetail from './TicketDetail';
import CustomerInfo from './CustomerInfo';
import CallControlBar from './CallControlBar';
import ShiftTimer from './ShiftTimer';
import NavBar from './NavBar';
import axios from 'axios';
import Sidebar from './Sidebar';
import ContactSection from './ContactSection';


const Dashboard = () => {
  const agent = useStore(state => state.agent);
  const logout = useStore(state => state.logout);
  const [redirect, setRedirect] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);
  const [dialNumber, setDialNumber] = useState("");
  const [search, setSearch] = useState("");
  const [agentStats, setAgentStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [queueWaitingReport, setQueueWaitingReport] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    async function loadStats() {
      if (agent && (agent._id || agent.id)) {
        setStatsLoading(true);
        setStatsError(null);
        try {
          const stats = await fetchAgentDailyStats(agent._id || agent.id);
          setAgentStats(stats);
        } catch (err) {
          setStatsError('Failed to load stats');
        } finally {
          setStatsLoading(false);
        }
      }
    }
    loadStats();
  }, [agent]);

  useEffect(() => {
    async function fetchQueueWaitingReport() {
      try {
        const response = await axios.get('/api/report/queues/waiting-report');
        setQueueWaitingReport(response.data.data);
      } catch (error) {
        console.error('Failed to fetch queue waiting report:', error);
      }
    }

    fetchQueueWaitingReport();
  }, []);

  const handleLogout = async () => {
    await logout();
    setRedirect(true);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/knowledge-base?query=${encodeURIComponent(search)}`;
    }
  };

  const sip = useSIP() || {};
  const { makeCall } = sip;
  const isSIPReady = typeof makeCall === 'function';

  if (redirect) {
    window.location.href = '/login';
    return null;
  }

  return (
    <SIPProvider>
      {/* Top Bar */}
      <NavBar onLogout={handleLogout} shiftControl={<ShiftTimer />} />

      <div className="flex h-[calc(100vh-68px)] bg-gray-100 text-gray-800">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-5xl mx-auto flex flex-col space-y-8">
            {activeTab === "dashboard" && (
              <>
                {/* Search + Alerts */}
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                  <form onSubmit={handleSearch} className="flex flex-1 max-w-md bg-white rounded-lg shadow-inner overflow-hidden">
                    <input
                      type="text"
                      className="flex-1 px-4 py-3 text-base focus:outline-none"
                      placeholder="Search Knowledge Base..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <button type="submit" className="px-5 bg-indigo-500 hover:bg-indigo-600 transition-colors text-white font-semibold">
                      Search
                    </button>
                  </form>
                  <div className="flex items-center space-x-4">
                    <FaBell className="text-2xl text-gray-600 hover:text-gray-800 transition-colors" title="Real-time Alerts" />
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">System: OK</span>
                  </div>
                </div>

                {/* Stats Panel */}
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-extrabold text-indigo-800">Agent Performance Overview</h2>
                    <span className="text-sm text-gray-500">Today</span>
                  </div>
                  {statsLoading ? (
                    <div className="text-indigo-600 font-semibold">Loading...</div>
                  ) : statsError ? (
                    <div className="text-red-600 font-semibold">{statsError}</div>
                  ) : agentStats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      {/* Calls */}
                      <div className="p-4 bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 flex flex-col items-center">
                        <div className="font-bold text-indigo-700 mb-1">Calls</div>
                        <div className="flex space-x-8">
                          <div className="text-center">
                            <div className="text-3xl font-semibold text-indigo-600">{agentStats.totalCalls || 0}</div>
                            <div className="text-sm text-gray-500">Total</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-semibold text-red-600">{agentStats.missedCalls || 0}</div>
                            <div className="text-sm text-gray-500">Missed</div>
                          </div>
                        </div>
                        <div className="mt-3 text-center">
                          <div className="text-xl font-semibold text-purple-700">{agentStats.avgDuration ? agentStats.avgDuration.toFixed(1) : 0} s</div>
                          <div className="text-sm text-gray-500">Avg Duration</div>
                        </div>
                      </div>
                      {/* Online */}
                      <div className="p-4 bg-yellow-50 rounded-xl shadow-sm border border-yellow-100 flex flex-col items-center">
                        <div className="font-bold text-yellow-700 mb-1">Online</div>
                        <div className="flex space-x-8">
                          <div className="text-center">
                            <div className="text-3xl font-semibold text-yellow-600">{agentStats.onlineDuration ? Math.floor(agentStats.onlineDuration / 60) : 0}</div>
                            <div className="text-sm text-gray-500">Minutes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-semibold text-teal-600">{agentStats.onlineTime || 0}</div>
                            <div className="text-sm text-gray-500">Sessions</div>
                          </div>
                        </div>
                      </div>
                      {/* Tickets & Calls */}
                      <div className="p-4 bg-green-50 rounded-xl shadow-sm border border-green-100 flex flex-col items-center">
                        <div className="font-bold text-green-700 mb-1">Tickets & Calls</div>
                        <div className="flex space-x-8">
                          <div className="text-center">
                            <div className="text-3xl font-semibold text-green-600">{agentStats.ticketsResolved || 0}</div>
                            <div className="text-sm text-gray-500">Tickets</div>
                          </div>
                          <div className="text-center">
                            <div className="text-3xl font-semibold text-blue-800">{agentStats.callsHandled || 0}</div>
                            <div className="text-sm text-gray-500">Handled</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">No stats available</div>
                  )}
                </div>

                {/* Queue Waiting Report */}
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                  <h2 className="text-2xl font-extrabold text-indigo-800">Queue Waiting Report</h2>
                  {queueWaitingReport.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {queueWaitingReport.map((queue, index) => (
                        <div key={index} className="p-4 bg-green-50 rounded-xl shadow-sm border border-green-100">
                          <div className="font-bold text-green-700 mb-1">Queue: {queue.queue}</div>
                          <div className="text-xl font-semibold text-green-800">{queue.waitingCount} waiting</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400">No queues waiting</div>
                  )}
                </div>
              </>
            )}

            {activeTab === "contacts" && <ContactSection />}
          </div>
        </main>

        {/* Floating Call Button */}
        <button
          className={`fixed bottom-10 right-10 z-50 w-16 h-16 rounded-2xl bg-indigo-500 shadow-xl text-white text-2xl flex items-center justify-center hover:bg-indigo-600 transition ${!isSIPReady ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isSIPReady ? 'Open Keypad / Make Call' : 'SIP Not Connected'}
          onClick={() => isSIPReady && setShowKeypad(true)}
          disabled={!isSIPReady}
        >
          <FaPhoneAlt />
        </button>
      </div>

      <CallPopup />
    </SIPProvider>
  );
};

export default Dashboard;
