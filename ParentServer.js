const { spawn } = require('child_process');
const path = require('path');

// Paths to your server files
const server1Path = path.join(__dirname, 'new.js');
const server2Path = path.join(__dirname, 'server.js');

// Function to start a server
function startServer(scriptPath, serverName) {
  const serverProcess = spawn('node', [scriptPath], {
    stdio: 'inherit', // This will pipe the output to the parent process
  });

  serverProcess.on('close', (code) => {
    console.log(`${serverName} exited with code ${code}`);
  });

  serverProcess.on('error', (err) => {
    console.error(`Failed to start ${serverName}:, err`);
  });
}

// Start both servers
startServer(server1Path, 'new');
startServer(server2Path, 'server');