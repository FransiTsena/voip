
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import JsSIP from 'jssip';
import useStore from '../store/store';
import { baseUrl } from '../baseUrl';

const SIPContext = createContext();

export const useSIP = () => useContext(SIPContext);

export const SIPProvider = ({ children }) => {
    const agent = useStore(state => state.agent);
    // Use SIP credentials from agent if available, fallback to demo values
    const SIP_USER = agent?.username || '';
    const [sipPassword, setSipPassword] = useState('');
    // Fetch SIP password from /auth/me when SIP_USER changes
    useEffect(() => {
        if (!SIP_USER) return;
        const fetchSipPassword = async () => {
            try {
                const res = await fetch(`${baseUrl}/auth/me`, {
                    method: 'GET',
                    credentials: 'include',
                });
                // console.log('Fetching SIP password for user:', await res.text());
                if (res.status === 200) {
                    const data = await res.json();

                    console.log('SIP credentials fetched:', data);
                    setSipPassword(data.sip?.password || '');
                    console.log('SIP_USER:', SIP_USER, 'SIP_PASSWORD:', data.sip?.password || '');

                }
            } catch { }
        };
        fetchSipPassword();
    }, [SIP_USER]);
    const SIP_SERVER = process.env.SERVER_IP || '10.42.0.1';
    const SIP_WS_SERVER = `ws://${SIP_SERVER}:8088/ws`;
    const PC_CONFIG = {
        iceServers: [
        ],
        rtcpMuxPolicy: 'require'
    };

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
        if (!SIP_USER || !sipPassword) return;
        startUA();
        return () => {
            if (uaRef.current) {
                uaRef.current.stop();
                uaRef.current = null;
            }
        };
        // Only rerun when SIP_USER or sipPassword changes
    }, [SIP_USER, sipPassword]);

    const startUA = () => {
        if (uaRef.current && uaRef.current.isRegistered()) return;
        try {
            const socket = new JsSIP.WebSocketInterface(SIP_WS_SERVER);
            const configuration = {
                sockets: [socket],
                uri: `sip:${SIP_USER}@${SIP_SERVER}`,
                password: sipPassword,
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

    const answer = async () => {
        if (incomingCall) {
            console.log('Answering incoming call:', incomingCall);
            console.log('Trying to answer call, status:', incomingCall.status);
            // JsSIP status constants: 1 = STATUS_WAITING_FOR_ANSWER
            // if (incomingCall.status !== 1) {
            //     setError('Cannot answer: call is no longer available (status ' + incomingCall.status + ')');
            //     console.warn('Cannot answer: session status is', incomingCall.status);
            //     return;
            // }
            try {
                const stream = await (window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia
                    ? window.navigator.mediaDevices.getUserMedia({ audio: true })
                    : Promise.reject(new Error('getUserMedia not supported in this browser')));
                const options = {
                    mediaConstraints: { audio: true, video: false },
                    mediaStream: stream,
                    pcConfig: PC_CONFIG
                };
                // Attach event handlers for the session before answering
                incomingCall.on('progress', () => console.log('Session event: progress'));
                incomingCall.on('accepted', () => {
                    console.log('Call accepted');
                    setCallSession(incomingCall);
                    setStatus('In Call');
                    setAgentStatus('On Call');
                    setTimerActive(true);
                    setIncomingCall(null);
                });
                incomingCall.on('failed', (e) => {
                    console.log('Call failed after answer:', e);
                    handleCallEnd(`Call failed: ${e.cause}`);
                });
                incomingCall.on('ended', () => {
                    console.log('Call ended after answer');
                    handleCallEnd('Call ended');
                });
                incomingCall.on('confirmed', () => console.log('Session event: confirmed'));
                incomingCall.on('peerconnection', () => console.log('Session event: peerconnection'));
                incomingCall.answer(options);
            } catch (err) {
                setError('Failed to answer call: ' + (err?.message || err));
            }
        }
    };

    const togglePause = () => {
        setAgentStatus(prev => {
            const next = prev === 'Available' ? 'Paused' : 'Available';
            setStatus(next === 'Paused' ? "Paused (won't receive calls)" : 'Registered & Idle');
            return next;
        });
    };

    const formatTime = (sec) => {
        const minutes = Math.floor(sec / 60).toString().padStart(2, '0');
        const seconds = (sec % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    // Make call function
    const makeCall = async (destination) => {
        if (!uaRef.current || !registered) {
            setError('SIP client not registered.');
            return;
        }
        if (!destination) {
            setError('No destination number provided.');
            return;
        }
        try {
            const stream = await (window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia
                ? window.navigator.mediaDevices.getUserMedia({ audio: true })
                : Promise.reject(new Error('getUserMedia not supported in this browser')));
            const eventHandlers = {
                progress: () => setStatus('Ringing...'),
                failed: (e) => handleCallEnd(`Call failed: ${e.cause}`),
                ended: () => handleCallEnd('Call ended'),
                confirmed: () => setStatus('In Call'),
            };
            const options = {
                eventHandlers,
                mediaConstraints: { audio: true, video: false },
                mediaStream: stream,
                pcConfig: PC_CONFIG,
            };
            const session = uaRef.current.call(`sip:${destination}@${SIP_SERVER}`, options);
            setCallSession(session);
            setStatus('Calling...');
        } catch (err) {
            setError('Failed to make call or get microphone: ' + (err?.message || err));
        }
    };

    // Call transfer function with event handlers
    const transferCall = (target) => {
        if (callSession && target) {
            try {
                const referTarget = `sip:${target}@${SIP_SERVER}`;
                const referSubscription = callSession.refer(referTarget);
                if (referSubscription) {
                    referSubscription.on('accepted', () => {
                        setError('Call transferred successfully.');
                        setTimeout(() => setError(''), 2000);
                    });
                    referSubscription.on('failed', (e) => {
                        let msg = 'Call transfer failed';
                        if (e && e.response) {
                            msg += `: ${e.response.status_code} ${e.response.reason_phrase}`;
                        } else if (e && e.cause) {
                            msg += `: ${e.cause}`;
                        } else {
                            msg += ': Unknown error';
                        }
                        setError(msg);
                    });
                    referSubscription.on('notify', (n) => {
                        // n.request.body may contain transfer status
                        if (n.request && n.request.body) {
                            if (/200/.test(n.request.body)) {
                                setError('Call transferred successfully.');
                                setTimeout(() => setError(''), 2000);
                            } else if (/603|486|404|480|Busy|Decline|Not Found|Unavailable/i.test(n.request.body)) {
                                setError('Call transfer failed: ' + n.request.body);
                            }
                        }
                    });
                }
            } catch (err) {
                setError('Failed to transfer call: ' + (err?.message || err));
            }
        } else {
            setError('No active call or target for transfer.');
        }
    };

    return (
        <SIPContext.Provider value={{ status, registered, callSession, incomingCall, callTimer, error, iceStatus, agentStatus, hangup, answer, togglePause, formatTime, remoteAudioRef, makeCall, transferCall }}>
            {children}
            <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
        </SIPContext.Provider>
    );
};
