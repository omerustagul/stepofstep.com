import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function ConnectionTest() {
    const [status, setStatus] = useState<string>('Testing...');
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<any>(null);
    const [envInfo, setEnvInfo] = useState<any>(null);

    useEffect(() => {
        const testConnection = async () => {
            // 1. Check Env Vars
            const url = import.meta.env.VITE_SUPABASE_URL;
            const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

            setEnvInfo({
                urlDefined: !!url,
                urlStart: url ? url.substring(0, 15) + '...' : 'MISSING',
                keyDefined: !!key
            });

            try {
                // 2. Simple Fetch
                const { data, error } = await supabase
                    .from('wheel_rewards')
                    .select('count', { count: 'exact', head: true });

                if (error) {
                    setStatus('FAILED');
                    setError(error);
                } else {
                    setStatus('SUCCESS');
                    setData(data);
                }
            } catch (err) {
                setStatus('CRITICAL ERROR');
                setError(err);
            }
        };

        testConnection();
    }, []);

    return (
        <div className="p-10 bg-zinc-900 min-h-screen text-white font-mono">
            <h1 className="text-3xl font-bold mb-6 text-orange-500">Database Connection Test</h1>

            <div className="space-y-6">
                <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                    <h2 className="text-xl font-bold mb-2">1. Environment Variables</h2>
                    <pre className="text-sm bg-black p-4 rounded-lg overflow-auto">
                        {JSON.stringify(envInfo, null, 2)}
                    </pre>
                </div>

                <div className={`p-4 rounded-xl border ${status === 'SUCCESS' ? 'bg-green-900/20 border-green-500' : 'bg-red-900/20 border-red-500'}`}>
                    <h2 className="text-xl font-bold mb-2">2. Connection Status: {status}</h2>
                    {error && (
                        <div className="mt-4">
                            <p className="font-bold text-red-400">Error Details:</p>
                            <pre className="text-sm bg-black p-4 rounded-lg overflow-auto text-red-300 mt-2">
                                {JSON.stringify(error, null, 2)}
                            </pre>
                        </div>
                    )}
                    {data !== null && (
                        <div className="mt-4">
                            <p className="font-bold text-green-400">Data Received:</p>
                            <pre className="text-sm bg-black p-4 rounded-lg overflow-auto text-green-300 mt-2">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                    <h2 className="text-xl font-bold mb-2">Troubleshooting</h2>
                    <ul className="list-disc list-inside space-y-2 text-zinc-400">
                        <li>If Status is <strong>SUCCESS</strong>: The database is working. The issue is likely in your app code (AuthContext, RLS, etc.).</li>
                        <li>If Status is <strong>FAILED</strong> with Network Error: Check your AdBlocker, VPN, or Firewall.</li>
                        <li>If Env Vars are <strong>MISSING</strong>: Check your .env file.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
