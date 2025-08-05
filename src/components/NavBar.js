import React from 'react';
import { FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import { useSIP } from './SIPProvider';
import useStore from '../store/store';

const NavBar = ({ onLogout }) => {
    const { agentStatus, setAgentStatus, registered, makeCall } = useSIP() || {};
    const agent = useStore(state => state.agent);
    const isSIPReady = registered && agentStatus === 'Available' && typeof makeCall === 'function';
    return (
        <nav className="w-full z-50 bg-white shadow-xl px-8 py-4 flex items-center justify-between sticky top-0">
            <div className="flex items-center gap-4">
                <span className="text-blue-500 text-2xl font-black tracking-wide drop-shadow-lg">INSA CC</span>
            </div>
            <div className="flex items-center gap-8">
                {/* Agent Status Dropdown - Modern Style */}
                <div className="flex items-center bg-gray-50 rounded-xl px-3 py-1 shadow-inner border border-gray-200 gap-2">
                    <span className="font-semibold text-gray-700">Status:</span>
                    <select
                        value={agentStatus}
                        onChange={e => setAgentStatus(e.target.value)}
                        className="px-3 py-1 rounded-lg border-2 border-indigo-300 text-indigo-700 font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all shadow-sm"
                    >
                        <option value="Available">Available</option>
                        <option value="Paused">Paused</option>
                        <option value="Do Not Disturb">Do Not Disturb</option>
                    </select>
                    <span className={`ml-2 text-xs font-bold ${isSIPReady ? 'text-green-500' : 'text-red-500'}`}>{isSIPReady ? 'SIP Ready' : 'SIP Not Ready'}</span>
                </div>
                {agent && (
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-blue-500 font-bold text-lg flex items-center gap-2"><FaUserCog className="text-blue-200" /> {agent.name}</span>
                        <span className="text-blue-100 text-xs">{agent.email}</span>
                    </div>
                )}
                <button
                    className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-4 py-2 rounded-xl shadow-lg hover:scale-105 transition-transform font-bold focus:outline-none focus:ring-2 focus:ring-pink-300 flex items-center gap-2"
                    onClick={onLogout}
                    title="Logout"
                >
                    <FaSignOutAlt className="text-lg" />
                </button>
            </div>
        </nav>
    );
};

export default NavBar;
