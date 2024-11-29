import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

export function useSocket(onSetlistUpdate, onPlaylistsUpdate) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Create socket connection
    const connectSocket = async () => {
      // Initialize socket connection
      await fetch('/api/socket');
      socketRef.current = io();

      // Set up event listeners
      socketRef.current.on('connect', () => {
        console.log('Connected to WebSocket');
      });

      socketRef.current.on('setlistUpdated', (updatedSetlist) => {
        if (onSetlistUpdate) {
          onSetlistUpdate(updatedSetlist);
        }
      });

      socketRef.current.on('playlistsUpdated', (updatedPlaylists) => {
        if (onPlaylistsUpdate) {
          onPlaylistsUpdate(updatedPlaylists);
        }
      });
    };

    connectSocket();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [onSetlistUpdate, onPlaylistsUpdate]);

  // Function to emit setlist updates
  const emitSetlistUpdate = (setlist) => {
    if (socketRef.current) {
      socketRef.current.emit('setlistUpdate', setlist);
    }
  };

  // Function to emit playlist updates
  const emitPlaylistUpdate = (playlists) => {
    if (socketRef.current) {
      socketRef.current.emit('playlistUpdate', playlists);
    }
  };

  return {
    emitSetlistUpdate,
    emitPlaylistUpdate,
  };
}
