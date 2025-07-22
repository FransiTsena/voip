const { exec } = require('child_process');
const fs = require('fs');

const runWithSudo = async (command) => {
  return new Promise((resolve, reject) => {
    exec(`sudo ${command}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error}`);
        reject(error);
        return;
      } 
      resolve({ stdout, stderr });
    });
  });
};

const writeFileWithSudo = async (filePath, content) => {
  try {
    // First write to a temporary file
    const tempPath = `${filePath}.tmp`;
    fs.writeFileSync(tempPath, content);

    // Then use sudo to move it to the target location
    await runWithSudo(`mv ${tempPath} ${filePath}`);
    return true;
  } catch (error) {
    throw new Error(`Failed to write file with sudo: ${error.message}`);
  }
};

const reloadAsterisk = async () => {
  try {
    // Use sudo to reload Asterisk
    await runWithSudo('asterisk -rx "core reload"');
    console.log('Asterisk reloaded successfully');
    return true;
  } catch (error) {
    throw new Error(`Failed to reload Asterisk: ${error.message}`);
  }
};

module.exports = {
  runWithSudo,
  writeFileWithSudo,
  reloadAsterisk
};
