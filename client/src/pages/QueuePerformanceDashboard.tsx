import React, { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type QueueMetric = {
  queueId: string;
  name: string;
  abandonRate: string;
};

const QueuePerformanceDashboard: React.FC = () => {
  const [queueMetrics, setQueueMetrics] = useState<QueueMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`${API}/api/metrics/advanced`, { withCredentials: true });
        setQueueMetrics(res.data.queues);
      } catch (err: any) {
        console.error("Error fetching queue metrics:", err);
        setError("Failed to load queue metrics.");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [API]);

  return (
    <div className="max-w-6xl mx-auto mt-8 p-4 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Queue Performance Dashboard</h2>
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading metrics...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
      ) : (
        <>
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Abandon Rate (%)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={queueMetrics}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="abandonRate" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Queue Metrics Table</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 text-sm rounded-lg overflow-hidden">
                <thead className="bg-gray-100">
                  <tr className="bg-gray-100">
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Queue</th>
                    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700">Abandon Rate (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {queueMetrics.map((queue) => (
                    <tr key={queue.queueId} className="hover:bg-blue-50 transition-colors">
                      <td className="py-3 px-4 border-b text-gray-800">{queue.name}</td>
                      <td className="py-3 px-4 border-b text-gray-600">{queue.abandonRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default QueuePerformanceDashboard;
