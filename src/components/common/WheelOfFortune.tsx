import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Trophy, X, Sparkles, Gift, AlertCircle, Loader2, Check, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

interface WheelOfFortuneProps {
    onClose: () => void;
}

const WheelOfFortune = ({ onClose }: WheelOfFortuneProps) => {
    const { user } = useAuth();
    const [isSpinning, setIsSpinning] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false); // Always start as false, we have fallback data
    const [canSpin, setCanSpin] = useState(true);
    const [segments, setSegments] = useState<any[]>(() => {
        try {
            const cached = localStorage.getItem('wheel_rewards_cache');
            if (cached) return JSON.parse(cached);

            // Fallback immediately if no cache
            return [
                { label: '1 Ay Pro', color: '#f97316', value: '1 Aylık Pro Üyelik', textColor: '#fff', probability: 5 },
                { label: '%50 İndirim', color: '#18181b', value: '%50 İndirim Kuponu', textColor: '#fff', probability: 10 },
                { label: '1 Ay Basic', color: '#f97316', value: '1 Aylık Basic Üyelik', textColor: '#fff', probability: 15 },
                { label: '%20 İndirim', color: '#18181b', value: '%20 İndirim Kuponu', textColor: '#fff', probability: 20 },
                { label: 'Tekrar Dene', color: '#71717a', value: 'Tekrar Deneyin', textColor: '#fff', probability: 25 },
                { label: '%10 İndirim', color: '#18181b', value: '%10 İndirim Kuponu', textColor: '#fff', probability: 15 },
                { label: 'Danışmanlık', color: '#f97316', value: 'Ücretsiz Danışmanlık', textColor: '#fff', probability: 10 }
            ];
        } catch {
            // Fallback on error
            return [
                { label: '1 Ay Pro', color: '#f97316', value: '1 Aylık Pro Üyelik', textColor: '#fff', probability: 5 },
                { label: '%50 İndirim', color: '#18181b', value: '%50 İndirim Kuponu', textColor: '#fff', probability: 10 },
                { label: '1 Ay Basic', color: '#f97316', value: '1 Aylık Basic Üyelik', textColor: '#fff', probability: 15 },
                { label: '%20 İndirim', color: '#18181b', value: '%20 İndirim Kuponu', textColor: '#fff', probability: 20 },
                { label: 'Tekrar Dene', color: '#71717a', value: 'Tekrar Deneyin', textColor: '#fff', probability: 25 },
                { label: '%10 İndirim', color: '#18181b', value: '%10 İndirim Kuponu', textColor: '#fff', probability: 15 },
                { label: 'Danışmanlık', color: '#f97316', value: 'Ücretsiz Danışmanlık', textColor: '#fff', probability: 10 }
            ];
        }
    });

    const [error, setError] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState<string>('');
    const [nextSpinDate, setNextSpinDate] = useState<Date | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [lastWinningReward, setLastWinningReward] = useState<any>(null);
    const [isClaimed, setIsClaimed] = useState(false);
    const [claimLoading, setClaimLoading] = useState(false);
    const [currentSpinId, setCurrentSpinId] = useState<string | null>(null);
    const [winningSegmentIndex, setWinningSegmentIndex] = useState<number | null>(null);

    // Physics & Audio Refs
    const wheelRef = useRef<HTMLDivElement>(null);
    const clapperRef = useRef<HTMLDivElement>(null);
    const rotationRef = useRef(0);
    const audioCtxRef = useRef<AudioContext | null>(null);
    const lastTickRef = useRef(-1);

    // Audio Tick Sound (Web Audio API - Optimized for sync)
    const playTick = useCallback(() => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }

            // Re-use audio context efficiently
            const osc = audioCtxRef.current.createOscillator();
            const gain = audioCtxRef.current.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, audioCtxRef.current.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, audioCtxRef.current.currentTime + 0.04);

            gain.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.04);

            osc.connect(gain);
            gain.connect(audioCtxRef.current.destination);

            osc.start();
            osc.stop(audioCtxRef.current.currentTime + 0.04);

            // Mechanical Angular Kick-back Animation (Realistic Spring Response)
            if (clapperRef.current) {
                clapperRef.current.animate([
                    { transform: 'translateX(-50%) rotate(0deg)' },
                    { transform: 'translateX(-50%) rotate(30deg)' }, // Reactive swing
                    { transform: 'translateX(-50%) rotate(-5deg)' }, // Slight over-snap back
                    { transform: 'translateX(-50%) rotate(0deg)' }
                ], {
                    duration: 60,
                    easing: 'ease-out'
                });
            }
        } catch (e) { }
    }, []);

    // Countdown logic - Weekly
    useEffect(() => {
        if (canSpin || !nextSpinDate) return;
        const timer = setInterval(() => {
            const now = new Date();
            const diff = nextSpinDate.getTime() - now.getTime();
            if (diff <= 0) {
                setCanSpin(true);
                setTimeLeft('');
                clearInterval(timer);
                return;
            }
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            let timeStr = '';
            if (d > 0) timeStr += `${d}g `;
            timeStr += `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            setTimeLeft(timeStr);
        }, 1000);
        return () => clearInterval(timer);
    }, [canSpin, nextSpinDate]);

    const fetchWheelData = useCallback(async () => {
        const timeout = (ms: number) => new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));

        setError(null);

        try {
            const rewardsPromise = supabase
                .from('wheel_rewards')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true });

            // Increased to 30s as user is experiencing timeouts
            const { data: rewards, error: rewardsError }: any = await Promise.race([
                rewardsPromise,
                timeout(30000)
            ]);

            if (rewardsError) throw rewardsError;

            let finalSegments: any[] = [];

            if (rewards && rewards.length > 0) {
                finalSegments = rewards.map((r: any) => ({
                    id: r.id,
                    label: r.label,
                    value: r.value,
                    color: r.color,
                    textColor: r.text_color,
                    probability: r.probability || 0,
                    reward_type: r.reward_type || 'text',
                    reward_value: r.reward_value || '',
                    file_url: r.file_url || ''
                }));
            } else {
                finalSegments = [
                    { label: '1 Ay Pro', color: '#f97316', value: '1 Aylık Pro Üyelik', textColor: '#fff', probability: 5 },
                    { label: '%50 İndirim', color: '#18181b', value: '%50 İndirim Kuponu', textColor: '#fff', probability: 10 },
                    { label: '1 Ay Basic', color: '#f97316', value: '1 Aylık Basic Üyelik', textColor: '#fff', probability: 15 },
                    { label: '%20 İndirim', color: '#18181b', value: '%20 İndirim Kuponu', textColor: '#fff', probability: 20 },
                    { label: 'Tekrar Dene', color: '#71717a', value: 'Tekrar Deneyin', textColor: '#fff', probability: 25 },
                    { label: '%10 İndirim', color: '#18181b', value: '%10 İndirim Kuponu', textColor: '#fff', probability: 15 },
                    { label: 'Danışmanlık', color: '#f97316', value: 'Ücretsiz Danışmanlık', textColor: '#fff', probability: 10 }
                ];
            }

            setSegments(finalSegments);
            localStorage.setItem('wheel_rewards_cache', JSON.stringify(finalSegments));

            if (user) {
                const { data: spins }: any = await supabase
                    .from('wheel_spins')
                    .select('created_at')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1);

                if (spins && spins.length > 0) {
                    const lastSpin = new Date(spins[0].created_at);

                    // Logic: Reset every Friday at 00:00
                    // Calculate the most recent Friday at 00:00
                    const now = new Date();
                    const currentDay = now.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
                    const daysSinceFriday = (currentDay + 7 - 5) % 7;
                    const lastFriday = new Date(now);
                    lastFriday.setHours(0, 0, 0, 0);
                    lastFriday.setDate(now.getDate() - daysSinceFriday);

                    // If last spin was AFTER the most recent Friday, then user has used their right for this week
                    if (lastSpin >= lastFriday && user.role !== 'admin') {
                        setCanSpin(false);
                        const nextFriday = new Date(lastFriday);
                        nextFriday.setDate(lastFriday.getDate() + 7);
                        setNextSpinDate(nextFriday);
                    }
                }
            } else {
                const lastSpinStr = localStorage.getItem('wheel_last_spin');
                if (lastSpinStr) {
                    const lastSpin = new Date(parseInt(lastSpinStr));

                    const now = new Date();
                    const currentDay = now.getDay();
                    const daysSinceFriday = (currentDay + 7 - 5) % 7;
                    const lastFriday = new Date(now);
                    lastFriday.setHours(0, 0, 0, 0);
                    lastFriday.setDate(now.getDate() - daysSinceFriday);

                    if (lastSpin >= lastFriday) {
                        setCanSpin(false);
                        const nextFriday = new Date(lastFriday);
                        nextFriday.setDate(lastFriday.getDate() + 7);
                        setNextSpinDate(nextFriday);
                    }
                }
            }
        } catch (err: any) {
            console.error('Wheel data error, using fallback:', err);
            // Don't overwrite if we already have cache
            if (segments.length === 0) {
                const fallbackSegments = [
                    { label: '1 Ay Pro', color: '#f97316', value: '1 Aylık Pro Üyelik', textColor: '#fff', probability: 5 },
                    { label: '%50 İndirim', color: '#18181b', value: '%50 İndirim Kuponu', textColor: '#fff', probability: 10 },
                    { label: '1 Ay Basic', color: '#f97316', value: '1 Aylık Basic Üyelik', textColor: '#fff', probability: 15 },
                    { label: '%20 İndirim', color: '#18181b', value: '%20 İndirim Kuponu', textColor: '#fff', probability: 20 },
                    { label: 'Tekrar Dene', color: '#71717a', value: 'Tekrar Deneyin', textColor: '#fff', probability: 25 },
                    { label: '%10 İndirim', color: '#18181b', value: '%10 İndirim Kuponu', textColor: '#fff', probability: 15 },
                    { label: 'Danışmanlık', color: '#f97316', value: 'Ücretsiz Danışmanlık', textColor: '#fff', probability: 10 }
                ];
                setSegments(fallbackSegments);
            }
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchWheelData();

        // Auto-open logic: If user just logged in and had an intent
        if (user && localStorage.getItem('wheel_intent') === 'spin') {
            localStorage.removeItem('wheel_intent');
            // The wheel is already open since this component is mounted. 
            // We could auto-trigger spin here if desired, but better to let user click once more or just ensure it stays open.
        }
    }, [fetchWheelData, user]);

    // Check for session-based auto-open
    useEffect(() => {
        const hasTriggeredThisSession = sessionStorage.getItem('wheel_auto_opened');
        if (!hasTriggeredThisSession && canSpin && !loading && segments.length > 0) {
            // This component is the wheel itself. If it's mounted, it's "open".
            // The logic for self-opening should be in the parent (Home.tsx or a Wrapper)
            sessionStorage.setItem('wheel_auto_opened', 'true');
        }
    }, [canSpin, loading, segments.length]);

    const segmentAngle = 360 / (segments.length || 1);

    const spinWheel = useCallback(async () => {
        if (!user) {
            setShowAuthModal(true);
            localStorage.setItem('wheel_intent', 'spin');
            return;
        }

        if (isSpinning || !canSpin || segments.length === 0) return;

        // Initialize Audio context on user gesture
        if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        setIsSpinning(true);
        setResult(null);
        setWinningSegmentIndex(null);

        // Weighted Random Selection
        const totalWeight = segments.reduce((sum, s) => sum + (s.probability || 0), 0);
        let randomWeight = Math.random() * (totalWeight || 1);
        let winningSegment = segments[0];
        let winningIndex = 0;

        for (let i = 0; i < segments.length; i++) {
            randomWeight -= (segments[i].probability || 0);
            if (randomWeight <= 0) {
                winningSegment = segments[i];
                winningIndex = i;
                break;
            }
        }

        // Calculate proper target rotation to align the winning segment at the top

        // 1. Segment 0 is at -90deg (Top) in SVG.
        // 2. We want the center of the winning segment to align with -90deg (Top).
        // 3. The center of segment existing at index i is: -90 + (i * segmentAngle) + (segmentAngle / 2)
        // 4. To move this center to -90, we need to rotate by negative of the difference.
        // However, simpler logic:
        // Segment 0 center is at 0 relative to wheel start.
        // Segment i center is at i * segmentAngle.
        // To bring Segment i to Top (0), we rotate CCW by i * segmentAngle.
        // CSS Rotate is CW. So we need rotation = - (i * segmentAngle).
        // Add random variation within the segment (-angle/2 to +angle/2) to make it realistic
        // (but keep it safe inside the segment)

        const safeZone = segmentAngle * 0.8; // Use 80% of the segment width
        const randomOffset = (Math.random() - 0.5) * safeZone;

        // Target angle relative to 0 (CCW)
        // ALIGNMENT FIX: Add segmentAngle/2 to center the segment at the top (since segments start at -90deg)
        const targetRotationRelative = (winningIndex * segmentAngle) + (segmentAngle / 2) + randomOffset;

        // Convert to CW rotation needed (360 - target)
        // Ensure we add enough full spins
        const currentRotation = rotationRef.current;
        const extraSpins = 10 * 360;

        // We want final rotation % 360 to be (360 - targetRotationRelative) % 360
        const desiredFinalAngle = (360 - targetRotationRelative) % 360;
        const currentMod = currentRotation % 360;

        let delta = desiredFinalAngle - currentMod;
        if (delta < 0) delta += 360;

        const targetAngle = extraSpins + delta;

        console.log('--- SPIN DEBUG ---');
        console.log('Winning Segment:', winningSegment.label);
        console.log('Winning Index:', winningIndex);
        console.log('Segment Angle:', segmentAngle);
        console.log('Target Rotation (Relative CCW):', targetRotationRelative);
        console.log('Desired Final Angle (MOD 360):', desiredFinalAngle);
        console.log('Current Rotation:', currentRotation);
        console.log('Delta:', delta);
        console.log('Total Target Angle:', targetAngle);
        console.log('------------------');

        let startTimestamp: number | null = null;
        let lastRotation = rotationRef.current;

        const animate = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const elapsed = timestamp - startTimestamp;
            const duration = 7000; // 7 seconds realistic spin

            if (elapsed < duration) {
                // Quintic Ease Out for high speed start and very slow end
                const progress = elapsed / duration;
                const easeOut = 1 - Math.pow(1 - progress, 5);
                const currentTotalRotation = lastRotation + (targetAngle * easeOut);

                if (wheelRef.current) {
                    // Use CSS transform for 60FPS fluid motion
                    wheelRef.current.style.transform = `rotate(${currentTotalRotation}deg)`;
                }

                // Tick Sound Trigger Logic (High precision)
                // Calculate which segment is currently passing the top
                // Total CW rotation. 
                // Position 0 passes top at 0, 360, 720...
                // Segment i passes top at (360 - i*angle)
                const normalizedRot = currentTotalRotation % 360;
                // Determine index under the needle (Top / -90deg visual, but 0 deg logical for calculation above)
                // Actually easier: The segment index is floor((360 - normalizedRot + angle/2) / angle) % count
                const currentIndex = Math.floor(((360 - normalizedRot) + (segmentAngle / 2)) / segmentAngle) % segments.length;

                if (currentIndex !== lastTickRef.current) {
                    playTick();
                    lastTickRef.current = currentIndex;
                }

                requestAnimationFrame(animate);
            } else {
                // Spin finished
                const finalRotation = lastRotation + targetAngle;
                rotationRef.current = finalRotation;
                if (wheelRef.current) {
                    wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
                }

                setIsSpinning(false);
                // setResult(winningSegment.value); // Moved to timeout below
                console.log('SPIN FINISHED. Popup Result:', winningSegment.value);
                setLastWinningReward(winningSegment);
                setWinningSegmentIndex(winningIndex);
                setCanSpin(false);

                // Delay popup to allow user to see the glowing segment (User Request)
                setTimeout(() => {
                    setResult(winningSegment.value);

                    // Trigger Celebration!
                    if (winningSegment.reward_type !== 'try_again') {
                        const duration = 3 * 1000;
                        const animationEnd = Date.now() + duration;
                        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

                        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

                        const interval: any = setInterval(function () {
                            const timeLeft = animationEnd - Date.now();

                            if (timeLeft <= 0) {
                                return clearInterval(interval);
                            }

                            const particleCount = 50 * (timeLeft / duration);
                            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                        }, 250);
                    }
                }, 1500);

                // Update next spin date for local UI
                setNextSpinDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

                // Initial save (unclaimed)
                if (user) {
                    supabase.from('wheel_spins').insert({
                        user_id: user.id,
                        reward_id: winningSegment.id,
                        spin_date: new Date().toISOString().split('T')[0],
                        is_claimed: false,
                        meta_data: {
                            type: winningSegment.reward_type,
                            value: winningSegment.reward_value,
                            file: winningSegment.file_url,
                            label: winningSegment.label
                        }
                    })
                        .select('id')
                        .single()
                        .then(({ data }: any) => {
                            if (data) setCurrentSpinId(data.id);
                            // Sync local storage for UI state (Badge in Home.tsx)
                            localStorage.setItem('wheel_last_spin', Date.now().toString());
                        });
                } else {
                    localStorage.setItem('wheel_last_spin', Date.now().toString());
                    localStorage.setItem('wheel_pending_reward', JSON.stringify(winningSegment));
                }
            }
        };

        requestAnimationFrame(animate);
    }, [isSpinning, canSpin, segments, segmentAngle, user, playTick]);

    const handleClaim = async () => {
        if (!user) {
            setShowAuthModal(true);
            return;
        }

        if (!lastWinningReward || isClaimed) return;

        setClaimLoading(true);
        try {
            // Specialized claim logic based on reward type
            if (lastWinningReward.reward_type === 'membership_discount' && lastWinningReward.reward_value) {
                const [plan, rate] = lastWinningReward.reward_value.split(':');
                // Calculate deadline (7 days from now)
                const deadline = new Date();
                deadline.setDate(deadline.getDate() + 7);

                // Store discount in app_users table
                const { error: upgradeError } = await supabase
                    .from('app_users')
                    .update({
                        discount_rate: parseInt(rate) || 0,
                        discount_plan: plan,
                        discount_deadline: deadline.toISOString()
                    })
                    .eq('auth_id', user.authId);

                if (upgradeError) console.error('Discount update error:', upgradeError);
            }

            // Mark as claimed in DB - UPDATE existing or INSERT if missing
            if (currentSpinId) {
                const { error } = await supabase
                    .from('wheel_spins')
                    .update({
                        is_claimed: true,
                        claimed_at: new Date().toISOString()
                    })
                    .eq('id', currentSpinId);

                if (error) throw error;
            } else {
                // Fallback for cases where ID is missing (e.g. auth flow interruption)
                const { error } = await supabase
                    .from('wheel_spins')
                    .insert({
                        user_id: user.id,
                        reward_id: lastWinningReward.id,
                        spin_date: new Date().toISOString().split('T')[0],
                        is_claimed: true,
                        claimed_at: new Date().toISOString(),
                        meta_data: {
                            type: lastWinningReward.reward_type,
                            value: lastWinningReward.reward_value,
                            file: lastWinningReward.file_url,
                            label: lastWinningReward.label
                        }
                    });

                if (error) throw error;
            }

            if (error) throw error;

            setIsClaimed(true);
            localStorage.removeItem('wheel_pending_reward');

            // Re-fetch to update history/limits
            fetchWheelData();

            // Otomatik kapat (2.5 saniye sonra)
            setTimeout(() => {
                onClose();
            }, 2500);
        } catch (err) {
            console.error('Claim error:', err);
            alert('Ödül alınırken bir hata oluştu. Lütfen tekrar deneyin.');
        } finally {
            setClaimLoading(false);
        }
    };

    // Check if result is a "loss" or "try again"
    // "Bir Hafta Sonra Tekrar Deneyin" or "Üzgünüz..." are losses.
    const resultStr = String(result || '').toLowerCase();
    const isTryAgain = resultStr.includes('tekrar') || resultStr.includes('üzgünüz');

    return (
        <div className="glass fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/50 backdrop-blur-[6px] p-6 md:p-4">
            <div className="relative w-full max-w-lg">
                <div className="bg-[rgb(var(--bg-card))]/80 backdrop-blur-md rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-[rgb(var(--border-primary))]/60 ring-1 ring-white/10">
                    {/* Kapatma Butonu - İçeride */}
                    {/* Kapatma Butonu - İçeride */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:top-8 md:right-8 p-2.5 text-[rgb(var(--text-primary))]/50 hover:text-white transition-all z-50 active:scale-90 bg-[rgb(var(--bg-primary))]/20 hover:bg-red-500/50 rounded-full backdrop-blur-md"
                    >
                        <X size={24} />
                    </button>

                    <div className="text-center mb-10 relative z-20">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <h2 className="text-4xl font-black bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400 bg-clip-text text-transparent tracking-tighter">Çarkı Çevir</h2>
                        </div>
                        <p className="text-zinc-500 font-medium">Şansını Dene, Ödülleri Topla!</p>
                    </div>

                    <div className="relative z-20">

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="animate-spin text-orange-500 mb-4" size={56} />
                                <p className="text-zinc-500 font-bold tracking-widest">YÜKLENİYOR...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <AlertCircle className="text-red-500 mb-4" size={48} />
                                <p className="text-zinc-400 mb-6 font-medium">{error}</p>
                                <button onClick={fetchWheelData} className="px-8 py-3 bg-white text-black rounded-2xl font-black tracking-wider hover:bg-orange-500 hover:text-white transition-all">TEKRAR DENE</button>
                            </div>
                        ) : (
                            <>
                                <div className="relative aspect-square mx-auto mb-10 max-w-[340px]">
                                    {/* OUTER GLOW */}
                                    <div className="absolute -inset-4 bg-orange-500/10 rounded-full blur-2xl" />

                                    {/* OUTER CASE */}
                                    <div className="absolute inset-0 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-950 p-2 shadow-2xl">
                                        <div className="w-full h-full rounded-full bg-zinc-900 border-4 border-zinc-700 flex items-center justify-center">
                                            {/* DECORATIVE DOTS */}
                                            <div className="absolute inset-0 pointer-events-none">
                                                <svg viewBox="0 0 340 340" className="w-full h-full">
                                                    <defs>
                                                        <filter id="dot-glow" x="-50%" y="-50%" width="200%" height="200%">
                                                            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                                            <feMerge>
                                                                <feMergeNode in="coloredBlur" />
                                                                <feMergeNode in="SourceGraphic" />
                                                            </feMerge>
                                                        </filter>
                                                    </defs>
                                                    {[...Array(24)].map((_, i) => {
                                                        const angle = (i * 15 - 90) * (Math.PI / 180); // -90 to start from top
                                                        const r = 160;
                                                        const cx = 170 + r * Math.cos(angle);
                                                        const cy = 170 + r * Math.sin(angle);
                                                        return (
                                                            <circle
                                                                key={i}
                                                                cx={cx}
                                                                cy={cy}
                                                                r="3"
                                                                fill="#f97316"
                                                                fillOpacity="0.6"
                                                                filter="url(#dot-glow)"
                                                            />
                                                        );
                                                    })}
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PREMIUM GOLD POINTER (Triangular) */}
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-30 drop-shadow-2xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                                        <div className="w-8 h-10 bg-gradient-to-b from-amber-200 rounded-xl via-orange-500 to-amber-600 [clip-path:polygon(0%_0%,100%_0%,50%_100%)] relative">
                                            {/* Inner Shine */}
                                            <div className="absolute inset-[2px] rounded-xl bg-gradient-to-b from-orange-400 via-orange-500 to-amber-700 [clip-path:polygon(0%_0%,100%_0%,50%_100%)]">
                                                {/* Highlight Reflection */}
                                                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b rounded-xl from-white/60 to-transparent" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* WHEEL ENGINE */}
                                    <div ref={wheelRef} className="absolute inset-4 transition-transform will-change-transform" style={{ transform: `rotate(0deg)` }}>
                                        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-2xl">
                                            {segments.map((segment, i) => {
                                                const startAngle = i * segmentAngle - 90;
                                                const endAngle = startAngle + segmentAngle;
                                                const startRad = (startAngle * Math.PI) / 180;
                                                const endRad = (endAngle * Math.PI) / 180;
                                                const x1 = 100 + 100 * Math.cos(startRad);
                                                const y1 = 100 + 100 * Math.sin(startRad);
                                                const x2 = 100 + 100 * Math.cos(endRad);
                                                const y2 = 100 + 100 * Math.sin(endRad);
                                                const midAngle = startAngle + segmentAngle / 2;
                                                const textRad = (midAngle * Math.PI) / 180;
                                                // Move text to the middle of the segment for better centering
                                                // Move text a bit further out where the triangle is wider
                                                const textRadius = 72;
                                                const textX = 100 + textRadius * Math.cos(textRad);
                                                const textY = 100 + textRadius * Math.sin(textRad);

                                                // Improved Smart Text Wrapping Logic
                                                const label = segment.label || '';
                                                const words = label.split(' ');

                                                // Dynamic character limit based on segment width (angle)
                                                // Narrower triangles need smaller limits
                                                const charsPerLine = Math.floor(segmentAngle / 4);
                                                const maxCharsPerLine = Math.max(5, Math.min(14, charsPerLine));

                                                let lines: string[] = [];
                                                let currentLine = "";

                                                words.forEach((word: string) => {
                                                    // If a single word is longer than max, we might need to split it or just accept it
                                                    if (word.length > maxCharsPerLine && !currentLine) {
                                                        lines.push(word);
                                                    } else if ((currentLine + (currentLine ? " " : "") + word).length <= maxCharsPerLine) {
                                                        currentLine += (currentLine ? " " : "") + word;
                                                    } else {
                                                        if (currentLine) lines.push(currentLine);
                                                        currentLine = word;
                                                    }
                                                });
                                                if (currentLine) lines.push(currentLine);

                                                // Max 4 lines to avoid vertical overflow
                                                lines = lines.slice(0, 4);

                                                // Base font size scaling - slightly larger as requested
                                                let baseFontSize = 14;
                                                if (segments.length > 6) baseFontSize = 12;
                                                if (segments.length > 10) baseFontSize = 10;
                                                if (segments.length > 14) baseFontSize = 8;

                                                // Adjust for line count and longest line
                                                const longestLine = Math.max(...lines.map(l => l.length));
                                                let fontSize = baseFontSize;

                                                if (longestLine > 8) fontSize *= 0.9;
                                                if (longestLine > 10) fontSize *= 0.8;

                                                if (lines.length === 2) fontSize *= 0.95;
                                                if (lines.length >= 3) fontSize *= 0.85;

                                                fontSize = Math.max(7.5, fontSize);

                                                const isWinner = winningSegmentIndex === i;
                                                const hasWinner = winningSegmentIndex !== null;
                                                const opacity = hasWinner && !isWinner ? 0.4 : 1;
                                                const filter = isWinner ? 'brightness(1.2) contrast(1.1)' : 'none';

                                                return (
                                                    <g key={i}
                                                        className="transition-all duration-700 ease-in-out"
                                                        style={{
                                                            opacity,
                                                            filter,
                                                            transformOrigin: '100px 100px',
                                                            transform: isWinner ? 'scale(1.03)' : 'scale(1)'
                                                        }}
                                                    >
                                                        <path
                                                            d={`M 100 100 L ${x1} ${y1} A 100 100 0 ${segmentAngle > 180 ? 1 : 0} 1 ${x2} ${y2} Z`}
                                                            fill={segment.color}
                                                            stroke="rgba(0,0,0,0.15)"
                                                            strokeWidth="0.5"
                                                        />
                                                        <text
                                                            x={textX}
                                                            y={textY}
                                                            fill={segment.textColor}
                                                            fontSize={fontSize}
                                                            fontWeight="900"
                                                            textAnchor="middle"
                                                            dominantBaseline="middle"
                                                            transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                                                            style={{
                                                                textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                                                letterSpacing: '-0.02em',
                                                                transition: 'all 0.3s ease',
                                                                pointerEvents: 'none'
                                                            }}
                                                        >
                                                            {lines.map((line, idx) => (
                                                                <tspan
                                                                    key={idx}
                                                                    x={textX}
                                                                    dy={idx === 0
                                                                        ? `-${(lines.length - 1) * (fontSize * 0.55)}px`
                                                                        : `${fontSize * 1.1}px`}
                                                                >
                                                                    {line}
                                                                </tspan>
                                                            ))}
                                                        </text>
                                                        <circle cx={x1} cy={y1} r="1.2" fill="rgba(255,255,255,0.3)" />
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </div>

                                    {/* REAL SOLID CENTER BUTTON */}
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${result ? 'opacity-0 scale-50 pointer-events-none' : 'opacity-100 scale-100'}`}>
                                        <div className="relative w-24 h-24 flex items-center justify-center">
                                            {/* BUTTON CAP (The moving part) */}
                                            <button
                                                onClick={spinWheel}
                                                disabled={isSpinning || !canSpin}
                                                className={`
                                                relative w-20 h-20 rounded-full z-10 
                                                flex flex-col items-center justify-center 
                                                transition-all transform-gpu active:translate-y-2
                                                ${isSpinning || !canSpin
                                                        ? 'bg-zinc-800 cursor-not-allowed border-zinc-700 shadow-[0_4px_0_rgb(30,30,30)] scale-95'
                                                        : 'bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 border-white/40 hover:scale-105 active:scale-95 border-b-[8px] border-b-orange-700 active:border-b-[2px]'
                                                    }
                                            `}
                                            >
                                                <div className="hidden md:block absolute inset-0 rounded-full bg-black/10 mix-blend-overlay" />
                                                {isSpinning ? (
                                                    <div className="animate-spin text-white"><Sparkles size={40} /></div>
                                                ) : (
                                                    <>
                                                        <span className="text-[8px] font-black text-white/70 tracking-[0.2em] mb-1">{canSpin ? 'Çevir' : 'Kalan Süre'}</span>
                                                        <span className="text-xs font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                                                            {canSpin ? 'S.O.S' : timeLeft || 'Tükendi'}
                                                        </span>
                                                    </>
                                                )}
                                            </button>

                                            {/* BUTTON BASE (The static part) */}
                                            <div className="absolute inset-0 bg-zinc-950 rounded-full shadow-inner border-4 border-zinc-800 flex items-center justify-center overflow-hidden">
                                                <div className="absolute inset-0 bg-gradient-to-tr from-zinc-900 to-zinc-800" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center py-4 bg-[rgb(var(--bg-secondary))]/50 rounded-2xl border border-[rgb(var(--border-primary))] backdrop-blur-sm">
                                    <p className="text-[rgb(var(--text-primary))] text-xs font-black mb-1">
                                        {canSpin ? 'Ödüller Seni Bekliyor' : 'Çevirebilmek için kalan süreniz:'}
                                    </p>
                                    <p className="text-orange-500 text-sm font-black tabular-nums">
                                        {canSpin ? '🎁 1 Çevirme Hakkınız Var' : `⏳ ${timeLeft}`}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {result && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-40 flex items-center justify-center p-6 bg-zinc-950/40 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{
                                scale: 1,
                                y: 0,
                                opacity: 1,
                                transition: { type: 'spring', damping: 25, stiffness: 300 }
                            }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl p-3 md:p-4 text-center shadow-2xl max-w-[420px] w-full relative overflow-hidden border border-white/20"
                        >
                            {/* Background Decorations */}
                            <div className="absolute -top-12 -left-12 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />

                            <div className="relative z-10">
                                <motion.div
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className={`w-14 h-14 ${isTryAgain ? 'bg-zinc-100' : 'bg-orange-500'} rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg -rotate-3`}
                                >
                                    {isTryAgain ? (
                                        <Gift size={28} className="text-zinc-400" />
                                    ) : (
                                        <Trophy size={28} className="text-white" />
                                    )}
                                </motion.div>

                                <h3 className="text-2xl font-black text-zinc-900 mb-1 tracking-tight">
                                    {isTryAgain ? 'Kısmet Değil!' : 'Tebrikler! 🎉'}
                                </h3>

                                <p className="text-zinc-400 text-xs font-medium mb-6 px-4">
                                    {isTryAgain ? 'Şansını haftaya tekrar dene.' : 'Harika bir ödül kazandın!'}
                                </p>

                                <div className="bg-zinc-50 rounded-2xl p-4 mb-6 border border-zinc-100 relative group overflow-hidden">
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">ÖDÜLÜNÜZ</p>
                                    <p className="text-xl font-black text-orange-600 tracking-tight">{result}</p>
                                </div>

                                {isClaimed ? (
                                    <div className="space-y-4">
                                        <div className="py-3 bg-green-50 text-green-600 rounded-xl font-bold flex items-center justify-center gap-2 text-sm">
                                            <Check size={18} /> {lastWinningReward?.reward_type === 'file' ? 'Dosya Hazır!' : 'Ödül Tanımlandı!'}
                                        </div>

                                        {lastWinningReward?.reward_type === 'file' && lastWinningReward?.file_url && (
                                            <a
                                                href={lastWinningReward.file_url}
                                                download
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full py-4 bg-orange-600 text-white rounded-xl font-bold hover:bg-zinc-900 transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95"
                                            >
                                                <Download size={20} /> İNDİR
                                            </a>
                                        )}

                                        <button onClick={onClose} className="w-full py-2 text-zinc-400 font-bold hover:text-zinc-600 transition-colors text-sm">Kapat</button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <button
                                            onClick={handleClaim}
                                            disabled={claimLoading}
                                            className="w-full h-12 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-all active:scale-95 shadow-lg shadow-zinc-900/10 flex items-center justify-center gap-2"
                                        >
                                            {claimLoading ? <Loader2 className="animate-spin" size={18} /> : (
                                                <>
                                                    <span>{isTryAgain ? 'Anladım' : 'Ödülü Al'}</span>
                                                    {!isTryAgain && <Check size={18} />}
                                                </>
                                            )}
                                        </button>
                                        {!isTryAgain && (
                                            <p className="text-[10px] text-zinc-400 font-medium italic">
                                                * Otomatik olarak hesabınıza eklenecektir.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                onSuccess={handleClaim}
            />
        </div>
    );
};

export default WheelOfFortune;
