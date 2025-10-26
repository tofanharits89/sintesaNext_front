const fs = require('fs');
const path = require('path');

// Common import mappings
const importMappings = {
  '@/lib/backend': '@/lib/api/backend',
  '@/lib/base-path': '@/lib/config/base-path',
  '@/lib/config': '@/lib/config/config',
  '@/lib/cookie-helpers': '@/lib/utils/cookie-helpers',
  '@/lib/cookieManager': '@/lib/utils/cookieManager',
  '@/lib/httpClient': '@/lib/api/httpClient',
  '@/lib/logger': '@/lib/utils/logger',
  '@/lib/query-configs': '@/lib/config/query-configs',
  '@/lib/route-helpers': '@/lib/utils/route-helpers',
  '@/lib/socket-client': '@/lib/api/socket-client',
  '@/lib/csrfManager': '@/lib/security/csrfManager',
  '@/lib/rbac': '@/lib/security/rbac',
  '@/lib/notifications-store': '@/lib/stores/notifications-store',
  '@/lib/users-store': '@/lib/stores/users-store',
  '@/lib/cache-manager': '@/lib/cache/cache-manager',
  '@/lib/cache-metrics': '@/lib/cache/cache-metrics',
  '@/lib/error-boundary': '@/lib/ui/error-boundary',
  '@/lib/utils': '@/lib/utils/utils'
};

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // Apply all import mappings
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      const regex = new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newImport);
        changed = true;
      }
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing imports in ${filePath}:`, error);
  }
}

// Function to recursively find and fix files
function findAndFixFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // Skip node_modules and other common ignore directories
      if (!['node_modules', '.git', '.next', 'dist', 'build'].includes(file.name)) {
        findAndFixFiles(fullPath, extensions);
      }
    } else if (extensions.some(ext => file.name.endsWith(ext))) {
      fixImportsInFile(fullPath);
    }
  }
}

// Start fixing from src directory
const srcDir = path.join(__dirname, 'src');
if (fs.existsSync(srcDir)) {
  findAndFixFiles(srcDir);
  console.log('Import fixing completed!');
} else {
  console.log('src directory not found');
}
