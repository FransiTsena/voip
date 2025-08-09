import React, { useState, useCallback } from 'react';
import { AgentFormData } from '../../types/agent';

// Props interface for AdvancedSettings
interface AdvancedSettingsProps {
  formData: AgentFormData;
  // Changed handleChange to accept name and value directly
  handleChange: (name: string, value: any) => void;
  FormRow: React.FC<{ label: string; tooltip?: string; children: React.ReactNode }>;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = React.memo(({ formData, handleChange, FormRow }) => {

  // State to manage expanded/collapsed sections
  const [expandedSections, setExpandedSections] = useState({
    editExtension: true,
    sipSettings: true,
    extensionOptions: true,
    recordingOptions: true,
    dictationServices: true,
    defaultGroupInclusion: true,
    dtls: true,
    optionalDestinations: true,
  });

  // Function to toggle section visibility
  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  // --- Options for various select/radio fields ---

  const dtmfSignalingOptions = [
    { value: 'RFC 4733', label: 'RFC 4733' },
    { value: 'inband', label: 'Inband' },
    { value: 'auto', label: 'Auto' },
  ];

  const sendRPIDOptions = [
    { value: 'Send P-Asserted-Identity header', label: 'Send P-Asserted-Identity header' },
    { value: 'Send Remote-Party-ID header', label: 'Send Remote-Party-ID header' },
    { value: 'No', label: 'No' },
  ];

  const transportOptions = [
    { value: '0.0.0.0-ws', label: '0.0.0.0-ws (WebSocket)' },
    { value: '0.0.0.0-udp', label: '0.0.0.0-udp (UDP)' },
    { value: '0.0.0.0-tcp', label: '0.0.0.0-tcp (TCP)' },
    { value: '0.0.0.0-wss', label: '0.0.0.0-wss (Secure WebSocket)' },
  ];

  const codecsOptions = [ // Assuming common codecs for now, adjust as needed
    { value: 'ulaw', label: 'ulaw' },
    { value: 'alaw', label: 'alaw' },
    { value: 'gsm', label: 'gsm' },
    { value: 'g729', label: 'g729' },
  ];

  const mediaEncryptionOptions = [
    { value: 'None', label: 'None' },
    { value: 'SRTP', label: 'SRTP' },
    { value: 'DTLS_SRTP', label: 'DTLS_SRTP' },
  ];

  const sessionTimersOptions = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ];

  const ringerVolumeOptions = [
    { value: 'None', label: 'None' },
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
  ];

  const callScreeningOptions = [
    { value: 'Disable', label: 'Disable' },
    { value: 'Enable', label: 'Enable' },
  ];

  const internalAutoAnswerOptions = [
    { value: 'Disable', label: 'Disable' },
    { value: 'Intercom', label: 'Intercom' },
  ];

  const queueStateDetectionOptions = [
    { value: 'Use State', label: 'Use State' },
    { value: 'No State', label: 'No State' },
  ];

  const recordingOptions = [
    { value: 'Force', label: 'Force' },
    { value: 'Yes', label: 'Yes' },
    { value: 'Don\'t Care', label: 'Don\'t Care' },
    { value: 'Never', label: 'Never' },
  ];

  const onDemandRecordingOptions = [
    { value: 'Disable', label: 'Disable' },
    { value: 'Enable', label: 'Enable' },
    { value: 'Override', label: 'Override' },
  ];

  const dictationServiceOptions = [
    { value: 'Disabled', label: 'Disabled' },
    { value: 'Enabled', label: 'Enabled' },
  ];

  const dictationFormatOptions = [
    { value: 'Ogg Vorbis', label: 'Ogg Vorbis' },
    { value: 'WAV', label: 'WAV' },
    { value: 'MP3', label: 'MP3' },
  ];

  const defaultDirectoryOptions = [
    { value: 'Include', label: 'Include' },
    { value: 'Exclude', label: 'Exclude' },
  ];

  const useCertificateOptions = [
    { value: 'default', label: 'default' },
    { value: 'custom_cert_1', label: 'Custom Certificate 1' },
  ];

  const dtlsVerifyOptions = [
    { value: 'Fingerprint', label: 'Fingerprint' },
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
  ];

  const dtlsSetupOptions = [
    { value: 'Act/Pass', label: 'Act/Pass' },
    { value: 'Active', label: 'Active' },
    { value: 'Passive', label: 'Passive' },
  ];

  // Helper for toggle buttons (radio style with boolean value)
  const renderBooleanToggle = (name: keyof AgentFormData, currentVal: boolean, labelTrue: string = 'Enable', labelFalse: string = 'Disable') => (
    <div className="flex space-x-2 text-xs">
      <label className="inline-flex items-center">
        <input
          type="radio"
          name={name}
          value="true"
          checked={currentVal === true}
          onChange={() => handleChange(name, true)} // Directly pass name and value
          className="form-radio h-3 w-3" // Smaller radio buttons
        />
        <span className="ml-1">{labelTrue}</span>
      </label>
      <label className="inline-flex items-center">
        <input
          type="radio"
          name={name}
          value="false"
          checked={currentVal === false}
          onChange={() => handleChange(name, false)} // Directly pass name and value
          className="form-radio h-3 w-3" // Smaller radio buttons
        />
        <span className="ml-1">{labelFalse}</span>
      </label>
    </div>
  );


  return (
    <div className="p-6">
      <p className="text-gray-600 mb-6">Configure advanced options for this extension.</p>

      {/* Edit Extension */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 mb-4 focus:outline-none"
          onClick={() => toggleSection('editExtension')}
        >
          <h4>Edit Extension</h4>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transform transition-transform duration-200 ${expandedSections.editExtension ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.editExtension && (
          <>
            <FormRow label="Custom Context" tooltip="Define a custom context for this extension.">
              <input
                type="text"
                name="customContext"
                value={formData.customContext}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed text-sm" // Adjusted size
                readOnly // Based on "ALLOW ALL (Default)" which looks like a read-only field
              />
            </FormRow>
          </>
        )}
      </div>

      {/* Add Extension (SIP Settings / Device Options) */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 mb-4 focus:outline-none"
          onClick={() => toggleSection('sipSettings')}
        >
          <h4>Add Extension</h4> {/* Section title from the screenshot */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transform transition-transform duration-200 ${expandedSections.sipSettings ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.sipSettings && (
          <>
            <FormRow label="DTMF Signaling" tooltip="Method for DTMF signaling.">
              <select
                name="dtmfSignaling"
                value={formData.dtmfSignaling}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              >
                {dtmfSignalingOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Default User" tooltip="Default user for authentication.">
              <input
                type="text"
                name="defaultUser"
                value={formData.defaultUser}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Trust RPID" tooltip="Trust Remote-Party-ID header.">
              {renderBooleanToggle('trustRPID', formData.trustRPID, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Send Connected Line" tooltip="Send Connected Line information.">
              {renderBooleanToggle('sendConnectedLine', formData.sendConnectedLine, 'Yes', 'No')}
            </FormRow>
            <FormRow label="User = Phone" tooltip="Set user to phone.">
              {renderBooleanToggle('userEqualsPhone', formData.userEqualsPhone, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Send RPID" tooltip="Method for sending Remote-Party-ID.">
              <select
                name="sendRPID"
                value={formData.sendRPID}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              >
                {sendRPIDOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Qualify Frequency" tooltip="Frequency in seconds to send SIP OPTIONS keepalives.">
              <input
                type="number"
                name="qualifyFrequency"
                value={formData.qualifyFrequency}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Transport" tooltip="SIP transport protocol.">
              <select
                name="transport"
                value={formData.transport}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              >
                {transportOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Enable AVPF" tooltip="Enable Audio/Video Profile with Feedback (AVPF).">
              {renderBooleanToggle('enableAVPF', formData.enableAVPF, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Enable ICE Support" tooltip="Enable Interactive Connectivity Establishment (ICE) support.">
              {renderBooleanToggle('enableICESupport', formData.enableICESupport, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Enable rtcp Mux" tooltip="Enable RTP Control Protocol (RTCP) multiplexing.">
              {renderBooleanToggle('enableRtcpMux', formData.enableRtcpMux, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Call Groups" tooltip="Groups from which this extension can be called.">
              <input
                type="text"
                name="callGroups"
                value={formData.callGroups}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
                placeholder="e.g., 1, 2"
              />
            </FormRow>
            <FormRow label="Pickup Groups" tooltip="Groups whose calls this extension can pick up.">
              <input
                type="text"
                name="pickupGroups"
                value={formData.pickupGroups}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
                placeholder="e.g., 3, 4"
              />
            </FormRow>
            <FormRow label="Disallowed Codecs" tooltip="List of codecs not allowed.">
              <select
                name="disallowedCodecs"
                value={formData.disallowedCodecs}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
                multiple // Assuming multi-select based on typical FreePBX behavior
                size={4}
              >
                {codecsOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Allowed Codecs" tooltip="List of codecs allowed.">
              <select
                name="allowedCodecs"
                value={formData.allowedCodecs}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
                multiple // Assuming multi-select
                size={4}
              >
                {codecsOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Dial" tooltip="Dial string for this extension.">
              <input
                type="text"
                name="dial"
                value={formData.dial}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Mailbox" tooltip="Voicemail mailbox for this extension.">
              <input
                type="text"
                name="mailbox"
                value={formData.mailbox}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Voicemail Extension" tooltip="Specific voicemail extension.">
              <input
                type="text"
                name="voicemailExtension"
                value={formData.voicemailExtension}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Account Code" tooltip="Account code for billing or tracking.">
              <input
                type="text"
                name="accountcode"
                value={formData.accountcode}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Max Contacts" tooltip="Maximum number of simultaneous registrations.">
              <input
                type="number"
                name="maxContacts"
                value={formData.maxContacts}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Remove Existing" tooltip="Remove existing registrations on new registration.">
              {renderBooleanToggle('removeExisting', formData.removeExisting, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Media Use Received Transport" tooltip="Use received transport for media.">
              {renderBooleanToggle('mediaUseReceivedTransport', formData.mediaUseReceivedTransport, 'Yes', 'No')}
            </FormRow>
            <FormRow label="RTP Symmetric" tooltip="Force RTP symmetric behavior.">
              {renderBooleanToggle('rtpSymmetric', formData.rtpSymmetric, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Rewrite Contact" tooltip="Rewrite SIP contact header.">
              {renderBooleanToggle('rewriteContact', formData.rewriteContact, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Force rport" tooltip="Force rport parameter in Via header.">
              {renderBooleanToggle('forceRport', formData.forceRport, 'Yes', 'No')}
            </FormRow>
            <FormRow label="MWI Subscription Type" tooltip="Message Waiting Indicator subscription type.">
              <select
                name="mwiSubscriptionType"
                value={formData.mwiSubscriptionType}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              >
                {transportOptions.map(option => ( // Re-using transport options as they match (Auto/Unsolicited/Solicited)
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Aggregate MWI" tooltip="Aggregate MWI notifications.">
              {renderBooleanToggle('aggregateMWI', formData.aggregateMWI, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Enable WebRTC defaults" tooltip="Enable default settings for WebRTC.">
              {renderBooleanToggle('enableWebRTCDefaults', formData.enableWebRTCDefaults, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Max audio streams" tooltip="Maximum number of audio streams.">
              <input
                type="number"
                name="maxAudioStreams"
                value={formData.maxAudioStreams}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Max video streams" tooltip="Maximum number of video streams.">
              <input
                type="number"
                name="maxVideoStreams"
                value={formData.maxVideoStreams}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Media Encryption" tooltip="Encryption method for media.">
              <select
                name="mediaEncryption"
                value={formData.mediaEncryption}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              >
                {mediaEncryptionOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Session Timers" tooltip="Enable SIP session timers.">
              <select
                name="sessionTimers"
                value={formData.sessionTimers}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              >
                {sessionTimersOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Timer Expiration Period" tooltip="SIP session timer expiration period in seconds.">
              <input
                type="number"
                name="timerExpirationPeriod"
                value={formData.timerExpirationPeriod}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Direct Media" tooltip="Enable direct media path.">
              {renderBooleanToggle('directMedia', formData.directMedia, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Media Address" tooltip="Specific media IP address.">
              <input
                type="text"
                name="mediaAddress"
                value={formData.mediaAddress}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Allow Non-Encrypted Media (Opportunistic SRTP)" tooltip="Allow non-encrypted media if SRTP fails.">
              {renderBooleanToggle('allowNonEncryptedMedia', formData.allowNonEncryptedMedia, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Refer Blind Progress" tooltip="Send SIP REFER with blind transfer progress.">
              {renderBooleanToggle('referBlindProgress', formData.referBlindProgress, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Device State Busy at" tooltip="The number of in-use channels which will cause busy to be returned as device state.">
              <input
                type="number"
                name="deviceStateBusyAt"
                value={formData.deviceStateBusyAt}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Match (Permit)" tooltip="IP addresses or networks to permit SIP registrations/requests.">
              <input
                type="text"
                name="matchPermit"
                value={formData.matchPermit}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
                placeholder="e.g., 0.0.0.0/0"
              />
            </FormRow>
            <FormRow label="Maximum Expiration" tooltip="Maximum registration expiration time in seconds.">
              <input
                type="number"
                name="maximumExpiration"
                value={formData.maximumExpiration}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Minimum Expiration" tooltip="Minimum registration expiration time in seconds.">
              <input
                type="number"
                name="minimumExpiration"
                value={formData.minimumExpiration}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="RTP Timeout" tooltip="RTP inactivity timeout in seconds.">
              <input
                type="number"
                name="rtpTimeout"
                value={formData.rtpTimeout}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="RTP Hold Timeout" tooltip="RTP inactivity timeout while on hold in seconds.">
              <input
                type="number"
                name="rtpHoldTimeout"
                value={formData.rtpHoldTimeout}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Outbound Proxy" tooltip="Outbound proxy for SIP requests.">
              <input
                type="text"
                name="outboundProxy"
                value={formData.outboundProxy}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="Outbound Auth" tooltip="Enable outbound authentication.">
              {renderBooleanToggle('outboundAuth', formData.outboundAuth, 'Yes', 'No')}
            </FormRow>
            <FormRow label="Messages Context" tooltip="Context for SIP MESSAGE requests.">
              <input
                type="text"
                name="messagesContext"
                value={formData.messagesContext}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="CID Num Alias" tooltip="Caller ID number alias.">
              <input
                type="text"
                name="cidNumAlias"
                value={formData.cidNumAlias}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
            <FormRow label="SIP Alias" tooltip="SIP alias for this extension.">
              <input
                type="text"
                name="sipAlias"
                value={formData.sipAlias}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm" // Adjusted size
              />
            </FormRow>
          </>
        )}
      </div>

      {/* Extension Options */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 mb-4 focus:outline-none"
          onClick={() => toggleSection('extensionOptions')}
        >
          <h4>Extension Options</h4>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transform transition-transform duration-200 ${expandedSections.extensionOptions ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.extensionOptions && (
          <>
            <FormRow label="Asterisk Dial Options" tooltip="Additional options for Asterisk dial command.">
              <input
                type="text"
                name="asteriskDialOptions"
                value={formData.asteriskDialOptions}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
            <FormRow label="Ring Time" tooltip="How long to ring the extension.">
              <input
                type="text"
                name="ringTime"
                value={formData.ringTime}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
            <FormRow label="Extension Ringer Volume Override" tooltip="Override default ringer volume.">
              <select
                name="extensionRingerVolumeOverride"
                value={formData.extensionRingerVolumeOverride}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {ringerVolumeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Call Forwarding Time" tooltip="Time in seconds before call forwarding activates.">
              <input
                type="text"
                name="callForwardingTime"
                value={formData.callForwardingTime}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
            <FormRow label="Outbound Concurrency Limit" tooltip="Maximum number of simultaneous outbound calls for this extension.">
              <input
                type="number"
                name="outboundConcurrencyLimit"
                value={formData.outboundConcurrencyLimit}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
            <FormRow label="Call Waiting" tooltip="Enable or disable call waiting.">
              {renderBooleanToggle('callWaiting', formData.callWaiting, 'Enable', 'Disable')}
            </FormRow>
            <FormRow label="Call Waiting Tone" tooltip="Enable or disable call waiting tone.">
              {renderBooleanToggle('callWaitingTone', formData.callWaitingTone, 'Enable', 'Disable')}
            </FormRow>
            <FormRow label="Call Screening" tooltip="Enable or disable call screening.">
              <select
                name="callScreening"
                value={formData.callScreening}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {callScreeningOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Internal Auto Answer" tooltip="How internal calls are automatically answered.">
              <select
                name="internalAutoAnswer"
                value={formData.internalAutoAnswer}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {internalAutoAnswerOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Intercom Mode" tooltip="Enable or disable intercom functionality.">
              {renderBooleanToggle('intercomMode', formData.intercomMode, 'Enable', 'Disable')}
            </FormRow>
            <FormRow label="Queue State Detection" tooltip="How queue state is detected for this extension.">
              <select
                name="queueStateDetection"
                value={formData.queueStateDetection}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {queueStateDetectionOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
          </>
        )}
      </div>

      {/* Recording Options */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 mb-4 focus:outline-none"
          onClick={() => toggleSection('recordingOptions')}
        >
          <h4>Recording Options</h4>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transform transition-transform duration-200 ${expandedSections.recordingOptions ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.recordingOptions && (
          <>
            <FormRow label="Inbound External Calls" tooltip="Recording behavior for inbound calls from external sources.">
              <select
                name="inboundExternalCalls"
                value={formData.inboundExternalCalls}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {recordingOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Outbound External Calls" tooltip="Recording behavior for outbound calls to external destinations.">
              <select
                name="outboundExternalCalls"
                value={formData.outboundExternalCalls}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {recordingOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Inbound Internal Calls" tooltip="Recording behavior for inbound calls from internal extensions.">
              <select
                name="inboundInternalCalls"
                value={formData.inboundInternalCalls}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {recordingOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Outbound Internal Calls" tooltip="Recording behavior for outbound calls to internal extensions.">
              <select
                name="outboundInternalCalls"
                value={formData.outboundInternalCalls}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {recordingOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="On Demand Recording" tooltip="Allow users to start/stop recordings on demand.">
              <select
                name="onDemandRecording"
                value={formData.onDemandRecording}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {onDemandRecordingOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Record Priority Policy" tooltip="Priority for recording. Higher number means higher priority.">
              <input
                type="number"
                name="recordPriorityPolicy"
                value={formData.recordPriorityPolicy}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
          </>
        )}
      </div>

      {/* Dictation Services */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 mb-4 focus:outline-none"
          onClick={() => toggleSection('dictationServices')}
        >
          <h4>Dictation Services</h4>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transform transition-transform duration-200 ${expandedSections.dictationServices ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.dictationServices && (
          <>
            <FormRow label="Dictation Service" tooltip="Enable or disable dictation service for this extension.">
              <select
                name="dictationService"
                value={formData.dictationService}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {dictationServiceOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
            {formData.dictationService === 'Enabled' && (
              <>
                <FormRow label="Dictation Format" tooltip="Audio format for dictation recordings.">
                  <select
                    name="dictationFormat"
                    value={formData.dictationFormat}
                    onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                    className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
                  >
                    {dictationFormatOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="Dictation Email Address" tooltip="Email address to send dictation recordings.">
                  <input
                    type="email"
                    name="dictationEmailAddress"
                    value={formData.dictationEmailAddress}
                    onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                    className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
                  />
                </FormRow>
                <FormRow label="Dictation From Address" tooltip="The 'From' email address for dictation emails.">
                  <input
                    type="email"
                    name="dictationFromAddress"
                    value={formData.dictationFromAddress}
                    onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                    className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
                  />
                </FormRow>
              </>
            )}
          </>
        )}
      </div>

      {/* Default Group Inclusion */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 mb-4 focus:outline-none"
          onClick={() => toggleSection('defaultGroupInclusion')}
        >
          <h4>Default Group Inclusion</h4>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transform transition-transform duration-200 ${expandedSections.defaultGroupInclusion ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.defaultGroupInclusion && (
          <>
            <FormRow label="Default Directory" tooltip="Include or exclude this extension from the default directory.">
              <select
                name="defaultDirectory"
                value={formData.defaultDirectory}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              >
                {defaultDirectoryOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormRow>
          </>
        )}
      </div>

      {/* DTLS */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 mb-4 focus:outline-none"
          onClick={() => toggleSection('dtls')}
        >
          <h4>DTLS</h4>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transform transition-transform duration-200 ${expandedSections.dtls ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.dtls && (
          <>
            <FormRow label="Enable DTLS" tooltip="Enable Datagram Transport Layer Security (DTLS).">
              {renderBooleanToggle('enableDTLS', formData.enableDTLS, 'Yes', 'No')}
            </FormRow>
            {formData.enableDTLS && (
              <>
                <FormRow label="Auto Generate Certificate" tooltip="Automatically generate a DTLS certificate.">
                  {renderBooleanToggle('autoGenerateCertificate', formData.autoGenerateCertificate, 'Yes', 'No')}
                </FormRow>
                {!formData.autoGenerateCertificate && (
                  <FormRow label="Use Certificate" tooltip="Select an existing DTLS certificate.">
                    <select
                      name="useCertificate"
                      value={formData.useCertificate}
                      onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                      className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
                    >
                      {useCertificateOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </FormRow>
                )}
                <FormRow label="DTLS Verify" tooltip="Verification mode for DTLS certificates.">
                  <select
                    name="dtlsVerify"
                    value={formData.dtlsVerify}
                    onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                    className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
                  >
                    {dtlsVerifyOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="DTLS Setup" tooltip="DTLS handshake setup role.">
                  <select
                    name="dtlsSetup"
                    value={formData.dtlsSetup}
                    onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                    className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
                  >
                    {dtlsSetupOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </FormRow>
                <FormRow label="DTLS Rekey Interval" tooltip="Time in seconds to rekey DTLS session. (0 for never)">
                  <input
                    type="number"
                    name="dtlsRekeyInterval"
                    value={formData.dtlsRekeyInterval}
                    onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                    className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
                  />
                </FormRow>
              </>
            )}
          </>
        )}
      </div>

      {/* Optional Destinations */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          type="button"
          className="flex justify-between items-center w-full text-xl font-semibold text-gray-700 mb-4 focus:outline-none"
          onClick={() => toggleSection('optionalDestinations')}
        >
          <h4>Optional Destinations</h4>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-6 w-6 transform transition-transform duration-200 ${expandedSections.optionalDestinations ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {expandedSections.optionalDestinations && (
          <>
            <FormRow label="No Answer Destination" tooltip="Where to send calls if this extension does not answer.">
              <input
                type="text"
                name="noAnswerDestination"
                value={formData.noAnswerDestination}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
            <FormRow label="No Answer CID Prefix" tooltip="Prefix to add to Caller ID for calls forwarded on no answer.">
              <input
                type="text"
                name="noAnswerCIDPrefix"
                value={formData.noAnswerCIDPrefix}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
            <FormRow label="Busy Destination" tooltip="Where to send calls if this extension is busy.">
              <input
                type="text"
                name="busyDestination"
                value={formData.busyDestination}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
            <FormRow label="Busy CID Prefix" tooltip="Prefix to add to Caller ID for calls forwarded on busy.">
              <input
                type="text"
                name="busyCIDPrefix"
                value={formData.busyCIDPrefix}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
            <FormRow label="Not Reachable Destination" tooltip="Where to send calls if this extension is unreachable.">
              <input
                type="text"
                name="notReachableDestination"
                value={formData.notReachableDestination}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
            <FormRow label="Not Reachable CID Prefix" tooltip="Prefix to add to Caller ID for calls forwarded when not reachable.">
              <input
                type="text"
                name="notReachableCIDPrefix"
                value={formData.notReachableCIDPrefix}
                onChange={e => handleChange(e.target.name, e.target.value)} // Updated onChange
                className="w-full py-1.5 px-2 border border-gray-300 rounded-md text-sm"
              />
            </FormRow>
          </>
        )}
      </div>
    </div>
  );
});

export default AdvancedSettings;
