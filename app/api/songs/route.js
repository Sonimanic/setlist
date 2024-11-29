import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const songsFilePath = path.join(process.cwd(), 'data', 'Songs.json');

async function readSongs() {
  const songsFile = await fs.readFile(songsFilePath, 'utf8');
  const songs = JSON.parse(songsFile);
  return songs;
}

async function writeSongs(songs) {
  // Add or update the global timestamp
  songs.updated = new Date().toISOString();
  await fs.writeFile(songsFilePath, JSON.stringify(songs, null, 2));
}

export async function POST(request) {
  try {
    const songData = await request.json();
    const songs = await readSongs();
    
    // Generate a unique ID for the new song
    const songId = crypto.randomUUID();
    
    // Add the new song with the generated ID
    const newSong = {
      id: crypto.randomBytes(3).toString('base64url'),
      ...songData,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    // Ensure the song structure exists
    if (!songs.song) songs.song = {};
    if (!songs.song.other) songs.song.other = {};
    
    // Add the song to the other category
    songs.song.other[newSong.id] = newSong;
    
    // Write the updated songs back to the file
    await writeSongs(songs);
    
    // Return the newly created song and a success message
    return NextResponse.json({ song: newSong, message: 'Song added successfully' });
  } catch (error) {
    console.error('Error in POST /api/songs:', error);
    return NextResponse.json({ error: 'Failed to add song' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { songId, songData } = await request.json();
    const songs = await readSongs();

    // Find which category contains the song
    let songCategory = null;
    for (const [category, songsInCategory] of Object.entries(songs.song)) {
      if (Object.keys(songsInCategory).includes(songId)) {
        songCategory = category;
        break;
      }
    }

    if (!songCategory) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Update the song data
    songs.song[songCategory][songId] = {
      ...songs.song[songCategory][songId],
      ...songData[songId],
      id: songId
    };

    await writeSongs(songs);
    return NextResponse.json({ success: true, song: songs.song[songCategory][songId] });
  } catch (error) {
    console.error('Error editing song:', error);
    return NextResponse.json(
      { error: 'Failed to edit song' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const songs = await readSongs();
    
    // Set cache control headers
    return new NextResponse(JSON.stringify(songs), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error getting songs:', error);
    return NextResponse.json({ error: 'Failed to get songs' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { songId, setlistId } = await request.json();
    console.log('Deleting song with ID:', songId, 'or setlistId:', setlistId); // Debug log
    
    const songs = await readSongs();
    console.log('Current songs structure:', songs.song); // Debug log

    // First try to find the song by its ID
    let found = false;
    let songToDelete = null;
    let categoryToDelete = null;

    // Search through all categories
    for (const category of Object.keys(songs.song || {})) {
      // Search in the category's songs
      const categoryData = songs.song[category];
      
      // If the category is an object and has the song ID as a key
      if (typeof categoryData === 'object') {
        for (const songKey of Object.keys(categoryData)) {
          const song = categoryData[songKey];
          
          // Check if this is the song we want to delete
          if (songKey === songId || (song && song.id === songId)) {
            found = true;
            songToDelete = songKey;
            categoryToDelete = category;
            break;
          }
        }
      }
      
      if (found) break;
    }

    if (!found) {
      console.log('Song not found with ID:', songId); // Debug log
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Delete the song from its category
    console.log('Deleting song:', songToDelete, 'from category:', categoryToDelete); // Debug log
    delete songs.song[categoryToDelete][songToDelete];

    // If the category is empty after deletion, remove it
    if (Object.keys(songs.song[categoryToDelete]).length === 0) {
      delete songs.song[categoryToDelete];
    }

    // Write the updated songs back to the file
    await writeSongs(songs);
    console.log('Successfully deleted song and saved changes'); // Debug log
    
    return new NextResponse(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error deleting song:', error);
    return NextResponse.json(
      { error: 'Failed to delete song: ' + error.message },
      { status: 500 }
    );
  }
}
