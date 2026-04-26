import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useScroll } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

// Singleton AudioContext
let audioCtx: AudioContext | null = null;
// Global interaction flag
let userHasInteracted = false;

export const initAudio = () => {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // Only attempt to resume if the user has actually interacted to avoid console spam
        if (audioCtx.state === 'suspended' && userHasInteracted) {
            audioCtx.resume().catch(() => {
                // Silently fail if not allowed yet
            });
        }
    } catch (e) {
        // Silently fail for environments without AudioContext support
    }
    return audioCtx;
};

export const playHoverSound = () => {
    const ctx = initAudio();
    if (!ctx) return;

    // Create a crystal ping sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Start high, drop slightly
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

    // Quick fade in/out
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);
};

export const SonicAtmosphere = () => {
    const scroll = useScroll();
    const oscillatorRef = useRef<OscillatorNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);

    // Init drone on user interaction (browser policy)
    useEffect(() => {
        const handleInteraction = () => {
            userHasInteracted = true;
            const ctx = initAudio();
            if (ctx && !oscillatorRef.current) {
                // Create Drone (Low frequency background)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(50, ctx.currentTime);

                // Start silent, volume controlled by scroll
                gain.gain.setValueAtTime(0, ctx.currentTime);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();

                oscillatorRef.current = osc;
                gainRef.current = gain;
            }
            // Clean up listeners once initialized
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            // We keep scroll listener if needed, but R3F handles scroll logic
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
            if (oscillatorRef.current) {
                try {
                    oscillatorRef.current.stop();
                } catch (e) { /* ignore */ }
            }
        };
    }, []);

    useFrame(() => {
        if (gainRef.current && scroll && audioCtx) {
            // Modulate volume/pitch based on scroll speed (delta)
            // delta is roughly 0 to 0.1 per frame depending on speed
            const speed = Math.abs(scroll.delta) * 50;

            // Limit volume to avoid loudness
            const targetGain = Math.min(speed * 0.1, 0.05);

            // Smoothly lerp gain
            gainRef.current.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.1);

            // Modulate pitch slightly (Doppler-like effect)
            if (oscillatorRef.current) {
                const targetFreq = 50 + (speed * 100);
                oscillatorRef.current.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.1);
            }
        }
    });

    return null;
};

