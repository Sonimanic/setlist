import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const editModeFile = path.join(process.cwd(), 'data', 'edit-mode.json');

// Ensure the data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
  fs.mkdirSync(path.join(process.cwd(), 'data'));
}

// Initialize edit-mode.json if it doesn't exist
if (!fs.existsSync(editModeFile)) {
  fs.writeFileSync(editModeFile, JSON.stringify({ masterDevice: null, lastUpdated: null }));
}

// Helper function to read the current edit mode state
function readEditMode() {
  try {
    const data = fs.readFileSync(editModeFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading edit mode file:', error);
    return { masterDevice: null, lastUpdated: null };
  }
}

// Helper function to write the edit mode state
function writeEditMode(data) {
  try {
    fs.writeFileSync(editModeFile, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error writing edit mode file:', error);
    return false;
  }
}

// GET handler
export async function GET() {
  const editMode = readEditMode();
  
  // If there's a master device but it hasn't been updated in 5 seconds, clear it
  if (editMode.masterDevice && editMode.lastUpdated) {
    const lastUpdate = new Date(editMode.lastUpdated);
    const now = new Date();
    if (now - lastUpdate > 60000) {
      editMode.masterDevice = null;
      editMode.lastUpdated = null;
      writeEditMode(editMode);
    }
  }
  
  return NextResponse.json(editMode);
}

// POST handler
export async function POST(request) {
  try {
    const body = await request.json();
    const { deviceId, action } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID is required' }, { status: 400 });
    }

    const currentState = readEditMode();

    if (action === 'claim') {
      // Only allow claiming if there's no master or if the current master is stale
      if (!currentState.masterDevice || 
          (currentState.lastUpdated && new Date() - new Date(currentState.lastUpdated) > 5000)) {
        writeEditMode({
          masterDevice: deviceId,
          lastUpdated: new Date().toISOString()
        });
        return NextResponse.json({ success: true, masterDevice: deviceId });
      } else {
        return NextResponse.json({ error: 'Another device is currently master' }, { status: 409 });
      }
    } else if (action === 'release') {
      // Only allow the current master to release
      if (currentState.masterDevice === deviceId) {
        writeEditMode({
          masterDevice: null,
          lastUpdated: null
        });
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'Not authorized to release master status' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
