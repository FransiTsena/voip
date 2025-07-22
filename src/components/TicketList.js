import React, { useEffect, useState } from 'react';
import useStore from '../store/store';

const TicketList = () => {
  const tickets = useStore((state) => state.tickets);
  const fetchTickets = useStore((state) => state.fetchTickets);
  const selectTicket = useStore((state) => state.selectTicket);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Filter and search logic
  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(search.toLowerCase()) ||
      (ticket.customer && ticket.customer.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter ? ticket.status === statusFilter : true;
    const matchesPriority = priorityFilter ? ticket.priority === priorityFilter : true;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Quick actions
  const handleQuickAction = (ticket, action) => {
    // Implement quick actions: assign, close, comment, etc.
    // Example: close ticket
    if (action === 'close') {
      // Call backend to close ticket (implement in store if needed)
      alert(`Ticket ${ticket.title} closed!`);
    }
    // Add more actions as needed
  };

  return (
    <div>
      <div className="p-2 flex gap-2">
        <input
          type="text"
          placeholder="Search tickets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border p-1 rounded w-1/2"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="closed">Closed</option>
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="border p-1 rounded"
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      {filteredTickets.map((ticket) => (
        <div
          key={ticket._id}
          className="p-4 border-b cursor-pointer hover:bg-gray-50 flex justify-between items-center"
        >
          <div onClick={() => selectTicket(ticket)} className="flex-1">
            <h3 className="font-bold">{ticket.title}</h3>
            <p className="text-sm text-gray-500">{ticket.status} | {ticket.priority}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="bg-green-500 text-white px-2 py-1 rounded text-xs"
              onClick={() => handleQuickAction(ticket, 'assign')}
            >Assign</button>
            <button
              className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
              onClick={() => handleQuickAction(ticket, 'comment')}
            >Comment</button>
            <button
              className="bg-red-500 text-white px-2 py-1 rounded text-xs"
              onClick={() => handleQuickAction(ticket, 'close')}
            >Close</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TicketList;
