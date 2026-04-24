import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export const useHaptics = () => {
    const vibrate = useCallback((pattern: HapticPattern) => {
        if (!navigator.vibrate) return;

        switch (pattern) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(40);
                break;
            case 'heavy':
                navigator.vibrate(70);
                break;
            case 'success':
                navigator.vibrate([10, 30, 10, 30]); // Double tap-like feeel
                break;
            case 'error':
                navigator.vibrate([50, 100, 50, 100]); // Longer, more urgent
                break;
            case 'warning':
                navigator.vibrate([30, 50]);
                break;
        }
    }, []);

    return { vibrate };
};
