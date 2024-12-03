import { Button } from "@/components/ui/button.js";
import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Use path.join to handle paths consistently across environments
const DATA_DIR = path.join(process.cwd(), 'data');
const setlistsPath = path.join(DATA_DIR, 'setlists.json');
const backupDir = path.join(DATA_DIR, 'backups');

// Ensure the backup directory exists
async function ensureBackupDirectory() {
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
  }
}

// Clean up old backups, keeping only the most recent ones
async function cleanupOldBackups(maxBackups = 30) {
  try {
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter(file => file.startsWith('setlists-') && file.endsWith('.json'));
    
    // Sort files by creation time (newest first)
    const sortedFiles = backupFiles.sort().reverse();
    
    // Remove files beyond the maximum count
    for (const file of sortedFiles.slice(maxBackups)) {
      await fs.unlink(path.join(backupDir, file));
    }
  } catch (error) {
    console.error('Error cleaning up old backups:', error);
  }
}

// Create a backup of the setlists file
async function createBackup() {
  try {
    await ensureBackupDirectory();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `setlists-${timestamp}.json`);
    
    // Only create backup if the file exists and has content
    try {
      const content = await fs.readFile(setlistsPath, 'utf8');
      const data = JSON.parse(content);
      if (Object.keys(data.setlists || {}).length > 0) {
        await fs.writeFile(backupPath, content);
        await cleanupOldBackups(); // Clean up after creating new backup
      }
    } catch (error) {
      console.error('Error reading existing setlists for backup:', error);
    }
  } catch (error) {
    console.error('Error creating backup:', error);
  }
}

// Ensure the data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Initialize setlists file if it doesn't exist
async function initializeSetlistsFile() {
  try {
    await fs.access(setlistsPath);
  } catch {
    await fs.writeFile(setlistsPath, JSON.stringify({ setlists: {} }, null, 2));
  }
}

// Read current setlists with detailed error logging
async function readSetlists() {
  try {
    // Check if file exists
    const exists = await fs.access(setlistsPath).then(() => true).catch(() => false);
    
    if (!exists) {
      await fs.writeFile(setlistsPath, JSON.stringify({ setlists: {} }, null, 2));
      return { setlists: {} };
    }
    
    // Read and parse file
    try {
      const data = await fs.readFile(setlistsPath, 'utf8');
      const parsed = JSON.parse(data);
      return parsed;
    } catch (error) {
      console.error('Error reading/parsing setlists file:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in readSetlists:', error);
    throw error;
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET() {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const data = await readSetlists();
    
    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
  } catch (error) {
    console.error('Error in GET route:', error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

export async function POST(request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    await ensureDataDirectory();
    await initializeSetlistsFile();

    // Create a backup before making any changes
    await createBackup();

    const requestData = await request.json();
    const currentData = await readSetlists();

    // If we're updating all setlists
    if (requestData.setlists) {
      // Validate that we're not accidentally clearing all setlists
      if (Object.keys(requestData.setlists).length === 0 && Object.keys(currentData.setlists).length > 0) {
        throw new Error('Cannot overwrite with empty setlists');
      }

      await fs.writeFile(setlistsPath, JSON.stringify({ setlists: requestData.setlists }, null, 2));
      return new NextResponse(JSON.stringify({ success: true }), {
        status: 200,
        headers: headers
      });
    }
    
    // If we're creating a new setlist
    if (requestData.name && requestData.setlist) {
      // Generate a unique ID
      const id = crypto.randomBytes(16).toString('hex');

      // Add new setlist
      const newSetlists = {
        ...currentData.setlists,
        [id]: {
          name: requestData.name,
          setlist: requestData.setlist,
          created: new Date().toISOString(),
          updated: new Date().toISOString()
        }
      };

      // Save updated setlists
      await fs.writeFile(setlistsPath, JSON.stringify({ setlists: newSetlists }, null, 2));
      
      return new NextResponse(JSON.stringify({ success: true, id }), {
        status: 200,
        headers: headers
      });
    }

    throw new Error('Invalid request data');
  } catch (error) {
    console.error('Error saving setlists:', error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Failed to save setlists' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

export async function PUT(request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    await ensureDataDirectory();
    await initializeSetlistsFile();

    // Create a backup before making any changes
    await createBackup();

    const requestData = await request.json();
    const currentData = await readSetlists();

    if (!requestData.id) {
      throw new Error('No setlist ID provided');
    }

    // Update the specified setlist
    const updatedSetlists = {
      ...currentData.setlists,
      [requestData.id]: {
        ...currentData.setlists[requestData.id],
        ...requestData,
        updated: new Date().toISOString()
      }
    };

    await fs.writeFile(setlistsPath, JSON.stringify({ setlists: updatedSetlists }, null, 2));
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('Error updating setlist:', error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Failed to update setlist' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}

export async function DELETE(request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    await ensureDataDirectory();
    await initializeSetlistsFile();

    // Create a backup before making any changes
    await createBackup();

    const requestData = await request.json();
    const currentData = await readSetlists();

    if (!requestData.id) {
      throw new Error('No setlist ID provided');
    }

    // Remove the specified setlist
    const { [requestData.id]: removedSetlist, ...remainingSetlists } = currentData.setlists;

    await fs.writeFile(setlistsPath, JSON.stringify({ setlists: remainingSetlists }, null, 2));
    return new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: headers
    });
  } catch (error) {
    console.error('Error deleting setlist:', error);
    return new NextResponse(JSON.stringify({ error: error.message || 'Failed to delete setlist' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }
}
