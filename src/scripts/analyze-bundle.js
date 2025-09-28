const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Build with analysis
console.log('Building with bundle analysis...');
execSync('npm run build:analyze', { stdio: 'inherit' });

// Check if analysis files exist
const analyzeDir = path.join(__dirname, '..', 'analyze');
const clientReport = path.join(analyzeDir, 'client.html');
const serverReport = path.join(analyzeDir, 'server.html');

if (fs.existsSync(clientReport)) {
  console.log(`✅ Client bundle analysis: ${clientReport}`);
}

if (fs.existsSync(serverReport)) {
  console.log(`✅ Server bundle analysis: ${serverReport}`);
}

// Extract key metrics from build output
const buildDir = path.join(__dirname, '..', '.next');
if (fs.existsSync(buildDir)) {
  console.log('\n📊 Bundle Analysis Complete');
  console.log('Run the following to view reports:');
  console.log(`  - Client: open ${clientReport}`);
  console.log(`  - Server: open ${serverReport}`);
}