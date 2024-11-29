const fs = require('fs').promises;
const path = require('path');

async function cleanupBackups() {
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  const currentDataPath = path.join(process.cwd(), 'data', 'setlists.json');

  try {
    // First verify we can read the current data
    const currentData = await fs.readFile(currentDataPath, 'utf8');
    JSON.parse(currentData); // Verify it's valid JSON

    // Create a fresh backup of current data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const newBackupPath = path.join(backupDir, `setlists-${timestamp}.json`);
    await fs.writeFile(newBackupPath, currentData);
    console.log('Created fresh backup:', newBackupPath);

    // Get all backup files
    const files = await fs.readdir(backupDir);
    const backupFiles = files.filter(file => 
      file.startsWith('setlists-') && 
      file.endsWith('.json') && 
      file !== path.basename(newBackupPath)
    );

    // Delete all old backups
    for (const file of backupFiles) {
      await fs.unlink(path.join(backupDir, file));
      console.log('Deleted old backup:', file);
    }

    console.log('\nCleanup complete!');
    console.log('- All old backups removed');
    console.log('- Fresh backup created');
    console.log('- Current data preserved');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupBackups();
