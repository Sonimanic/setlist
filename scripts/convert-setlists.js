const fs = require('fs');
const path = require('path');

// Read setlists.json
const setlistsPath = path.join(__dirname, '..', 'data', 'setlists.json');
const playlistsPath = path.join(__dirname, '..', 'data', 'playlists.json');

const setlistsData = JSON.parse(fs.readFileSync(setlistsPath, 'utf8'));

// Convert to playlists format
const playlistsData = {
  playlists: {
    'default': {
      id: 'default',
      name: 'Default Setlist',
      setlist: setlistsData.setlists[0] || []
    }
  }
};

// Write to playlists.json
fs.writeFileSync(playlistsPath, JSON.stringify(playlistsData, null, 2));
