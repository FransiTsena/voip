import axios from 'axios';
import { baseUrl } from '../baseUrl';

export async function fetchAgentDailyStats(agentId) {
    // Returns { ticketsResolved, callsHandled }
    const { data } = await axios.get(`${baseUrl}/metrics/agent/${agentId}`, { withCredentials: true });
    return data;
}
