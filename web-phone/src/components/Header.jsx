import { useState } from 'react';

const Header = ({ agentStatus, onTogglePause }) => {
  const [isPaused, setIsPaused] = useState(agentStatus === 'Paused');

  const handleTogglePause = () => {
    onTogglePause();
    setIsPaused(!isPaused);
  };

  return (
    <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
      <span className="font-semibold text-gray-800">Agent SIP Phone</span>
      <span className={`px-2 py-1 rounded-full text-sm ${
        isPaused ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'
      }`}>
        {agentStatus}
      </span>
      <button 
        onClick={handleTogglePause} 
        className="text-sm bg-gray-100 rounded-lg px-3 py-1 hover:bg-gray-200 transition-colors"
      >
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
};

export default Header;
