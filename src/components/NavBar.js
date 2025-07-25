import React from 'react';
import { FaUserCog, FaPhoneAlt, FaSignOutAlt } from 'react-icons/fa';
import { useSIP } from './SIPProvider';
import useStore from '../store/store';

const NavBar = ({ onLogout, shiftControl }) => {

    const {
        makeCall,
        registered,
        agentStatus
    } = useSIP() || {};
    const agent = useStore(state => state.agent);
    const isSIPReady = registered && agentStatus === 'Available' && typeof makeCall === 'function';
    return (
        <nav className="w-full z-50 bg-white shadow-xl px-8 py-4 flex items-center justify-between sticky top-0">
            <div className="flex items-center gap-4">
                <span className="text-blue-500 text-2xl font-black tracking-wide drop-shadow-lg">INSA CC</span>
            </div>
            <div className="flex items-center gap-8">
                {shiftControl && (
                    <div className="mr-4 flex items-center">{shiftControl}</div>
                )}
                {agent && (
                    <div className="flex flex-col items-end mr-4">
                        <span className="text-blue-500 font-bold text-lg flex items-center gap-2"><FaUserCog className="text-blue-200" /> {agent.name}</span>
                        <span className="text-blue-100 text-xs">{agent.email}</span>
                        <span className={`text-xs ${isSIPReady ? 'text-green-500' : 'text-red-500'}`}>{isSIPReady ? 'SIP Ready' : 'SIP Not Ready'}</span>
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
