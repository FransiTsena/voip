
import React, { useState, useEffect } from 'react';
import useStore from '../store/store';

const ShiftTimer = () => {
  const shift = useStore((state) => state.shift);
  const startShift = useStore((state) => state.startShift);
  const endShift = useStore((state) => state.endShift);
  const agent = useStore((state) => state.agent);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (shift && shift.startTime && !shift.endTime) {
      interval = setInterval(() => {
        setTimer(Math.floor((new Date() - new Date(shift.startTime)) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [shift]);

  const handleStartShift = () => {
    startShift(agent.id);
  };

  const handleEndShift = () => {
    endShift(shift._id);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  return (
    <nav className="w-full flex items-center justify-between py-2.5 bg-white/95 border-b border-gray-200 z-20 relative">
      <div className="flex items-center gap-1 min-w-[180px]">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-500 ">
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2.5 2.5M12 22a10 10 0 100-20 10 10 0 000 20z" />
          </svg>
        </div>
        <span className="text-lg font-semibold text-gray-800 tracking-wide">Shift Timer</span>
      </div>
      <div className="flex items-center">
        {shift && shift.startTime && !shift.endTime ? (
          <>
            <span className="flex items-center">
              <span className="py-1 rounded-full bg-gray-200 text-gray-700 font-semibold text-xs border border-gray-300 animate-pulse">On</span>
              <span className="font-mono text-base text-gray-700 bg-gray-100 px-4 py-1 rounded tracking-widest animate-timer-glow border border-gray-200">
                {formatTime(timer)}
              </span>
            </span>
            <button
              onClick={handleEndShift}
              className="ml-4 px-4 py-2 text-xs text-white bg-gray-500 rounded-lg font-bold hover:bg-gray-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-200 flex items-center gap-1"
              title="End Shift"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" className="text-white" />
              </svg>
              <span>End</span>
            </button>
          </>
        ) : (
          <>
            <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-500 font-semibold text-xs border border-gray-300">Off</span>
            <button
              onClick={handleStartShift}
              className="ml-4 px-4 py-2 text-xs text-white bg-gray-700 rounded-lg font-bold hover:bg-gray-900 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-gray-200 flex items-center gap-1"
              title="Start Shift"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <polygon points="8,5 19,12 8,19" fill="currentColor" className="text-white" />
              </svg>
              <span>Start</span>
            </button>
          </>
        )}
      </div>
      <style>{`
        @keyframes timerGlow {
          0% { box-shadow: 0 0 0 0 #a3a3a380; }
          70% { box-shadow: 0 0 8px 4px #a3a3a340; }
          100% { box-shadow: 0 0 0 0 #a3a3a300; }
        }
        .animate-timer-glow {
          animation: timerGlow 2s infinite;
        }
      `}</style>
    </nav>
  );
};

export default ShiftTimer;
