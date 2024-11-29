import { Server } from 'socket.io';

const ioHandler = (req, res) => {
  if (!res.socket.server.io) {
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected');

      // Listen for setlist updates
      socket.on('setlistUpdate', (updatedSetlist) => {
        // Broadcast the update to all other clients
        socket.broadcast.emit('setlistUpdated', updatedSetlist);
      });

      // Listen for playlist updates
      socket.on('playlistUpdate', (updatedPlaylists) => {
        // Broadcast the update to all other clients
        socket.broadcast.emit('playlistsUpdated', updatedPlaylists);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }
  res.end();
};

export const GET = ioHandler;
export const POST = ioHandler;
