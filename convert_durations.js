const fs = require('fs');

// Convert seconds to MM:SS
function secondsToTime(totalSeconds) {
  if (!totalSeconds) return '0:00';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Read the JSON file
const filePath = './SoniManic.json';
const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Convert all durations
for (const songId in jsonData.songs) {
  const song = jsonData.songs[songId];
  if (song.duration) {
    // Convert only if it's not already in MM:SS format
    if (!String(song.duration).includes(':')) {
      song.duration = secondsToTime(parseInt(song.duration));
    }
  }
}

// Write the updated JSON back to file
fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
