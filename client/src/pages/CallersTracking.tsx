import React, { useEffect, useState } from "react";
import { UseSocket } from "../context/SocketContext";
import { Clock, PhoneIncoming } from 'lucide-react';

type Caller = {
  id: string;
  caller_id: string;
  position: number;
  waitStart: number;
  queue: string;
};

type QueueNameMap = {
  [queueId: string]: string;
};

const QueueCallerTable: React.FC = () => {
  const [callers, setCallers] = useState<Caller[]>([]);
  const [queueNameMap, setQueueNameMap] = useState<QueueNameMap>({});
  const [now, setNow] = useState(Date.now());
  const { socket } = UseSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for flat caller array
    socket.on("queueStatus", (data: Caller[]) => {
      setCallers(data);
    });

    // Listen for queue name map
    socket.on("queueNameMap", (map: QueueNameMap) => {
      setQueueNameMap(map);
    });

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      socket.off("queueStatus");
      socket.off("queueNameMap");
      clearInterval(interval);
    };
  }, [socket]);

  const formatWaitTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-6 w-full bg-gray-100 text-gray-900 font-sans flex flex-col items-center">
      <div className="w-full mb-6 text-left">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          <PhoneIncoming className="w-5 h-5 mr-2 text-blue-500" />
          Incoming call
        </h2>
      </div>

      <div className="overflow-x-auto w-full bg-white shadow-lg border border-gray-200 rounded-md">
        <table className="min-w-full w-full table-auto">
          <thead>
            <tr className="text-left bg-gray-200 text-gray-700 font-semibold text-sm">
              <th className="px-6 py-3">Queue</th>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Caller ID</th>
              <th className="px-6 py-3">Position</th>
              <th className="px-6 py-3 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Wait Time
              </th>
            </tr>
          </thead>
          <tbody>
            {callers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No callers currently in queue.
                </td>
              </tr>
            ) : (
              callers.map((caller) => {
                const waitSeconds = Math.floor((now - caller.waitStart) / 1000);
                return (
                  <tr
                    key={caller.id}
                    className="border-t border-gray-200 hover:bg-blue-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 truncate">
                      {queueNameMap[caller.queue] || caller.queue}
                    </td>
                    <td className="px-6 py-4">{caller.id}</td>
                    <td className="px-6 py-4">{caller.caller_id}</td>
                    <td className="px-6 py-4">{caller.position}</td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">
                      {formatWaitTime(waitSeconds)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default QueueCallerTable;
