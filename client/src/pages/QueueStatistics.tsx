import React, { useState, useEffect } from 'react';
import { UseSocket } from '../context/SocketContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface QueueStats {
  queueId: string;
  queueName: string;
  date: string;
  totalCalls: number;
  answeredCalls: number;
  abandonedCalls: number;
  missedCalls: number;
  currentWaitingCallers: number;
  averageWaitTime: number;
  averageTalkTime: number;
  averageHoldTime: number;
  longestWaitTime: number;
  shortestWaitTime: number;
  serviceLevelPercentage: number;
  answerRate: number;
  abandonmentRate: number;
  activeAgents: number;
  availableAgents: number;
  busyAgents: number;
  hourlyStats: Array<{
    hour: number;
    calls: number;
    answered: number;
    abandoned: number;
    avgWaitTime: number;
    avgTalkTime: number;
    waitingCallers: number;
  }>;
  lastUpdated: string;
}

interface QueueSummary {
  totalQueues: number;
  totalCalls: number;
  totalAnswered: number;
  totalAbandoned: number;
  totalWaiting: number;
  avgAnswerRate: number;
}

// Simple Icons as SVG components
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

const TrendingUpIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const TrendingDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const QueueStatistics: React.FC = () => {
  const [queueStats, setQueueStats] = useState<QueueStats[]>([]);
  const [summary, setSummary] = useState<QueueSummary | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'realtime' | 'historical'>('realtime');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showQueueSelect, setShowQueueSelect] = useState(false);
  const [showViewModeSelect, setShowViewModeSelect] = useState(false);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  
  // Get socket from context
  const { socket } = UseSocket();

  useEffect(() => {
    if (!socket) return;

    // Listen for real-time queue statistics
    const handleAllQueueStats = (data: { queues: QueueStats[], summary: QueueSummary }) => {
      setQueueStats(data.queues);
      setSummary(data.summary);
      setLoading(false);
    };

    const handleQueueStatsUpdate = (data: { queueId: string, stats: QueueStats }) => {
      setQueueStats(prev => {
        const updated = [...prev];
        const index = updated.findIndex(q => q.queueId === data.queueId);
        if (index >= 0) {
          updated[index] = { ...updated[index], ...data.stats };
        } else {
          updated.push(data.stats);
        }
        return updated;
      });
    };

    socket.on('allQueueStats', handleAllQueueStats);
    socket.on('queueStatsUpdate', handleQueueStatsUpdate);

    // Request initial data
    socket.emit('getAllQueueStats');

    return () => {
      socket.off('allQueueStats', handleAllQueueStats);
      socket.off('queueStatsUpdate', handleQueueStatsUpdate);
    };
  }, []);

  // Fetch historical data when date or queue changes
  useEffect(() => {
    if (viewMode === 'historical') {
      fetchHistoricalData();
    }
  }, [selectedDate, selectedQueue, viewMode]);

  const fetchHistoricalData = async () => {
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const endpoint = selectedQueue === 'all' 
        ? `/api/queues/statistics/all?startDate=${dateStr}&endDate=${dateStr}`
        : `/api/queues/${selectedQueue}/statistics?startDate=${dateStr}&endDate=${dateStr}`;
      
      const response = await fetch(endpoint);
      const data = await response.json();
      
      if (data.success) {
        setQueueStats(Array.isArray(data.data) ? data.data : [data.data]);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredStats = () => {
    if (selectedQueue === 'all') return queueStats;
    return queueStats.filter(q => q.queueId === selectedQueue);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

//   const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatPercentage = (value: number) => `${value}%`;

  const getStatusColor = (rate: number, type: 'answer' | 'abandon' | 'service') => {
    if (type === 'answer') {
      return rate >= 90 ? 'bg-green-500' : rate >= 80 ? 'bg-yellow-500' : 'bg-red-500';
    } else if (type === 'abandon') {
      return rate <= 5 ? 'bg-green-500' : rate <= 10 ? 'bg-yellow-500' : 'bg-red-500';
    } else { // service level
      return rate >= 80 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red-500';
    }
  };

  const prepareHourlyData = (stats: QueueStats[]) => {
    if (stats.length === 0) return [];
    
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      calls: 0,
      answered: 0,
      abandoned: 0,
      avgWaitTime: 0,
      waitingCallers: 0
    }));

    stats.forEach(queue => {
      queue.hourlyStats.forEach((hourStat, index) => {
        hourlyData[index].calls += hourStat.calls;
        hourlyData[index].answered += hourStat.answered;
        hourlyData[index].abandoned += hourStat.abandoned;
        hourlyData[index].avgWaitTime += hourStat.avgWaitTime;
        hourlyData[index].waitingCallers += hourStat.waitingCallers;
      });
    });

    return hourlyData;
  };

  const preparePieData = (stats: QueueStats[]) => {
    const totalAnswered = stats.reduce((sum, q) => sum + q.answeredCalls, 0);
    const totalAbandoned = stats.reduce((sum, q) => sum + q.abandonedCalls, 0);
    const totalMissed = stats.reduce((sum, q) => sum + q.missedCalls, 0);

    return [
      { name: 'Answered', value: totalAnswered, color: '#00C49F' },
      { name: 'Abandoned', value: totalAbandoned, color: '#FF8042' },
      { name: 'Missed', value: totalMissed, color: '#FFBB28' }
    ];
  };

  const filteredStats = getFilteredStats();
  const hourlyData = prepareHourlyData(filteredStats);
  const pieData = preparePieData(filteredStats);

