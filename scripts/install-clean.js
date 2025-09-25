#!/usr/bin/env node

/**
 * Clean installation script
 * Removes problematic dependencies and installs clean packages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Starting clean installation...');

// Remove node_modules and lock files
console.log('📦 Removing old dependencies...');
try {
  if (fs.existsSync('node_modules')) {
    // Cross-platform removal
    const isWindows = process.platform === 'win32';
    const rmCommand = isWindows ? 'rmdir /s /q node_modules' : 'rm -rf node_modules';
    execSync(rmCommand, { stdio: 'inherit' });
  }
  if (fs.existsSync('package-lock.json')) {
    const isWindows = process.platform === 'win32';
    const delCommand = isWindows ? 'del package-lock.json' : 'rm package-lock.json';
    execSync(delCommand, { stdio: 'inherit' });
  }
} catch (error) {
  console.warn('⚠️  Could not remove old files:', error.message);
}

// Install dependencies
console.log('📥 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Run type check
console.log('🔍 Running type check...');
try {
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('✅ Type check passed');
} catch (error) {
  console.warn('⚠️  Type check failed:', error.message);
}

console.log('🎉 Clean installation completed!');
console.log('');
console.log('Next steps:');
console.log('  npm run dev     - Start development server');
console.log('  npm run build   - Build for production');
console.log('  npm run test    - Run tests');