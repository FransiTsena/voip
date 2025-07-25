import React, { useState } from 'react';
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


const Dashboard = () => {
  const agent = useStore(state => state.agent);
  const logout = useStore(state => state.logout);
  // For navigation after logout
  const [redirect, setRedirect] = useState(false);
  // Keypad modal state
  const [showKeypad, setShowKeypad] = useState(false);
  const [dialNumber, setDialNumber] = useState("");
  // Search bar state
  const [search, setSearch] = useState("");

  // Keypad button values
  const keypadButtons = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["*", "0", "#"]
  ];

  const handleLogout = async () => {
    await logout();
    setRedirect(true);
  };

  // Handle search submit
  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      window.location.href = `/knowledge-base?query=${encodeURIComponent(search)}`;
    }
  };

  if (redirect) {
    window.location.href = '/login';
    return null;
  }

  return (
    <SIPProvider>
      {/* Top Bar: NavBar only */}
      <div className="w-full flex flex-col shadow-sm bg-white sticky top-0 z-30">
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <NavBar onLogout={handleLogout} shiftControl={<ShiftTimer />} />
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)] bg-white">
        {/* Sidebar: Navigation */}
        <Sidebar />

        {/* Main Content: Search, Alerts, Centered Active Call & Customer Info */}
        <main className="flex-1 flex flex-col items-center justify-start px-6 py-6 overflow-y-auto">
          {/* Search Bar and Alerts */}
          <div className="w-full max-w-4xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex items-center w-full md:max-w-md">
              <input
                type="text"
                className="flex-1 rounded-l-lg px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-200 text-base bg-white"
                placeholder="Search Knowledge Base..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-r-lg px-4 py-2 bg-blue-500 text-white font-semibold hover:bg-blue-600 border border-blue-500 border-l-0"
              >
                Search
              </button>
            </form>
            {/* Alerts */}
            <div className="flex items-center gap-4">
              <FaBell className="text-gray-500 text-xl" title="Real-time Alerts" />
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold">Queue: 2 waiting</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold">System: OK</span>
            </div>
          </div>
          <SIPDashboardUI
            agent={agent}
            showKeypad={showKeypad}
            setShowKeypad={setShowKeypad}
            dialNumber={dialNumber}
            setDialNumber={setDialNumber}
            keypadButtons={keypadButtons}
          />
        </main>
      </div>
    </SIPProvider>
  );
};



