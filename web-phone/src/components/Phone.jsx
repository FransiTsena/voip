import React, { useState, useRef, useEffect } from 'react';
import JsSIP from 'jssip';

// --- Configuration ---
// WebSocket URL for your Asterisk server's HTTP transport
const SIP_WS_SERVER = 'ws://10.42.0.17:8088/ws'; 
// Your SIP User Agent (UA) details
const SIP_USER = '1002';
const SIP_PASSWORD = '1234';
const SIP_SERVER = '10.42.0.17';

/**
 * WebRTC PeerConnection Configuration for a LOCAL NETWORK.
 *
 * For a purely local setup (like a demo where your browser and Zoiper/Asterisk
 * are on the same WiFi/LAN), you often don't need STUN servers. The browser
 * can discover the other peer's local IP address directly.
 *
 * By leaving `iceServers` empty, we force the browser to only use local "host"
 * candidates.
 *
 * *** IF AUDIO STILL FAILS ***
 * The problem is almost certainly in your Asterisk configuration:
 * 1.  **pjsip.conf**: Ensure your WebRTC endpoint has `icesupport=yes`, `avpf=yes`,
 * and `rtcp_mux=yes`. Also, DTLS settings (`dtls_cert_file`, etc.) must be correct.
 * 2.  **rtp.conf**: Asterisk must advertise its own LOCAL IP address (10.42.0.17) in
 * the SDP it sends to the browser. If it sends `127.0.0.1` or a different
 * private IP (e.g., from a Docker container), the browser won't know where to
 * send the audio. Check for `ice_host_candidate` settings.
 */
const PC_CONFIG = {
  iceServers: [], // Empty for local-only setup
  rtcpMuxPolicy: 'require',
};

