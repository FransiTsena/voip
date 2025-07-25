const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const { writeFileWithSudo } = require('../../utils/sudo'); // Assuming sudo.js is in utils

const execPromise = util.promisify(exec);

// Config file paths for PJSIP
const PJSIP_ENDPOINT_CUSTOM_CONF_PATH = "/etc/asterisk/pjsip.endpoint_custom.conf";
const PJSIP_AOR_CUSTOM_CONF_PATH = "/etc/asterisk/pjsip.aor_custom.conf";
const PJSIP_AUTH_CUSTOM_CONF_PATH = "/etc/asterisk/pjsip.auth_custom.conf";

// Helper function to generate PJSIP endpoint configuration string for a single extension
const generatePjsipEndpointConfig = (data) => {
  // Map frontend boolean values to Asterisk 'yes'/'no' strings
  const directMedia = (data.directMedia === false) ? 'no' : 'yes'; // Default to 'yes'
  const trustRPID = data.trustRPID ? 'yes' : 'no';
  const sendConnectedLine = data.sendConnectedLine ? 'yes' : 'no';
  const userEqualsPhone = data.userEqualsPhone ? 'yes' : 'no';
  const enableAVPF = data.enableAVPF ? 'yes' : 'no';
  const enableICESupport = data.enableICESupport ? 'yes' : 'no';
  const enableRtcpMux = data.enableRtcpMux ? 'yes' : 'no';
  const removeExisting = data.removeExisting ? 'yes' : 'no'; // This is for AOR, but included here for completeness if needed
  const mediaUseReceivedTransport = data.mediaUseReceivedTransport ? 'yes' : 'no';
  const rtpSymmetric = data.rtpSymmetric ? 'yes' : 'no';
  const rewriteContact = data.rewriteContact ? 'yes' : 'no';
  const forceRport = data.forceRport ? 'yes' : 'no';
  const aggregateMWI = data.aggregateMWI ? 'yes' : 'no';
  const enableWebRTCDefaults = data.enableWebRTCDefaults ? 'yes' : 'no';
  const allowNonEncryptedMedia = (data.allowNonEncryptedMedia === false) ? 'no' : 'yes'; // Default to 'yes'
  const referBlindProgress = data.referBlindProgress ? 'yes' : 'no';
  const enableDTLS = data.enableDTLS ? 'yes' : 'no'; // DTLS field
  const autoGenerateCertificate = data.autoGenerateCertificate ? 'yes' : 'no'; // DTLS field

  // Map sendRPID to send_pai or send_rpid based on frontend selection
  let sendPai = 'no';
  let sendRpid = 'no';
  if (data.sendRPID === 'Send P-Asserted-Identity header') {
    sendPai = 'yes';
  } else if (data.sendRPID === 'Send Remote-Party-ID header') {
    sendRpid = 'yes';
  }

  // Map mediaEncryption values
  let mediaEncryption = 'no';
  if (data.mediaEncryption === 'SRTP') {
    mediaEncryption = 'sRTP';
  } else if (data.mediaEncryption === 'DTLS_SRTP') {
    mediaEncryption = 'dtls';
  }

  // Convert sessionTimers to lowercase
  const sessionTimers = data.sessionTimers.toLowerCase();

  // Map transport values (assuming 'Auto' might map to a specific default or be omitted)
  // For FreePBX-like transport options, they usually map to specific bindings.
  // For simplicity, if 'Auto', we might omit or default to 'udp'.
  // If specific transports like '0.0.0.0-ws' are used, they imply a specific transport binding.
  // Here, we'll just pass the value directly, assuming Asterisk handles it if it's a valid binding name.
  let transport = data.transport;


  // Map mwiSubscriptionType
  let mwiSubscribeEvent = 'auto'; // Default
  if (data.mwiSubscriptionType === 'Auto') {
    mwiSubscribeEvent = 'auto';
  }
  // Add more specific mappings if frontend provides 'Unsolicited', 'Solicited' etc.
  // For now, assuming only 'Auto' is explicitly handled or others are passed as is.

  // Handle codecs: if disallowedCodecs is provided, prepend '!all,'.
  const allowedCodecs = data.allowedCodecs || 'ulaw,alaw,gsm,g726,g722'; // Default codecs
  const disallowedCodecs = data.disallowedCodecs ? `!all,${data.disallowedCodecs}` : '';

  // Construct caller ID string for Asterisk
  const callerId = data.displayName && data.userExtension ?
    `"${data.displayName}" <${data.outboundCID || data.userExtension}>` :
    data.outboundCID || data.userExtension;

  // DTLS specific settings
  let dtlsConfig = [];
  if (enableDTLS === 'yes') {
    dtlsConfig.push(`dtls_enable=${enableDTLS}`);
    dtlsConfig.push(`dtls_auto_generate_cert=${autoGenerateCertificate}`);
    if (data.useCertificate && data.useCertificate !== 'default') {
      dtlsConfig.push(`dtls_cert_file=/etc/asterisk/keys/${data.useCertificate}.pem`); // Example path
      dtlsConfig.push(`dtls_key_file=/etc/asterisk/keys/${data.useCertificate}.key`); // Example path
    }
    dtlsConfig.push(`dtls_verify=${data.dtlsVerify.toLowerCase()}`);
    dtlsConfig.push(`dtls_setup=${data.dtlsSetup.toLowerCase()}`);
    dtlsConfig.push(`dtls_rekey_interval=${data.dtlsRekeyInterval}`);
  }


  // Build config lines
  const configLines = [
    `[${data.userExtension}]`,
    `type=endpoint`,
    `aors=${data.userExtension}`,
    `auth=${data.userExtension}-auth`,
    `tos_audio=${data.tosAudio || 'ef'}`,
    `tos_video=${data.tosVideo || 'af41'}`,
    `cos_audio=${data.cosAudio || 5}`,
    `cos_video=${data.cosVideo || 4}`,
    `allow=${allowedCodecs}`,
    `context=from-internal`,
    `callerid=${callerId}`,
    `dtmf_mode=${data.dtmfSignaling.toLowerCase().replace(' ', '')}`,
    `direct_media=${directMedia}`,
    `transport=${transport}`,
    `aggregate_mwi=${aggregateMWI}`,
    ...(data.namedCallGroup ? [`named_call_group=${data.namedCallGroup}`] : []),
    `use_avpf=${enableAVPF}`,
    `rtcp_mux=${enableRtcpMux}`,
    `max_audio_streams=${data.maxAudioStreams}`,
    `max_video_streams=${data.maxVideoStreams}`,
    `bundle=${data.bundle || 'no'}`,
    `ice_support=${enableICESupport}`,
    `media_use_received_transport=${mediaUseReceivedTransport}`,
    `trust_id_inbound=${trustRPID}`,
    `user_eq_phone=${userEqualsPhone}`,
    `send_connected_line=${sendConnectedLine}`,
    `media_encryption=${mediaEncryption}`,
    `timers=${sessionTimers}`,
    `timers_min_se=${data.timerExpirationPeriod}`,
    `media_encryption_optimistic=${allowNonEncryptedMedia}`,
    `refer_blind_progress=${referBlindProgress}`,
    `rtp_timeout=${data.rtpTimeout === 0 ? 0 : (data.rtpTimeout || 30)}`,
    `rtp_timeout_hold=${data.rtpHoldTimeout === 0 ? 0 : (data.rtpHoldTimeout || 300)}`,
    `rtp_keepalive=${data.rtpKeepalive || 0}`,
    `send_pai=${sendPai}`,
    ...(sendRpid === 'yes' ? [`send_rpid=${sendRpid}`] : []),
    `rtp_symmetric=${rtpSymmetric}`,
    `rewrite_contact=${rewriteContact}`,
    `force_rport=${forceRport}`,
    `language=${data.languageCode || 'en'}`,
    `one_touch_recording=${data.oneTouchRecording || 'on'}`,
    `record_on_feature=${data.recordOnFeature || 'apprecord'}`,
    `record_off_feature=${data.recordOffFeature || 'apprecord'}`,
    `webrtc=${enableWebRTCDefaults}`,
    ...dtlsConfig,
  ];

  return configLines.join('\n');
};

