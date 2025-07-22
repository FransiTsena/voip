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
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div>
        <span className="text-lg font-bold">Shift Status:</span>
        {shift && shift.startTime && !shift.endTime ? (
          <>
            <span className="ml-2 text-green-500">On Shift</span>
            <span className="ml-4 font-mono">{formatTime(timer)}</span>
          </>
        ) : (
          <span className="ml-2 text-red-500">Off Shift</span>
        )}
      </div>
      {shift && shift.startTime && !shift.endTime ? (
        <button
          onClick={handleEndShift}
          className="px-4 py-2 text-white bg-red-500 rounded"
        >
          End My Shift
        </button>
      ) : (
        <button
          onClick={handleStartShift}
          className="px-4 py-2 text-white bg-green-500 rounded"
        >
          Start My Shift
        </button>
      )}
    </div>
  );
};

export default ShiftTimer;
