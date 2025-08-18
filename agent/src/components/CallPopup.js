import React, { useState } from 'react';
import { useSIP } from './SIPProvider';

const CallPopup = ({
    showKeypad,
    setShowKeypad,
    callSession,
    incomingCall,
    callTimer,
    hangup,
    answer,
    holdCall,
    unholdCall,
    muteCall,
    unmuteCall,
    transferCall,
    makeCall,
    formatTime,
    iceStatus,
    agentStatus
}) => {


    // State for transfer UI
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferTarget, setTransferTarget] = useState('');

    // Keypad UI
    const [keypadValue, setKeypadValue] = useState('');
    // Keyboard input for keypad
    React.useEffect(() => {
        if (!showKeypad) return;
        const handleKeyDown = (e) => {
            if (!showKeypad) return;
            if (e.key >= '0' && e.key <= '9') setKeypadValue(v => v + e.key);
            if (e.key === '*' || e.key === '#') setKeypadValue(v => v + e.key);
            if (e.key === 'Backspace') setKeypadValue(v => v.slice(0, -1));
            if (e.key === 'Enter' && keypadValue) handleKeypadDial();
            if (e.key === 'Escape') {
                setShowKeypad(false);
                setKeypadValue('');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showKeypad, keypadValue]);

    // Hold and mute state
    const [isHeld, setIsHeld] = useState(false);
    const [isMuted, setIsMuted] = useState(false);

    // Debug: log props to diagnose popup visibility
    console.log('CallPopup props:', { callSession, incomingCall, showKeypad });
    // More robust check for popup visibility
    const hasActiveCall = callSession && typeof callSession === 'object';
    const hasIncomingCall = incomingCall && typeof incomingCall === 'object';
    if (!hasActiveCall && !hasIncomingCall && !showKeypad) {
        return null;
    }

    const handleKeypadInput = (val) => setKeypadValue(keypadValue + val);
    const handleKeypadClear = () => setKeypadValue('');
    const handleKeypadDial = () => {
        if (keypadValue && typeof makeCall === 'function') {
            makeCall(keypadValue);
        }
        setShowKeypad(false);
        setKeypadValue('');
    };

    const isIncoming = !!incomingCall;
    const remoteNumber = isIncoming
        ? incomingCall?.remote_identity?.uri?.user
        : callSession?.remote_identity?.uri?.user;

    // Hold handler
    const handleHold = () => {
        if (!callSession) return;
        if (isHeld) {
            unholdCall(callSession);
        } else {
            holdCall(callSession);
        }
        setIsHeld(v => !v);
    };

    // Mute handler
    const handleMute = () => {
        if (!callSession) return;
        if (isMuted) {
            unmuteCall(callSession);
        } else {
            muteCall(callSession);
        }
        setIsMuted(v => !v);
    };

    const handleContacts = () => {/* implement contacts */ };

    // Transfer handlers
    const handleTransfer = () => {
        if (transferTarget) {
            transferCall(transferTarget);
            setShowTransfer(false);
            setTransferTarget('');
        }
    };

    // Only show bottom nav/call controls if there is a live call
    const showCallControls = hasActiveCall || hasIncomingCall;

    return (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-[700px] max-w-[95vw]">
            {showCallControls && (
                <div className="flex items-center justify-between bg-[#101926] rounded-[40px] shadow-2xl px-6 py-3">
                    {/* Call Quality & Agent Status */}
                    <div className="absolute left-6 top-2 flex flex-col items-start">
                        {/* <span className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-1 mb-1">ICE: {iceStatus || 'N/A'}</span> */}
                        <span className="text-xs text-gray-300 bg-gray-800 rounded px-2 py-1">Agent: {agentStatus}</span>
                    </div>
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
                            <button
                                onClick={() => {
                                    console.log('🟢 ANSWER BUTTON CLICKED IN CALLPOPUP');
                                    console.log('📞 CallPopup - incomingCall:', incomingCall);
                                    console.log('📞 CallPopup - callSession:', callSession);
                                    console.log('📞 CallPopup - answer function:', answer);
                                    console.log('📞 CallPopup - isIncoming:', isIncoming);
                                    if (typeof answer === 'function') {
                                        console.log('✅ Calling answer function...');
                                        answer();
                                    } else {
                                        console.error('❌ Answer is not a function:', typeof answer);
                                    }
                                }}
                                className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold text-lg w-32 h-12 rounded-[20px] shadow-lg transition-all"
                            >
                                Answer
                            </button>
                            <button
                                onClick={() => {
                                    console.log('🔴 REJECT BUTTON CLICKED IN CALLPOPUP');
                                    console.log('📞 CallPopup - incomingCall:', incomingCall);
                                    console.log('📞 CallPopup - callSession:', callSession);
                                    console.log('📞 CallPopup - hangup function:', hangup);
                                    console.log('📞 CallPopup - isIncoming:', isIncoming);
                                    if (typeof hangup === 'function') {
                                        console.log('✅ Calling hangup function...');
                                        hangup();
                                    } else {
                                        console.error('❌ Hangup is not a function:', typeof hangup);
                                    }
                                }}
                                className="flex items-center justify-center bg-red-400 hover:bg-red-500 text-white font-bold text-lg w-32 h-12 rounded-[20px] shadow-lg transition-all"
                            >
                                Reject
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex bg-white rounded-[30px] px-8 py-2 items-center space-x-8 mx-6">
                                <button onClick={handleHold} className={`flex flex-col items-center ${isHeld ? 'text-blue-600' : 'text-gray-800'} hover:text-blue-600 focus:outline-none`}>
                                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                        <rect x="10" y="7" width="4" height="10" rx="2" fill="currentColor" />
                                    </svg>
                                    <span className="text-xs mt-1">{isHeld ? 'Unhold' : 'Hold'}</span>
                                </button>
                                <button onClick={handleMute} className={`flex flex-col items-center ${isMuted ? 'text-blue-600' : 'text-gray-800'} hover:text-blue-600 focus:outline-none`}>
                                    <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
                                        {isMuted ? (
                                            <>
                                                <path d="M9 9v6h4l5 5V4l-5 5H9z" stroke="currentColor" strokeWidth="2" />
                                                <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
                                            </>
                                        ) : (
                                            <path d="M9 9v6h4l5 5V4l-5 5H9z" stroke="currentColor" strokeWidth="2" />
                                        )}
                                    </svg>
                                    <span className="text-xs mt-1">{isMuted ? 'Unmute' : 'Mute'}</span>
                                </button>
                                <button onClick={() => setShowKeypad(true)} className="flex flex-col items-center text-gray-800 hover:text-blue-600 focus:outline-none">
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
            )}
            {/* Keypad UI */}
            {showKeypad && (
                <>
                    {/* Wrapper for backdrop and dialog */}
                    <div
                        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm flex items-end justify-center"
                        onClick={e => {
                            if (e.target === e.currentTarget) {
                                setShowKeypad(false);
                                setKeypadValue('');
                            }
                        }}
                        onTouchStart={e => {
                            if (e.target === e.currentTarget) {
                                setShowKeypad(false);
                                setKeypadValue('');
                            }
                        }}
                    >
                        <div className="w-[340px] flex flex-col items-center z-50 rounded-2xl p-7 bg-white border border-gray-200 shadow-xl mb-24">
                            <div className="mb-4 flex items-center justify-between w-full">
                                <span className="text-2xl font-semibold text-gray-800">Dial Number</span>
                                <button
                                    className="ml-auto text-gray-400 hover:text-gray-700 focus:outline-none"
                                    onClick={() => { setShowKeypad(false); setKeypadValue(''); }}
                                    aria-label="Close keypad"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <input
                                type="text"
                                value={keypadValue}
                                readOnly
                                className="mb-5 text-center text-2xl font-mono border-b border-gray-300 w-full bg-transparent focus:outline-none tracking-widest placeholder-gray-400"
                                placeholder="Enter number..."
                            />
                            <div className="grid grid-cols-3 gap-4 mb-5">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((val) => (
                                    <button
                                        key={val}
                                        className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-full text-2xl font-bold text-gray-700 shadow hover:bg-gray-100 active:scale-95 transition-all flex items-center justify-center focus:ring-2 focus:ring-indigo-300"
                                        onClick={() => handleKeypadInput(val.toString())}
                                    >
                                        {val}
                                    </button>
                                ))}
                            </div>
                            <div className="flex space-x-4 mt-2">
                                <button
                                    className="flex items-center justify-center gap-2 px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold text-lg shadow transition-all disabled:opacity-50 focus:ring-2 focus:ring-indigo-400"
                                    onClick={handleKeypadDial}
                                    disabled={!keypadValue}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.05 5A5 5 0 0 1 19 8.95" /><path d="M15.05 9A1 1 0 0 1 17 10.95" /><path d="M22 16.92V19a2 2 0 0 1-2.18 2A19.86 19.86 0 0 1 3 5.18 2 2 0 0 1 5 3h2.09a2 2 0 0 1 2 1.72c.13 1.13.37 2.23.7 3.29a2 2 0 0 1-.45 2.11l-.27.27a16 16 0 0 0 6.29 6.29l.27-.27a2 2 0 0 1 2.11-.45c1.06.33 2.16.57 3.29.7A2 2 0 0 1 22 16.92Z" /></svg>
                                    Dial
                                </button>
                                <button
                                    className="flex items-center justify-center px-5 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-xl font-semibold text-lg shadow transition-all"
                                    onClick={handleKeypadClear}
                                    disabled={!keypadValue}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4H8l-7 7v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z" /><line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" /></svg>
                                    Clear
                                </button>
                            </div>
                            <div className="mt-3 text-xs text-gray-400">Tip: You can use your keyboard to type, Backspace to delete, Enter to dial.</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default CallPopup;
