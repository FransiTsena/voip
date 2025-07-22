import { create } from 'zustand';
import axios from 'axios';

const baseUrl = process.env.BASE_URL || 'http://localhost:4000/api';

const useStore = create((set) => ({
  tickets: [],
  customers: [],
  articles: [],
  agent: null,
  token: localStorage.getItem('token') || null,
  shift: null,
  call: null,
  selectedTicket: null,

  // Auth actions
  setAuth: ({ agent, token }) => set({ agent, token }),
  logout: () => {
    localStorage.removeItem('token');
    set({ agent: null, token: null });
  },

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
