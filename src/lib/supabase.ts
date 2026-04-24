import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Aggressive AbortSignal stripper to bypass browser-level fetch cancellations
const customFetch = async (url: string, options: any = {}) => {
  // Remove signal to prevent "AbortError: signal is aborted without reason"
  const { signal, ...otherOptions } = options;
  
  // Add a safety timeout of 10 seconds to any fetch
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      ...otherOptions,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Global Singleton Pattern for Supabase Client
 * Prevents multiple instances and helps survive HMR reloads.
 */
declare global {
  interface Window {
    __SUPABASE_CLIENT__?: any;
  }
}

if (!window.__SUPABASE_CLIENT__) {
  if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Missing environment variables!');
  }
  
  window.__SUPABASE_CLIENT__ = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Use our custom lock-bypass fetch
      storageKey: 'step_auth_token'
    },
    global: {
      fetch: customFetch
    }
  });
}

export const supabase = window.__SUPABASE_CLIENT__;
export default supabase;