// Helper function to generate PJSIP AOR configuration string for a single extension
const generatePjsipAorConfig = (data) => {
  const removeExisting = data.removeExisting ? 'yes' : 'no';
  return `
[${data.userExtension}]
type=aor
max_contacts=${data.maxContacts}
remove_existing=${removeExisting}
maximum_expiration=${data.maximumExpiration}
minimum_expiration=${data.minimumExpiration}
qualify_frequency=${data.qualifyFrequency}
`;
};

// Helper function to generate PJSIP Auth configuration string for a single extension
const generatePjsipAuthConfig = (data) => {
  // Use custom username if enabled and provided, otherwise use userExtension
  const username = data.useCustomUsername && data.username ? data.username : data.userExtension;
  // Prefer passwordForNewUser if set, otherwise use secret
  const password = data.passwordForNewUser || data.secret;

  return `
[${data.userExtension}-auth]
type=auth
auth_type=userpass
username=${username}
password=${password}
`;
};

// Helper to reload Asterisk PJSIP module
const reloadAsteriskPjsip = async () => {
  try {
    await execPromise('sudo asterisk -rx "core reload"');
    console.log('Asterisk PJSIP reloaded successfully.');
  } catch (error) {
    console.error(`Error reloading Asterisk PJSIP: ${error.message}`);
    throw new Error(`Asterisk PJSIP reload failed: ${error.message}`);
  }
};

/**
 * Generates and writes all PJSIP configurations based on the provided extensions data.
 * Overwrites the custom PJSIP configuration files and reloads Asterisk PJSIP.
 * @param {Array<Object>} allExtensions - An array of extension documents from the database.
 */
const generateAndWritePjsipConfigs = async (allExtensions) => {
  let combinedEndpointConfig = '';
  let combinedAorConfig = '';
  let combinedAuthConfig = '';

  allExtensions.forEach(ext => {
    combinedEndpointConfig += generatePjsipEndpointConfig(ext) + '\n\n';
    combinedAorConfig += generatePjsipAorConfig(ext) + '\n\n';
    combinedAuthConfig += generatePjsipAuthConfig(ext) + '\n\n';
  });

  try {
    // Write configurations to respective custom files (overwriting them)
    await writeFileWithSudo(PJSIP_ENDPOINT_CUSTOM_CONF_PATH, combinedEndpointConfig);
    await writeFileWithSudo(PJSIP_AOR_CUSTOM_CONF_PATH, combinedAorConfig);
    await writeFileWithSudo(PJSIP_AUTH_CUSTOM_CONF_PATH, combinedAuthConfig);

    console.log('PJSIP configurations regenerated and written successfully.');

    // Reload PJSIP in Asterisk
    await reloadAsteriskPjsip();

  } catch (error) {
    console.error('Failed to regenerate PJSIP config or reload Asterisk:', error);
    throw error;
  }
};

module.exports = {
  generateAndWritePjsipConfigs,
  // Export individual generators if they might be used elsewhere directly
  generatePjsipEndpointConfig,
  generatePjsipAorConfig,
  generatePjsipAuthConfig,
};
