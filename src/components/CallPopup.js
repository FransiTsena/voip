import React from 'react';
import { useSIP } from './SIPProvider';

const CallPopup = () => {
    const {
        status,
        incomingCall,
        callSession,
        callTimer,
        error,
        agentStatus,
        hangup,
        answer,
        togglePause,
        formatTime,
        iceStatus
    } = useSIP();

    // Only show popup if in call or incoming call
    if (!callSession && !incomingCall) return null;

    const isIncoming = !!incomingCall;
    const remoteNumber = isIncoming
        ? incomingCall.remote_identity.uri.user
        : callSession.remote_identity.uri.user;

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-2xl rounded-2xl px-8 py-6 flex flex-col items-center min-w-[320px] max-w-[90vw] border-4 border-white animate-fade-in">
                <div className="flex items-center space-x-3 mb-2">
                    <span className="inline-block w-3 h-3 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-white font-semibold text-lg tracking-wide">
                        {isIncoming ? 'Incoming Call' : 'In Call'}
                    </span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{remoteNumber}</div>
                <div className="text-white text-sm mb-2">{status} {iceStatus && <span className="ml-2 text-xs">ICE: {iceStatus}</span>}</div>
                {error && <div className="text-xs text-red-200 mb-2">{error}</div>}
                <div className="text-2xl font-mono text-white mb-4">{!isIncoming && callSession ? formatTime(callTimer) : null}</div>
                <div className="flex space-x-4">
                    {isIncoming ? (
                        <>
                            <button onClick={answer} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg transition-all">Answer</button>
                            <button onClick={hangup} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold text-lg shadow-lg transition-all">Reject</button>
                        </>
                    ) : (
                        <button onClick={hangup} className="bg-red-500 hover:bg-red-600 text-white px-8 py-2 rounded-full font-bold text-lg shadow-lg transition-all">End Call</button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CallPopup;
