
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
let envConfig = {};

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envConfig = envContent.split('\n').reduce((acc, line) => {
        const [key, ...value] = line.split('=');
        if (key && value) {
            acc[key.trim()] = value.join('=').trim();
        }
        return acc;
    }, {});
} catch (e) {
    console.error('Could not read .env file');
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
    console.log('Fetching site_settings...');
    const { data, error } = await supabase.from('site_settings').select('*').limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('site_settings columns:', data && data.length > 0 ? Object.keys(data[0]) : 'Table empty or no permission');
        if (data && data.length > 0) console.log('Sample row:', data[0]);
    }
}

inspect();
