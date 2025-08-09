// types/queue.ts

// Interface for the main Queue form data (General Settings)
export interface QueueFormData {
  queueNumber: string;
  queueName: string;
  queueNoAnswer: 'Yes' | 'No';
  callConfirm: 'Yes' | 'No';
  callConfirmAnnounce: string;
  cidNamePrefix: string;
  waitTimePrefix: 'Yes' | 'No';
  alertInfo: string;
  ringerVolumeOverride: string;
  ringerVolumeOverrideMode: 'Force' | 'Don\'t Care' | 'No';
  restrictDynamicAgents: 'Yes' | 'No';
  agentRestrictions: 'Call as Dialed' | 'No Follow-Me or Call Forward' | 'Extensions Only';
  ringStrategy: string;
  autofill: 'Yes' | 'No';
  skipBusyAgents: 'Yes' | 'No' | 'Yes + (ringinuse=no)' | 'Queue calls only (ringinuse=no)';
  queueWeight: number;
  musicOnHoldClass: string;
  joinAnnouncement: string;
  callRecording: 'force' | 'yes' | 'dontcare' | 'no' | 'never';
  markCallsAnsweredElsewhere: 'Yes' | 'No';
  failOverDestination: string;
}

// Interface for Agent data within a queue
export interface Agent {
  id: string;
  name: string;
  extension: string;
}

// Interface for Timing & Agent Options tab data
export interface TimingAgentFormData {
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

// Interface for Capacity Options tab data
export interface CapacityFormData {
  maxCallers: number;
  joinEmpty: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose';
  leaveEmpty: 'Yes' | 'Strict' | 'Ultra Strict' | 'No' | 'Loose';
  penaltyMembersLimit: string;
}

// Options for various select fields

export const announcementOptions = [
  { value: 'Default', label: 'Default' },
  { value: 'Custom1', label: 'Custom Announcement 1' },
  { value: 'Custom2', label: 'Custom Announcement 2' },
];

export const alertInfoOptions = [
  { value: 'None', label: 'None' },
  { value: 'Alert1', label: 'Alert Info 1' },
  { value: 'Alert2', label: 'Alert Info 2' },
];

export const ringerVolumeOverrideOptions = [
  { value: '', label: 'Default' }, // Empty string for no override
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
];

export const ringStrategyOptions = [
  { value: 'ringall', label: 'ringall (ring all available agents)' },
  { value: 'leastrecent', label: 'leastrecent (ring agent who was least recently called)' },
  { value: 'fewestcalls', label: 'fewestcalls (ring agent with fewest completed calls)' },
  { value: 'random', label: 'random (ring random agent)' },
  { value: 'rrmemory', label: 'rrmemory (round robin with memory)' },
  { value: 'rrordered', label: 'rrordered (round robin in order)' },
  { value: 'linear', label: 'linear (ring agents in order)' },
  { value: 'wrandom', label: 'wrandom (weighted random)' },
];

export const musicOnHoldOptions = [
  { value: 'inherit', label: 'Inherit' },
  { value: 'moh1', label: 'MoH Only' },
  { value: 'moh2', label: 'Agent Ringing' },
  { value: 'moh3', label: 'Ring Only' },
];

export const joinAnnouncementOptions = [
  { value: 'None', label: 'None' },
  { value: 'welcomeRecordings', label: 'welcome Recordings' },
  { value: 'customJoin', label: 'Custom Join Announcement' },
];

export const failOverDestinationOptions = [
  { value: '', label: 'None' },
  { value: 'playRecordings', label: 'Play Recordings' },
  { value: 'extension', label: 'Extension' },
  { value: 'voicemail', label: 'Voicemail' },
  { value: 'ivr', label: 'IVR Menu' },
];
