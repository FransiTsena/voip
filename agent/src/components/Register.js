import React, { useState } from 'react';
import { baseUrl } from '../baseUrl';

const Register = ({ onSwitch }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const res = await fetch(`${baseUrl}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, name, email })
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess('Registration successful! You can now log in.');
                setUsername(''); setPassword(''); setName(''); setEmail('');
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError('Server error');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
                <h2 className="text-2xl mb-4 text-center">Agent Registration</h2>
                {error && <div className="text-red-500 mb-2">{error}</div>}
                {success && <div className="text-green-500 mb-2">{success}</div>}
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full mb-3 p-2 border rounded"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full mb-3 p-2 border rounded"
                    required
                />
                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full mb-3 p-2 border rounded"
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full mb-3 p-2 border rounded"
                />
                <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">Register</button>
                <button type="button" className="w-full mt-2 text-blue-500" onClick={onSwitch}>Already have an account? Login</button>
            </form>
        </div>
    );
};

export default Register;
