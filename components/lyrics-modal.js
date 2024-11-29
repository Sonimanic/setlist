"use client";

import * as React from "react";
import { X } from "lucide-react";

// Format duration for display (HH:MM:SS if over an hour, MM:SS otherwise)
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

export function LyricsModal({ isOpen, onClose, song }) {
  if (!isOpen) return null;
  if (!song) {
    console.error('No song data provided to LyricsModal');
    return null;
  }

  console.log('Song data in modal:', {
    name: song.name,
    artist: song.artist,
    key: song.key,
    tempo: song.tempo,
    duration: song.duration,
    hasLyrics: !!song.lyrics
  });

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50">
      <div className="fixed inset-0 w-full bg-black transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-screen">
          {/* Header */}
          <div className="flex justify-between items-center pt-14 px-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-semibold text-white">{song.name}</h2>
              <p className="text-sm text-gray-400">{song.artist}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-6 pt-1">
              {/* Song Details */}
              <div className="flex justify-between gap-4">
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-400">Key</p>
                  <p className="text-white">{song.key || 'Not specified'}</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-400">Tempo</p>
                  <p className="text-white">{song.tempo || 'Not specified'} BPM</p>
                </div>
                <div className="flex flex-col items-center">
                  <p className="text-sm font-medium text-gray-400">Duration</p>
                  <p className="text-white">{formatDuration(song.duration)}</p>
                </div>
              </div>

              {/* Lyrics */}
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">Lyrics</h3>
                <div className="whitespace-pre-wrap text-gray-300 font-mono">
                  {song.lyrics ? (
                    <div dangerouslySetInnerHTML={{ __html: song.lyrics }} />
                  ) : (
                    <p className="text-gray-500 italic">No lyrics available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
