import React, { useEffect, useState, useRef, useCallback } from "react";
import JsSIP from "jssip";
import {
  PhoneCall,
  PauseCircle,
  XCircle,
  Headphones,
  Mic,
  PhoneIncoming,
  Wifi,
  WifiOff,
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

const SIP_DOMAIN = "10.42.0.1";
const WS_SERVER = "ws://10.42.0.1:8088/ws";
const ADMIN_EXTENSION = "9001";
const SIP_PASSWORD = "eyJhbGciOiJIUzI1"; // Replace with actual password

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
  const [, setTimeTick] = useState<number>(0);
  const [activeJsSipSessionsMap, setActiveJsSipSessionsMap] = useState<Map<string, RTCSession>>(new Map());
  const [uaInstance, setUaInstance] = useState<JsSIP.UA | null>(null);
  const [registrationStatus, setRegistrationStatus] = useState<string>("Disconnected");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMonitorModalOpen, setIsMonitorModalOpen] = useState<boolean>(false);
  const [selectedCall, setSelectedCall] = useState<ActiveCall | null>(null);
  const [selectedAction, setSelectedAction] = useState<"Listen" | "Whisper" | "Barge" | null>(null);
  const [monitorModalErrorMessage, setMonitorModalErrorMessage] = useState<string | null>(null);
  const [isSipConfigModalOpen, setIsSipConfigModalOpen] = useState<boolean>(false);
  //pendingMonitorAction
  const [, setPendingMonitorAction] = useState<{
    call: ActiveCall;
    action: "Listen" | "Whisper" | "Barge";
  } | null>(null);
  const [adminExtension, setAdminExtension] = useState(ADMIN_EXTENSION);
  const [sipPassword, setSipPassword] = useState(SIP_PASSWORD);
  const [sipErrorMessage, setSipErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setTimeTick((tick) => tick + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const getCallDuration = (startTime: number): string => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const connectSip = useCallback(() => {
    if (!adminExtension || !sipPassword) {
      setSipErrorMessage("Extension and password are required.");
      setRegistrationStatus("Error: Missing credentials");
      return;
    }
    if (uaInstance) return;

    try {
      const socket = new JsSIP.WebSocketInterface(WS_SERVER);
      const configuration = {
        sockets: [socket],
        uri: `sip:${adminExtension}@${SIP_DOMAIN}`,
        password: sipPassword,
        register: true,
        trace_sip: true,
      };

      const ua = new JsSIP.UA(configuration);
      setUaInstance(ua);

      ua.on("connecting", () => setRegistrationStatus("Connecting..."));
      ua.on("connected", () => setRegistrationStatus("Connected"));
      ua.on("disconnected", () => {
        setRegistrationStatus("Disconnected");
        setUaInstance(null);
        setActiveJsSipSessionsMap(new Map());
        setSipErrorMessage("Disconnected from SIP server.");
      });
      ua.on("registered", () => {
        setRegistrationStatus("Registered");
        setSipErrorMessage(null);
      });
      ua.on("unregistered", () => {
        setRegistrationStatus("Unregistered");
        setUaInstance(null);
        setActiveJsSipSessionsMap(new Map());
        setSipErrorMessage("SIP registration was removed.");
      });
      ua.on("registrationFailed", ({ cause }: { cause?: JsSIP.C.causes }) => {
        setRegistrationStatus(`Registration Failed: ${cause || "Unknown cause"}`);
        setUaInstance(null);
        setActiveJsSipSessionsMap(new Map());
        setSipErrorMessage(`Registration failed: ${cause || "Unknown cause"}`);
      });

      ua.start();
    } catch (error) {
      setRegistrationStatus(`Error: ${error instanceof Error ? error.message : String(error)}`);
      setSipErrorMessage(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      setUaInstance(null);
    }
  }, [uaInstance, adminExtension, sipPassword]);

  useEffect(() => {
    connectSip();
    return () => {
      if (uaInstance) uaInstance.stop();
    };
  }, [connectSip]);

  // const handleSipStatusChange = useCallback(
  //   (status: string, ua: JsSIP.UA | null) => {
  //     setRegistrationStatus(status);
  //     setUaInstance(ua);

  //     if (status === "Registered" && ua && pendingMonitorAction) {
  //       const agentChannel = pendingMonitorAction.action !== "Listen"
  //         ? (pendingMonitorAction.call.channels.find((ch) => ch.includes(pendingMonitorAction.call.agent)) || pendingMonitorAction.call.channels[0])
  //         : pendingMonitorAction.call.agent;
  //       if (agentChannel) {
  //         makeMonitoringCall(agentChannel, pendingMonitorAction.action);
  //         setPendingMonitorAction(null);
  //         setIsSipConfigModalOpen(false);
  //       } else {
  //         setMonitorModalErrorMessage("No valid target found for this call.");
  //         setIsMonitorModalOpen(true);
  //         setSelectedCall(pendingMonitorAction.call);
  //         setSelectedAction(pendingMonitorAction.action);
  //         setPendingMonitorAction(null);
  //       }
  //     } else if (status !== "Registered") {
  //       setPendingMonitorAction(null);
  //     }
  //   },
  //   [pendingMonitorAction, isMonitorModalOpen]
  // );

  const makeMonitoringCall = (target: string, action: "Listen" | "Whisper" | "Barge") => {
    if (!uaInstance || !uaInstance.isRegistered()) {
      setMonitorModalErrorMessage(
        `SIP client not registered. Please ${registrationStatus === "Connecting..." ? "wait for connection" : "check your SIP configuration"}.`
      );
      setIsMonitorModalOpen(true);
      setSelectedCall(null);
      setSelectedAction(action);
      setPendingMonitorAction({ call: selectedCall || activeCalls[0], action });
      setIsSipConfigModalOpen(true);
      return;
    }

    try {
      let targetUri: string;
      let options: any;

      if (action === "Listen") {
        if (!target.match(/^\d+$/)) {
          throw new Error("Invalid agent extension for Listen action.");
        }
        targetUri = `sip:556${target}@192.168.1.8`;
        options = {
          mediaConstraints: { audio: true, video: false },
          // pcConfig: {
          //   iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          //   rtcpMuxPolicy: "require",
          // },
        };
      } else {
        const spyOptions = {
          Whisper: "qw",
          Barge: "qB",
        }[action];

        targetUri = `sip:spy-${target.split("/")[1].split("-")[0]}@192.168.1.8`;
        options = {
          mediaConstraints: { audio: true, video: false },
          pcConfig: {
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            rtcpMuxPolicy: "require",
          },
          extraHeaders: [
            `X-ChanSpy-Target: ${target}`,
            `X-ChanSpy-Options: ${spyOptions}`,
          ],
        };
      }

      const session = uaInstance.call(targetUri, options);
      setActiveJsSipSessionsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(crypto.randomUUID(), session);
        return newMap;
      });

      session.on("accepted", () => {
        if (audioRef.current && session.connection.getRemoteStreams().length > 0) {
          audioRef.current.srcObject = session.connection.getRemoteStreams()[0];
          audioRef.current.play().catch(() => {});
        }
      });
      session.on("failed", () => {
        setActiveJsSipSessionsMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(session.id);
          return newMap;
        });
        if (audioRef.current) audioRef.current.srcObject = null;
      });
      session.on("ended", () => {
        setActiveJsSipSessionsMap((prev) => {
          const newMap = new Map(prev);
          newMap.delete(session.id);
          return newMap;
        });
        if (audioRef.current) audioRef.current.srcObject = null;
        if (isMonitorModalOpen) setIsMonitorModalOpen(false);
      });

      setMonitorModalErrorMessage(null);
      setIsMonitorModalOpen(true);
    } catch (error) {
      setMonitorModalErrorMessage(
        `Failed to initiate ${action}: ${error instanceof Error ? error.message : String(error)}`
      );
      setIsMonitorModalOpen(true);
      setSelectedCall(null);
      setSelectedAction(action);
    }
  };

  const handleMonitorAction = (call: ActiveCall, action: "Listen" | "Whisper" | "Barge") => {
    if (!uaInstance || !uaInstance.isRegistered()) {
      setPendingMonitorAction({ call, action });
      setIsSipConfigModalOpen(true);
      return;
    }

    setSelectedCall(call);
    setSelectedAction(action);
    setMonitorModalErrorMessage(null);

    const target = action === "Listen" ? call.agent : (call.channels.find((ch) => ch.includes(call.agent)) || call.channels[0]);
    if (!target) {
      setMonitorModalErrorMessage("No valid target found for this call.");
      setIsMonitorModalOpen(true);
      setSelectedCall(call);
      setSelectedAction(action);
      return;
    }

    makeMonitoringCall(target, action);
  };

  const totalCalls = activeCalls.length;
  const talkingCalls = activeCalls.filter((c) => c.state === "Talking").length;
  const onHoldCalls = activeCalls.filter((c) => c.state === "Hold").length;

  return (
    <div className="p-6 w-full bg-gray-100 text-gray-900 font-sans flex flex-col items-center">
      
      {/* Top Header Section with Title and SIP Status */}
      <div className="flex justify-between items-center w-full mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Calls being processed</h2>
        <div className="text-sm font-medium flex items-center gap-2">
          SIP Status: <span className={registrationStatus === "Registered" ? "text-green-600" : "text-red-600"}>{registrationStatus}</span>
          {registrationStatus === "Registered" ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
        </div>
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

      <audio ref={audioRef} autoPlay className="hidden" />
      <CallMonitorModal
        isOpen={isMonitorModalOpen}
        onClose={() => {
          setIsMonitorModalOpen(false);
          if (selectedCall) {
            const session = Array.from(activeJsSipSessionsMap.entries()).find(([_, s]) => s)?.[1];
            if (session) session.terminate();
          }
          setSelectedCall(null);
          setSelectedAction(null);
          setMonitorModalErrorMessage(null);
        }}
        call={selectedCall}
        action={selectedAction}
        getCallDuration={getCallDuration}
        errorMessage={monitorModalErrorMessage}
      />
      {isSipConfigModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full relative">
            <button
              onClick={() => {
                setIsSipConfigModalOpen(false);
                setPendingMonitorAction(null);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-800">SIP Account Configuration</h3>
            {sipErrorMessage && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
                {sipErrorMessage}
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 mb-4">
              <div>
                <label htmlFor="adminExtension" className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Extension
                </label>
                <input
                  type="text"
                  id="adminExtension"
                  value={adminExtension}
                  onChange={(e) => setAdminExtension(e.target.value.trim())}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., 9001"
                />
              </div>
              <div>
                <label htmlFor="sipPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  SIP Password
                </label>
                <input
                  type="password"
                  id="sipPassword"
                  value={sipPassword}
                  onChange={(e) => setSipPassword(e.target.value.trim())}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 sm:text-sm"
                  placeholder="Enter SIP password"
                />
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  if (uaInstance) uaInstance.stop();
                  connectSip();
                }}
                disabled={!adminExtension || !sipPassword}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 transition-colors font-semibold shadow-sm"
              >
                Connect SIP
              </button>
              <button
                onClick={() => {
                  setIsSipConfigModalOpen(false);
                  setPendingMonitorAction(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallStatus;