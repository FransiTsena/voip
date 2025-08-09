import React, { useState, useEffect, useRef } from "react";
import JsSIP from "jssip";

// Define missing types
interface JsSIPRTCSession extends EventTarget {
  connection: RTCPeerConnection;
  terminate: () => void;
  answer: (options: {
    mediaConstraints: { audio: boolean; video: boolean };
  }) => void;
  on: (event: string, callback: Function) => void;
  remote_identity: {
    uri: string;
  };
}

interface JsSIPUA extends EventTarget {
  call: (target: string, options: any) => JsSIPRTCSession;
  start: () => void;
  stop: () => void;
  on: (event: string, callback: Function) => void;
  isConnected: () => boolean;
}

interface SipConfig {
  wsUri: string;
  sipUri: string;
  password: string;
  displayName: string;
}

type CallStatus =
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "registered" }
  | { status: "incoming"; remoteNumber: string }
  | { status: "calling"; remoteNumber: string }
  | { status: "in-call"; remoteNumber: string }
  | { status: "ended" }
  | { status: "error"; message: string };

const SipPhone: React.FC<{ config: SipConfig }> = ({ config }) => {
  const [callStatus, setCallStatus] = useState<CallStatus>({
    status: "disconnected",
  });
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const uaRef = useRef<JsSIPUA | null>(null);
  const currentSessionRef = useRef<JsSIPRTCSession | null>(null);

  // Initialize SIP UA
  useEffect(() => {
    const { wsUri, sipUri, password, displayName } = config;

    const socket = new JsSIP.WebSocketInterface(wsUri);
    const ua = new JsSIP.UA({
      sockets: [socket],
      uri: sipUri,
      password,
      display_name: displayName,
      session_timers: false,
      register: true,
    }) as unknown as JsSIPUA;

    uaRef.current = ua;

    // Event handlers
    ua.on("connecting", () => {
      setCallStatus({ status: "connecting" });
    });

    ua.on("registered", () => {
      setCallStatus({ status: "registered" });
    });

    ua.on("registrationFailed", (e: any) => {
      setCallStatus({
        status: "error",
        message: `Registration failed: ${e.cause}`,
      });
    });

    ua.on("newRTCSession", (data: { originator: string; session: any }) => {
      const session = data.session as JsSIPRTCSession;

      if (data.originator === "remote") {
        currentSessionRef.current = session;
        setCallStatus({
          status: "incoming",
          remoteNumber: session.remote_identity.uri,
        });

        session.on("accepted", () => {
          setCallStatus({
            status: "in-call",
            remoteNumber: session.remote_identity.uri,
          });
        });

        session.on("ended", () => {
          setCallStatus({ status: "registered" });
          currentSessionRef.current = null;
        });

        session.on("failed", (e: any) => {
          setCallStatus({
            status: "error",
            message: `Call failed: ${e.cause}`,
          });
          currentSessionRef.current = null;
        });

        // Handle media stream
        session.connection.addEventListener("addstream", (e: any) => {
          if (remoteAudioRef.current && e.stream) {
            remoteAudioRef.current.srcObject = e.stream;
          }
        });
      }
    });

    ua.start();

    return () => {
      ua.stop();
      if (currentSessionRef.current) {
        currentSessionRef.current.terminate();
      }
    };
  }, [config]);

  const makeCall = (number: string) => {
    if (!uaRef.current) return;

    const options = {
      mediaConstraints: { audio: true, video: false },
      pcConfig: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          // Add your TURN servers if needed
        ],
      },
    };

    const session = uaRef.current.call(number, options) as JsSIPRTCSession;
    currentSessionRef.current = session;

    setCallStatus({ status: "calling", remoteNumber: number });

    session.on("accepted", () => {
      setCallStatus({ status: "in-call", remoteNumber: number });
    });

    session.on("ended", () => {
      setCallStatus({ status: "registered" });
      currentSessionRef.current = null;
    });

    session.on("failed", (e: any) => {
      setCallStatus({ status: "error", message: `Call failed: ${e.cause}` });
      currentSessionRef.current = null;
    });
  };

  const answerCall = () => {
    if (currentSessionRef.current) {
      currentSessionRef.current.answer({
        mediaConstraints: { audio: true, video: false },
      });
    }
  };

  const endCall = () => {
    if (currentSessionRef.current) {
      currentSessionRef.current.terminate();
    }
  };

  return (
    <div className="sip-phone">
      <h2>SIP Phone</h2>
      <div>Status: {callStatus.status}</div>
      {"remoteNumber" in callStatus && (
        <div>Remote: {callStatus.remoteNumber}</div>
      )}
      {"message" in callStatus && (
        <div className="error">{callStatus.message}</div>
      )}

      <div className="controls">
        {callStatus.status === "registered" && (
          <button onClick={() => makeCall("1002")}>Call 1002</button>
        )}

        {callStatus.status === "incoming" && (
          <>
            <button onClick={answerCall}>Answer</button>
            <button onClick={endCall}>Decline</button>
          </>
        )}

        {(callStatus.status === "calling" ||
          callStatus.status === "in-call") && (
          <button onClick={endCall}>End Call</button>
        )}
      </div>

      <audio ref={remoteAudioRef} autoPlay playsInline />
    </div>
  );
};

export default SipPhone;
