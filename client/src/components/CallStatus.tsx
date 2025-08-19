import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import {
  PhoneCall,
  PauseCircle,
  XCircle,
  Headphones,
  Mic,
  PhoneIncoming,
} from "lucide-react";
import { RTCSession } from "jssip/lib/RTCSession";

interface ActiveCall {
  id: string;
  caller: string;
  callerName: string;
  agent: string;
  agentName: string;
  state: string;
  startTime: number;
  channels: string[];
}

interface CallStatusProps {
  activeCalls: ActiveCall[];
}

interface CallMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  call: ActiveCall | null;
  action: "Listen" | "Whisper" | "Barge" | null;
  getCallDuration: (startTime: number) => string;
  errorMessage: string | null;
}

const CallMonitorModal: React.FC<CallMonitorModalProps> = ({
  isOpen,
  onClose,
  call,
  action,
  getCallDuration,
  errorMessage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close modal"
        >
          <XCircle className="w-6 h-6" />
        </button>
        <h3 className="text-2xl font-bold mb-6 text-gray-800">
          {action ? `${action} Call` : "Call Monitor"}
        </h3>
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        {call && (
          <div className="text-sm text-gray-700">
            <p><strong>Caller:</strong> {call.caller}</p>
            <p><strong>Caller Name:</strong> {call.callerName}</p>
            <p><strong>Agent:</strong> {call.agent}</p>
            <p><strong>Agent Name:</strong> {call.agentName}</p>
            <p><strong>State:</strong> {call.state}</p>
            <p><strong>Duration:</strong> {getCallDuration(call.startTime)}</p>
          </div>
        )}
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CallStatus: React.FC<CallStatusProps> = ({ activeCalls }) => {
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState<boolean>(false);
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [selectedAction, setSelectedAction] = useState<"Listen" | "Whisper" | "Barge" | null>(null);
  const [monitorModalErrorMessage, setMonitorModalErrorMessage] = useState<string | null>(null);
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

  const getCallDuration = (startTime: number): string => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMonitorAction = async (call: ActiveCall, action: "Listen" | "Whisper" | "Barge") => {
    setSelectedCall(call);
    setSelectedAction(action);
    setMonitorModalErrorMessage(null);

    const targetExtension = call.agent;
    if (!targetExtension) {
      setMonitorModalErrorMessage("No valid target extension for this call.");
      setIsMonitorModalOpen(true);
      return;
    }

    try {
      await axios.post(`${API}/api/monitoring/initiate`, {
        targetExtension,
        mode: action.toLowerCase(),
      }, { withCredentials: true });
      setIsMonitorModalOpen(true);
    } catch (err: any) {
      setMonitorModalErrorMessage(
        `Failed to initiate ${action}: ${err.response?.data?.message || err.message}`
      );
      setIsMonitorModalOpen(true);
    }
  };

  const totalCalls = activeCalls.length;
  const talkingCalls = activeCalls.filter((c) => c.state === "Talking").length;
  const onHoldCalls = activeCalls.filter((c) => c.state === "Hold").length;

  return (
    <div className="p-6 w-full bg-gray-100 text-gray-900 font-sans flex flex-col items-center">
      
      <div className="flex justify-between items-center w-full mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Calls being processed</h2>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 w-full">
        {[
          { label: "Total Active Calls", value: totalCalls, icon: <PhoneIncoming className="w-5 h-5 text-blue-500" /> },
          { label: "Talking", value: talkingCalls, icon: <PhoneCall className="w-5 h-5 text-green-500" /> },
          { label: "On Hold", value: onHoldCalls, icon: <PauseCircle className="w-5 h-5 text-yellow-500" /> },
        ].map(({ label, value, icon }) => (
          <div
            key={label}
            className="flex-1 min-w-[150px] bg-white border border-gray-200 shadow-sm px-5 py-3 rounded-md flex items-center justify-between"
          >
            <div>
              <div className="text-sm text-gray-500">{label}</div>
              <div className="text-xl font-bold text-gray-800">{value}</div>
            </div>
            {icon}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto w-full bg-white shadow-lg border border-gray-200 rounded-md">
        <table className="min-w-full w-full table-auto">
          <thead>
            <tr className="text-left bg-gray-200 text-gray-700 font-semibold text-sm">
              <th className="px-6 py-3">Caller</th>
              <th className="px-6 py-3">Caller Name</th>
              <th className="px-6 py-3">Agent</th>
              <th className="px-6 py-3">Agent Name</th>
              <th className="px-6 py-3">State</th>
              <th className="px-6 py-3">Duration</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeCalls.length > 0 ? (
              activeCalls.map((call) => (
                <tr
                  key={call.id}
                  className="border-t border-gray-200 hover:bg-blue-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 font-semibold text-gray-800">{call.caller}</td>
                  <td className="px-6 py-4">{call.callerName}</td>
                  <td className="px-6 py-4">{call.agent}</td>
                  <td className="px-6 py-4">{call.agentName}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        call.state === "Talking"
                          ? "bg-green-100 text-green-700"
                          : call.state === "Hold"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {call.state === "Talking" ? (
                        <PhoneCall className="w-3 h-3" />
                      ) : call.state === "Hold" ? (
                        <PauseCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {call.state}
                    </span>
                  </td>
                  <td className="px-6 py-5 font-mono text-sm text-gray-700">{getCallDuration(call.startTime)}</td>
                  <td className="px-6 py-5 flex gap-2 justify-center">
                    <button
                      onClick={() => handleMonitorAction(call, "Listen")}
                      className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 ring-blue-500 flex items-center gap-1 shadow-sm"
                    >
                      <Headphones className="w-4 h-4" /> Listen
                    </button>
                    <button
                      onClick={() => handleMonitorAction(call, "Whisper")}
                      className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:ring-2 ring-yellow-500 flex items-center gap-1 shadow-sm"
                    >
                      <Mic className="w-4 h-4" /> Whisper
                    </button>
                    <button
                      onClick={() => handleMonitorAction(call, "Barge")}
                      className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 focus:ring-2 ring-red-500 flex items-center gap-1 shadow-sm"
                    >
                      <PhoneCall className="w-4 h-4" /> Barge
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                  No active calls currently.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CallMonitorModal
        isOpen={isMonitorModalOpen}
        onClose={() => {
          setIsMonitorModalOpen(false);
          setSelectedCall(null);
          setSelectedAction(null);
          setMonitorModalErrorMessage(null);
        }}
        call={selectedCall}
        action={selectedAction}
        getCallDuration={getCallDuration}
        errorMessage={monitorModalErrorMessage}
      />
    </div>
  );
};

export default CallStatus;