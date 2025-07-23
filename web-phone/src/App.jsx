import { useState, useRef, useEffect } from 'react';
import JsSIP from 'jssip';
import './App.css';
import Login from './components/Login';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Phone from './components/Phone';

function App() {
  const navigate = useNavigate();
  // SIP server config (edit SIP_WS as needed)
  const SIP_WS = 'ws://10.42.0.17:8088/ws';

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sipUser, setSipUser] = useState('');
  const [sipPassword, setSipPassword] = useState('');

  // Phone state
  const [registered, setRegistered] = useState(false);
  const [callSession, setCallSession] = useState(null);
  const [callNumber, setCallNumber] = useState('');
  const [incomingCall, setIncomingCall] = useState(null);
  const [status, setStatus] = useState('Idle');
  const [agentStatus, setAgentStatus] = useState('Available');
  const [callTimer, setCallTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const uaRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localAudioRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => setCallTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const register = () => {
    if (uaRef.current) return;
    const socket = new JsSIP.WebSocketInterface(SIP_WS);
    const ua = new JsSIP.UA({
      sockets: [socket],
      uri: `sip:${sipUser}@10.42.0.17`,
      password: sipPassword,
      session_timers: false,
    });

    uaRef.current = ua;

    ua.on('registered', () => {
      setRegistered(true);
      setStatus('Registered');
    });

    ua.on('registrationFailed', (e) => {
      setStatus('Registration failed: ' + (e && e.cause ? e.cause : ''));
      setRegistered(false);
    });

    ua.on('newRTCSession', (e) => {
      const session = e.session;

      session.on('peerconnection', (e) => {
        const pc = e.peerconnection;
        pc.ontrack = (event) => {
          const stream = event.streams[0];
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.muted = false;
            remoteAudioRef.current
              .play()
              .catch(err => console.error('Playback error:', err));
          }
        };
      });

      if (session.direction === 'incoming') {
        if (agentStatus === 'Paused') {
          session.terminate();
          return;
        }
        setIncomingCall(session);
        setStatus(`Incoming call from ${session.remote_identity.uri.user}`);
      } else {
        setCallSession(session);
        setStatus('Calling...');
      }

      session.on('ended', () => {
        setCallSession(null);
        setIncomingCall(null);
        setStatus('Idle');
        setTimerActive(false);
        setCallTimer(0);
        setAgentStatus('Available');
      });

      session.on('failed', () => {
        setCallSession(null);
        setIncomingCall(null);
        setStatus('Call failed');
        setTimerActive(false);
        setCallTimer(0);
        setAgentStatus('Available');
      });

      session.on('accepted', () => {
        setStatus('In call');
        setAgentStatus('On Call');
        setTimerActive(true);
      });

      session.on('confirmed', () => {
        setStatus('In call');
        setAgentStatus('On Call');
        setTimerActive(true);
      });
    });

    ua.start();
  };

  const call = async () => {
    if (!uaRef.current || !callNumber) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (localAudioRef.current) {
        localAudioRef.current.srcObject = stream;
      }

      uaRef.current.call(`sip:${callNumber}@10.42.0.17`, {
        mediaConstraints: { audio: true, video: false },
        rtcOfferConstraints: { offerToReceiveAudio: 1 },
        pcConfig: {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        },
        mediaStream: stream
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const hangup = () => {
    if (callSession) callSession.terminate();
    if (incomingCall) incomingCall.terminate();
    setTimerActive(false);
    setCallTimer(0);
  };

  const answer = async () => {
    if (incomingCall) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }

        incomingCall.answer({
          mediaConstraints: { audio: true, video: false },
          pcConfig: {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          },
          mediaStream: stream
        });

        setCallSession(incomingCall);
        setIncomingCall(null);
        setAgentStatus('On Call');
        setTimerActive(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
      }
    }
  };

  const handleKeypad = (val) => setCallNumber((prev) => prev + val);
  const handleBackspace = () => setCallNumber((prev) => prev.slice(0, -1));
  const handleClear = () => setCallNumber('');

  const togglePause = () => {
    if (agentStatus === 'Available') {
      setAgentStatus('Paused');
      setStatus("Paused (won't receive calls)");
    } else {
      setAgentStatus('Available');
      setStatus('Idle');
    }
  };

  const handleLogin = (username, password, setError) => {
    if (!username || !password) {
      setError && setError('Please enter both username and password.');
      return;
    }
    setSipUser(username);
    setSipPassword(password);
    setIsLoggedIn(true);
    setError && setError('');
    navigate('/phone');
  };

  return (
    <Routes>
      {/* <Route path="/" element={<Login onLogin={handleLogin} />} /> */}
      <Route path="/" element={<Phone  />} />
    </Routes>
  );
}

export default App;
