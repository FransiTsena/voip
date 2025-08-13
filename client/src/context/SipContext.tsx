import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";
import JsSIP from "jssip";
import { RTCSession } from "jssip/lib/RTCSession";

interface SipContextType {
  ua: JsSIP.UA | null;
  status: string;
  incomingSession: RTCSession | null;
  incomingNumber: string | null;
  answer: () => void;
  decline: () => void;
}

const SipContext = createContext<SipContextType | undefined>(undefined);

interface SipProviderProps {
  children: ReactNode;
  config: {
    wsUri: string;
    sipUri: string;
    password: string;
    displayName?: string;
  };
}

export const SipProvider: React.FC<SipProviderProps> = ({
  children,
  config,
}) => {
  const uaRef = useRef<JsSIP.UA | null>(null);
  const [status, setStatus] = useState<string>("disconnected");
  const [incomingSession, setIncomingSession] = useState<RTCSession | null>(
    null
  );
  const [incomingNumber, setIncomingNumber] = useState<string | null>(null);

  const cleanSession = (session: RTCSession) => {
    if (incomingSession && session !== incomingSession) return; // ignore other sessions
    setIncomingSession(null);
    setIncomingNumber(null);
  };

  useEffect(() => {
    const { wsUri, sipUri, password, displayName } = config;
    if (uaRef.current) return; // singleton
    const socket = new (JsSIP as any).WebSocketInterface(wsUri);
    const ua = new (JsSIP as any).UA({
      sockets: [socket],
      uri: sipUri,
      password,
      display_name: displayName,
      session_timers: false,
      register: true,
    });
    uaRef.current = ua;

    ua.on("connecting", () => setStatus("connecting"));
    ua.on("connected", () => setStatus("connected"));
    ua.on("registered", () => setStatus("registered"));
    ua.on("registrationFailed", (e: any) => setStatus(`error: ${e.cause}`));
    ua.on("disconnected", () => setStatus("disconnected"));
    ua.on("newRTCSession", (data: any) => {
      const session: RTCSession = data.session;
      if (data.originator === "remote") {
        // attach handlers immediately
        session.on("ended", () => cleanSession(session));
        session.on("failed", () => cleanSession(session));
        session.on("accepted", () => setStatus("in-call"));
        setIncomingSession(session);
        setIncomingNumber(
          (session as any).remote_identity?.uri?.user ||
            (session as any).remote_identity?.uri ||
            "Unknown"
        );
      }
    });

    ua.start();
    return () => {
      ua.stop();
    };
  }, [config]);

  const answer = useCallback(() => {
    if (incomingSession) {
      try {
        incomingSession.answer({
          mediaConstraints: { audio: true, video: false },
        });
      } catch (e) {
        console.error(e);
      }
    }
  }, [incomingSession]);

  const decline = useCallback(() => {
    if (incomingSession) {
      try {
        incomingSession.terminate();
      } catch {
        /* ignore */
      }
      setIncomingSession(null);
      setIncomingNumber(null);
    }
  }, [incomingSession]);

  return (
    <SipContext.Provider
      value={{
        ua: uaRef.current,
        status,
        incomingSession,
        incomingNumber,
        answer,
        decline,
      }}
    >
      {children}
    </SipContext.Provider>
  );
};

export const useSip = () => {
  const ctx = useContext(SipContext);
  if (!ctx) throw new Error("useSip must be used within SipProvider");
  return ctx;
};
