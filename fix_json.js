const fs = require('fs');

// Read the original file
const originalContent = fs.readFileSync('SoniManic.json', 'utf8');

// Fix the JSON structure
let fixedContent = originalContent
    // Remove trailing commas
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix the contact section
    .replace(/"name": "SoniManic",(\s*)"song"/, '"name": "SoniManic"\n  },\n  "song"');

// Parse and stringify to ensure valid JSON
try {
    const jsonObj = JSON.parse(fixedContent);
    fixedContent = JSON.stringify(jsonObj, null, 2);
    fs.writeFileSync('SoniManic.json', fixedContent);
    console.log('Successfully fixed JSON structure');
} catch (error) {
    console.error('Error parsing JSON:', error);
}
