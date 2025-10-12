#!/usr/bin/env node

/**
 * Script to download Geist fonts from Google Fonts
 * This will download the WOFF2 files which are modern and highly compressed
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Geist font files from Google Fonts - Updated URLs
const fontFiles = {
  'geist-sans': {
    files: [
      {
        name: 'Geist-Regular.woff2',
        url: 'https://fonts.gstatic.com/s/geist/v1/gyByhwUwIdRiEOi0ZyeJn3o9.woff2'
      },
      {
        name: 'Geist-Medium.woff2',
        url: 'https://fonts.gstatic.com/s/geist/v1/gyByhwUwIdRiEOiMZ2lHn3o9.woff2'
      },
      {
        name: 'Geist-SemiBold.woff2',
        url: 'https://fonts.gstatic.com/s/geist/v1/gyByhwUwIdRiEOiQZGlHn3o9.woff2'
      },
      {
        name: 'Geist-Bold.woff2',
        url: 'https://fonts.gstatic.com/s/geist/v1/gyByhwUwIdRiEOiOZ2lHn3o9.woff2'
      }
    ]
  },
  'geist-mono': {
    files: [
      {
        name: 'GeistMono-Regular.woff2',
        url: 'https://fonts.gstatic.com/s/geistmono/v1/hFrr9dJaHNfEX8o6K4fgRv0.woff2'
      },
      {
        name: 'GeistMono-Medium.woff2',
        url: 'https://fonts.gstatic.com/s/geistmono/v1/hFrr9dJaHNfEX8o6LIfgRv0.woff2'
      },
      {
        name: 'GeistMono-SemiBold.woff2',
        url: 'https://fonts.gstatic.com/s/geistmono/v1/hFrr9dJaHNfEX8o6KYfgRv0.woff2'
      }
    ]
  }
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };

    https.get(url, options, (response) => {
      // Check if response is successful
      if (response.statusCode !== 200) {
        fs.unlink(dest, () => {});
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }

      // Check content type
      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('font')) {
        fs.unlink(dest, () => {});
        reject(new Error(`Invalid content type: ${contentType}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded: ${path.basename(dest)} (${contentType})`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => reject(err));
      console.error(`❌ Failed to download: ${url} - ${err.message}`);
    });
  });
}

async function downloadFonts() {
  const baseDir = path.join(__dirname, '../public/fonts');

  console.log('📦 Downloading Geist fonts...\n');

  for (const [fontFamily, fontData] of Object.entries(fontFiles)) {
    const fontDir = path.join(baseDir, fontFamily);

    // Ensure directory exists
    if (!fs.existsSync(fontDir)) {
      fs.mkdirSync(fontDir, { recursive: true });
    }

    console.log(`📁 Processing ${fontFamily}...`);

    for (const fontFile of fontData.files) {
      const destPath = path.join(fontDir, fontFile.name);
      try {
        await downloadFile(fontFile.url, destPath);
      } catch (error) {
        console.error(`❌ Failed to download ${fontFile.name}: ${error.message}`);
        console.log(`🔄 Trying alternative approach...`);

        // Try with curl as fallback
        try {
          const { execSync } = require('child_process');
          execSync(`curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -o "${destPath}" "${fontFile.url}"`, { stdio: 'inherit' });
          console.log(`✅ Downloaded: ${fontFile.name} (fallback method)`);
        } catch (curlError) {
          console.error(`❌ Both methods failed for ${fontFile.name}`);
        }
      }
    }

    console.log(`✅ ${fontFamily} completed!\n`);
  }

  console.log('🎉 Font download process completed!');
  console.log('📂 Location: public/fonts/');
}

downloadFonts().catch(console.error);