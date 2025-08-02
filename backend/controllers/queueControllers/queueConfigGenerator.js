// Helper: Generate Asterisk config for one Queue
const generateAsteriskQueueConfig = (queue) => {
  // Note: This function uses the *saved Mongoose document* structure,
  // which now includes both top-level and nested fields.
  const settings = queue.generalSettings;
  const timing = queue.timingAgentOptions;
  const capacity = queue.capacityOptions;

  // Start with the queue context header, using queueId from the schema
  let config = `\n[${queue.queueId}]\n`;

  // --- General Settings (using top-level fields from schema where applicable, or nested for more specific ones) ---
  if (settings) {
    config += `announce-frequency=${settings.announceFrequency || 0}\n`;
    config += `announce-holdtime=${settings.announceHoldTime || 'no'}\n`;
    config += `autofill=${settings.autofill || 'yes'}\n`;
    config += `autopause=${settings.autopause || 'no'}\n`;
    config += `joinempty=${settings.joinEmpty || 'yes'}\n`;
    config += `leavewhenempty=${settings.leaveWhenEmpty || 'no'}\n`;
    config += `maxlen=${settings.maxLen || 0}\n`;
    config += `musicclass=${settings.musicClass || 'default'}\n`;
    // config += `queue-youarenext=${settings.queueYouAreNext || 'queue-youarenext'}\n`;
    // config += `queue-thereare=${settings.queueThereAre || 'queue-thereare'}\n`;
    // config += `queue-callswaiting=${settings.queueCallsWaiting || 'queue-callswaiting'}\n`;
    // config += `queue-holdtime=${settings.queueHoldTime || 'queue-holdtime'}\n`;
    // config += `queue-minutes=${settings.queueMinutes || 'queue-minutes'}\n`;
    // config += `queue-seconds=${settings.queueSeconds || 'queue-seconds'}\n`;
    // config += `queue-thankyou=${settings.queueThankYou || 'queue-thankyou'}\n`;
    // config += `queue-callerannounce=${settings.queueCallerAnnounce || ''}\n`;
    config += `queue-reporthold=${settings.queueReportHold || 'no'}\n`;
    config += `announce-position=${settings.announcePosition || 'yes'}\n`;
    config += `announce-round-seconds=${settings.announceRoundSeconds || 0}\n`;
    config += `announce-holdtime=${settings.announceHoldTime || 'no'}\n`;
    config += `timeout=${settings.timeout || 15}\n`;
    config += `retry=${settings.retry || 5}\n`;
    config += `wrapuptime=${settings.wrapUpTime || 0}\n`;
    config += `maxlen=${settings.maxLen || 0}\n`;
    config += `servicelevel=${settings.serviceLevel || 60}\n`;
    config += `strategy=${settings.strategy || 'ringall'}\n`;
    config += `eventmemberstatus=${settings.eventMemberStatus || 'yes'}\n`;
    config += `eventwhencalled=${settings.eventWhenCalled || 'yes'}\n`;
    config += `reportholdtime=${settings.reportHoldTime || 'no'}\n`;
    config += `memberdelay=${settings.memberDelay || 0}\n`;
    config += `weight=${settings.weight || 0}\n`;
    config += `timeoutrestart=${settings.timeoutRestart || 'no'}\n`;
    config += `monitor-type=${settings.monitorType || 'MixMonitor'}\n`;
    config += `monitor-join=${settings.monitorJoin || 'no'}\n`;
    config += `ringinuse=${settings.ringInUse || 'yes'}\n`;
    config += `setinterfacevar=${settings.setInterfaceVar || 'no'}\n`;
    config += `updatecdr=${settings.updateCDR || 'no'}\n`;
    config += `autofill=${settings.autofill || 'yes'}\n`;
    config += `autopause=${settings.autopause || 'no'}\n`;
    config += `autopausedelay=${settings.autopauseDelay || 0}\n`;
    config += `autopausebusy=${settings.autopauseBusy || 'no'}\n`;
    config += `autopausedisabled=${settings.autopauseDisabled || 'no'}\n`;
    config += `timeoutpriority=${settings.timeoutPriority || 'app'}\n`;
    config += `timeoutrestart=${settings.timeoutRestart || 'no'}\n`;
    config += `defaultrule=${settings.defaultRule || ''}\n`;
    config += `periodic-announce-frequency=${settings.periodicAnnounceFrequency || 0}\n`;
    config += `periodic-announce=${settings.periodicAnnounce || ''}\n`;
    config += `announce-holdtime=${settings.announceHoldTime || 'no'}\n`;
    config += `announce-frequency=${settings.announceFrequency || 0}\n`;
    config += `announce-position=${settings.announcePosition || 'yes'}\n`;
    config += `announce-round-seconds=${settings.announceRoundSeconds || 0}\n`;
    config += `announce-to-first-user=${settings.announceToFirstUser || 'no'}\n`;
    config += `min-announce-interval=${settings.minAnnounceInterval || 0}\n`;
    config += `announce-position-limit=${settings.announcePositionLimit || 0}\n`;
    config += `announce-position=${settings.announcePosition || 'yes'}\n`;
    config += `joinempty=${settings.joinEmpty || 'yes'}\n`;
    config += `leavewhenempty=${settings.leaveWhenEmpty || 'no'}\n`;
    config += `maxlen=${settings.maxLen || 0}\n`;
    config += `servicelevel=${settings.serviceLevel || 60}\n`;
    config += `strategy=${settings.strategy || 'ringall'}\n`;
    config += `eventmemberstatus=${settings.eventMemberStatus || 'yes'}\n`;
    config += `eventwhencalled=${settings.eventWhenCalled || 'yes'}\n`;
    config += `reportholdtime=${settings.reportHoldTime || 'no'}\n`;
    config += `memberdelay=${settings.memberDelay || 0}\n`;
    config += `weight=${settings.weight || 0}\n`;
    config += `timeoutrestart=${settings.timeoutRestart || 'no'}\n`;
    config += `monitor-type=${settings.monitorType || 'MixMonitor'}\n`;
    config += `monitor-join=${settings.monitorJoin || 'no'}\n`;
    config += `ringinuse=${settings.ringInUse || 'yes'}\n`;
    config += `setinterfacevar=${settings.setInterfaceVar || 'no'}\n`;
    config += `updatecdr=${settings.updateCDR || 'no'}\n`;
    config += `autofill=${settings.autofill || 'yes'}\n`;
    config += `autopause=${settings.autopause || 'no'}\n`;
    config += `autopausedelay=${settings.autopauseDelay || 0}\n`;
    config += `autopausebusy=${settings.autopauseBusy || 'no'}\n`;
    config += `autopausedisabled=${settings.autopauseDisabled || 'no'}\n`;
    config += `timeoutpriority=${settings.timeoutPriority || 'app'}\n`;
    config += `timeoutrestart=${settings.timeoutRestart || 'no'}\n`;
    config += `defaultrule=${settings.defaultRule || ''}\n`;
    config += `periodic-announce-frequency=${settings.periodicAnnounceFrequency || 0}\n`;
    config += `periodic-announce=${settings.periodicAnnounce || ''}\n`;
    config += `announce-holdtime=${settings.announceHoldTime || 'no'}\n`;
    config += `announce-frequency=${settings.announceFrequency || 0}\n`;
    config += `announce-position=${settings.announcePosition || 'yes'}\n`;
    config += `announce-round-seconds=${settings.announceRoundSeconds || 0}\n`;
    config += `announce-to-first-user=${settings.announceToFirstUser || 'no'}\n`;
    config += `min-announce-interval=${settings.minAnnounceInterval || 0}\n`;
    config += `announce-position-limit=${settings.announcePositionLimit || 0}\n`;
  }

  // --- Timing Options ---
  if (timing) {
    config += `; maxWaitTime: ${timing.maxWaitTime}\n`;
    config += `; maxWaitTimeMode: ${timing.maxWaitTimeMode}\n`;
  }

  // --- Capacity Options ---
  if (capacity) {
    config += `; maxCapacity: ${capacity.maxCapacity}\n`;
    config += `; joinCapacity: ${capacity.joinCapacity}\n`;
    config += `; agentCapacity: ${capacity.agentCapacity}\n`;
  }

  // --- Agent Settings ---
  // Using the nested queueAgents array for detailed member configuration
  if (Array.isArray(queue.queueAgents)) {
    queue.queueAgents.forEach(agent => {
      // Assuming penalty is 0 by default, and context is 'from-internal'.
      // You might need to adjust 'from-internal' to your actual context.
      config += `member=Local/${agent.extension}@from-internal/n,0,${agent.name}\n`;
    });
  }

  return config;
};

const util = require('util');
const { exec } = require('child_process');
const execPromise = util.promisify(exec);

// Helper: Reload Asterisk Queue module
const reloadAsteriskQueues = async () => {
  try {
    // Reloads only the queue application module, which is more targeted.
    await execPromise('sudo asterisk -rx "module reload app_queue.so"');
    console.log('Asterisk queue application reloaded successfully');
  } catch (error) {
    console.error('Error reloading Asterisk queue application:', error);
    throw error;
  }
};

module.exports = {
  generateAsteriskQueueConfig,
  reloadAsteriskQueues
};
