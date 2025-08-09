import { useEffect, useState } from "react";
import { UseSocket } from "../context/SocketContext";
import { FaSearch } from "react-icons/fa";
import Tooltip from "@mui/material/Tooltip";

// Queue data structure
interface Queue {
  name: string;
  calls: number;
  holdtime: number | null;
  completed: number;
  abandoned: number;
  strategy: string;
  weight: number;
  talktime: number;
  max: number;
  raw: any;
}

export default function QueueDashboard() {
  const [queues, setQueues] = useState<Queue[]>([]);
  const [search, setSearch] = useState("");
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const { socket } = UseSocket();

  useEffect(() => {
    socket?.on("queueUpdate", (data) => {
      const queueArr = Object.keys(data)
        .filter((key) => !!data[key] && key !== "default")
        .map((key) => {
          const q = data[key];
          return {
            name: q.Queue || q.name || key,
            calls: Number(q.Calls),
            holdtime: q.Holdtime !== undefined ? Number(q.Holdtime) : null,
            completed: Number(q.Completed),
            abandoned: Number(q.Abandoned),
            strategy: q.Strategy || "",
            weight: Number(q.Weight),
            talktime: Number(q.TalkTime),
            max: Number(q.Max),
            raw: q,
          };
        });

      setQueues(queueArr);
      setLastUpdate(new Date().toLocaleTimeString());
    });

    return () => {
      socket?.off("queueUpdate");
    };
  }, [socket]);

  const filteredQueues = queues.filter(
    (q) => q.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (q: Queue) => {
    const abandonRate = q.abandoned / (q.calls || 1);
    if (abandonRate > 0.5) return { label: "Critical", color: "bg-red-600" };
    if (abandonRate > 0.2) return { label: "Warning", color: "bg-yellow-600" };
    return { label: "Healthy", color: "bg-green-600" };
  };

  const getProgress = (q: Queue) => {
    const total = q.completed + q.abandoned;
    const completedPct = total ? (q.completed / total) * 100 : 0;
    const abandonedPct = total ? (q.abandoned / total) * 100 : 0;
    return { completedPct, abandonedPct };
  };

  return (
    <div className="p-6 w-full bg-gray-100 text-gray-900 font-sans">
        <h2 className="text-xl font-semibold text-gray-800">Queue Live Metrics</h2>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 p-4 bg-white rounded-lg shadow-inner border border-gray-200">
        <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full shadow-sm w-full md:w-80">
          <FaSearch className="text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search queue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-gray-800 placeholder-gray-500 text-base"
          />
        </div>
        <div className="text-sm text-gray-600 text-right">
          Last update:{" "}
          <span className="font-semibold text-gray-800">
            {lastUpdate || "N/A"}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto w-full bg-white shadow-lg border border-gray-200">
        <table className="min-w-full table-auto text-sm">
          <thead>
            <tr className="text-left bg-gray-200 text-gray-700 font-semibold">
              {[
                { label: "Queue", tip: "Name of the queue" },
                { label: "Strategy", tip: "Call distribution strategy" },
                { label: "Calls", tip: "Current callers in queue" },
                { label: "Max", tip: "Max callers allowed in queue" },
                { label: "Avg Hold Time", tip: "Average hold time (seconds)" },
                { label: "Completed / Abandoned", tip: "Call outcomes" },
                { label: "Weight", tip: "Queue priority weight" },
                { label: "Avg Talk Time", tip: "Average talk time (seconds)" },
                { label: "Status", tip: "Health indicator" },
              ].map(({ label, tip }) => (
                <th key={label} className="px-6 py-3 whitespace-nowrap">
                  <Tooltip title={tip} arrow>
                    <span>{label}</span>
                  </Tooltip>
                </th>
              ))} 
            </tr>
          </thead>
          <tbody>
            {filteredQueues.length > 0 ? (
              filteredQueues.map((q, index) => {
                const status = getStatus(q);
                const progress = getProgress(q);

                return (
                  <tr
                    key={q.name}
                    className={`border-t border-gray-200 transition-colors duration-300 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50`}
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {q.name}
                    </td>
                    <td className="px-6 py-4">{q.strategy}</td>
                    <td className="px-6 py-4">{q.calls}</td>
                    <td className="px-6 py-4">{q.max === 0 ? '∞' : q.max}</td>
                    <td className="px-6 py-4">
                      {q.holdtime !== null ? `Avg ${q.holdtime}s` : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-green-700">
                            {q.completed}
                          </span>
                          <div className="w-24 h-2 bg-green-100 rounded-full">
                            <div
                              style={{ width: `${progress.completedPct}%` }}
                              className="h-full rounded-full bg-green-500 transition-all"
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-red-700">
                            {q.abandoned}
                          </span>
                          <div className="w-24 h-2 bg-red-100 rounded-full">
                            <div
                              style={{ width: `${progress.abandonedPct}%` }}
                              className="h-full rounded-full bg-red-500 transition-all"
                            ></div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{q.weight}</td>
                    <td className="px-6 py-4">Avg {q.talktime}s</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold text-white ${status.color}`}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-8 text-center text-gray-500 text-lg"
                >
                  No live queue data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
