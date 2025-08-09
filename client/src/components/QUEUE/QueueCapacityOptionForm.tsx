import React, { useCallback } from 'react';
import { CapacityFormData } from '../../types/queueTypes'; // Import the type

// Props for the CapacityOptionsTab component
// Updated to match the props passed from QueueForm.tsx
interface CapacityOptionsTabProps {
  formData: CapacityFormData;
  handleChange: (name: string, value: any) => void;
}

// Dummy data for select options
const penaltyMembersLimitOptions = [
  { value: 'Honor Penalties', label: 'Honor Penalties' },
  { value: 'Ignore Penalties', label: 'Ignore Penalties' },
];

// --- Reusable Form Components (Hoisted and Memoized) ---

// Reusable component for form rows
const FormRow: React.FC<{ label: string; tooltip?: string; children: React.ReactNode }> = React.memo(({ label, tooltip, children }) => (
  <div className="flex items-center border-b border-gray-200 py-4 last:border-b-0">
    <div className="w-1/3 pr-4 text-left text-gray-700 font-medium flex items-center justify-start">
      {label}
      {tooltip && (
        <span className="ml-2 text-gray-400 cursor-help" title={tooltip}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      )}
    </div>
    <div className="w-2/3 pl-4">
      {children}
    </div>
  </div>
));

// Reusable button group for Join Empty / Leave Empty
const JoinLeaveEmptyButtonGroup: React.FC<{ value: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose'; onChange: (value: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex rounded-md shadow-sm -space-x-px">
    <button
      type="button"
      onClick={() => onChange('Yes')}
      className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'Yes' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Yes
    </button>
    <button
      type="button"
      onClick={() => onChange('Strict')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'Strict' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Strict
    </button>
    <button
      type="button"
      onClick={() => onChange('Ultra Strict')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'Ultra Strict' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Ultra Strict
    </button>
    <button
      type="button"
      onClick={() => onChange('No')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'No' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      No
    </button>
    <button
      type="button"
      onClick={() => onChange('Loose')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'Loose' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Loose
    </button>
  </div>
));

// --- End Reusable Form Components ---


const CapacityOptionsTab: React.FC<CapacityOptionsTabProps> = React.memo(({ formData, handleChange }) => {

  // Memoized handlers for button groups
  const handleJoinEmptyChange = useCallback((value: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose') => {
    handleChange('joinEmpty', value);
  }, [handleChange]);

  const handleLeaveEmptyChange = useCallback((value: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose') => {
    handleChange('leaveEmpty', value);
  }, [handleChange]);

  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Capacity Options Settings</h3>

      {/* Max Callers */}
      <FormRow label="Max Callers" tooltip="The maximum number of callers allowed in this queue. Set to 0 for unlimited.">
        <input
          type="number"
          name="maxCallers"
          value={formData.maxCallers} // Use formData directly
          onChange={e => handleChange(e.target.name, Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          min="0"
        />
      </FormRow>

      {/* Join Empty */}
      <FormRow label="Join Empty" tooltip="Determines if callers can join an empty queue.">
        <JoinLeaveEmptyButtonGroup
          value={formData.joinEmpty} // Use formData directly
          onChange={handleJoinEmptyChange}
        />
      </FormRow>

      {/* Leave Empty */}
      <FormRow label="Leave Empty" tooltip="Determines if callers are removed from the queue if it becomes empty.">
        <JoinLeaveEmptyButtonGroup
          value={formData.leaveEmpty} // Use formData directly
          onChange={handleLeaveEmptyChange}
        />
      </FormRow>

      {/* Penalty Members Limit */}
      <FormRow label="Penalty Members Limit" tooltip="Controls how agents with penalties are handled in the queue.">
        <select
          name="penaltyMembersLimit"
          value={formData.penaltyMembersLimit} // Use formData directly
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {penaltyMembersLimitOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>
    </div>
  );
});

export default CapacityOptionsTab;
