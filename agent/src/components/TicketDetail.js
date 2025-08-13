import React from 'react';
import useStore from '../store/store';

const TicketDetail = () => {
  const selectedTicket = useStore((state) => state.selectedTicket);

  if (!selectedTicket) {
    return <div className="flex items-center justify-center h-full">Select a ticket to view details</div>;
  }

  return (
    <div>
      <h2 className="text-lg font-bold">{selectedTicket.title}</h2>
      <p className="mb-4">{selectedTicket.description}</p>
      {/* Add more ticket details and comments section here */}
    </div>
  );
};

export default TicketDetail;