// --- Sidebar Component ---
function Sidebar() {
  const [showTickets, setShowTickets] = useState(true);
  const [showKB, setShowKB] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  return (
    <aside className="w-64 min-w-[220px] bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      <div className="flex flex-col gap-2 p-4">
        <button className="flex items-center gap-2 text-base font-semibold text-gray-700 hover:bg-blue-100 rounded px-3 py-2 transition" onClick={() => setShowTickets(v => !v)}>
          Ticket History {showTickets ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {showTickets && <div className="pl-2"><TicketList /></div>}
        <button className="flex items-center gap-2 text-base font-semibold text-gray-700 hover:bg-blue-100 rounded px-3 py-2 transition" onClick={() => setShowKB(v => !v)}>
          Knowledge Base {showKB ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {showKB && <div className="pl-2 text-sm text-gray-500">(Search above or view articles here...)</div>}
        <button className="flex items-center gap-2 text-base font-semibold text-gray-700 hover:bg-blue-100 rounded px-3 py-2 transition" onClick={() => setShowMetrics(v => !v)}>
          Performance Metrics {showMetrics ? <FaChevronUp /> : <FaChevronDown />}
        </button>
        {showMetrics && <div className="pl-2 text-sm text-gray-500">(Metrics panel coming soon...)</div>}
      </div>
    </aside>
  );
}

// --- Main SIP Dashboard UI ---
function SIPDashboardUI({ agent, showKeypad, setShowKeypad, dialNumber, setDialNumber, keypadButtons }) {
  const sip = useSIP() || {};
  const makeCall = sip.makeCall;
  const incomingCall = sip.incomingCall;
  const answer = sip.answer;
  const hangup = sip.hangup;
  const sipError = sip.error;
  const [showIncoming, setShowIncoming] = useState(false);
  const [incomingNumber, setIncomingNumber] = useState("");
  const isSIPReady = typeof makeCall === 'function';

  React.useEffect(() => {
    if (incomingCall) {
      setShowIncoming(true);
      const number = incomingCall.remote_identity?.uri?.user || '';
      setIncomingNumber(number);
    } else {
      setShowIncoming(false);
      setIncomingNumber("");
    }
  }, [incomingCall]);

  const handleMakeCall = () => {
    if (dialNumber && isSIPReady) {
      makeCall(dialNumber);
    }
    setShowKeypad(false);
    setDialNumber("");
  };

  // --- Main Layout ---
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      {/* Active Call Panel & Customer Info */}
      <div className="flex flex-row gap-6 items-start">
        {/* Active Call Panel */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow p-6 flex flex-col gap-4 min-w-[320px]">
          <div className="flex items-center gap-3 mb-2">
            <FaPhoneAlt className="text-blue-500 text-2xl" />
            <span className="font-bold text-lg">Active Call</span>
            {/* Example color-coded tag */}
            <span className="ml-2 px-2 py-1 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold" title="VIP Customer">VIP</span>
            <span className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 text-xs font-semibold" title="Escalation">Escalation</span>
          </div>
          <CallControlBar
            isSIPReady={isSIPReady}
            incomingCall={incomingCall}
            answer={answer}
            hangup={hangup}
            agent={agent}
            showIncoming={showIncoming}
            incomingNumber={incomingNumber}
          />
          {/* AI Suggestions (placeholder) */}
          <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">AI Suggested Response:</div>
            <div className="bg-blue-50 border border-blue-100 rounded p-2 text-sm text-blue-900">How can I assist you today?</div>
          </div>
        </div>
        {/* Customer Profile & Ticket Detail */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow p-6 flex flex-col gap-4 min-w-[320px]">
          <div className="flex items-center gap-2 mb-2">
            <FaUserTag className="text-green-500 text-xl" />
            <span className="font-bold text-lg">Customer Profile</span>
            {/* Example tooltip */}
            <span className="ml-2 px-2 py-1 rounded bg-gray-100 text-gray-700 text-xs font-semibold" title="Customer ID">ID: 12345</span>
          </div>
          <CustomerInfo />
          <div className="mt-2">
            <div className="text-xs text-gray-400 mb-1">Current Ticket</div>
            <TicketDetail />
          </div>
        </div>
      </div>

      {/* SIP Error Toast */}
      {sipError && (
        <div className="fixed bottom-32 right-10 z-50 max-w-xs bg-red-100 text-red-700 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold border border-red-300 animate-fade-in">
          {sipError}
        </div>
      )}

      {/* Floating Action Button for Keypad */}
      <button
        className={`fixed bottom-10 right-10 z-50 rounded-full w-20 h-20 flex items-center justify-center transition-all text-4xl border-4 border-white shadow-lg bg-blue-500 hover:bg-blue-600 text-white ${!isSIPReady ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isSIPReady ? 'Open Keypad / Make Call' : 'SIP Not Connected'}
        onClick={() => isSIPReady && setShowKeypad(true)}
        disabled={!isSIPReady}
      >
        <FaPhoneAlt className="animate-pulse" />
      </button>

      {/* Keypad Modal */}
      {showKeypad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 animate-fade-in">
          <div className="relative w-[340px] max-w-full rounded-2xl bg-white shadow-xl border border-gray-200 flex flex-col items-center p-0 overflow-hidden animate-fade-in-up">
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-blue-600 text-2xl font-black transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200"
              onClick={() => setShowKeypad(false)}
              title="Close"
              style={{ zIndex: 2 }}
            >
              ×
            </button>
            {/* Number Display */}
            <div className="mt-8 mb-6 text-3xl font-mono tracking-widest text-gray-900 h-12 flex items-center justify-center w-full border-b border-gray-100 bg-white">
              {dialNumber || <span className="text-gray-400">Enter number</span>}
            </div>
            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6 px-6">
              {keypadButtons.flat().map((btn, i) => (
                <button
                  key={btn + i}
                  className="w-14 h-14 rounded-full bg-gray-50 hover:bg-blue-100 active:bg-blue-200 text-2xl font-bold text-gray-800 flex items-center justify-center shadow-sm border border-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-blue-200"
                  onClick={() => setDialNumber(dialNumber + btn)}
                  disabled={!isSIPReady}
                  title={isSIPReady ? undefined : 'SIP Not Connected'}
                  style={{ transition: 'box-shadow 0.2s, transform 0.2s' }}
                >
                  {btn}
                </button>
              ))}
              {/* Backspace button */}
              <button
                className="w-14 h-14 rounded-full bg-gray-50 hover:bg-red-100 active:bg-red-200 text-2xl font-bold text-gray-500 flex items-center justify-center shadow-sm border border-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-red-200"
                onClick={() => setDialNumber(dialNumber.slice(0, -1))}
                disabled={!dialNumber}
                title="Delete last digit"
                style={{ transition: 'box-shadow 0.2s, transform 0.2s', gridColumn: '3' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
            {/* Call Button */}
            <button
              className="mb-7 w-6/12 text-white rounded-2xl py-3 text-xl font-bold flex items-center justify-center disabled:opacity-50 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all bg-blue-500 hover:bg-blue-600"
              onClick={handleMakeCall}
              disabled={!dialNumber || !isSIPReady}
              title={isSIPReady ? undefined : 'SIP Not Connected'}
              style={{ letterSpacing: '0.03em' }}
            >
              <FaPhoneAlt className="mr-3 text-2xl" /> Call
            </button>
            {/* SIP Not Ready Message */}
            {!isSIPReady && (
              <div className="mb-7 text-red-600 font-bold text-center">SIP connection not ready. Cannot make calls.</div>
            )}
          </div>
        </div>
      )}
      <CallPopup />
    </div>
  );
}
export default Dashboard;
