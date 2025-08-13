
import { create } from 'zustand';
import axios from 'axios';
import { baseUrl } from "../baseUrl";


// Detect if running in a browser (web) or in an app (mobile/electron/react-native)
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

const useStore = create((set, get) => ({
  tickets: [],
  customers: [],
  articles: [],
  agent: null,
  token: !isWeb && typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null,
  shift: null,
  call: null,
  selectedTicket: null,

  // Auth actions
  setAuth: ({ agent, token }) => {
    if (!isWeb && typeof localStorage !== 'undefined') {
      localStorage.setItem('token', token);
      set({ agent, token });
    } else {
      set({ agent }); // token is managed by cookie for web
    }
  },
  refreshToken: async () => {
    // Call backend refresh endpoint, update agent and SIP credentials
    try {
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.agent) {
        const agentWithSip = { ...data.agent, sip: data.sip };
        set({ agent: agentWithSip });
        // Optionally update token if you use it on frontend
        if (data.token) set({ token: data.token });
      } else {
        set({ agent: null });
      }
    } catch (err) {
      set({ agent: null });
    }
  },
  logout: async () => {
    const res = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (res.status === 200) {
      localStorage.clear();
      // cookieStore.clear();
      set({ agent: null, token: null });
    }
  },

  // Helper for auth check
  isAuthenticated: () => {
    if (isWeb) {
      // On web, rely on agent presence (cookie-based session)
      return !!get().agent;
    } else {
      // On app, require token
      return !!get().token;
    }
  },

  // Actions
  selectTicket: (ticket) => set({ selectedTicket: ticket }),
  fetchTickets: async () => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/tickets`, config);
    set({ tickets: data });
  },
  fetchCustomers: async () => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/customers`, config);
    set({ customers: data });
  },
  searchArticles: async (query) => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.get(`${baseUrl}/kb/search?q=${query}`, config);
    set({ articles: data });
  },
  startShift: async (agentId) => {
    // Use agent from store if agentId not provided
    if (!agentId) {
      const agent = get().agent;
      // Support both agent.id and agent._id
      const id = agent && (agent.id || agent._id);
      if (!id) throw new Error('Agent ID is required (no id or _id on agent)');
      agentId = id;
    }
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.post(`${baseUrl}/shifts/start`, { agentId }, config);
    set({ shift: data });
  },
  endShift: async (shiftId) => {
    const token = get().token;
    const config = isWeb
      ? { withCredentials: true }
      : { headers: token ? { Authorization: `Bearer ${token}` } : {} };
    const { data } = await axios.post(`${baseUrl}/shifts/end`, { shiftId }, config);
    set({ shift: data });
  },
  // Restore agent from cookie/session
  fetchCurrentAgent: async () => {
    try {
      const res = await fetch(`${baseUrl}/auth/me`, {
        method: 'GET',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.agent) {
          // Attach SIP credentials if present
          const agentWithSip = data.sip ? { ...data.agent, sip: data.sip } : data.agent;
          set({ agent: agentWithSip });
        } else set({ agent: null });
      } else {
        set({ agent: null });
      }
    } catch (err) {
      set({ agent: null });
    }
  },
}));

export default useStore;
