'use client';
import { useState, useEffect } from 'react';
import { Music4, Clock, KeyRound, Activity, AlignLeft, User2 } from 'lucide-react';

// Convert MM:SS or HH:MM:SS to seconds
const timeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(num => parseInt(num) || 0);
  if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  // MM:SS format
  return parts[0] * 60 + (parts[1] || 0);
};

// Convert seconds to MM:SS or HH:MM:SS
const formatDuration = (seconds) => {
  if (!seconds) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function EditSongForm({ song, onEditSong, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    artist: '',
    key: '',
    tempo: '',
    tempo_subdivision: '0',
    duration: '0',
    lyrics: '',
  });
  const [durationDisplay, setDurationDisplay] = useState('0:00');

  useEffect(() => {
    if (song) {
      // Convert numeric duration to display format
      const duration = parseInt(song.duration) || 0;
      setDurationDisplay(formatDuration(duration));

      setFormData({
        name: song.name || '',
        artist: song.artist || '',
        key: song.key || '',
        tempo: song.tempo || '',
        tempo_subdivision: song.tempo_subdivision || '0',
        duration: duration.toString(),
        lyrics: song.lyrics ? song.lyrics.replace(/<br>/g, '\n') : '',
      });
    }
  }, [song]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedSong = {
      [song.id]: {
        ...formData,
        tempo: formData.tempo ? `${parseFloat(formData.tempo).toFixed(2)}` : '0.00',
        duration: timeToSeconds(durationDisplay).toString(),
        lyrics: formData.lyrics ? formData.lyrics.replace(/\n/g, '<br>') : '',
      }
    };
    onEditSong(song.id, updatedSong);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'duration') {
      // Allow typing numbers and colons, format as MM:SS or HH:MM:SS
      const cleaned = value.replace(/[^\d:]/g, '');
      if (cleaned.length <= 8) { // Limit to HH:MM:SS format
        let formattedTime = cleaned;
        const parts = cleaned.split(':');
        
        if (parts.length <= 3) { // Only allow up to 3 parts (HH:MM:SS)
          if (!cleaned.includes(':')) {
            // If typing numbers without colons
            if (cleaned.length >= 2) {
              const seconds = cleaned.slice(-2);
              const minutes = cleaned.slice(-4, -2);
              const hours = cleaned.slice(0, -4);
              
              if (parseInt(seconds) < 60 && parseInt(minutes) < 60) {
                if (hours) {
                  formattedTime = `${hours}:${minutes}:${seconds}`;
                } else if (minutes) {
                  formattedTime = `${minutes}:${seconds}`;
                }
              }
            }
          } else {
            // If manually typing colons
            const lastPart = parts[parts.length - 1];
            if (lastPart.length === 2 && parseInt(lastPart) < 60) {
              formattedTime = parts.join(':');
            }
          }
        }
        
        setDurationDisplay(formattedTime);
      }
    } else if (name === 'lyrics') {
      // Convert newlines to <br> tags
      const formattedLyrics = value.replace(/\n/g, '<br>');
      setFormData(prev => ({
        ...prev,
        [name]: formattedLyrics
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="grid gap-6">
        {/* Song Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Song Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Music4 className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={handleChange}
              name="name"
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="Enter song name"
            />
          </div>
        </div>

        {/* Artist */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Artist</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <User2 className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={formData.artist}
              onChange={handleChange}
              name="artist"
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="Enter artist name"
            />
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Duration (MM:SS or HH:MM:SS)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Clock className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={durationDisplay}
              onChange={handleChange}
              name="duration"
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="0:00"
            />
          </div>
        </div>

        {/* Key */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Key</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <KeyRound className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={formData.key}
              onChange={handleChange}
              name="key"
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="Enter song key"
            />
          </div>
        </div>

        {/* Tempo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Tempo</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
              <Activity className="h-4 w-4" />
            </div>
            <input
              type="number"
              value={formData.tempo}
              onChange={handleChange}
              name="tempo"
              step="0.01"
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="Enter tempo"
            />
          </div>
        </div>

        {/* Lyrics */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white">Lyrics</label>
          <div>
            <textarea
              name="lyrics"
              value={formData.lyrics}
              onChange={handleChange}
              className="flex h-24 w-full rounded-md border border-white/10 bg-black p-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-50 text-white"
              placeholder="Enter lyrics"
            />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div>
        <button
          type="submit"
          className="w-full p-3 bg-green-600 hover:bg-green-700 text-white border border-green-500 rounded-md text-sm font-medium transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
}
