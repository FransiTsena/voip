import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { fetchAgentDailyStats } from '../store/agentStats';
import { Phone, Bell, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useSIP } from './SIPProvider';
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
import KnowledgeBaseSearch from './KnowledgeBaseSearch';
import { BookOpen, X } from 'lucide-react';
import CannedResponseSearch from './CannedResponseSearch';

const Header = ({ handleSearch, search, setSearch }) => (
  <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
    {/* Removed Knowledge Base search field */}
    <div className="flex items-center space-x-4">
      <Bell className="text-2xl text-gray-500 hover:text-gray-700 transition-colors" title="Real-time Alerts" />
      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold tracking-wide">System: OK</span>
    </div>
  </div>
);

const ShiftReportPanel = ({ loadingShifts, shiftReport, reasonEdits, handleReasonChange, handleReasonSubmit, reasonLoading, setShiftPage }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 animate-fade-in border border-gray-200">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-800">Today's Shift Sessions</h2>
    </div>
    {loadingShifts ? (
      <div className="text-center py-8 text-gray-500">Loading shifts...</div>
    ) : !shiftReport || shiftReport.shifts.length === 0 ? (
      <div className="text-center py-8 text-gray-500">No shift records for today.</div>
    ) : (
      <>
        <div className="mb-4 flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-600">
          {shiftReport.agent && (
            <div>Agent: <span className="font-semibold">{shiftReport.agent.name || shiftReport.agent.username}</span> ({shiftReport.agent.username})</div>
          )}
          <div>Total Shifts: <span className="font-semibold">{shiftReport.totalShifts}</span></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="p-3">Start Time</th>
                <th className="p-3">End Time</th>
                <th className="p-3 text-center">Duration (s)</th>
                <th className="p-3 text-center">Ongoing</th>
                <th className="p-3">Reason</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {shiftReport.shifts.map((shift, idx) => (
                <tr key={idx} className={`hover:bg-gray-50 ${shift.ongoing ? "bg-yellow-50" : ""}`}>
                  <td className="p-3">{shift.startTime ? new Date(shift.startTime).toLocaleString() : '-'}</td>
                  <td className="p-3">{shift.endTime ? new Date(shift.endTime).toLocaleString() : (shift.ongoing ? 'Ongoing' : '-')}</td>
                  <td className="p-3 text-center">{Math.round(shift.duration)}</td>
                  <td className="p-3 text-center">{shift.ongoing ? 'Yes' : 'No'}</td>
                  <td className="p-3">
                    {shift.ongoing || !shift.reason ? (
                      <input
                        type="text"
                        className="w-full bg-gray-100 border-gray-300 rounded px-2 py-1 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                        value={reasonEdits[shift._id] || shift.reason || ''}
                        onChange={e => handleReasonChange(shift._id, e.target.value)}
                        placeholder="Enter reason..."
                        disabled={reasonLoading}
                      />
                    ) : (
                      shift.reason
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {(shift.ongoing || !shift.reason) && reasonEdits[shift._id] ? (
                      <button
                        className="px-3 py-1 bg-indigo-600 text-white rounded-md text-xs hover:bg-indigo-700 transition-colors"
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
        </div>
        {/* Pagination Controls */}
        <div className="flex justify-end items-center mt-4 space-x-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShiftPage(p => Math.max(1, p - 1))}
            disabled={shiftReport.page === 1}
          >Prev</button>
          <span className="px-4 py-2 text-sm font-medium text-gray-700">Page {shiftReport.page} of {shiftReport.totalPages}</span>
          <button
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setShiftPage(p => p < shiftReport.totalPages ? p + 1 : p)}
            disabled={shiftReport.page >= shiftReport.totalPages}
          >Next</button>
        </div>
      </>
    )}
  </div>
);

const QueueWaitingReportPanel = ({ queueWaitingReport }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 animate-fade-in border border-gray-200">
    <h2 className="text-2xl font-bold text-gray-800">Queue Waiting Report</h2>
    {queueWaitingReport.length > 0 ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {queueWaitingReport.map((queue, index) => (
          <div key={index} className="bg-green-50 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:scale-105">
            <div className="text-sm font-semibold text-green-800 mb-1">Queue: {queue.queue}</div>
            <div className="text-3xl font-bold text-green-600">{queue.waitingCount} <span className="text-lg font-medium">waiting</span></div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">No queues with waiting calls.</div>
    )}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-gray-800 text-white rounded-lg shadow-lg">
        <p className="font-bold">{label}</p>
        {payload.map((pld, index) => (
          <div key={index} style={{ color: pld.fill }}>
            {`${pld.name}: ${pld.value}`}
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const StatsPanel = ({ statsLoading, statsError, agentStats, simulatedOnlineMinutes, simulatedOnlineSeconds }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4 animate-fade-in border border-gray-200">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-800">Agent Performance Overview</h2>
      <span className="text-sm font-medium text-gray-500">Today</span>
    </div>
    {statsLoading ? (
      <div className="text-center py-8 text-gray-500">Loading stats...</div>
    ) : statsError ? (
      <div className="text-center py-8 text-red-600 bg-red-50 border border-red-200 rounded-md">{statsError}</div>
    ) : agentStats ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calls Overview Card */}
        <div className="bg-gray-50 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Calls Overview</h3>
            <div className="text-3xl font-bold text-indigo-600">{agentStats.totalCalls || 0}</div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={[{ name: 'Calls', Handled: agentStats.callsHandled || 0, Missed: agentStats.missedCalls || 0 }]}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" />
              <Bar dataKey="Handled" fill="#4f46e5" radius={[4, 4, 0, 0]} onClick={() => console.log('Filtering by Handled')} />
              <Bar dataKey="Missed" fill="#ef4444" radius={[4, 4, 0, 0]} onClick={() => console.log('Filtering by Missed')} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm font-medium text-gray-600">
            Avg. Duration: {agentStats.avgDuration ? agentStats.avgDuration.toFixed(1) : 0}s
          </div>
        </div>
        {/* Tickets & Online Card */}
        <div className="bg-gray-50 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:scale-105">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Tickets & Online</h3>
            <div className="text-3xl font-bold text-green-600">{agentStats.ticketsResolved || 0}</div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie
                data={[{ name: 'Tickets Resolved', value: agentStats.ticketsResolved || 0 }, { name: 'Online Sessions', value: agentStats.onlineTime || 0 }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={5}
                fill="#8884d8"
                onClick={(data) => console.log(`Filtering by ${data.name}`)}
              >
                <Cell key="tickets" fill="#10b981" />
                <Cell key="online" fill="#f59e0b" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 text-center text-sm font-medium text-gray-600">
            Online Time: {simulatedOnlineMinutes.toString().padStart(2, '0')}:{simulatedOnlineSeconds.toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    ) : (
      <div className="text-center py-8 text-gray-500">No stats available.</div>
    )}
  </div>
);

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
  const [showKBPopup, setShowKBPopup] = useState(false);
  const [showCannedPopup, setShowCannedPopup] = useState(false);
  // Dialog state moved to main return block below
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
    <>
      {/* Top Bar with agent status controls */}
      <NavBar
        onLogout={handleLogout}
        isSIPReady={isSIPReady}
        agentStatus={agentStatus}
        setAgentStatus={setAgentStatus}
      />

      <div className="flex h-[calc(100vh-68px)]  text-gray-800">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} tabs={["dashboard", "contacts", "analytics"]} />
        <main className="flex-1 overflow-y-auto px-8 py-6">
          <div className="max-w-5xl mx-auto flex flex-col space-y-8">
            {/* Top action buttons for dialogs */}
            <div className="flex gap-4 justify-end mb-4">
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
                onClick={() => setShowKBPopup(true)}
              >
                <BookOpen size={20} />
                Knowledge Base
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
                onClick={() => setShowCannedPopup(true)}
              >
                <span className="inline-block w-4 h-4 bg-blue-200 rounded-full mr-1" />
                Canned Answers
              </button>
            </div>
            {activeTab === "dashboard" && (
              <>
                <Header handleSearch={handleSearch} search={search} setSearch={setSearch} />

                <StatsPanel statsLoading={statsLoading} statsError={statsError} agentStats={agentStats} simulatedOnlineMinutes={simulatedOnlineMinutes} simulatedOnlineSeconds={simulatedOnlineSeconds} />

                <ShiftReportPanel loadingShifts={loadingShifts} shiftReport={shiftReport} reasonEdits={reasonEdits} handleReasonChange={handleReasonChange} handleReasonSubmit={handleReasonSubmit} reasonLoading={reasonLoading} setShiftPage={setShiftPage} />
                <QueueWaitingReportPanel queueWaitingReport={queueWaitingReport} />
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
            {/* Knowledge Base Dialog */}
            {showKBPopup && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] overflow-y-auto relative p-8 flex flex-col">
                  <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition" onClick={() => setShowKBPopup(false)}>
                    <X size={32} />
                  </button>
                  <KnowledgeBaseSearch />
                </div>
              </div>
            )}
            {/* Canned Answers Dialog */}
            {showCannedPopup && (
              <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] overflow-y-auto relative p-8 flex flex-col">
                  <button className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 transition" onClick={() => setShowCannedPopup(false)}>
                    <X size={32} />
                  </button>
                  <CannedResponseSearch />
                </div>
              </div>
            )}
          </div>
        </main>
        {/* Sidebar removed for cleaner layout */}
        {/* Floating Call Button with bounce animation */}
        <button
          className={`fixed bottom-10 right-10 z-50 w-16 h-16 rounded-2xl bg-indigo-500 shadow-xl text-white text-2xl flex items-center justify-center hover:bg-indigo-600 transition ${!isSIPReady ? 'opacity-50 cursor-not-allowed' : ''} animate-bounce`}
          title={isSIPReady ? 'Open Keypad / Make Call' : 'SIP Not Connected'}
          onClick={() => isSIPReady && setShowKeypad(true)}
          disabled={!isSIPReady}
        >
          <Phone />
        </button>
      </div>

      {/* Show CallPopup if there is a live call OR if keypad is requested */}
      {(sip.callSession || sip.incomingCall || showKeypad) && (
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
      )}
    </>
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
      to { opacity: 1, transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}

export default Dashboard;
