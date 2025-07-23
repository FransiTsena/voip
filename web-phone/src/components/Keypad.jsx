const Keypad = ({ callNumber, onKeypadPress, onBackspace, onClear, disabled }) => {
  const numbers = [...'123456789*0#'];

  return (
    <div className="mb-4">
      <input
        type="text"
        value={callNumber}
        onChange={(e) => onKeypadPress(e.target.value.replace(/[^0-9*#]/g, ''))}
        placeholder="Enter number"
        className="w-full text-2xl text-center border border-gray-200 rounded-lg py-2 px-4 bg-white"
        disabled={disabled}
      />
      <div className="grid grid-cols-3 gap-2 mb-4">
        {numbers.map((num) => (
          <button
            key={num}
            onClick={() => onKeypadPress(num)}
            className="text-2xl h-12 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
          >
            {num}
          </button>
        ))}
        <button
          onClick={onBackspace}
          className="text-2xl h-12 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          ⌫
        </button>
        <button
          onClick={onClear}
          className="text-2xl h-12 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        >
          C
        </button>
      </div>
    </div>
  );
};

export default Keypad;
