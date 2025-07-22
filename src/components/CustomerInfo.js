import React from 'react';
import useStore from '../store/store';

const CustomerInfo = () => {
  const selectedTicket = useStore((state) => state.selectedTicket);
  const customers = useStore((state) => state.customers);
  const fetchCustomers = useStore((state) => state.fetchCustomers);

  React.useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  if (!selectedTicket) {
    return null;
  }

  const customer = customers.find(
    (customer) => customer._id === selectedTicket.customerId
  );

  if (!customer) {
    return <div>Loading customer...</div>;
  }

  return (
    <div>
      <h2 className="p-4 text-lg font-bold border-b">Customer Info</h2>
      <div className="p-4">
        <p>
          <strong>Name:</strong> {customer.name}
        </p>
        <p>
          <strong>Email:</strong> {customer.email}
        </p>
        <p>
          <strong>Phone:</strong> {customer.phone}
        </p>
      </div>
    </div>
  );
};

export default CustomerInfo;
