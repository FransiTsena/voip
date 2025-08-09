import React from 'react';
import {
  QueueFormData,
  announcementOptions,
  alertInfoOptions,
  ringerVolumeOverrideOptions,
  ringStrategyOptions,
  musicOnHoldOptions,
  joinAnnouncementOptions,
  failOverDestinationOptions
} from '../../types/queueTypes'; // Adjust path as necessary

// Reusable component for form rows (copied from QueueForm.tsx for self-containment)
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

// Reusable button group for Yes/No (copied from QueueForm.tsx)
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

// Reusable button group for Ringer Volume Override Mode (copied from QueueForm.tsx)
const RingerVolumeOverrideModeButtonGroup: React.FC<{ value: 'Force' | 'Don\'t Care' | 'No'; onChange: (value: 'Force' | 'Don\'t Care' | 'No') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex rounded-md shadow-sm -space-x-px">
    <button
      type="button"
      onClick={() => onChange('Force')}
      className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'Force' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Force
    </button>
    <button
      type="button"
      onClick={() => onChange('Don\'t Care')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'Don\'t Care' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Don't Care
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

// Reusable button group for Agent Restrictions (copied from QueueForm.tsx)
const AgentRestrictionsButtonGroup: React.FC<{ value: 'Call as Dialed' | 'No Follow-Me or Call Forward' | 'Extensions Only'; onChange: (value: 'Call as Dialed' | 'No Follow-Me or Call Forward' | 'Extensions Only') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex rounded-md shadow-sm -space-x-px">
    <button
      type="button"
      onClick={() => onChange('Call as Dialed')}
      className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'Call as Dialed' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Call as Dialed
    </button>
    <button
      type="button"
      onClick={() => onChange('No Follow-Me or Call Forward')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'No Follow-Me or Call Forward' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      No Follow-Me or Call Forward
    </button>
    <button
      type="button"
      onClick={() => onChange('Extensions Only')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'Extensions Only' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Extensions Only
    </button>
  </div>
));

// Reusable button group for Skip Busy Agents (copied from QueueForm.tsx)
const SkipBusyAgentsButtonGroup: React.FC<{ value: 'Yes' | 'No' | 'Yes + (ringinuse=no)' | 'Queue calls only (ringinuse=no)'; onChange: (value: 'Yes' | 'No' | 'Yes + (ringinuse=no)' | 'Queue calls only (ringinuse=no)') => void }> = React.memo(({ value, onChange }) => (
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
      onClick={() => onChange('Yes + (ringinuse=no)')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'Yes + (ringinuse=no)' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Yes + (ringinuse=no)
    </button>
    <button
      type="button"
      onClick={() => onChange('Queue calls only (ringinuse=no)')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'Queue calls only (ringinuse=no)' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Queue calls only (ringinuse=no)
    </button>
  </div>
));

// Reusable button group for Call Recording (copied from QueueForm.tsx)
const CallRecordingButtonGroup: React.FC<{ value: 'force' | 'yes' | 'dontcare' | 'no' | 'never'; onChange: (value: 'force' | 'yes' | 'dontcare' | 'no' | 'never') => void }> = React.memo(({ value, onChange }) => (
  <div className="inline-flex rounded-md shadow-sm -space-x-px">
    <button
      type="button"
      onClick={() => onChange('force')}
      className={`px-4 py-2 text-sm font-medium rounded-l-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'force' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Force
    </button>
    <button
      type="button"
      onClick={() => onChange('yes')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'yes' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Yes
    </button>
    <button
      type="button"
      onClick={() => onChange('dontcare')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'dontcare' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Don't Care
    </button>
    <button
      type="button"
      onClick={() => onChange('no')}
      className={`px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'no' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      No
    </button>
    <button
      type="button"
      onClick={() => onChange('never')}
      className={`px-4 py-2 text-sm font-medium rounded-r-md focus:z-10 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200
        ${value === 'never' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
    >
      Never
    </button>
  </div>
));


// Props interface for GeneralSettings
interface GeneralSettingsProps {
  formData: QueueFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleQueueNoAnswerChange: (value: 'Yes' | 'No') => void;
  handleCallConfirmChange: (value: 'Yes' | 'No') => void;
  handleWaitTimePrefixChange: (value: 'Yes' | 'No') => void;
  handleRingerVolumeOverrideModeChange: (value: 'Force' | 'Don\'t Care' | 'No') => void;
  handleRestrictDynamicAgentsChange: (value: 'Yes' | 'No') => void;
  handleAgentRestrictionsChange: (value: 'Call as Dialed' | 'No Follow-Me or Call Forward' | 'Extensions Only') => void;
  handleAutofillChange: (value: 'Yes' | 'No') => void;
  handleSkipBusyAgentsChange: (value: 'Yes' | 'No' | 'Yes + (ringinuse=no)' | 'Queue calls only (ringinuse=no)') => void;
  handleCallRecordingChange: (value: 'force' | 'yes' | 'dontcare' | 'no' | 'never') => void;
  handleMarkCallsAnsweredElsewhereChange: (value: 'Yes' | 'No') => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = React.memo((
  {
    formData,
    handleChange,
    handleQueueNoAnswerChange,
    handleCallConfirmChange,
    handleWaitTimePrefixChange,
    handleRingerVolumeOverrideModeChange,
    handleRestrictDynamicAgentsChange,
    handleAgentRestrictionsChange,
    handleAutofillChange,
    handleSkipBusyAgentsChange,
    handleCallRecordingChange,
    handleMarkCallsAnsweredElsewhereChange,
  }) => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">General Settings</h2>

      {/* Queue Number */}
      <FormRow label="Queue Number" tooltip="The number that callers will dial to reach this queue.">
        <input
          type="text"
          name="queueNumber"
          value={formData.queueNumber}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 1111"
          required
        />
      </FormRow>

      {/* Queue Name */}
      <FormRow label="Queue Name" tooltip="A descriptive name for this queue.">
        <input
          type="text"
          name="queueName"
          value={formData.queueName}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., Sales Queue"
          required
        />
      </FormRow>

      {/* Queue No Answer */}
      <FormRow label="Queue No Answer" tooltip="If set to Yes, callers will hear the 'No Answer' announcement if no agent answers.">
        <YesNoButtonGroup
          value={formData.queueNoAnswer}
          onChange={handleQueueNoAnswerChange}
        />
      </FormRow>

      {/* Call Confirm */}
      <FormRow label="Call Confirm" tooltip="If set to Yes, agents will be prompted to confirm the call before being connected.">
        <YesNoButtonGroup
          value={formData.callConfirm}
          onChange={handleCallConfirmChange}
        />
      </FormRow>

      {/* Call Confirm Announce */}
      <FormRow label="Call Confirm Announce" tooltip="The announcement played to the agent for call confirmation.">
        <select
          name="callConfirmAnnounce"
          value={formData.callConfirmAnnounce}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {announcementOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* CID Name Prefix */}
      <FormRow label="CID Name Prefix" tooltip="A prefix to add to the caller ID name for calls coming from this queue.">
        <input
          type="text"
          name="cidNamePrefix"
          value={formData.cidNamePrefix}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., [Queue] "
        />
      </FormRow>

      {/* Wait Time Prefix */}
      <FormRow label="Wait Time Prefix" tooltip="If set to Yes, the caller will hear their estimated wait time.">
        <YesNoButtonGroup
          value={formData.waitTimePrefix}
          onChange={handleWaitTimePrefixChange}
        />
      </FormRow>

      {/* Alert Info */}
      <FormRow label="Alert Info" tooltip="Custom alert information sent to the agent's phone.">
        <select
          name="alertInfo"
          value={formData.alertInfo}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {alertInfoOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Ringer Volume Override */}
      <FormRow label="Ringer Volume Override" tooltip="Override the agent's phone ringer volume for queue calls.">
        <select
          name="ringerVolumeOverride"
          value={formData.ringerVolumeOverride}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {ringerVolumeOverrideOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Ringer Volume Override Mode */}
      <FormRow label="Ringer Volume Override Mode" tooltip="How the ringer volume override should be applied.">
        <RingerVolumeOverrideModeButtonGroup
          value={formData.ringerVolumeOverrideMode}
          onChange={handleRingerVolumeOverrideModeChange}
        />
      </FormRow>

      {/* Restrict Dynamic Agents */}
      <FormRow label="Restrict Dynamic Agents" tooltip="If set to Yes, dynamic agents cannot log in or out of this queue.">
        <YesNoButtonGroup
          value={formData.restrictDynamicAgents}
          onChange={handleRestrictDynamicAgentsChange}
        />
      </FormRow>

      {/* Agent Restrictions */}
      <FormRow label="Agent Restrictions" tooltip="Rules for how agents can receive calls from this queue.">
        <AgentRestrictionsButtonGroup
          value={formData.agentRestrictions}
          onChange={handleAgentRestrictionsChange}
        />
      </FormRow>

      {/* Ring Strategy */}
      <FormRow label="Ring Strategy" tooltip="Determines how calls are distributed among agents in the queue.">
        <select
          name="ringStrategy"
          value={formData.ringStrategy}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {ringStrategyOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Autofill */}
      <FormRow label="Autofill" tooltip="If set to Yes, agents will automatically receive the next call after finishing one.">
        <YesNoButtonGroup
          value={formData.autofill}
          onChange={handleAutofillChange}
        />
      </FormRow>

      {/* Skip Busy Agents */}
      <FormRow label="Skip Busy Agents" tooltip="Defines when to skip agents who are currently busy.">
        <SkipBusyAgentsButtonGroup
          value={formData.skipBusyAgents}
          onChange={handleSkipBusyAgentsChange}
        />
      </FormRow>

      {/* Queue Weight */}
      <FormRow label="Queue Weight" tooltip="Higher weight means this queue has higher priority.">
        <input
          type="number"
          name="queueWeight"
          value={formData.queueWeight}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        />
      </FormRow>

      {/* Music On Hold Class */}
      <FormRow label="Music On Hold Class" tooltip="The Music On Hold class played to callers waiting in the queue.">
        <select
          name="musicOnHoldClass"
          value={formData.musicOnHoldClass}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {musicOnHoldOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Join Announcement */}
      <FormRow label="Join Announcement" tooltip="An announcement played to the caller when they join the queue.">
        <select
          name="joinAnnouncement"
          value={formData.joinAnnouncement}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {joinAnnouncementOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>

      {/* Call Recording */}
      <FormRow label="Call Recording" tooltip="Control call recording for calls in this queue.">
        <CallRecordingButtonGroup
          value={formData.callRecording}
          onChange={handleCallRecordingChange}
        />
      </FormRow>

      {/* Mark Calls Answered Elsewhere */}
      <FormRow label="Mark Calls Answered Elsewhere" tooltip="If set to Yes, calls answered outside the queue will be marked as answered.">
        <YesNoButtonGroup
          value={formData.markCallsAnsweredElsewhere}
          onChange={handleMarkCallsAnsweredElsewhereChange}
        />
      </FormRow>

      {/* Fail Over Destination */}
      <FormRow label="Fail Over Destination" tooltip="Where to send calls if no agents are available or max wait time is reached.">
        <select
          name="failOverDestination"
          value={formData.failOverDestination}
          onChange={handleChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
        >
          {failOverDestinationOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </FormRow>
    </div>
  );
});

export default GeneralSettings;
