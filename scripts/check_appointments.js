
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual Env Parser
const envContent = fs.readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function checkAppointments() {
    const { data, error } = await supabase.from('appointments').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Appointments:', JSON.stringify(data, null, 2));
    }
}

checkAppointments();
