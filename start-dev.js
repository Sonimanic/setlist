const { exec } = require('child_process');
const os = require('os');

// Get local IP address
const networkInterfaces = os.networkInterfaces();
let localIP;

Object.keys(networkInterfaces).forEach((interfaceName) => {
  const interfaces = networkInterfaces[interfaceName];
  interfaces.forEach((interface) => {
    if (interface.family === 'IPv4' && !interface.internal) {
      localIP = interface.address;
    }
  });
});

console.log(`Starting development server on ${localIP}:3000`);
console.log('You can access the app on your iPad at:');
console.log(`http://${localIP}:3000`);

exec('npm run dev -- --hostname 0.0.0.0', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`);
    return;
  }
  console.log(stdout);
  console.error(stderr);
});
