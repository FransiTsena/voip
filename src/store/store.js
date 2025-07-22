import create from 'zustand';
import axios from 'axios';

const useStore = create((set) => ({
  tickets: [],
  customers: [],
  articles: [],
  agent: {
    id: '60d21b4667d0d8992e610c85', // Mock agent ID
    name: 'John Doe',
  },
  shift: null,
  call: null,
  selectedTicket: null,

  // Actions
  selectTicket: (ticket) => set({ selectedTicket: ticket }),
  fetchTickets: async () => {
    const { data } = await axios.get('/api/tickets');
    set({ tickets: data });
  },
  fetchCustomers: async () => {
    const { data } = await axios.get('/api/customers');
    set({ customers: data });
  },
  searchArticles: async (query) => {
    const { data } = await axios.get(`/api/kb/search?q=${query}`);
    set({ articles: data });
  },
  startShift: async (agentId) => {
    const { data } = await axios.post('/api/shifts/start', { agentId });
    set({ shift: data });
  },
  endShift: async (shiftId) => {
    const { data } = await axios.post('/api/shifts/end', { shiftId });
    set({ shift: data });
  },
}));

export default useStore;
