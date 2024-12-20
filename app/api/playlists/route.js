import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

const setlistsPath = path.join(process.cwd(), 'data', 'setlists.json');
const backupDir = path.join(process.cwd(), 'data', 'backups');

// Ensure the backup directory exists
async function ensureBackupDirectory() {
  try {
    await fs.access(backupDir);
  } catch {
    await fs.mkdir(backupDir, { recursive: true });
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
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
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

// Read current setlists
async function readSetlists() {
  try {
    const data = await fs.readFile(setlistsPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading setlists:', error);
    return { setlists: {} };
  }
}

export async function GET() {
  try {
    await ensureDataDirectory();
    await initializeSetlistsFile();
    const data = await readSetlists();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading setlists:', error);
    return NextResponse.json({ setlists: {} });
  }
}

export async function POST(request) {
  try {
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
      return NextResponse.json({ success: true });
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
      
      return NextResponse.json({ success: true, id });
    }

    throw new Error('Invalid request data');
  } catch (error) {
    console.error('Error saving setlists:', error);
    return NextResponse.json({ error: error.message || 'Failed to save setlists' }, { status: 500 });
  }
}
