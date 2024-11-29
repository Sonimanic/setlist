const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Ensure public directory exists
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}

// Create a simple icon (black background with white text)
async function generateIcon(size) {
    const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#000"/>
        <text x="50%" y="50%" font-family="Arial" font-size="${size/4}px" fill="white" text-anchor="middle" dominant-baseline="middle">
            S
        </text>
    </svg>`;

    await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(publicDir, `icon-${size}x${size}.png`));
}

// Generate both sizes
Promise.all([
    generateIcon(192),
    generateIcon(512)
]).then(() => {
    console.log('Icons generated successfully!');
}).catch(console.error);
