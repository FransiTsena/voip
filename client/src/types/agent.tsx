// src/types/agent.ts

// Optimized AgentFormData interface
export interface AgentFormData {
  _id?: string; // MongoDB _id, present for existing agents
  userExtension: string;
  displayName: string;
  outboundCID: string;
  emergencyCID: string;
  secret: string;
  accountcode: string;

  // --- Advanced Tab Fields (directly from your provided code) ---
  customContext: string;
  dtmfSignaling: string;
  defaultUser: string;
  trustRPID: boolean;
  sendConnectedLine: boolean;
  userEqualsPhone: boolean;
  sendRPID: string;
  qualifyFrequency: number;
  transport: string;
  enableAVPF: boolean;
  enableICESupport: boolean;
  enableRtcpMux: boolean;
  callGroups: string;
  pickupGroups: string;
  disallowedCodecs: string;
  allowedCodecs: string;
  dial: string;
  mailbox: string;
  voicemailExtension: string;
  maxContacts: number;
  removeExisting: boolean;
  mediaUseReceivedTransport: boolean;
  rtpSymmetric: boolean;
  rewriteContact: boolean;
  forceRport: boolean;
  mwiSubscriptionType: string;
  aggregateMWI: boolean;
  enableWebRTCDefaults: boolean;
  maxAudioStreams: number;
  maxVideoStreams: number;
  mediaEncryption: string;
  sessionTimers: string;
  timerExpirationPeriod: number;
  directMedia: boolean;
  mediaAddress: string;
  allowNonEncryptedMedia: boolean;
  referBlindProgress: boolean;
  deviceStateBusyAt: number;
  matchPermit: string;
  maximumExpiration: number;
  minimumExpiration: number;
  rtpTimeout: number;
  rtpHoldTimeout: number;
  outboundProxy: string;
  outboundAuth: boolean;
  messagesContext: string;
  cidNumAlias: string;
  sipAlias: string;

  // Extension Options
  asteriskDialOptions: string;
  ringTime: string;
  extensionRingerVolumeOverride: string;
  callForwardingTime: string;
  outboundConcurrencyLimit: number;
  callWaiting: boolean;
  callWaitingTone: boolean;
  callScreening: string;
  internalAutoAnswer: string;
  intercomMode: boolean;
  queueStateDetection: string;

  // Recording Options
  inboundExternalCalls: string;
  outboundExternalCalls: string;
  inboundInternalCalls: string;
  outboundInternalCalls: string;
  onDemandRecording: string;
  recordPriorityPolicy: number;

  // Dictation Services
  dictationService: string;
  dictationFormat: string;
  dictationEmailAddress: string;
  dictationFromAddress: string;

  // Default Group Inclusion
  defaultDirectory: string;

  // DTLS
  enableDTLS: boolean;
  autoGenerateCertificate: boolean;
  useCertificate: string;
  dtlsVerify: string;
  dtlsSetup: string;
  dtlsRekeyInterval: number;

  // Optional Destinations
  noAnswerDestination: string;
  noAnswerCIDPrefix: string;
  busyDestination: string;
  busyCIDPrefix: string;
  notReachableDestination: string;
  notReachableCIDPrefix: string;

  // --- Voicemail Tab Fields (corrected types to boolean and made optional) ---
  voicemailEnabled: boolean;
  voicemailPassword?: string;
  voicemailEmail?: string;
  playInstructions?: boolean; // Corrected from string to boolean
  playUnavailableMessage?: boolean; // Corrected from string to boolean
  playBusyMessage?: boolean; // Corrected from string to boolean
  emailAttachment?: boolean; // Corrected from string to boolean
  emailDeleteVoicemail?: boolean; // Corrected from string to boolean
  voicemailLanguage?: string;
  voicemailTimeZone?: string;

  // --- Find Me/Follow Me Tab Fields (kept as they are used in the frontend) ---
  findMeFollowMeEnabled?: boolean;
  initialRingTime?: number;
  ringStrategy?: string;
  followMeNumbers?: { number: string; delay: number }[]; // Assuming this structure
  destinationIfNoAnswer?: string;

  // --- Pin Sets Tab Fields (kept as they are used in the frontend) ---
  pinSetEnabled?: boolean;
  pinNumber?: string;
}



