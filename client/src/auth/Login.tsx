import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await login(email, password);
      setSuccessMessage('Login successful!');
    } catch (err: any) {
      setError(err.message);
      setSuccessMessage(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white font-inter text-gray-900 p-4">
      <div className="flex flex-col lg:flex-row rounded-2xl shadow-lg overflow-hidden max-w-5xl w-full bg-white animate-fade-in">
        <div className="w-full lg:w-1/2 flex justify-center items-center p-8 bg-gray-50">
          <img
            src="/call-center_6680381.png"
            alt="Login Illustration"
            className="w-full h-auto object-contain max-h-96 lg:max-h-full"
          />
        </div>
        <div className="w-full lg:w-1/2 flex justify-center items-center p-8">
          <div className="w-full max-w-md text-center">
            <div className="mb-8">
              <img
                src="/picpic.png"
                alt="Company Logo"
                className="mx-auto h-24 w-auto object-contain mb-4"
              />
              <h1 className="text-3xl font-extrabold text-gray-800">Login to Dashboard</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="sr-only">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 ease-in-out"
                />
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
              {successMessage && (
                <p className="text-green-600 text-sm mt-2">{successMessage}</p>
              )}
              <button
                type="submit"
                className="w-full text-white font-bold py-3 px-6 rounded-xl shadow-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;