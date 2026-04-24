import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift } from 'lucide-react';
import WheelOfFortune from './WheelOfFortune';

const FloatingWheelButton = () => {
    const [showWheelInternal, setShowWheelInternal] = useState(false);
    const [hasSpinRight, setHasSpinRight] = useState(false);
    const [isNavbarVisible, setIsNavbarVisible] = useState(true);

    useEffect(() => {
        const checkSpinRight = () => {
            const lastSpinStr = localStorage.getItem('wheel_last_spin');
            if (lastSpinStr) {
                const lastSpin = parseInt(lastSpinStr);
                const nextSpin = lastSpin + 7 * 24 * 60 * 60 * 1000; // 7 days
                if (Date.now() < nextSpin) {
                    setHasSpinRight(false);
                    return;
                }
            }
            setHasSpinRight(true);
        };

        const checkFooterVisibility = () => {
            // Check if we are in Portal or Admin (MobileNavbar is hidden there)
            const isPortalOrAdmin = window.location.pathname.startsWith('/portal') || window.location.pathname.startsWith('/admin');
            if (isPortalOrAdmin) {
                setIsNavbarVisible(false);
                return;
            }

            const footer = document.getElementById('main-footer');
            if (footer) {
                const rect = footer.getBoundingClientRect();
                // Match logic with MobileNavbar: hide when footer top is visible
                if (rect.top <= window.innerHeight) {
                    setIsNavbarVisible(false); // Footer visible, so navbar is hidden
                } else {
                    setIsNavbarVisible(true); // Footer not visible, navbar is visible
                }
            } else {
                setIsNavbarVisible(true);
            }
        };

        checkSpinRight();
        checkFooterVisibility();
        window.addEventListener('scroll', checkFooterVisibility);

        // Check again when modal closes
        if (!showWheelInternal) {
            checkSpinRight();
        }

        return () => window.removeEventListener('scroll', checkFooterVisibility);
    }, [showWheelInternal]);

    return (
        <>
            {showWheelInternal && <WheelOfFortune onClose={() => setShowWheelInternal(false)} />}
            <AnimatePresence>
                {!showWheelInternal && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0, opacity: 0, y: 20 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowWheelInternal(true)}
                        className={`fixed ${isNavbarVisible ? 'bottom-24 md:bottom-8' : 'bottom-8'} right-6 md:right-8 z-40 bg-gradient-to-br from-orange-500 to-amber-500 text-white p-4 rounded-full shadow-2xl shadow-orange-500/40 border-4 border-white/20 group transition-all duration-300`}
                    >
                        <Gift size={28} className="group-hover:rotate-12 transition-transform" />
                        {hasSpinRight && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-white flex items-center justify-center animate-bounce shadow-sm z-50">
                                <span className="text-[10px] font-bold text-white">1</span>
                            </div>
                        )}

                        {/* Tooltip */}
                        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl border border-zinc-700">
                            Hediye Çarkını Çevir!
                        </div>
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
};

export default FloatingWheelButton;
