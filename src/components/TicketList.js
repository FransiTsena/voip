import React, { useEffect } from 'react';
import useStore from '../store/store';

const TicketList = () => {
  const tickets = useStore((state) => state.tickets);
  const fetchTickets = useStore((state) => state.fetchTickets);
  const selectTicket = useStore((state) => state.selectTicket);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return (
    <div>
      {tickets.map((ticket) => (
        <div
          key={ticket._id}
          className="p-4 border-b cursor-pointer hover:bg-gray-50"
          onClick={() => selectTicket(ticket)}
        >
          <h3 className="font-bold">{ticket.title}</h3>
          <p className="text-sm text-gray-500">{ticket.status}</p>
        </div>
      ))}
    </div>
  );
};

export default TicketList;
