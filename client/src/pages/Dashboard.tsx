import { useEffect, useState } from "react";
import QueueDashboard from "../components/QueueMeterics";
import { UseSocket } from "../context/SocketContext";
import QueueMembersDashboard from "../components/QueueMembersStatus";
import CallersTracking from "./CallersTracking";
import CallStatus from "../components/CallStatus";

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


export default function LiveCalls() {
  const { socket } = UseSocket();
  const [activeCalls, setActiveCalls] = useState<ActiveCall[]>([]);

  useEffect(() => {
    socket?.on("ongoingCalls", (calls: ActiveCall[]) => {
      console.log ("on going calles", calls)
      setActiveCalls(calls);
    });

    return () => {
      socket?.off("ongoingCalls");
    };
  }, [socket]);

  return (
    <div className="h-screen flex flex-col">
      <CallersTracking />

      <CallStatus activeCalls={activeCalls} />

      <QueueDashboard />
      <QueueMembersDashboard />
    </div>
  );
}
