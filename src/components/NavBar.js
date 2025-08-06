import React, { useState } from 'react';
import { FaUserCog, FaSignOutAlt } from 'react-icons/fa';
import useStore from '../store/store';

const NavBar = ({ onLogout, isSIPReady, agentStatus, setAgentStatus }) => {
    const agent = useStore(state => state.agent);
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [shiftReport, setShiftReport] = useState([]);
    const [loadingShifts, setLoadingShifts] = useState(false);

    const fetchShiftReport = async () => {
        if (!agent?.id) return;
        setLoadingShifts(true);
        try {
            const res = await fetch(`/api/metrics/agent/${agent.id}/shifts`);
            const data = await res.json();
            setShiftReport(data.shifts || []);
        } catch (err) {
            setShiftReport([]);
        }
        setLoadingShifts(false);
    };

    const openShiftModal = () => {
        setShowShiftModal(true);
        fetchShiftReport();
    };
    const closeShiftModal = () => setShowShiftModal(false);

    return (
        <>
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
                            <option value="Available" disabled={!isSIPReady}>Available</option>
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
            {/* Shift Report Modal */}
            {showShiftModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl relative">
                        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={closeShiftModal}>&times;</button>
                        <h2 className="text-xl font-bold mb-4 text-indigo-700">Shift Report</h2>
                        {loadingShifts ? (
                            <div className="text-center text-gray-500">Loading...</div>
                        ) : shiftReport.length === 0 ? (
                            <div className="text-center text-gray-500">No shift records found.</div>
                        ) : (
                            <table className="w-full text-sm border">
                                <thead>
                                    <tr className="bg-indigo-50">
                                        <th className="p-2 border">Start Time</th>
                                        <th className="p-2 border">End Time</th>
                                        <th className="p-2 border">Duration (s)</th>
                                        <th className="p-2 border">Reason</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shiftReport.map((shift, idx) => (
                                        <tr key={idx} className={shift.ongoing ? "bg-yellow-50" : ""}>
                                            <td className="p-2 border">{shift.startTime ? new Date(shift.startTime).toLocaleString() : '-'}</td>
                                            <td className="p-2 border">{shift.endTime ? new Date(shift.endTime).toLocaleString() : (shift.ongoing ? 'Ongoing' : '-')}</td>
                                            <td className="p-2 border">{Math.round(shift.duration)}</td>
                                            <td className="p-2 border">{shift.reason || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default NavBar;
