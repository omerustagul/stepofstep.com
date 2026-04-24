import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPS_DIR = path.join(__dirname, '../public/apps');
const OUTPUT_FILE = path.join(__dirname, '../src/config/apps.json');
const CONFIG_DIR = path.join(__dirname, '../src/config');

// Ensure config dir exists
if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Ensure apps dir exists (create if not to avoid error, though strictly it should exist)
if (!fs.existsSync(APPS_DIR)) {
    console.log('Apps directory not found in public/apps. Creating...');
    fs.mkdirSync(APPS_DIR, { recursive: true });
}

try {
    const apps = fs.readdirSync(APPS_DIR).filter(file => {
        return fs.statSync(path.join(APPS_DIR, file)).isDirectory();
    }).map(folder => {
        // Try to read a package.json or config if available for better names, else fall back to folder name
        let niceName = folder.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        return {
            id: folder,
            name: niceName,
            path: `/apps/${folder}/`,
            icon: 'Box' // Default icon, can be improved later
        };
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(apps, null, 2));
    console.log(`Successfully scanned ${apps.length} apps. Config written to ${OUTPUT_FILE}`);
} catch (err) {
    console.error('Error scanning apps:', err);
}
