import React from 'react';
import type { IVROption } from './types';

interface IVROptionFieldsProps {
  options: IVROption[];
  setOptions: (options: IVROption[]) => void;
}

const IVROptionFields: React.FC<IVROptionFieldsProps> = ({ options, setOptions }) => {
  const handleOptionChange = (index: number, field: keyof IVROption, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const addOption = () => {
    setOptions([...options, { number: '', queue: '', action: 'queue', description: '' }]);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-2">Menu Options</h3>
      {options.map((option, index) => (
        <div key={index} className="flex space-x-2 mb-2">
          <input
            type="number"
            value={option.number}
            onChange={(e) => handleOptionChange(index, 'number', e.target.value)}
            placeholder="Option Number (e.g., 1)"
            className="w-1/4 px-3 py-2 border rounded-md"
            required
          />
          <input
            type="text"
            value={option.queue}
            onChange={(e) => handleOptionChange(index, 'queue', e.target.value)}
            placeholder="Queue Name (e.g., sales_queue)"
            className="w-1/2 px-3 py-2 border rounded-md"
            required
          />
          {options.length > 1 && (
            <button
              type="button"
              onClick={() => removeOption(index)}
              className="px-4 py-2 bg-red-200 text-red-700 rounded-md hover:bg-red-300"
            >
              Remove
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addOption}
        className="px-4 py-2 bg-green-200 text-green-700 rounded-md hover:bg-green-300 mt-2"
      >
        Add Option
      </button>
    </div>
  );
};

export default IVROptionFields;