// parent.js
const { spawn } = require('child_process');
const path = require('path');

// Function to run a script
function runScript(scriptPath) {
  const script = spawn('node', [scriptPath]);

  // Handle stdout (log output to console)
  script.stdout.on('data', (data) => {
    console.log(`${scriptPath} output: ${data}`);
  });

  // Handle stderr (log errors to console)
  script.stderr.on('data', (data) => {
    console.error(`${scriptPath} error: ${data}`);
  });

  // Handle exit
  script.on('close', (code) => {
    console.log(`${scriptPath} process exited with code ${code}`);
  });
}

// Absolute paths to app.js and server.js
const appJsPath = path.join(__dirname, 'app.js');
const serverJsPath = path.join(__dirname, 'server.js');

// Run both scripts
runScript(appJsPath);
runScript(serverJsPath);
