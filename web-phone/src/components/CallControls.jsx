const CallControls = ({
  callSession,
  incomingCall,
  onCall,
  onHangup,
  onAnswer,
  onToggleHold,
  onHold,
  callTimer
}) => {
  return (
    <>
      {callSession && (
        <div className="text-lg text-gray-800 mb-4">
          {callTimer}
        </div>
      )}
      {incomingCall && (
        <div className="text-center mb-4">
          <span className="text-gray-800 font-medium">
            Incoming call from {incomingCall.remote_identity.uri.user}
          </span>
          <div className="mt-2 flex justify-center gap-4">
            <button
              onClick={onHangup}
              className="w-12 h-12 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              ⏹
            </button>
            <button
              onClick={onAnswer}
              className="w-12 h-12 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              📞
            </button>
          </div>
        </div>
      )}
      {callSession && (
        <div className="flex justify-center gap-4 mt-4">
          <button
            onClick={onToggleHold}
            className="w-12 h-12 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {onHold ? '▶' : '⏸'}
          </button>
          <button
            onClick={onHangup}
            className="w-12 h-12 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            ⏹
          </button>
        </div>
      )}
    </>
  );
};

export default CallControls;
