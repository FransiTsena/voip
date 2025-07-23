
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import JsSIP from 'jssip';
import useStore from '../store/store';

const SIPContext = createContext();

export const useSIP = () => useContext(SIPContext);

export const SIPProvider = ({ children }) => {
    const agent = useStore(state => state.agent);
    // Use SIP credentials from agent if available, fallback to demo values
    const SIP_USER = agent?.username || '1006';
    const SIP_PASSWORD = agent?.sip?.password || '1234';
    const SIP_SERVER = process.env.SERVER_IP || '10.42.0.1';
    const SIP_WS_SERVER = `ws://${SIP_SERVER}:8088/ws`;
    const PC_CONFIG = { iceServers: [], rtcpMuxPolicy: 'require' };

    const [status, setStatus] = useState('Disconnected');
    const [registered, setRegistered] = useState(false);
    const [callSession, setCallSession] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callTimer, setCallTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [error, setError] = useState('');
    const [iceStatus, setIceStatus] = useState('');
    const [agentStatus, setAgentStatus] = useState('Available');
    const uaRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
    
        if (timerActive) {
            timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [timerActive]);

    useEffect(() => {
        startUA();
        return () => {
            if (uaRef.current) {
                uaRef.current.stop();
                uaRef.current = null;
            }
        };
    }, []);

    const startUA = () => {
        if (uaRef.current && uaRef.current.isRegistered()) return;
        try {
            const socket = new JsSIP.WebSocketInterface(SIP_WS_SERVER);
            const configuration = {
                sockets: [socket],
                uri: `sip:${SIP_USER}@${SIP_SERVER}`,
                password: SIP_PASSWORD,
                session_timers: false,
                pcConfig: PC_CONFIG,
            };
            const ua = new JsSIP.UA(configuration);
            uaRef.current = ua;
            ua.on('connecting', () => setStatus('Connecting...'));
            ua.on('connected', () => setStatus('Connected (Registering...)'));
            ua.on('disconnected', (e) => {
                setStatus('Disconnected');
                setError(`WebSocket disconnected: ${e.cause}`);
                setRegistered(false);
            });
            ua.on('registered', () => {
                setStatus('Registered & Idle');
                setRegistered(true);
                setError('');
            });
            ua.on('unregistered', () => {
                setStatus('Unregistered');
                setRegistered(false);
            });
            ua.on('registrationFailed', (e) => {
                setStatus('Registration Failed');
                setError(`Registration failed: ${e.cause}`);
                setRegistered(false);
            });
            ua.on('newRTCSession', ({ session }) => {
                if (session.direction === 'incoming') {
                    if (agentStatus === 'Paused') {
                        session.terminate({ status_code: 486, reason_phrase: 'Busy Here' });
                        return;
                    }
                    setIncomingCall(session);
                    setStatus(`Incoming call from ${session.remote_identity.uri.user}`);
                } else {
                    setCallSession(session);
                }
                session.on('peerconnection', ({ peerconnection }) => {
                    peerconnection.ontrack = (event) => {
                        if (remoteAudioRef.current) {
                            remoteAudioRef.current.srcObject = event.streams[0];
                            remoteAudioRef.current.play().catch(() => { });
                        }
                    };
                    peerconnection.oniceconnectionstatechange = () => {
                        const state = peerconnection.iceConnectionState;
                        setIceStatus(state);
                        if (state === 'failed') setError('Audio connection failed.');
                    };
                });
                session.on('progress', () => setStatus('Ringing...'));
                session.on('accepted', () => {
                    setStatus('In Call');
                    setAgentStatus('On Call');
                    setTimerActive(true);
                    setIncomingCall(null);
                });
                session.on('ended', () => handleCallEnd('Call ended'));
                session.on('failed', (e) => handleCallEnd(`Call failed: ${e.cause}`));
            });
            ua.start();
        } catch (e) {
            setError('Failed to initialize SIP client.');
        }
    };

    const handleCallEnd = (reason) => {
        setCallSession(null);
        setIncomingCall(null);
        setStatus('Registered & Idle');
        setAgentStatus('Available');
        setTimerActive(false);
        setCallTimer(0);
        setIceStatus('');
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    };

    const hangup = () => {
        if (callSession) callSession.terminate();
        if (incomingCall) incomingCall.terminate({ status_code: 486, reason_phrase: 'Rejected' });
    };

    const answer = () => {
        if (incomingCall) {
            const options = { mediaConstraints: { audio: true, video: false }, pcConfig: PC_CONFIG };
            incomingCall.answer(options);
            setCallSession(incomingCall);
        }
    };

    const togglePause = () => {
        setAgentStatus(prev => prev === 'Available' ? 'Paused' : 'Available');
        setStatus(agentStatus === 'Available' ? "Paused (won't receive calls)" : 'Registered & Idle');
    };

    const formatTime = (sec) => {
        const minutes = Math.floor(sec / 60).toString().padStart(2, '0');
        const seconds = (sec % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <SIPContext.Provider value={{ status, registered, callSession, incomingCall, callTimer, error, iceStatus, agentStatus, hangup, answer, togglePause, formatTime, remoteAudioRef }}>
            {children}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
        </SIPContext.Provider>
    );
};
