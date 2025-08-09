import React, { useState, useEffect, useRef } from "react";
import JsSIP from "jssip";
import { XCircle, Wifi, WifiOff } from "lucide-react";

interface SipConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSipStatusChange: (status: string, ua: JsSIP.UA | null) => void;
}

// Replace with your actual SIP server config
const SIP_DOMAIN = "10.42.0.1"; // Example: "pbx.example.com"
const WS_SERVER = "ws://10.42.0.1:8088/ws"; // Ensure the `/ws` path is correct for Asterisk

const SipConfigModal: React.FC<SipConfigModalProps> = ({
  isOpen,
  onClose,
  onSipStatusChange,
}) => {
  const [adminExtension, setAdminExtension] = useState("9001");
  const [sipPassword, setSipPassword] = useState("eyJhbGciOiJIUzI1");
  const [registrationStatus, setRegistrationStatus] = useState("Disconnected");
  const uaRef = useRef<JsSIP.UA | null>(null);

  const connect = () => {
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
      uaRef.current = ua;

      ua.on("connecting", () => {
        setRegistrationStatus("Connecting...");
        onSipStatusChange("Connecting...", null);
      });
      ua.on("connected", () => {
        setRegistrationStatus("Connected");
        onSipStatusChange("Connected", ua);
      });
      ua.on("disconnected", () => {
        setRegistrationStatus("Disconnected");
        onSipStatusChange("Disconnected", null);
        uaRef.current = null;
      });
      ua.on("registered", () => {
        setRegistrationStatus("Registered");
        onSipStatusChange("Registered", ua);
      });
      ua.on("unregistered", () => {
        setRegistrationStatus("Unregistered");
        onSipStatusChange("Unregistered", null);
      });
      ua.on("registrationFailed", (data: any) => {
        const reason = data?.cause || "Unknown";
        setRegistrationStatus(`Registration Failed: ${reason}`);
        onSipStatusChange(`Registration Failed: ${reason}`, null);
        uaRef.current = null;
      });

      ua.start();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setRegistrationStatus(`Error: ${message}`);
      onSipStatusChange(`Error: ${message}`, null);
    }
  };

  const disconnect = () => {
    if (uaRef.current) {
      uaRef.current.stop();
      uaRef.current = null;
      setRegistrationStatus("Disconnected");
      onSipStatusChange("Disconnected", null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      connect();
    }

    return () => {
      disconnect(); // Clean up on unmount or modal close
    };
  }, [isOpen, adminExtension, sipPassword]);

  if (!isOpen) return null;

  const isConnected = registrationStatus === "Registered" || registrationStatus === "Connected";

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
          SIP Account Configuration
        </h3>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label htmlFor="adminExtension" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Extension
            </label>
            <input
              type="text"
              id="adminExtension"
              value={adminExtension}
              onChange={(e) => setAdminExtension(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., monitor"
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
              onChange={(e) => setSipPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 sm:text-sm"
              placeholder="********"
            />
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-sm font-medium">
            Status:{" "}
            <span
              className={`font-bold ${
                registrationStatus === "Registered"
                  ? "text-green-600"
                  : registrationStatus.startsWith("Error") || registrationStatus === "Disconnected"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {registrationStatus}
            </span>
            {isConnected ? (
              <Wifi className="w-5 h-5 text-green-600" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-600" />
            )}
          </div>
          <button
            onClick={isConnected ? disconnect : connect}
            className={`px-4 py-2 rounded-md shadow-sm text-white font-semibold transition-colors ${
              isConnected ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isConnected ? "Disconnect SIP" : "Connect SIP"}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors font-semibold shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SipConfigModal;
