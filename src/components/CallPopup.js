

import React, { useState } from 'react';
import { useSIP } from './SIPProvider';

const CallPopup = () => {
    const {
        status,
        incomingCall,
        callSession,
        callTimer,
        error,
        hangup,
        answer,
        togglePause,
        formatTime,
        iceStatus,
        transferCall
    } = useSIP();


    // State for transfer UI
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferTarget, setTransferTarget] = useState('');

    // Only show popup if in call or incoming call
    if (!callSession && !incomingCall) return null;

    const isIncoming = !!incomingCall;
    const remoteNumber = isIncoming
        ? incomingCall.remote_identity.uri.user
        : callSession.remote_identity.uri.user;


    // Placeholder handlers for controls
    const handleHold = () => {/* implement hold */ };
    const handleMute = () => {/* implement mute */ };
    const handleKeypad = () => {/* implement keypad */ };
    const handleContacts = () => {/* implement contacts */ };

    // Transfer handlers
    const handleTransfer = () => {
        if (transferTarget) {
            transferCall(transferTarget);
            setShowTransfer(false);
            setTransferTarget('');
        }
    };

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-[700px] max-w-[95vw]">
            <div className="flex items-center justify-between bg-[#101926] rounded-[40px] shadow-2xl px-6 py-3">
                {/* Drag handle */}
                <div className="flex flex-col items-center mr-4">
                    <span className="w-1 h-1 bg-gray-400 rounded-full mb-1"></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full mb-1"></span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                </div>
                {/* Timer */}
                <div className="text-white text-3xl font-mono font-semibold min-w-[80px] text-center">
                    {!isIncoming && callSession ? formatTime(callTimer) : '00:00'}
                </div>
                {/* Controls or Answer/Reject */}
                {isIncoming ? (
                    <div className="flex items-center space-x-6 mx-6">
                        <button onClick={answer} className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold text-lg w-32 h-12 rounded-[20px] shadow-lg transition-all">Answer</button>
                        <button onClick={hangup} className="flex items-center justify-center bg-red-400 hover:bg-red-500 text-white font-bold text-lg w-32 h-12 rounded-[20px] shadow-lg transition-all">Reject</button>
                    </div>
                ) : (
                    <>
                        <div className="flex bg-white rounded-[30px] px-8 py-2 items-center space-x-8 mx-6">
                            <button onClick={handleHold} className="flex flex-col items-center text-gray-800 hover:text-blue-600 focus:outline-none">
                                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><rect x="10" y="7" width="4" height="10" rx="2" fill="currentColor" /></svg>
                                <span className="text-xs mt-1">Hold</span>
                            </button>
                            <button onClick={handleMute} className="flex flex-col items-center text-gray-800 hover:text-blue-600 focus:outline-none">
                                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M9 9v6h4l5 5V4l-5 5H9z" stroke="currentColor" strokeWidth="2" /><line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" /></svg>
                                <span className="text-xs mt-1">Mute</span>
                            </button>
                            <button onClick={handleKeypad} className="flex flex-col items-center text-gray-800 hover:text-blue-600 focus:outline-none">
                                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><circle cx="6" cy="6" r="2" fill="currentColor" /><circle cx="12" cy="6" r="2" fill="currentColor" /><circle cx="18" cy="6" r="2" fill="currentColor" /><circle cx="6" cy="12" r="2" fill="currentColor" /><circle cx="12" cy="12" r="2" fill="currentColor" /><circle cx="18" cy="12" r="2" fill="currentColor" /><circle cx="6" cy="18" r="2" fill="currentColor" /><circle cx="12" cy="18" r="2" fill="currentColor" /><circle cx="18" cy="18" r="2" fill="currentColor" /></svg>
                                <span className="text-xs mt-1">Keypad</span>
                            </button>
                            <button onClick={handleContacts} className="flex flex-col items-center text-gray-800 hover:text-blue-600 focus:outline-none">
                                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="2" /><rect x="8" y="8" width="8" height="4" rx="2" fill="currentColor" /><rect x="8" y="14" width="8" height="2" rx="1" fill="currentColor" /></svg>
                                <span className="text-xs mt-1">Contacts</span>
                            </button>
                            {/* Transfer Button */}
                            <button onClick={() => setShowTransfer(v => !v)} className="flex flex-col items-center text-gray-800 hover:text-blue-600 focus:outline-none">
                                <svg width="28" height="28" fill="none" viewBox="0 0 24 24"><path d="M17 8l4 4m0 0l-4 4m4-4H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                <span className="text-xs mt-1">Transfer</span>
                            </button>
                        </div>
                        {/* Transfer UI */}
                        {showTransfer && (
                            <div className="flex items-center space-x-2 bg-gray-100 rounded-xl px-4 py-2 mt-2 mx-6">
                                <input
                                    type="text"
                                    className="border border-gray-300 rounded-lg px-3 py-1 text-lg w-32"
                                    placeholder="Ext/Number"
                                    value={transferTarget}
                                    onChange={e => setTransferTarget(e.target.value)}
                                />
                                <button
                                    onClick={handleTransfer}
                                    className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-1 font-bold text-lg"
                                    disabled={!transferTarget}
                                >
                                    Transfer
                                </button>
                                <button
                                    onClick={() => setShowTransfer(false)}
                                    className="ml-2 text-gray-500 hover:text-red-500 text-lg font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        )}
                        {/* End Call Button */}
                        <button onClick={hangup} className="flex items-center justify-center bg-red-400 hover:bg-red-500 transition-all w-16 h-16 rounded-[24px] ml-4">
                            <svg width="32" height="32" fill="none" viewBox="0 0 24 24"><path d="M4 17c0-2.21 3.58-4 8-4s8 1.79 8 4" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><path d="M8 17v2a2 2 0 002 2h4a2 2 0 002-2v-2" stroke="#fff" strokeWidth="2" /></svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CallPopup;