//   if () {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <div className="text-lg">Loading queue statistics...</div>
//       </div>
//     );
//   }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Queue Statistics</h1>
        <div className="flex gap-4 items-center">
          {/* View Mode Select */}
          <div className="relative">
            <button
              onClick={() => setShowViewModeSelect(!showViewModeSelect)}
              className="w-40 px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
            >
              <span className="capitalize">{viewMode}</span>
              <ChevronDownIcon />
            </button>
            {showViewModeSelect && (
              <div className="absolute z-10 w-40 mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                <button
                  onClick={() => {
                    setViewMode('realtime');
                    setShowViewModeSelect(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                >
                  Real-time
                </button>
                <button
                  onClick={() => {
                    setViewMode('historical');
                    setShowViewModeSelect(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                >
                  Historical
                </button>
              </div>
            )}
          </div>

          {/* Date Picker for Historical Mode */}
          {viewMode === 'historical' && (
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-40 px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center"
              >
                <CalendarIcon />
                <span className="ml-2">{selectedDate.toLocaleDateString()}</span>
              </button>
              {showDatePicker && (
                <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      setSelectedDate(new Date(e.target.value));
                      setShowDatePicker(false);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Queue Select */}
          <div className="relative">
            <button
              onClick={() => setShowQueueSelect(!showQueueSelect)}
              className="w-48 px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
            >
              <span>{selectedQueue === 'all' ? 'All Queues' : queueStats.find(q => q.queueId === selectedQueue)?.queueName || selectedQueue}</span>
              <ChevronDownIcon />
            </button>
            {showQueueSelect && (
              <div className="absolute z-10 w-48 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedQueue('all');
                    setShowQueueSelect(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-gray-100"
                >
                  All Queues
                </button>
                {queueStats.map(queue => (
                  <button
                    key={queue.queueId}
                    onClick={() => {
                      setSelectedQueue(queue.queueId);
                      setShowQueueSelect(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100"
                  >
                    {queue.queueName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <div className="text-blue-500">
                <UsersIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Queues</p>
                <p className="text-2xl font-bold">{summary.totalQueues}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <div className="text-green-500">
                <PhoneIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold">{summary.totalCalls}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <div className="text-green-500">
                <TrendingUpIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Answered</p>
                <p className="text-2xl font-bold">{summary.totalAnswered}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <div className="text-red-500">
                <TrendingDownIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Abandoned</p>
                <p className="text-2xl font-bold">{summary.totalAbandoned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <div className="text-yellow-500">
                <ClockIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Waiting</p>
                <p className="text-2xl font-bold">{summary.totalWaiting}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center space-x-2">
              <div className="text-blue-500">
                <TargetIcon />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Answer Rate</p>
                <p className="text-2xl font-bold">{formatPercentage(summary.avgAnswerRate)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {['overview', 'performance', 'trends', 'agents'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Call Distribution Pie Chart */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Call Distribution</h3>
                  </div>
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent || 10 * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Hourly Call Volume */}
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Hourly Call Volume</h3>
                  </div>
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="calls" fill="#8884d8" name="Total Calls" />
                        <Bar dataKey="answered" fill="#82ca9d" name="Answered" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Queue Details Table */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Queue Details</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Queue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Calls</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Answer Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abandon Rate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Wait Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service Level</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waiting</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agents</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStats.map((queue) => (
                        <tr key={queue.queueId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{queue.queueName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{queue.totalCalls}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(queue.answerRate, 'answer')}`}>
                              {formatPercentage(queue.answerRate)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(queue.abandonmentRate, 'abandon')}`}>
                              {formatPercentage(queue.abandonmentRate)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(queue.averageWaitTime)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(queue.serviceLevelPercentage, 'service')}`}>
                              {formatPercentage(queue.serviceLevelPercentage)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-semibold text-orange-600">
                              {queue.currentWaitingCallers}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div>Active: {queue.activeAgents}</div>
                              <div>Available: {queue.availableAgents}</div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Wait Time Trends</h3>
                  </div>
                  <div className="p-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={hourlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hour" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="avgWaitTime" stroke="#8884d8" name="Avg Wait Time (s)" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Service Level Performance</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {filteredStats.map((queue) => (
                        <div key={queue.queueId} className="space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium">{queue.queueName}</span>
                            <span>{formatPercentage(queue.serviceLevelPercentage)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getStatusColor(queue.serviceLevelPercentage, 'service')}`}
                              style={{ width: `${Math.min(queue.serviceLevelPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Call Volume vs Answer Rate</h3>
              </div>
              <div className="p-6">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="calls" fill="#8884d8" name="Total Calls" />
                    <Line yAxisId="right" type="monotone" dataKey="answered" stroke="#82ca9d" name="Answered Calls" />
                    <Line yAxisId="right" type="monotone" dataKey="abandoned" stroke="#ff7300" name="Abandoned Calls" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Agents Tab */}
          {activeTab === 'agents' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {filteredStats.map((queue) => (
                <div key={queue.queueId} className="bg-white border border-gray-200 rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">{queue.queueName}</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Active Agents:</span>
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          {queue.activeAgents}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          {queue.availableAgents}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Busy:</span>
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          {queue.busyAgents}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilization:</span>
                        <span className="font-semibold">
                          {queue.activeAgents > 0 ? 
                            formatPercentage((queue.busyAgents / queue.activeAgents) * 100) : 
                            '0%'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueStatistics;