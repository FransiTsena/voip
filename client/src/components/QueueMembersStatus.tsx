import { useEffect, useState } from "react";
import { UseSocket } from "../context/SocketContext";

interface QueueMemberType {
  Queue: string;
  Name: string;
  Location: string;
  Membership: string;
  Penalty: string;
  CallsTaken: string;
  LastCall: string;
  InCall: string;
  Status: string;
  Paused: string;
  pauseReason: string;
  queueName: string;
}

export default function QueueMembersDashboard() {
  const [queueMembers, setQueueMembers] = useState<QueueMemberType[]>([]);
  const [selectedQueue, setSelectedQueue] = useState("All Queues");
  const { socket } = UseSocket();

  useEffect(() => {
    const handler = (data: QueueMemberType[] | any) => {
      console.log("queueMembers", data);
      if (Array.isArray(data)) {
        setQueueMembers(data);
      } else {
        // Flatten the data and assert its type to resolve the TypeScript error.
        const flatArray = Object.values(data).flat() as QueueMemberType[];
        setQueueMembers(flatArray);
      }
    };
    socket?.on("queueMembers", handler);

    return () => {
      socket?.off("queueMembers", handler);
    };
  }, [socket]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "1":
        return <span className="text-green-600 font-medium">Idle</span>;
      case "2":
      case "3":
        return <span className="text-blue-600 font-medium">In Use</span>;
      case "4":
        return <span className="text-red-600 font-medium">Busy</span>;
      case "5":
        return <span className="text-gray-500 font-medium">Unavailable</span>;
      case "6":
        return (
          <span className="text-yellow-500 font-semibold animate-pulse">
            Ringing
          </span>
        );
      case "8":
        return <span className="text-orange-500 font-medium">On Hold</span>;
      default:
        return <span className="text-gray-400 font-medium">Unknown</span>;
    }
  };

  // Get a unique list of queue names for the filter dropdown
  const uniqueQueues = [...new Set(queueMembers.map(member => member.queueName || member.Queue))];

  // Filter agents based on the selected queue
  const filteredMembers = queueMembers.filter(member => 
    selectedQueue === "All Queues" || (member.queueName || member.Queue) === selectedQueue
  );

  return (
    <div className="p-6 space-y-10 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">👥 Queue Members</h2>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="queue-filter" className="text-gray-600">Filter by Queue:</label>
          <select
            id="queue-filter"
            value={selectedQueue}
            onChange={(e) => setSelectedQueue(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 text-gray-700"
          >
            <option value="All Queues">All Queues</option>
            {uniqueQueues.map(queue => (
              <option key={queue} value={queue}>{queue}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Single Table Container */}
      <div className="overflow-x-auto w-full bg-white shadow-lg border border-gray-200 rounded-md">
        {/* Table */}
        <table className="min-w-full w-full table-fixed text-sm text-gray-700">
          {/* Table Header */}
          <thead>
            <tr className="text-left bg-gray-200 text-gray-700 font-semibold text-sm">
              <th className="px-6 py-3">Queue</th>
              <th className="px-6 py-3">Agent</th>
              <th className="px-6 py-3">Membership</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-center">Paused</th>
              <th className="px-6 py-3 text-center">Pause Reason</th>
              <th className="px-6 py-3 text-center">Calls</th>
              <th className="px-6 py-3 text-center">In Call</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((agent, index) => (
                <tr
                  key={`${agent.Name}-${index}`} // Using a combination for a more unique key
                  className="border-t border-gray-200 hover:bg-blue-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 truncate">{agent.queueName || agent.Queue}</td>
                  <td className="px-6 py-4 truncate">{agent.Name}</td>
                  <td className="px-6 py-4 capitalize truncate">{agent.Membership}</td>
                  <td className="px-6 py-4">{getStatusLabel(agent.Status)}</td>
                  <td className="px-6 py-4 text-center">{agent.Paused === "1" ? "Paused" : "No"}</td>
                  <td className="px-6 py-4 text-center">{agent.Paused === "1" ? (agent.pauseReason || '-') : "-"}</td>
                  <td className="px-6 py-4 text-center">{agent.CallsTaken}</td>
                  <td className="px-6 py-4 text-center">{agent.InCall === "1" ? "Yes" : "No"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                  No queue members currently available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