export const initialAgentFormData: AgentFormData = {
  userExtension: '',
  displayName: '',
  outboundCID: '',
  emergencyCID: '',
  secret: '',
  accountcode: '',

  // Advanced Tab Defaults
  customContext: 'ALLOW ALL (Default)',
  dtmfSignaling: 'RFC 4733',
  defaultUser: '',
  trustRPID: true,
  sendConnectedLine: true,
  userEqualsPhone: false,
  sendRPID: 'Send P-Asserted-Identity header',
  qualifyFrequency: 60,
  transport: '0.0.0.0-ws',
  enableAVPF: false,
  enableICESupport: false,
  enableRtcpMux: false,
  callGroups: '',
  pickupGroups: '',
  disallowedCodecs: '',
  allowedCodecs: '',
  dial: '',
  mailbox: '',
  voicemailExtension: '',
  maxContacts: 1,
  removeExisting: true,
  mediaUseReceivedTransport: false,
  rtpSymmetric: true,
  rewriteContact: true,
  forceRport: true,
  mwiSubscriptionType: 'Auto',
  aggregateMWI: true,
  enableWebRTCDefaults: true,
  maxAudioStreams: 1,
  maxVideoStreams: 1,
  mediaEncryption: 'None',
  sessionTimers: 'Yes',
  timerExpirationPeriod: 90,
  directMedia: true,
  mediaAddress: '',
  allowNonEncryptedMedia: false,
  referBlindProgress: true,
  deviceStateBusyAt: 0,
  matchPermit: '',
  maximumExpiration: 7200,
  minimumExpiration: 60,
  rtpTimeout: 0,
  rtpHoldTimeout: 0,
  outboundProxy: '',
  outboundAuth: false,
  messagesContext: '',
  cidNumAlias: '',
  sipAlias: '',

  // Extension Options Defaults
  asteriskDialOptions: 'HhTtr',
  ringTime: 'Default',
  extensionRingerVolumeOverride: 'None',
  callForwardingTime: 'Default',
  outboundConcurrencyLimit: 3,
  callWaiting: true,
  callWaitingTone: true,
  callScreening: 'Disable',
  internalAutoAnswer: 'Disable',
  intercomMode: true,
  queueStateDetection: 'Use State',

  // Recording Options Defaults
  inboundExternalCalls: 'Don\'t Care',
  outboundExternalCalls: 'Don\'t Care',
  inboundInternalCalls: 'Don\'t Care',
  outboundInternalCalls: 'Don\'t Care',
  onDemandRecording: 'Disable',
  recordPriorityPolicy: 10,

  // Dictation Services Defaults
  dictationService: 'Disabled',
  dictationFormat: 'Ogg Vorbis',
  dictationEmailAddress: 'dictate@freepbx.org',
  dictationFromAddress: 'dictate@freepbx.org',

  // Default Group Inclusion Defaults
  defaultDirectory: 'Include',

  // DTLS Defaults
  enableDTLS: false,
  autoGenerateCertificate: false,
  useCertificate: 'default',
  dtlsVerify: 'Fingerprint',
  dtlsSetup: 'Act/Pass',
  dtlsRekeyInterval: 0,

  // Optional Destinations Defaults
  noAnswerDestination: 'Unavail Voicemail if Enabled',
  noAnswerCIDPrefix: '',
  busyDestination: 'Busy Voicemail if Enabled',
  busyCIDPrefix: '',
  notReachableDestination: 'Unavail Voicemail if Enabled',
  notReachableCIDPrefix: '',

  // Voicemail Tab defaults (ensure these match your VoicemailSetting component's expectations)
  voicemailEnabled: false,
  voicemailPassword: '',
  playInstructions: false,
  playUnavailableMessage: false,
  playBusyMessage: false,
  emailAttachment: false,
  emailDeleteVoicemail: false,
  voicemailLanguage: 'en',
  voicemailTimeZone: 'America/New_York',
  // Find Me/Follow Me Tab defaults (ensure these match your FindMeFollowMeSetting component's expectations)
  findMeFollowMeEnabled: false,
  initialRingTime: 20,
  ringStrategy: 'ringall',
  followMeNumbers: [], // Initialize as empty array
  destinationIfNoAnswer: 'Voicemail',

  // Pin Sets Tab defaults (ensure these match your PinSetsSettings component's expectations)
  pinSetEnabled: false,
  pinNumber: '',
  // Add any other specific fields that belong in the "Other" tab with their defaults
};