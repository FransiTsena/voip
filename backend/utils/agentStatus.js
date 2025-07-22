// Utility for agent status updates (stub for now)
async function updateAgentStatus(extension, status) {
  return { extension, status, message: "Agent status update is not handled in Asterisk-only mode." };
}

module.exports = { updateAgentStatus };
