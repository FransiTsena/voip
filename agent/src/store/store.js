import { create } from 'zustand';
import axios from 'axios';
import { baseUrl } from "../baseUrl";

const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const useStore = create((set, get) => ({
  tickets: [],
  customers: [],
  articles: [],
  user: null,
  token: !isWeb && typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  shift: null,
  call: null,
  selectedTicket: null,

  setAuth: ({ user, token }) => {
    if (!isWeb && typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
      set({ user, token });
    } else {
      set({ user });
    }
  },

  refreshToken: async () => {
    try {
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.user) {
        const userWithSip = { ...data.user, sip: data.sip };
        set({ user: userWithSip });
        if (data.token) set({ token: data.token });
      } else {
        set({ user: null });
      }
    } catch (err) {
      set({ user: null });
    }
  },

  logout: async () => {
    try {
      await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } finally {
      localStorage.clear();
      set({ user: null, token: null });
    }
  },

  isAuthenticated: () => {
    if (isWeb) {
      return !!get().user;
    } else {
      return !!get().token;
    }
  },

  selectTicket: (ticket) => set({ selectedTicket: ticket }),

  fetchTickets: async () => {
    const token = get().token;
    const config = isWeb ? { withCredentials: true } : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/api/tickets`, config);
    set({ tickets: data });
  },

  fetchCustomers: async () => {
    const token = get().token;
    const config = isWeb ? { withCredentials: true } : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/api/customers`, config);
    set({ customers: data });
  },

  searchArticles: async (query) => {
    const token = get().token;
    const config = isWeb ? { withCredentials: true } : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/api/kb/search?q=${query}`, config);
    set({ articles: data });
  },

  startShift: async () => {
    const user = get().user;
    if (!user || !user._id) throw new Error('User ID is required');
    const agentId = user._id;

    const token = get().token;
    const config = isWeb ? { withCredentials: true } : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.post(`${baseUrl}/api/shifts/start`, { agentId }, config);
    set({ shift: data });
  },

  endShift: async (shiftId) => {
    const token = get().token;
    const config = isWeb ? { withCredentials: true } : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.post(`${baseUrl}/api/shifts/end`, { shiftId }, config);
    set({ shift: data });
  },

  fetchCurrentUser: async () => {
    try {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const userWithSip = data.sip ? { ...data.user, sip: data.sip } : data.user;
          set({ user: userWithSip });
        } else set({ user: null });
      } else {
        set({ user: null });
      }
    } catch (err) {
      set({ user: null });
    }
  },
}));

export default useStore;
