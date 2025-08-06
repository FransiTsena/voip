import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
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
import { baseUrl } from '../baseUrl';


const Dashboard = () => {
  // Pagination state for shift report
  const [shiftPage, setShiftPage] = useState(1);
  const shiftsPerPage = 10;
  const [reasonEdits, setReasonEdits] = useState({});
  const [reasonLoading, setReasonLoading] = useState(false);

  // Handler to update reason for a shift
  const handleReasonChange = (shiftId, value) => {
    setReasonEdits(prev => ({ ...prev, [shiftId]: value }));
  };

  const handleReasonSubmit = async (shiftId) => {
    if (!reasonEdits[shiftId]) return;
    setReasonLoading(true);
    try {
      await fetch(`${baseUrl}/shifts/${shiftId}/reason`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reasonEdits[shiftId] })
      });
      setReasonEdits(prev => ({ ...prev, [shiftId]: '' }));
      // Refresh shift report after update
      fetchShiftReport(shiftPage);
    } catch (err) {
      // Handle error
    }
    setReasonLoading(false);
  };
  const agent = useStore(state => state.agent);
  const logout = useStore(state => state.logout);
  const [redirect, setRedirect] = useState(false);
  const [dialNumber, setDialNumber] = useState("");
  const [search, setSearch] = useState("");
  const [agentStats, setAgentStats] = useState(null);
  const [simulatedOnlineMinutes, setSimulatedOnlineMinutes] = useState(0);
  const [simulatedOnlineSeconds, setSimulatedOnlineSeconds] = useState(0);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);
  const [queueWaitingReport, setQueueWaitingReport] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showKeypad, setShowKeypad] = useState(false);
  const [shiftReport, setShiftReport] = useState({ agent: null, shifts: [], totalShifts: 0, totalDuration: 0 });
  const [loadingShifts, setLoadingShifts] = useState(false);

  // Define fetchShiftReport so it can be called from anywhere
  const fetchShiftReport = async (page = 1) => {
    if (!agent || !(agent._id || agent.id)) return;
    setLoadingShifts(true);
    try {
      const res = await fetch(`${baseUrl}/metrics/agent/${agent._id || agent.id}/shifts/today?page=${page}&limit=${shiftsPerPage}`);
      const data = await res.json();
      setShiftReport({
        agent: data.agent,
        shifts: data.shifts || [],
        totalShifts: data.totalShifts || 0,
        totalDuration: data.totalDuration || 0,
        page: data.page || 1,
        totalPages: data.totalPages || 1,
      });
    } catch (err) {
      setShiftReport({ agent: null, shifts: [], totalShifts: 0, totalDuration: 0, page: 1, totalPages: 1 });
    }
    setLoadingShifts(false);
  };

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
    fetchShiftReport(shiftPage);
    // Reset simulated minutes when agentStats change
    setSimulatedOnlineMinutes(0);
    setSimulatedOnlineSeconds(0);
  }, [agent, shiftPage]);


  useEffect(() => {
    async function fetchQueueWaitingReport() {
      try {
        const response = await axios.get(`${baseUrl}/report/queues/waiting-report`);
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
      window.location.href = `${baseUrl}/knowledge-base?query=${encodeURIComponent(search)}`;
    }
  };

  const sip = useSIP() || {};
  const { makeCall, agentStatus, setAgentStatus } = sip;
  const isSIPReady = typeof makeCall === 'function';

  // Simulate online minutes incrementing in real time
  useEffect(() => {
    let interval;
    if (isSIPReady && agentStatus === 'Available' && agentStats && agentStats.onlineDuration) {
      let startSeconds = Math.floor(agentStats.onlineDuration);
      setSimulatedOnlineMinutes(Math.floor(startSeconds / 60));
      setSimulatedOnlineSeconds(startSeconds % 60);
      interval = setInterval(() => {
        setSimulatedOnlineSeconds(prevSec => {
          if (prevSec === 59) {
            setSimulatedOnlineMinutes(prevMin => prevMin + 1);
            return 0;
          }
          return prevSec + 1;
        });
      }, 1000);
    } else {
      // Reset timer to static value if SIP is not ready or agentStatus is not 'Available'
      let startSeconds = agentStats && agentStats.onlineDuration ? Math.floor(agentStats.onlineDuration) : 0;
      setSimulatedOnlineMinutes(Math.floor(startSeconds / 60));
      setSimulatedOnlineSeconds(startSeconds % 60);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSIPReady, agentStatus, agentStats?.onlineDuration]);

  if (redirect) {
    window.location.href = '/login';
    return null;
  }

  return (
    <SIPProvider>
      {/* Top Bar with agent status controls */}
      <NavBar
        onLogout={handleLogout}
        isSIPReady={isSIPReady}
        agentStatus={agentStatus}
        setAgentStatus={setAgentStatus}
      />

      <div className="flex h-[calc(100vh-68px)] bg-gray-100 text-gray-800">
        {/* Agent Status Controls moved to NavBar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={["dashboard", "contacts", "analytics"]} />
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

                {/* Stats Panel with Animated Graphs and Numbers */}
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-extrabold text-indigo-800">Agent Performance Overview</h2>
                    <span className="text-sm text-gray-500">Today</span>
                  </div>
                  {statsLoading ? (
                    <div className="text-indigo-600 font-semibold">Loading...</div>
                  ) : statsError ? (
                    <div className="text-red-600 font-semibold">{statsError}</div>
                  ) : agentStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      {/* Bar Chart for Calls with Numbers */}
                      <div className="bg-indigo-50 rounded-xl shadow-sm border border-indigo-100 p-4 relative">
                        <div className="font-bold text-indigo-700 mb-2">Calls Overview</div>
                        <div className="absolute top-4 right-6 flex flex-col items-end space-y-1">
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="text-3xl font-bold text-indigo-600 animate-count">{agentStats.totalCalls || 0}</div>
                          <div className="text-xs text-gray-500">Missed</div>
                          <div className="text-3xl font-bold text-red-500 animate-count">{agentStats.missedCalls || 0}</div>
                          <div className="text-xs text-gray-500">Handled</div>
                          <div className="text-3xl font-bold text-blue-800 animate-count">{agentStats.callsHandled || 0}</div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={[{
                            name: 'Calls',
                            Total: agentStats.totalCalls || 0,
                            Missed: agentStats.missedCalls || 0,
                            Handled: agentStats.callsHandled || 0
                          }]}
                          >
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="Total" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="Missed" fill="#ef4444" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="Handled" fill="#2563eb" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                        <div className="mt-3 text-center">
                          <span className="text-xl font-semibold text-purple-700">Avg Duration: {agentStats.avgDuration ? agentStats.avgDuration.toFixed(1) : 0} s</span>
                        </div>
                      </div>
                      {/* Pie Chart for Tickets & Online with Numbers */}
                      <div className="bg-yellow-50 rounded-xl shadow-sm border border-yellow-100 p-4 relative">
                        <div className="font-bold text-yellow-700 mb-2">Tickets & Online</div>
                        <div className="absolute top-4 right-6 flex flex-col items-end space-y-1">
                          <div className="text-xs text-gray-500">Tickets</div>
                          <div className="text-3xl font-bold text-green-600 animate-count">{agentStats.ticketsResolved || 0}</div>
                          <div className="text-xs text-gray-500">Online Sessions</div>
                          <div className="text-3xl font-bold text-yellow-600 animate-count">{agentStats.onlineTime || 0}</div>
                          <div className="text-xs text-gray-500">Online Time</div>
                          <div className="text-3xl font-bold text-yellow-600 animate-count">{simulatedOnlineMinutes.toString().padStart(2, '0')}:{simulatedOnlineSeconds.toString().padStart(2, '0')}</div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={[{ name: 'Tickets', value: agentStats.ticketsResolved || 0 }, { name: 'Online Sessions', value: agentStats.onlineTime || 0 }]}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={60}
                              fill="#34d399"
                              label
                            >
                              <Cell key="tickets" fill="#10b981" />
                              <Cell key="online" fill="#f59e42" />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="mt-3 text-center">
                          <span className="text-xl font-semibold text-yellow-600">Online: {simulatedOnlineMinutes.toString().padStart(2, '0')}:{simulatedOnlineSeconds.toString().padStart(2, '0')}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-400">No stats available</div>
                  )}
                </div>

                {/* Shift Report Panel with Pagination and Reason Editing */}
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-extrabold text-indigo-800">Today's Shift Sessions</h2>
                  </div>
                  {loadingShifts ? (
                    <div className="text-indigo-600 font-semibold">Loading...</div>
                  ) : !shiftReport || shiftReport.shifts.length === 0 ? (
                    <div className="text-gray-400">No shift records for today.</div>
                  ) : (
                    <>
                      <div className="mb-2 flex flex-col md:flex-row md:items-center md:justify-between">
                        {shiftReport.agent && (
                          <div className="text-sm text-gray-600">Agent: <span className="font-bold">{shiftReport.agent.name || shiftReport.agent.username}</span> ({shiftReport.agent.username})</div>
                        )}
                        <div className="text-sm text-gray-600">Total Shifts: <span className="font-bold">{shiftReport.totalShifts}</span></div>
                      </div>
                      <table className="w-full text-sm border">
                        <thead>
                          <tr className="bg-indigo-50">
                            <th className="p-2 border">Start Time</th>
                            <th className="p-2 border">End Time</th>
                            <th className="p-2 border">Duration (s)</th>
                            <th className="p-2 border">Ongoing</th>
                            <th className="p-2 border">Reason</th>
                            <th className="p-2 border">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {shiftReport.shifts.map((shift, idx) => (
                            <tr key={idx} className={shift.ongoing ? "bg-yellow-50" : ""}>
                              <td className="p-2 border">{shift.startTime ? new Date(shift.startTime).toLocaleString() : '-'}</td>
                              <td className="p-2 border">{shift.endTime ? new Date(shift.endTime).toLocaleString() : (shift.ongoing ? 'Ongoing' : '-')}</td>
                              <td className="p-2 border">{Math.round(shift.duration)}</td>
                              <td className="p-2 border">{shift.ongoing ? 'Yes' : 'No'}</td>
                              <td className="p-2 border">
                                {shift.ongoing || !shift.reason ? (
                                  <input
                                    type="text"
                                    className="border rounded px-2 py-1 text-sm"
                                    value={reasonEdits[shift._id] || shift.reason || ''}
                                    onChange={e => handleReasonChange(shift._id, e.target.value)}
                                    placeholder="Enter reason..."
                                    disabled={reasonLoading}
                                  />
                                ) : (
                                  shift.reason
                                )}
                              </td>
                              <td className="p-2 border">
                                {(shift.ongoing || !shift.reason) && reasonEdits[shift._id] ? (
                                  <button
                                    className="px-3 py-1 bg-indigo-500 text-white rounded text-xs"
                                    onClick={() => handleReasonSubmit(shift._id)}
                                    disabled={reasonLoading}
                                  >
                                    Save
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {/* Pagination Controls */}
                      <div className="flex justify-end items-center mt-4 space-x-2">
                        <button
                          className="px-3 py-1 bg-gray-200 rounded"
                          onClick={() => setShiftPage(p => Math.max(1, p - 1))}
                          disabled={shiftReport.page === 1}
                        >Prev</button>
                        <span className="px-2">Page {shiftReport.page} of {shiftReport.totalPages}</span>
                        <button
                          className="px-3 py-1 bg-gray-200 rounded"
                          onClick={() => setShiftPage(p => p < shiftReport.totalPages ? p + 1 : p)}
                          disabled={shiftReport.page >= shiftReport.totalPages}
                        >Next</button>
                      </div>
                    </>
                  )}
                </div>

                {/* Queue Waiting Report */}
                <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 animate-fade-in">
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
            {activeTab === "analytics" && (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
                <h2 className="text-2xl font-extrabold text-indigo-800 mb-4">Analytics & Full Reporting</h2>
                <div className="text-gray-700 mb-2">View detailed reports and analytics for agent performance, shifts, calls, tickets, and more.</div>
                {/* Example: Show all shifts, not just today */}
                {loadingShifts ? (
                  <div className="text-indigo-600 font-semibold">Loading...</div>
                ) : !shiftReport || shiftReport.shifts.length === 0 ? (
                  <div className="text-gray-400">No shift records available.</div>
                ) : (
                  <table className="w-full text-sm border">
                    <thead>
                      <tr className="bg-indigo-50">
                        <th className="p-2 border">Start Time</th>
                        <th className="p-2 border">End Time</th>
                        <th className="p-2 border">Duration (s)</th>
                        <th className="p-2 border">Ongoing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shiftReport.shifts.map((shift, idx) => (
                        <tr key={idx} className={shift.ongoing ? "bg-yellow-50" : ""}>
                          <td className="p-2 border">{shift.startTime ? new Date(shift.startTime).toLocaleString() : '-'}</td>
                          <td className="p-2 border">{shift.endTime ? new Date(shift.endTime).toLocaleString() : (shift.ongoing ? 'Ongoing' : '-')}</td>
                          <td className="p-2 border">{Math.round(shift.duration)}</td>
                          <td className="p-2 border">{shift.ongoing ? 'Yes' : 'No'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {/* Add more analytics and reporting features here as needed */}
              </div>
            )}
          </div>
        </main>

        {/* Floating Call Button with bounce animation */}
        <button
          className={`fixed bottom-10 right-10 z-50 w-16 h-16 rounded-2xl bg-indigo-500 shadow-xl text-white text-2xl flex items-center justify-center hover:bg-indigo-600 transition ${!isSIPReady ? 'opacity-50 cursor-not-allowed' : ''} animate-bounce`}
          title={isSIPReady ? 'Open Keypad / Make Call' : 'SIP Not Connected'}
          onClick={() => isSIPReady && setShowKeypad(true)}
          disabled={!isSIPReady}
        >
          <FaPhoneAlt />
        </button>
      </div>

      <CallPopup
        showKeypad={showKeypad}
        setShowKeypad={setShowKeypad}
        callSession={sip.callSession}
        incomingCall={sip.incomingCall}
        callTimer={sip.callTimer}
        hangup={sip.hangup}
        answer={sip.answer}
        holdCall={sip.holdCall}
        unholdCall={sip.unholdCall}
        muteCall={sip.muteCall}
        unmuteCall={sip.unmuteCall}
        transferCall={sip.transferCall}
        makeCall={sip.makeCall}
        formatTime={sip.formatTime}
        iceStatus={sip.iceStatus}
        agentStatus={sip.agentStatus}
      />
    </SIPProvider>
  );
};


// Add fade-in, bounce, and count-up animations
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .animate-fade-in {
      animation: fadeIn 0.8s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-bounce {
      animation: bounce 1.2s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    .animate-count {
      animation: countUp 0.7s ease;
    }
    @keyframes countUp {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

export default Dashboard;
