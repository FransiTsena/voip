import { create } from 'zustand';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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
    const { data } = await axios.get(`${baseUrl}/tickets`);
    set({ tickets: data });
  },
  fetchCustomers: async () => {
    const { data } = await axios.get(`${baseUrl}/customers`);
    set({ customers: data });
  },
  searchArticles: async (query) => {
    const { data } = await axios.get(`${baseUrl}/kb/search?q=${query}`);
    set({ articles: data });
  },
  startShift: async (agentId) => {
    const { data } = await axios.post(`${baseUrl}/shifts/start`, { agentId });
    set({ shift: data });
  },
  endShift: async (shiftId) => {
    const { data } = await axios.post(`${baseUrl}/shifts/end`, { shiftId });
    set({ shift: data });
  },
}));

export default useStore;
