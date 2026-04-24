const NoiseOverlay = () => {
    const opacity = 0.4; // Increased from 0.05

    // Disable on mobile to prevent GPU crashes/white screen on iOS
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-[9999] pointer-events-none select-none mix-blend-overlay"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='${opacity}'/%3E%3C/svg%3E")`,
                opacity: 0.4, // Increased from 0.15
            }}
        />
    );
};

export default NoiseOverlay;
