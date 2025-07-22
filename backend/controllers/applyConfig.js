const { generateAndWriteDialplan } = require('./dialPlanController/configDialPlan');

// POST /api/apply-config
// Regenerates and reloads the Asterisk queue config for all queues
const applyConfig = async (req, res) => {
  try {
    // Also regenerate and reload dialplan`
    await generateAndWriteDialplan();
    res.status(200).json({ status: 200, message: 'Asterisk configuration and dialplan applied successfully.' });
  } catch (error) {
    console.error('Error applying config:', error);
    res.status(500).json({ status: 500, error: 'Failed to apply config', details: error.message });
  }
};

module.exports = { applyConfig };
