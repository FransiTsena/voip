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
    // 
  };

  return (
    <div className="flex items-center gap-3 px-3 py-1 bg-gradient-to-tr from-white/90 via-blue-50 to-blue-200/80 backdrop-blur-md rounded-xl shadow border border-blue-100 animate-fade-in relative overflow-hidden min-w-[220px] max-w-xs">
      {/* Material 3 expressive background accent (subtle for navbar) */}
      <div className="absolute -top-4 -left-4 w-12 h-12 bg-blue-300/20 rounded-full blur z-0" />
      <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-pink-300/10 rounded-full blur z-0" />
      <div className="flex items-center gap-2 z-10">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600/10 shadow-inner">
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-blue-500">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l2.5 2.5M12 22a10 10 0 100-20 10 10 0 000 20z" />
          </svg>
        </div>
        <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Shift</span>
        {shift && shift.startTime && !shift.endTime ? (
          <span className="flex items-center gap-1">
            <span className="px-2 py-0.5 rounded-full bg-green-300/80 text-green-900 font-bold text-[10px] border border-green-400 animate-pulse shadow">On</span>
            <span className="font-mono text-xs text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded shadow-inner tracking-widest animate-timer-glow border border-blue-200">
              {formatTime(timer)}
            </span>
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-red-200/80 text-red-700 font-bold text-[10px] border border-red-300 shadow">Off</span>
        )}
      </div>
      {shift && shift.startTime && !shift.endTime ? (
        <button
          onClick={handleEndShift}
          className="ml-2 px-2 py-1 text-xs text-white bg-500 rounded-lg font-bold shadow hover:from-red-600 hover:to-pink-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-red-200 animate-fade-in flex items-center gap-1 z-10"
          title="End Shift"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block">
            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" className="text-white" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleStartShift}
          className="ml-2 px-2 py-1 text-xs text-white bg-green-500 rounded-lg font-bold shadow hover:from-green-600 hover:to-blue-600 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-green-200 animate-fade-in flex items-center gap-1 z-10"
          title="Start Shift"
        >
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="inline-block">
            <polygon points="8,5 19,12 8,19" fill="currentColor" className="text-white" />
          </svg>
        </button>
      )}
      <style>{`
        @keyframes timerGlow {
          0% { box-shadow: 0 0 0 0 #3b82f680; }
          70% { box-shadow: 0 0 8px 4px #3b82f640; }
          100% { box-shadow: 0 0 0 0 #3b82f600; }
        }
        .animate-timer-glow {
          animation: timerGlow 2s infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.7s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ShiftTimer;