export const GlobalSonic = () => {
    const location = useLocation();
    const prevPath = useRef(location.pathname);
    const lastScrollY = useRef(0);
    const audioInitialized = useRef(false);



    // Scroll Sound Refs
    const scrollOscUp = useRef<OscillatorNode | null>(null);
    const scrollOscDown = useRef<OscillatorNode | null>(null);
    const scrollGainUp = useRef<GainNode | null>(null);
    const scrollGainDown = useRef<GainNode | null>(null);

    // Initialize Audio Engine
    useEffect(() => {
        const handleInteraction = () => {
            userHasInteracted = true;
            const ctx = initAudio();
            if (ctx && !audioInitialized.current) {
                audioInitialized.current = true;

                // Setup Scroll Oscillators (Drone-like)
                // Up Drone (Higher Shimmer)
                const oscUp = ctx.createOscillator();
                const gainUp = ctx.createGain();
                oscUp.type = 'sine';
                oscUp.frequency.setValueAtTime(400, ctx.currentTime); // Mid-High
                gainUp.gain.setValueAtTime(0, ctx.currentTime);
                oscUp.connect(gainUp);
                gainUp.connect(ctx.destination);
                oscUp.start();
                scrollOscUp.current = oscUp;
                scrollGainUp.current = gainUp;

                // Down Drone (Deep Bass)
                const oscDown = ctx.createOscillator();
                const gainDown = ctx.createGain();
                oscDown.type = 'triangle';
                oscDown.frequency.setValueAtTime(60, ctx.currentTime); // Low Bass
                gainDown.gain.setValueAtTime(0, ctx.currentTime);
                oscDown.connect(gainDown);
                gainDown.connect(ctx.destination);
                oscDown.start();
                scrollOscDown.current = oscDown;
                scrollGainDown.current = gainDown;
            }
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('mousedown', handleInteraction);
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('keydown', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('mousedown', handleInteraction);

        return () => {
            // Cleanup logic if needed
            if (scrollOscUp.current) try { scrollOscUp.current.stop() } catch { }
            if (scrollOscDown.current) try { scrollOscDown.current.stop() } catch { }
        };
    }, []);

    // Reset and silence all sounds on navigation or visibility change
    useEffect(() => {
        const silenceAll = () => {
            const now = audioCtx?.currentTime || 0;
            if (scrollGainUp.current) scrollGainUp.current.gain.cancelScheduledValues(now);
            if (scrollGainDown.current) scrollGainDown.current.gain.cancelScheduledValues(now);
            if (scrollGainUp.current) scrollGainUp.current.gain.setValueAtTime(0, now);
            if (scrollGainDown.current) scrollGainDown.current.gain.setValueAtTime(0, now);
        };

        if (prevPath.current !== location.pathname) {
            silenceAll();
            playNavSound();
            prevPath.current = location.pathname;
        }

        // Also silence when tab is hidden
        const handleVisibilityChange = () => {
            if (document.hidden) silenceAll();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            silenceAll();
        };
    }, [location]);

    const playNavSound = () => {
        const ctx = initAudio();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        filter.type = 'lowpass';

        osc.frequency.setValueAtTime(100, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.4);

        filter.frequency.setValueAtTime(200, ctx.currentTime);
        filter.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.1);
        filter.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.05); // Reduced volume
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
    };

    // Scroll Logic with improved safety
    useEffect(() => {
        let lastScrollTime = Date.now();
        let scrollTimeout: NodeJS.Timeout;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const delta = currentScrollY - lastScrollY.current;
            const speed = Math.min(Math.abs(delta), 80); 
            const nowTime = Date.now();
            
            lastScrollTime = nowTime;

            const ctx = initAudio();
            if (ctx && audioInitialized.current) {
                const now = ctx.currentTime;

                // Stop sounds if scrolling too slow
                if (speed < 1.5) {
                    if (scrollGainUp.current) scrollGainUp.current.gain.setTargetAtTime(0, now, 0.05);
                    if (scrollGainDown.current) scrollGainDown.current.gain.setTargetAtTime(0, now, 0.05);
                } else {
                    const volume = Math.min(speed * 0.0004, 0.015);

                    if (delta > 0) {
                        if (scrollGainDown.current) scrollGainDown.current.gain.setTargetAtTime(volume, now, 0.1);
                        if (scrollOscDown.current) scrollOscDown.current.frequency.setTargetAtTime(60 + (speed * 0.5), now, 0.1);
                        if (scrollGainUp.current) scrollGainUp.current.gain.setTargetAtTime(0, now, 0.1);
                    } else {
                        if (scrollGainUp.current) scrollGainUp.current.gain.setTargetAtTime(volume, now, 0.1);
                        if (scrollOscUp.current) scrollOscUp.current.frequency.setTargetAtTime(400 + (speed * 2), now, 0.1);
                        if (scrollGainDown.current) scrollGainDown.current.gain.setTargetAtTime(0, now, 0.1);
                    }
                }
            }

            lastScrollY.current = currentScrollY;

            // Failsafe: if no scroll event for 100ms, silence everything
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const ctx = initAudio();
                if (ctx && audioInitialized.current) {
                    const now = ctx.currentTime;
                    if (scrollGainUp.current) scrollGainUp.current.gain.setTargetAtTime(0, now, 0.1);
                    if (scrollGainDown.current) scrollGainDown.current.gain.setTargetAtTime(0, now, 0.1);
                }
            }, 100);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearTimeout(scrollTimeout);
        };
    }, []);

    return null;
};
