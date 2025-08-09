import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsivePie } from '@nivo/pie';
import axios from 'axios';
import baseUrl from '../util/baseUrl';

interface Call {
  _id: string;
  callerId: string;
  callerName: string;
  status: string;
  startTime: string;
  endTime?: string;
}

interface CallCount {
  status: string;
  count: number;
}

const statusBadgeClasses: Record<string, string> = {
  answered: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  missed: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  ended: 'bg-slate-50 text-slate-700 ring-1 ring-inset ring-slate-200',
  ringing: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200',
  'on hold': 'bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200',
};

const ReportDashboard: React.FC = () => {
  // Removed call history state and fetching logic
  const [counts, setCounts] = useState<CallCount[]>([]);
  const [agentCount, setAgentCount] = useState<number>(0);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [agentStatus, setAgentStatus] = useState<{ status: string; count: number }[]>([]);
  const [queueMembers, setQueueMembers] = useState<{ name: string; members: number }[]>([]);
  // Removed call history state and fetching logic

  useEffect(() => {
    fetchCounts();
    fetchAgentCount();
    fetchQueueCount();
    fetchAgentStatus();
    fetchQueueMembers();
  }, []);

  const fetchCounts = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/report/calls/count`);
      setCounts(res.data.data);
    } catch {
      setError('Failed to fetch call counts');
    }
  };

  // Removed call fetching logic

  const fetchAgentCount = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/report/agents/count`);
      setAgentCount(res.data.count || 0);
    } catch { }
  };

  const fetchQueueCount = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/report/queues/count`);
      setQueueCount(res.data.count || 0);
    } catch { }
  };

  const fetchAgentStatus = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/report/agents/call-status`);
      setAgentStatus(res.data.data || []);
    } catch { }
  };

  const fetchQueueMembers = async () => {
    try {
      const res = await axios.get(`${baseUrl}/api/report/queues/all`);
      setQueueMembers(
        res.data.data.map((q: any) => ({
          name: q.name,
          members: q.members?.length || 0,
        }))
      );
    } catch { }
  };

  // Removed call history filter and export logic

  const barData = counts.map((c: CallCount) => ({ status: c.status, count: c.count }));
  const pieData = counts.map((c: CallCount) => ({ id: c.status, label: c.status, value: c.count }));
  const agentStatusData = agentStatus.map((a: { status: string; count: number }) => ({
    id: a.status,
    label: a.status,
    value: a.count,
  }));
  const queueMembersData = queueMembers.map((q: { name: string; members: number }) => ({
    queue: q.name,
    members: q.members,
  }));

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; subtitle?: string; gradient?: string }>
    = ({ title, value, icon, subtitle, gradient = 'from-indigo-50 to-white' }) => (
      <div className={`rounded-xl border border-gray-200 bg-gradient-to-b ${gradient} p-4 sm:p-5 shadow-sm flex items-center gap-4`}
        title={subtitle || title}>
        <div className="shrink-0 h-10 w-10 rounded-lg bg-white ring-1 ring-gray-200 flex items-center justify-center text-indigo-600">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm text-gray-500">{title}</div>
          <div className="text-2xl font-semibold tracking-tight text-gray-900">{value}</div>
          {subtitle ? <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div> : null}
        </div>
      </div>
    );

  const ChartCard: React.FC<{ title: string; children?: React.ReactNode; subtitle?: string }> = ({ title, subtitle, children }) => (
    <div className="h-80 bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 flex flex-col">
      <div className="mb-3">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p> : null}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );

  const FilterField: React.FC<{
    label: string;
    name: string;
    type: string;
    value: string;
  }> = ({ label, name, type, value }) => (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <input
        className="border rounded px-2 py-1"
        type={type}
        name={name}
        value={value}
        onChange={handleFilterChange}
      />
    </div>
  );

  const FilterSelect: React.FC<{
    label: string;
    name: string;
    value: string;
    options: string[];
  }> = ({ label, name, value, options }) => (
    <div>
      <label className="block text-sm font-medium">{label}</label>
      <select
        className="border rounded px-2 py-1"
        name={name}
        value={value}
        onChange={handleFilterChange}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt === '' ? 'All' : opt}
          </option>
        ))}
      </select>
    </div>
  );

  const totalCalls = useMemo(() => counts.reduce((a, c) => a + c.count, 0), [counts]);
  const answeredCount = useMemo(() => counts.find((c) => c.status === 'answered')?.count || 0, [counts]);
  const missedCount = useMemo(() => counts.find((c) => c.status === 'missed')?.count || 0, [counts]);

  const formatDateTime = (d: string | number | Date) => new Date(d).toLocaleString();

  // Removed call history pagination and badge logic

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <header className="mb-6 sm:mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor call volumes, agent performance, and queue health at a glance.</p>
            <a href="/call-history" className="inline-block mt-3 text-indigo-600 hover:underline text-sm font-medium">Go to Call History &rarr;</a>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Agents"
          value={agentCount}
          subtitle="Agents registered in the system"
          gradient="from-sky-50 to-white"
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M7.5 6a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm9 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM0 20.25C0 16.245 3.245 13 7.25 13h.5C11.755 13 15 16.245 15 20.25v.75H0v-.75Zm24 1.5h-7.5v-.75c0-2.338-.868-4.471-2.292-6.105A7.233 7.233 0 0 1 16.75 13h.5c4.005 0 7.25 3.245 7.25 7.25v1.5Z" />
            </svg>
          )}
        />
        <StatCard
          title="Total Queues"
          value={queueCount}
          subtitle="Active call queues configured"
          gradient="from-amber-50 to-white"
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M3 6a3 3 0 0 1 3-3h13a1 1 0 1 1 0 2H6a1 1 0 0 0 0 2h13a1 1 0 1 1 0 2H6a1 1 0 0 0 0 2h13a1 1 0 1 1 0 2H6a3 3 0 0 1-3-3V6Z" />
            </svg>
          )}
        />
        <StatCard
          title="Total Calls"
          value={totalCalls}
          subtitle="All calls in the selected period"
          gradient="from-indigo-50 to-white"
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M1.5 4.5A3 3 0 0 1 4.5 1.5h2.25A3 3 0 0 1 9.75 4.5v.75a2.25 2.25 0 0 1-2.25 2.25H6.87a.75.75 0 0 0-.53.22l-.86.86a17.97 17.97 0 0 0 7.29 7.29l.86-.86a.75.75 0 0 0 .22-.53v-.63a2.25 2.25 0 0 1 2.25-2.25h.75a3 3 0 0 1 3 3V19.5a3 3 0 0 1-3 3H19.5A18 18 0 0 1 1.5 4.5Z" />
            </svg>
          )}
        />
        <StatCard
          title="Answered vs Missed"
          value={`${answeredCount} / ${missedCount}`}
          subtitle="Calls answered and missed"
          gradient="from-emerald-50 to-white"
          icon={(
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 2a10 10 0 1 0 10 10A10.011 10.011 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z" />
            </svg>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
        <ChartCard title="Call Status Distribution" subtitle="Compare call outcomes across the selected period">
          <ResponsiveBar
            data={barData}
            keys={['count']}
            indexBy="status"
            margin={{ top: 30, right: 20, bottom: 50, left: 60 }}
            padding={0.3}
            colors={{ scheme: 'set2' }}
            axisBottom={{ tickRotation: 0 }}
            axisLeft={{ legend: 'Count', legendPosition: 'middle', legendOffset: -40 }}
            animate
            labelSkipHeight={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
          />
        </ChartCard>

        <ChartCard title="Call Status Breakdown" subtitle="Share of each call status">
          <ResponsivePie
            data={pieData}
            margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            innerRadius={0.5}
            padAngle={1}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ scheme: 'paired' }}
            animate
          />
        </ChartCard>

        <ChartCard title="Agent Status Breakdown" subtitle="Live view of agent call states">
          <ResponsivePie
            data={agentStatusData}
            margin={{ top: 30, right: 30, bottom: 30, left: 30 }}
            innerRadius={0.5}
            padAngle={1}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ scheme: 'category10' }}
            animate
          />
        </ChartCard>

        <ChartCard title="Queue Members" subtitle="Number of agents assigned per queue">
          <ResponsiveBar
            data={queueMembersData}
            keys={['members']}
            indexBy="queue"
            margin={{ top: 30, right: 20, bottom: 60, left: 60 }}
            padding={0.3}
            colors={{ scheme: 'spectral' }}
            axisBottom={{ tickRotation: 0 }}
            axisLeft={{ legend: 'Members', legendPosition: 'middle', legendOffset: -40 }}
            animate
          />
        </ChartCard>
      </div>

      {/* Call history table and filters removed. See Call History page for details. */}
    </div>
  );
};

export default ReportDashboard;
