import React, { useState } from 'react';
import useStore from '../store/store';
import { baseUrl } from '../baseUrl';

const Login = ({ onSwitch }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setAuth = useStore(state => state.setAuth);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            console.log("baseUrl", baseUrl)
            const res = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });
            const data = await res.json();
            if (res.ok && data.agent) {
                // Attach SIP credentials to agent for SIPProvider
                const agentWithSip = { ...data.agent, sip: data.sip };
                setAuth({ agent: agentWithSip });
            } else {
                setError(data.message || 'Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Server error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300">
            <div className="backdrop-blur-md bg-white/70 p-12 rounded-[2.5rem] shadow-2xl w-full max-w-md flex flex-col items-center animate-fade-in border border-gray-100 relative" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)' }}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-24 h-24 flex items-center justify-center rounded-full bg-white/80 border border-gray-200 shadow-lg">
                    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                                <stop offset="0%" stopColor="#e0e7ef" />
                                <stop offset="100%" stopColor="#cbd5e1" />
                            </radialGradient>
                        </defs>
                        <circle cx="30" cy="30" r="28" stroke="#2D3748" strokeWidth="2" fill="url(#grad1)" />
                        <text x="50%" y="54%" textAnchor="middle" fill="#2D3748" fontSize="20" fontWeight="bold" fontFamily="serif" dy=".3em">INSA</text>
                    </svg>
                </div>
                <div className="mb-10 mt-16 flex flex-col items-center">
                    <h2 className="text-3xl font-black text-gray-800 mb-1 tracking-tight font-serif drop-shadow-sm">INSA Call Center</h2>
                    <p className="text-gray-400 text-base italic font-light">Artistry in Service</p>
                </div>
                <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-600 px-3 py-2 rounded text-center animate-shake text-sm font-medium shadow-sm">
                            {error}
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-gray-50 text-gray-700 font-medium placeholder-gray-400 shadow-sm"
                        required
                        autoFocus
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-400 transition bg-gray-50 text-gray-700 font-medium placeholder-gray-400 shadow-sm"
                        required
                    />
                    <button
                        type="submit"
                        className={`w-full bg-gray-900 text-white p-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed tracking-wide ${loading ? 'cursor-wait' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
            <style>{`
                .animate-fade-in { animation: fadeIn 0.7s; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
                .animate-shake { animation: shake 0.3s; }
                @keyframes shake { 10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); } 30%, 50%, 70% { transform: translateX(-8px); } 40%, 60% { transform: translateX(8px); } }
            `}</style>
        </div>
    );
};

export default Login;
