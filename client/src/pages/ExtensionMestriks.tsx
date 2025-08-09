import React, { useState, useEffect } from "react";
import { FaSync } from "react-icons/fa";
import { UseSocket } from "../context/SocketContext";

interface CallData {
  id: number;
  extension: string;
  total_calls: number;
  answerd_calls: number | null;
  missed_calls: number | null;
  rejected_calls: number | null;
}

const TableComponent: React.FC = () => {
  const [data, setData] = useState<CallData[]>([]);
  const [loading] = useState<boolean>(true);
  const [error] = useState<string | null>(null);
  const { socket } = UseSocket();

  // const fetchData = async () => {
  //   try {
  //     const response = await axios.get<CallData[]>(
  //       `${import.meta.env.VITE_API_URL}/api/agent/call-stats`
  //     );
  //     setData(response.data);
  //   } catch (err) {
  //     const axiosError = err as AxiosError;
  //     setError(axiosError.message || "Failed to fetch data");
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  const handleRefeashe = () => {
    // fetchData();
  };

  useEffect(() => {
    // fetchData();

    socket?.on("callUpdate", (newData: CallData) => {
      setData((prevData) => {
        const existingIndex = prevData.findIndex(
          (item) => item.id === newData.id
        );
        if (existingIndex !== -1) {
          return prevData.map((item) =>
            item.id === newData.id ? newData : item
          );
        } else {
          return [...prevData, newData];
        }
      });
    });

    // Cleanup socket connection on unmount
    return () => {
      if (socket) {
        socket?.disconnect();
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-white text-center">
        <p>Loading call statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-white text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={handleRefeashe}
          className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center justify-center mx-auto"
        >
          <FaSync className="mr-2" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Call Statistics</h2>
        <div className="flex gap-4">
          <button
            onClick={handleRefeashe}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaSync className="mr-2" /> Refresh
          </button>
          {/* You can add more buttons here if needed, like your Add button */}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full table-auto bg-gray-800 rounded-lg shadow-lg">
          <thead>
            <tr className="bg-indigo-600 text-left text-sm uppercase tracking-wider">
              <th className="p-4">ID</th>
              <th className="p-4">Extension</th>
              <th className="p-4">Total Calls</th>
              <th className="p-4">Answered Calls</th>
              <th className="p-4">Missed Calls</th>
              <th className="p-4">Rejected Calls</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.id}
                className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
              >
                <td className="p-4">{row.id}</td>
                <td className="p-4">{row.extension}</td>
                <td className="p-4">{row.total_calls}</td>
                <td className="p-4">{row.answerd_calls ?? "N/A"}</td>
                <td className="p-4">{row.missed_calls ?? "N/A"}</td>
                <td className="p-4">{row.rejected_calls ?? "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableComponent;
