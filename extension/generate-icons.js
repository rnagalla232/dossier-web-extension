#!/usr/bin/env node

// Simple script to create placeholder PNG icons
// In a real project, you would use a tool like sharp or imagemagick

const fs = require('fs');
const path = require('path');

// Create a simple colored square as placeholder
function createPlaceholderIcon(size, filename) {
    // This is a simplified approach - in production you'd use a proper image library
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#gradient)" rx="${size/8}"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" font-family="Arial, sans-serif" font-size="${size/4}" fill="white" font-weight="bold">M</text>
</svg>`;
    
    fs.writeFileSync(path.join(__dirname, 'icons', filename.replace('.png', '.svg')), svg);
    console.log(`Created ${filename.replace('.png', '.svg')} (${size}x${size})`);
}

// Generate icons
const sizes = [16, 32, 48, 128];
sizes.forEach(size => {
    createPlaceholderIcon(size, `icon${size}.png`);
});

console.log('\nIcon generation complete!');
console.log('Note: These are SVG placeholders. For production, convert to PNG using:');
console.log('  - Online tools like convertio.co');
console.log('  - Command line tools like ImageMagick');
console.log('  - Node.js libraries like sharp');
