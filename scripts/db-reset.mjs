import fs from 'fs';
import path from 'path';
import os from 'os';

function getAppDataDir(appName) {
    if (process.platform === 'win32') {
        return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), appName);
    } else if (process.platform === 'darwin') {
        return path.join(os.homedir(), 'Library', 'Application Support', appName);
    } else {
        return path.join(os.homedir(), '.config', appName);
    }
}

const apps = [
    'com.omnidesk.omni-engine',
    'omnidesk-omni-studio',
    'com.omnidesk.omni-profile'
];

let deletedCount = 0;

for (const app of apps) {
    const appDataDir = getAppDataDir(app);
    console.log(`Checking directory: ${appDataDir}`);

    if (fs.existsSync(appDataDir)) {
        // Delete omnidesk.db, omnidesk.db-shm, omnidesk.db-wal
        const dbFiles = ['omnidesk.db', 'omnidesk.db-shm', 'omnidesk.db-wal'];
        
        for (const file of dbFiles) {
            const dbPath = path.join(appDataDir, file);
            if (fs.existsSync(dbPath)) {
                try {
                    fs.unlinkSync(dbPath);
                    console.log(`✅ Deleted: ${dbPath}`);
                    deletedCount++;
                } catch (e) {
                    console.error(`❌ Failed to delete ${dbPath}: ${e.message}`);
                }
            }
        }
    } else {
        console.log(`  (Directory does not exist)`);
    }
}

if (deletedCount === 0) {
    console.log('\nNo local databases found to reset.');
} else {
    console.log(`\n🎉 Successfully deleted ${deletedCount} local database file(s)!`);
}
