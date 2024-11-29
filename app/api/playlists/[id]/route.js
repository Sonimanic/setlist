import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const playlistsPath = path.join(process.cwd(), 'playlists.json');

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Read the current playlists
    let data = {};
    if (fs.existsSync(playlistsPath)) {
      const fileContent = fs.readFileSync(playlistsPath, 'utf8');
      data = JSON.parse(fileContent);
    }

    // Initialize playlists object if it doesn't exist
    if (!data.playlists) {
      data.playlists = {};
    }

    // Delete the playlist
    delete data.playlists[id];

    // Save the updated playlists
    fs.writeFileSync(playlistsPath, JSON.stringify(data, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const { name } = await request.json();
    
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Read the current playlists
    let data = {};
    if (fs.existsSync(playlistsPath)) {
      const fileContent = fs.readFileSync(playlistsPath, 'utf8');
      data = JSON.parse(fileContent);
    }

    // Initialize playlists object if it doesn't exist
    if (!data.playlists) {
      data.playlists = {};
    }

    // Check if playlist exists
    if (!data.playlists[id]) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    // Update only the name and updated timestamp
    data.playlists[id] = {
      ...data.playlists[id],
      name: name.trim(),
      updated: new Date().toISOString()
    };

    // Save the updated playlists
    fs.writeFileSync(playlistsPath, JSON.stringify(data, null, 2));

    return NextResponse.json({ 
      success: true, 
      id,
      playlist: data.playlists[id]
    });
  } catch (error) {
    console.error('Error updating playlist:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}
