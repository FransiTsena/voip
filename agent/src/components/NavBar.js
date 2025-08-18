import React, { useState } from 'react';
import { Wifi, LogOut } from 'lucide-react';
import useStore from '../store/store';

const NavBar = ({ onLogout, isSIPReady, agentStatus, setAgentStatus }) => {
    const agent = useStore((state) => state.agent);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Get first two letters of agent's name for avatar
    const getInitials = (name) => {
        if (!name) return 'NA';
        const initials = name
            .split(' ')
            .map((word) => word.charAt(0))
            .join('')
            .slice(0, 2)
            .toUpperCase();
        return initials;
    };

    return (
        <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
                <img
                    src="/logo.png"
                    alt="FE Call Center Logo"
                    className="h-10 w-10 rounded-lg shadow-sm"
                />
                <span className="text-xl font-bold text-gray-900 tracking-tight">
                    FE Call Center
                </span>
            </div>

            {/* Right Side: Status and Profile */}
            <div className="flex items-center gap-4">
                {/* Agent Status Toggle */}
                <button
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm border border-gray-200 ${isSIPReady && agentStatus === 'Available'
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } ${!isSIPReady ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() =>
                        isSIPReady &&
                        setAgentStatus(agentStatus === 'Available' ? 'Unavailable' : 'Available')
                    }
                    disabled={!isSIPReady}
                    aria-label={`Set agent status to ${agentStatus === 'Available' ? 'Unavailable' : 'Available'}`}
                    title={`Set ${agentStatus === 'Available' ? 'Unavailable' : 'Available'}`}
                >
                    <Wifi
                        size={20}
                        className={
                            isSIPReady
                                ? agentStatus === 'Available'
                                    ? 'text-blue-600'
                                    : 'text-gray-600'
                                : 'text-gray-400'
                        }
                    />
                    <span className="text-sm font-semibold">{agentStatus}</span>
                </button>

                {/* Agent Profile with Dropdown */}
                {agent && (
                    <div className="relative">
                        <button
                            className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 shadow-sm hover:bg-gray-100 transition-all duration-200"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            aria-label="Toggle profile menu"
                            aria-expanded={isDropdownOpen}
                        >
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-semibold text-sm">
                                {getInitials(agent.name)}
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                                <span className="text-xs text-gray-500 hidden sm:block">{agent.email}</span>
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-50">
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        // Placeholder for shift report action
                                        console.log('View Shift Report');
                                    }}
                                >
                                    <span>Shift Report</span>
                                </button>
                                <button
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        onLogout();
                                    }}
                                    aria-label="Logout"
                                >
                                    <LogOut size={16} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavBar;