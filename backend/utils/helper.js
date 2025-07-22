const extensions = {};

function initializeExtension(extension) {
  if (!extensions[extension]) {
    extensions[extension] = {
      totalCalls: 0,
      answeredCalls: 0,
      totalMissedCalles:0,
      totalTalkTime: 0, // In seconds
    };
  }
}

module.exports = { initializeExtension, extensions };
