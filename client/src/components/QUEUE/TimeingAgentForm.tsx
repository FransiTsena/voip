import React, { useCallback } from 'react'; // Removed useState, useEffect as it's now a controlled component

// Define the shape of the form data for this specific tab
interface TimingAgentFormData {
  maxWaitTime: string;
  maxWaitTimeMode: 'Strict' | 'Loose';
  agentTimeout: string;
  agentTimeoutRestart: 'Yes' | 'No';
  retry: string;
  wrapUpTime: string;
  memberDelay: string;
  agentAnnouncement: string;
  reportHoldTime: 'Yes' | 'No';
  autoPause: 'Yes' | 'No' | 'Yes in this queue only' | 'Yes in all queues';
  autoPauseOnBusy: 'Yes' | 'No';
  autoPauseOnUnavailable: 'Yes' | 'No';
  autoPauseDelay: number;
}

// Props for the TimingAgentOptionsTab component
// Updated to match the props passed from QueueForm.tsx
interface TimingAgentOptionsTabProps {
  formData: TimingAgentFormData;
  handleChange: (name: string, value: any) => void;
}

// Dummy data for select options (replace with actual API calls if needed)
const maxWaitTimeOptions = [
  { value: 'Unlimited', label: 'Unlimited' },
  { value: '10', label: '10 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '120', label: '2 minutes' },
  { value: '300', label: '5 minutes' },
];

const agentTimeoutOptions = [
  { value: '15', label: '15 seconds' },
  { value: '20', label: '20 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
];

const retryOptions = [
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
  { value: '15', label: '15 seconds' },
];

const wrapUpTimeOptions = [
  { value: '0', label: '0 seconds' },
  { value: '5', label: '5 seconds' },
  { value: '10', label: '10 seconds' },
  { value: '15', label: '15 seconds' },
];

const memberDelayOptions = [
  { value: '0', label: '0 seconds' },
  { value: '1', label: '1 second' },
  { value: '2', label: '2 seconds' },
  { value: '3', label: '3 seconds' },
];

const agentAnnouncementOptions = [
  { value: 'None', label: 'None' },
  { value: 'announcement1', label: 'Announcement 1' },
  { value: 'announcement2', label: 'Announcement 2' },
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

// Reusable button group for Yes/No
const YesNoButtonGroup: React.FC<{ value: 'Yes' | 'No'; onChange: (value: 'Yes' | 'No') => void }> = React.memo(({ value, onChange }) => (
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
      onClick={() => onChange('No')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'No' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      No
    </button>
  </div>
));

// Button group for Strict/Loose
const StrictLooseButtonGroup: React.FC<{ value: 'Strict' | 'Loose'; onChange: (value: 'Strict' | 'Loose') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex rounded-md shadow-sm -space-x-px">
    <button
      type="button"
      onClick={() => onChange('Strict')}
      className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'Strict' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Strict
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

// Button group for Auto Pause
const AutoPauseButtonGroup: React.FC<{ value: 'Yes' | 'No' | 'Yes in this queue only' | 'Yes in all queues'; onChange: (value: 'Yes' | 'No' | 'Yes in this queue only' | 'Yes in all queues') => void }> = React.memo(({ value, onChange }) => (
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
      onClick={() => onChange('No')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'No' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      No
    </button>
    <button
      type="button"
      onClick={() => onChange('Yes in this queue only')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'Yes in this queue only' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Yes in this queue only
    </button>
    <button
      type="button"
      onClick={() => onChange('Yes in all queues')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
          ${value === 'Yes in all queues' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Yes in all queues
    </button>
  </div>
));

// --- End Reusable Form Components ---


const TimingAgentOptionsTab: React.FC<TimingAgentOptionsTabProps> = ({ formData, handleChange }) => {

  // No internal state needed here, as formData and handleChange are passed directly from parent
  // useEffect to notify parent is also not needed as parent's handleChange is directly used

  // Memoized handlers for button groups
  const handleMaxWaitTimeModeChange = useCallback((value: 'Strict' | 'Loose') => {
    handleChange('maxWaitTimeMode', value);
  }, [handleChange]);

  const handleAgentTimeoutRestartChange = useCallback((value: 'Yes' | 'No') => {
    handleChange('agentTimeoutRestart', value);
  }, [handleChange]);

  const handleReportHoldTimeChange = useCallback((value: 'Yes' | 'No') => {
    handleChange('reportHoldTime', value);
  }, [handleChange]);

  const handleAutoPauseChange = useCallback((value: 'Yes' | 'No' | 'Yes in this queue only' | 'Yes in all queues') => {
    handleChange('autoPause', value);
  }, [handleChange]);

  const handleAutoPauseOnBusyChange = useCallback((value: 'Yes' | 'No') => {
    handleChange('autoPauseOnBusy', value);
  }, [handleChange]);

  const handleAutoPauseOnUnavailableChange = useCallback((value: 'Yes' | 'No') => {
    handleChange('autoPauseOnUnavailable', value);
  }, [handleChange]);


  return (
    <div className="p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Timing & Agent Options Settings</h3>

      {/* Max Wait Time */}
      <FormRow label="Max Wait Time" tooltip="The maximum time (in seconds) a caller will wait in the queue before being sent to the failover destination.">
        <select
          name="maxWaitTime"
          value={formData.maxWaitTime}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {maxWaitTimeOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Max Wait Time Mode */}
      <FormRow label="Max Wait Time Mode" tooltip="Determines how the Max Wait Time is enforced.">
        <StrictLooseButtonGroup
          value={formData.maxWaitTimeMode}
          onChange={handleMaxWaitTimeModeChange}
        />
      </FormRow>

      {/* Agent Timeout */}
      <FormRow label="Agent Timeout" tooltip="The maximum time (in seconds) an agent's phone will ring before the call is sent to the next agent or queue.">
        <select
          name="agentTimeout"
          value={formData.agentTimeout}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {agentTimeoutOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Agent Timeout Restart */}
      <FormRow label="Agent Timeout Restart" tooltip="If set to Yes, the agent timeout timer will restart when a new agent is tried.">
        <YesNoButtonGroup
          value={formData.agentTimeoutRestart}
          onChange={handleAgentTimeoutRestartChange}
        />
      </FormRow>

      {/* Retry */}
      <FormRow label="Retry" tooltip="The time (in seconds) to wait before retrying agents after a failed attempt.">
        <select
          name="retry"
          value={formData.retry}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {retryOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Wrap-Up Time */}
      <FormRow label="Wrap-Up Time" tooltip="The time (in seconds) an agent remains unavailable after a call before receiving another.">
        <select
          name="wrapUpTime"
          value={formData.wrapUpTime}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {wrapUpTimeOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Member Delay */}
      <FormRow label="Member Delay" tooltip="The time (in seconds) to wait before sending a call to an agent after they become available.">
        <select
          name="memberDelay"
          value={formData.memberDelay}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {memberDelayOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Agent Announcement */}
      <FormRow label="Agent Announcement" tooltip="An announcement played to the agent before connecting the call.">
        <select
          name="agentAnnouncement"
          value={formData.agentAnnouncement}
          onChange={e => handleChange(e.target.name, e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {agentAnnouncementOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Report Hold Time */}
      <FormRow label="Report Hold Time" tooltip="If set to Yes, agents will hear the caller's hold time before connecting.">
        <YesNoButtonGroup
          value={formData.reportHoldTime}
          onChange={handleReportHoldTimeChange}
        />
      </FormRow>

      {/* Auto Pause */}
      <FormRow label="Auto Pause" tooltip="Automatically pause agents after they complete a call.">
        <AutoPauseButtonGroup
          value={formData.autoPause}
          onChange={handleAutoPauseChange}
        />
      </FormRow>

      {/* Auto Pause on Busy */}
      <FormRow label="Auto Pause on Busy" tooltip="Automatically pause agents if their phone is busy.">
        <YesNoButtonGroup
          value={formData.autoPauseOnBusy}
          onChange={handleAutoPauseOnBusyChange}
        />
      </FormRow>

      {/* Auto Pause on Unavailable */}
      <FormRow label="Auto Pause on Unavailable" tooltip="Automatically pause agents if their phone is unavailable.">
        <YesNoButtonGroup
          value={formData.autoPauseOnUnavailable}
          onChange={handleAutoPauseOnUnavailableChange}
        />
      </FormRow>

      {/* Auto Pause Delay */}
      <FormRow label="Auto Pause Delay" tooltip="The delay (in seconds) before automatically pausing an agent.">
        <input
          type="number"
          name="autoPauseDelay"
          value={formData.autoPauseDelay}
          onChange={e => handleChange(e.target.name, Number(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          min="0"
        />
      </FormRow>
    </div>
  );
};

export default TimingAgentOptionsTab;