export default function Phone() {
  const [status, setStatus] = useState('Disconnected');
  const [registered, setRegistered] = useState(false);
  const [callSession, setCallSession] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callNumber, setCallNumber] = useState('');
  const [agentStatus, setAgentStatus] = useState('Available');
  const [callTimer, setCallTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [error, setError] = useState('');
  const [iceStatus, setIceStatus] = useState('');

  // Refs for JsSIP instance and audio elements
  const uaRef = useRef(null);
  const remoteAudioRef = useRef(null);
  
  // Ref for the call timer interval
  const timerRef = useRef(null);

  // --- Effects ---

  // Effect to manage the call timer
  useEffect(() => {
    if (timerActive) {
      timerRef.current = setInterval(() => {
        setCallTimer(t => t + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);
  
  // Effect to initialize and clean up the JsSIP UA
  useEffect(() => {
    // Start the UA when the component mounts
    startUA();

    // Return a cleanup function to stop the UA when the component unmounts
    return () => {
      if (uaRef.current) {
        console.log('Stopping JsSIP UA...');
        uaRef.current.stop();
        uaRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // --- Helper Functions ---

  const formatTime = (sec) => {
    const minutes = Math.floor(sec / 60).toString().padStart(2, '0');
    const seconds = (sec % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // --- JsSIP UA Initialization and Event Handlers ---

  const startUA = () => {
    if (uaRef.current && uaRef.current.isRegistered()) {
      console.log('JsSIP UA already registered.');
      return;
    }
    
    try {
      const socket = new JsSIP.WebSocketInterface(SIP_WS_SERVER);
      const configuration = {
        sockets: [socket],
        uri: `sip:${SIP_USER}@${SIP_SERVER}`,
        password: SIP_PASSWORD,
        session_timers: false,
        pcConfig: PC_CONFIG, // Use our local-first PC config
      };

      const ua = new JsSIP.UA(configuration);
      uaRef.current = ua;

      // --- UA Connection Events ---
      ua.on('connecting', () => setStatus('Connecting...'));
      ua.on('connected', () => setStatus('Connected (Registering...)'));
      ua.on('disconnected', (e) => {
        setStatus('Disconnected');
        setError(`WebSocket disconnected: ${e.cause}. Check Asterisk & WS URL.`);
        setRegistered(false);
      });

      // --- UA Registration Events ---
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
        setError(`Registration failed: ${e.cause}. Check credentials.`);
        setRegistered(false);
      });

      // --- Call Handling Events ---
      ua.on('newRTCSession', ({ session }) => {
        console.log('New session created:', session.direction);

        // --- PeerConnection Event Handlers ---
        session.on('peerconnection', ({ peerconnection }) => {
          console.log('PeerConnection created.');
          
          // This is the crucial part for receiving audio
          peerconnection.ontrack = (event) => {
            console.log('Remote track received:', event.track);
            if (remoteAudioRef.current) {
              // Attach the incoming media stream to the <audio> element
              remoteAudioRef.current.srcObject = event.streams[0];
              remoteAudioRef.current.play().catch(e => console.error("Autoplay failed", e));
            }
          };

          // Monitor ICE connection state for debugging
          peerconnection.oniceconnectionstatechange = () => {
            const state = peerconnection.iceConnectionState;
            setIceStatus(state); // Update UI for debugging
            console.log(`ICE State: ${state}`);
            if (state === 'failed') {
              setError('Audio connection failed. Check Asterisk RTP/ICE config.');
            }
          };
        });

        // --- Session State Events ---
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
      console.error('JsSIP UA initialization failed:', e);
      setError('Failed to initialize SIP client. Check console.');
    }
  };
  
  const handleCallEnd = (reason) => {
      console.log(reason);
      setCallSession(null);
      setIncomingCall(null);
      setStatus('Registered & Idle');
      setAgentStatus('Available');
      setTimerActive(false);
      setCallTimer(0);
      setIceStatus('');
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = null;
      }
  }

  // --- Call Actions ---

  const call = () => {
    if (!uaRef.current || !registered || !callNumber) {
      setError('Must be registered and have a number to call.');
      return;
    }
    const options = {
      mediaConstraints: { audio: true, video: false },
      pcConfig: PC_CONFIG,
    };
    uaRef.current.call(`sip:${callNumber}@${SIP_SERVER}`, options);
    setStatus(`Calling ${callNumber}...`);
  };

  const hangup = () => {
    if (callSession) {
      callSession.terminate();
    }
    if (incomingCall) {
      incomingCall.terminate({ status_code: 486, reason_phrase: 'Rejected' });
    }
  };

  const answer = () => {
    if (incomingCall) {
      const options = {
        mediaConstraints: { audio: true, video: false },
        pcConfig: PC_CONFIG,
      };
      incomingCall.answer(options);
      setCallSession(incomingCall);
    }
  };

  const sendDTMF = (digit) => {
    if (callSession) {
      callSession.sendDTMF(digit);
    }
  };

  // --- UI Handlers ---

  const handleKeypad = (val) => {
    setCallNumber((prev) => prev + val);
    if (callSession && status === 'In Call') {
      sendDTMF(val);
    }
  };
  
  const togglePause = () => {
    setAgentStatus(prev => prev === 'Available' ? 'Paused' : 'Available');
    setStatus(agentStatus === 'Available' ? "Paused (won't receive calls)" : 'Registered & Idle');
  };

  // --- Render ---

  return (
    <div className="bg-gray-50 flex justify-center items-center min-h-screen font-sans">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Local SIP Phone</h1>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${registered ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {registered ? 'Registered' : 'Unregistered'}
            </span>
            <button onClick={togglePause} className="text-xs px-2 py-1 rounded-md bg-gray-200 hover:bg-gray-300">
              {agentStatus === 'Paused' ? 'Resume' : 'Pause'}
            </button>
          </div>
        </div>

        {/* Status Display */}
        <div className="text-center bg-gray-100 p-3 rounded-lg">
          <p className="text-sm font-medium text-gray-700">{status}</p>
          <div className="flex justify-center items-center space-x-2">
            <p className="text-xs text-gray-500">ICE: {iceStatus || 'idle'}</p>
            {error && <p className="text-xs text-red-500 truncate" title={error}>{error}</p>}
          </div>
        </div>
        
        {/* Call Timer and Number Input */}
        <div className="text-center">
          <div className="h-10 text-3xl font-mono text-gray-800 tracking-wider">
            {callSession ? formatTime(callTimer) : (callNumber || ' ')}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3">
          {[...'123456789*0#'].map(k => (
            <button key={k} onClick={() => handleKeypad(k)} className="h-16 rounded-full bg-gray-200 text-2xl font-semibold text-gray-700 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400">
              {k}
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
           <button onClick={() => setCallNumber(prev => prev.slice(0, -1))} className="w-16 h-16 rounded-full bg-gray-200 text-2xl flex items-center justify-center hover:bg-gray-300">⌫</button>
          
          <button
            onClick={callSession ? hangup : call}
            disabled={!registered || (!callSession && !callNumber)}
            className={`w-20 h-20 rounded-full text-white text-4xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 shadow-lg disabled:bg-gray-300 disabled:shadow-none disabled:transform-none
              ${callSession ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {callSession ? '✆' : '📞'}
          </button>
          
          <div className="w-16 h-16"></div> {/* Spacer */}
        </div>

        {/* Incoming Call Modal */}
        {incomingCall && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 text-center shadow-xl animate-pulse">
              <p className="text-lg font-medium text-gray-600">Incoming Call From</p>
              <p className="text-4xl font-bold text-gray-900 my-4">{incomingCall.remote_identity.uri.user}</p>
              <div className="flex space-x-4">
                <button onClick={answer} className="flex-1 py-3 bg-green-500 text-white rounded-lg text-lg font-semibold hover:bg-green-600">Answer</button>
                <button onClick={hangup} className="flex-1 py-3 bg-red-500 text-white rounded-lg text-lg font-semibold hover:bg-red-600">Reject</button>
              </div>
            </div>
          </div>
        )}

        {/* This audio element is crucial. It plays the remote audio. 
            It's hidden from the user but must be in the DOM. `autoPlay` and
            `playsInline` are important attributes. */}
        <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />
      </div>
    </div>
  );
}
