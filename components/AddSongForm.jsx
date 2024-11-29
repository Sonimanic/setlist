'use client';
import { useState } from 'react';
import { nanoid } from 'nanoid';
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

export default function AddSongForm({ onAddSong, onClose }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const songId = nanoid(6);
    const newSong = {
      id: songId,
      name: formData.name,
      artist: formData.artist,
      key: formData.key,
      tempo: formData.tempo ? `${parseFloat(formData.tempo).toFixed(2)}` : '0.00',
      duration: timeToSeconds(durationDisplay).toString(),
      lyrics: formData.lyrics ? formData.lyrics.replace(/\n/g, '<br>') : '',
    };
    
    onAddSong(newSong);
    
    // Reset form
    setFormData({
      name: '',
      artist: '',
      key: '',
      tempo: '',
      tempo_subdivision: '0',
      duration: '0',
      lyrics: '',
    });
    setDurationDisplay('0:00');
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
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const isFormValid = formData.name.trim() && formData.artist.trim() && formData.key.trim() && formData.tempo && durationDisplay && durationDisplay !== '0:00';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      <div className="grid gap-6">
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
              required
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="Enter song name"
            />
          </div>
        </div>

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
              required
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="Enter artist name"
            />
          </div>
        </div>

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
              required
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="0:00"
            />
          </div>
        </div>

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
              required
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="Enter song key"
            />
          </div>
        </div>

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
              required
              step="0.01"
              className="w-full p-3 pl-10 rounded-md bg-black border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 text-white placeholder-gray-400"
              placeholder="Enter tempo"
            />
          </div>
        </div>

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
          <p className="text-xs text-gray-400">
            Line breaks will be preserved
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button
          type="submit"
          disabled={!isFormValid}
          className={`w-full p-3 rounded-md text-sm font-medium transition-colors ${
            isFormValid 
              ? 'bg-green-600 hover:bg-green-700 text-white border border-green-500' 
              : 'bg-gray-800 text-gray-400 cursor-not-allowed border border-white/10'
          }`}
        >
          Add Song
        </button>
      </div>
    </form>
  );
}
