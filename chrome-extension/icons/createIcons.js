// This is a simple script to generate placeholder icons
// In a real implementation, you would use proper SVG/PNG icons

const fs = require('fs');
const { createCanvas } = require('canvas');

// Create icon sizes
const sizes = [16, 48, 128];

// Create icons
sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#4285F4';
  ctx.fillRect(0, 0, size, size);
  
  // Inner circle
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.4, 0, Math.PI * 2);
  ctx.fill();
  
  // DOM text
  ctx.fillStyle = '#4285F4';
  ctx.font = `bold ${size * 0.3}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('D2C', size / 2, size / 2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`icon${size}.png`, buffer);
  
  console.log(`Generated icon${size}.png`);
});

console.log('Done generating icons'); 