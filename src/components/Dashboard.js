import React from 'react';
import TicketList from './TicketList';
import TicketDetail from './TicketDetail';
import CustomerInfo from './CustomerInfo';
import KnowledgeBaseSearch from './KnowledgeBaseSearch';
import CallControlBar from './CallControlBar';
import ShiftTimer from './ShiftTimer';

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Sidebar */}
      <div className="w-1/4 bg-white border-r">
        <h2 className="p-4 text-lg font-bold border-b">Tickets / Customers</h2>
        <TicketList />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Top Bar */}
        <ShiftTimer />

        {/* Ticket Detail */}
        <div className="flex-1 p-4">
          <TicketDetail />
        </div>

        {/* Call Control Bar */}
        <CallControlBar />
      </div>

      {/* Right Sidebar */}
      <div className="w-1/4 bg-white border-l">
        <CustomerInfo />
        <KnowledgeBaseSearch />
        <h2 className="p-4 text-lg font-bold border-b">Actions</h2>
        {/* Actions */}
      </div>
    </div>
  );
};

export default Dashboard;
