import { useEffect, useState } from "react";
import QueueDashboard from "../components/QueueMeterics";
import { UseSocket } from "../context/SocketContext";
import QueueMembersDashboard from "../components/QueueMembersStatus";
import CallersTracking from "./CallersTracking";
import CallStatus from "../components/CallStatus";
import { SipProvider } from "../context/SipContext";

interface ActiveCall {
  id: string;
  caller: string;
  callerName: string; // ✅ Add this line
  agentName: string;
  agent: string;
  state: string;
  startTime: number;
  channels: any[];
}

// Provide base SIP config (TODO: replace with real credentials / dynamic data)
const sipConfig = {
  wsUri: "ws://10.42.0.1:8088/ws",
  sipUri: "sip:9001@10.42.0.1",
  password: "eyJhbGciOiJIUzI1", // placeholder
  displayName: "Supervisor"
};

export default function LiveCalls() {
  const { socket } = UseSocket();
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);

  useEffect(() => {
    socket?.on("ongoingCalls", (calls: ActiveCall[]) => {
      console.log("on going calles", calls)
      setActiveCalls(calls);
    });
    socket?.emit("on-going-calles")
    return () => {
      socket?.off("ongoingCalls");
    socket?.off("on-going-calles")

    };
  }, [socket]);

  return (
    <SipProvider config={sipConfig}>
      <div className="h-screen flex flex-col">
        <CallersTracking />
        <CallStatus activeCalls={activeCalls} />
        <QueueDashboard />
        <QueueMembersDashboard />
      </div>
    </SipProvider>
  );
}
