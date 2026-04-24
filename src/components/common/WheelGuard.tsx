import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import WheelOfFortune from './WheelOfFortune';
import { useAuth } from '../../context/AuthContext';

const WheelGuard = () => {
    const [showWheel, setShowWheel] = useState(false);
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        // Don't show wheel on admin or auth pages
        const isExcludedPath = location.pathname.startsWith('/admin') ||
            location.pathname.startsWith('/login') ||
            location.pathname.startsWith('/register');

        if (isExcludedPath) return;

        // Auto-open logic: Trigger once per session
        const hasTriggered = sessionStorage.getItem('wheel_session_triggered');

        if (!hasTriggered) {
            // Delay auto-open slightly for better UX
            const timer = setTimeout(() => {
                setShowWheel(true);
                sessionStorage.setItem('wheel_session_triggered', 'true');
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [location.pathname]);

    // Handle post-login auto-open (localStorage intent)
    useEffect(() => {
        const intent = localStorage.getItem('wheel_intent');
        if (isAuthenticated && intent === 'spin') {
            setShowWheel(true);
        }
    }, [isAuthenticated]);

    if (!showWheel) return null;

    return <WheelOfFortune onClose={() => setShowWheel(false)} />;
};

export default WheelGuard;
