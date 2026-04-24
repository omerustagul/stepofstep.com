import React from 'react';
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'; // Initialize i18n
import App from './App.tsx'
import ErrorBoundary from './components/common/ErrorBoundary';

/**
 * DEFINITIVE FIX FOR "AbortError: signal is aborted without reason"
 * This polyfill provides a mock lock object if the browser aborts the request.
 * This prevents Supabase from hanging indefinitely.
 */
if (typeof navigator !== 'undefined' && navigator.locks) {
    const originalRequest = navigator.locks.request.bind(navigator.locks);
    navigator.locks.request = async (name: any, options: any, callback?: any) => {
        const cb = typeof options === 'function' ? options : callback;
        const mockLock = { name, mode: 'exclusive' };
        
        try {
            return await originalRequest(name, options, async (lock: any) => {
                if (!lock && !options.ifAvailable) {
                    // Fallback if browser returns null but doesn't throw
                    return await cb(mockLock);
                }
                return await cb(lock);
            });
        } catch (e: any) {
            if (e.name === 'AbortError' || e.message?.includes('aborted')) {
                console.warn('[System] Lock aborted, using mock lock');
                return await cb(mockLock);
            }
            // For other errors, try direct execution as last resort
            try {
                return await cb(mockLock);
            } catch (innerErr) {
                throw e;
            }
        }
    };
}

// Global React polyfill for legacy dependencies
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
