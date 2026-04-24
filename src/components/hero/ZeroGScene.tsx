import { useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ScrollControls, Scroll, Stars, CameraShake } from '@react-three/drei';
import * as THREE from 'three';
import FloatingText from './FloatingText';
import HapticProduct from './HapticProduct';
import HoloButton from './HoloButton';
import { SonicAtmosphere } from './SonicManager';
import { motion } from 'framer-motion';
// import { useTranslation } from 'react-i18next';

const ZeroGScene = () => {
    // Portal Transition State
    const [transitionTarget, setTransitionTarget] = useState<THREE.Vector3 | null>(null);

    // State to control camera shake intensity
    const [shakeIntensity, setShakeIntensity] = useState(0);

    const handleTransition = (pos: [number, number, number], elementId: string) => {
        // Start camera flight
        setTransitionTarget(new THREE.Vector3(...pos));

        // Navigate after animation
        setTimeout(() => {
            document.getElementById(elementId)?.scrollIntoView({ behavior: 'smooth' });
            // Reset after nav (optional, or unmount)
            setTimeout(() => setTransitionTarget(null), 1000);
        }, 1500);
    };

    // Temporal Bridge: Check time of day
    const [isNight, setIsNight] = useState(true);

    useEffect(() => {
        const hour = new Date().getHours();
        // Night is between 6 PM (18) and 6 AM (6)
        setIsNight(hour >= 18 || hour < 6);
    }, []);

    const handleShake = (intensity: number) => {
        setShakeIntensity(intensity);
        // Reset shake after a short burst to simulate an impact/thud
        setTimeout(() => setShakeIntensity(0), 500);
    };

    return (
        <div className={`h-screen w-full relative transition-colors duration-1000 ${isNight ? 'bg-zinc-950' : 'bg-orange-50'}`}>
            <Canvas
                camera={{ position: [0, 0, 5], fov: 50 }}
                dpr={[1, 2]}
                gl={{ antialias: true, alpha: true }}
            >
                {/* Temporal Atmosphere */}
                <color attach="background" args={[isNight ? '#09090b' : '#fff7ed']} />
                <fog attach="fog" args={[isNight ? '#09090b' : '#fff7ed', 5, 20]} />

                <ambientLight intensity={isNight ? 0.2 : 0.8} />
                <pointLight position={[10, 10, 10]} intensity={isNight ? 0.5 : 1} />
                <spotLight position={[-10, -10, -10]} intensity={isNight ? 0.5 : 0.2} />

                {/* Camera Shake Effect - Controlled by product interaction */}
                <CameraShake
                    maxYaw={0.05 * shakeIntensity}
                    maxPitch={0.05 * shakeIntensity}
                    maxRoll={0.05 * shakeIntensity}
                    yawFrequency={10 * shakeIntensity}
                    pitchFrequency={10 * shakeIntensity}
                    rollFrequency={10 * shakeIntensity}
                    intensity={shakeIntensity}
                    decay={true}
                    decayRate={0.65}
                />

                <ScrollControls pages={1.5} damping={0.2}>
                    <Scroll>
                        {/* Audio Engine */}
                        <SonicAtmosphere />

                        {/* Main Content */}
                        <FloatingText isNight={isNight} />

                        {/* The Haptic Product - Interactive Object */}
                        {/* Moved up to be visible immediately */}
                        <group position={[0, -1.2, 0]}>
                            <HapticProduct onShake={handleShake} />
                        </group>

                        {/* Holographic Buttons */}
                        <group position={[0, -1.5, 0]}>
                            {/* Primary Button: Projeye Başla */}
                            <HoloButton
                                text="PROJE"
                                position={[-1.2, 0, 0]}
                                onClick={() => handleTransition([-1.2, -1.5, 0], 'contact')}
                                primary={true}
                                color="#f97316"
                            />

                            {/* Secondary Button: İşler (References) */}
                            <HoloButton
                                text="İŞLER"
                                position={[1.2, 0, 0]}
                                onClick={() => handleTransition([1.2, -1.5, 0], 'portfolio')}
                                primary={false}
                                color="#a1a1aa"
                            />
                        </group>
                    </Scroll>

                    <CameraController target={transitionTarget} />

                    <Scroll html>
                        <div className="w-screen h-screen flex flex-col items-center justify-center pointer-events-none">
                            {/* Overlay Content - Restored from Home.tsx */}
                            <div className="relative z-10 text-center px-6 max-w-5xl mx-auto mt-[-10vh] pointer-events-auto">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <span className="px-4 py-2 rounded-full border border-orange-200 text-orange-600 bg-orange-50/80 backdrop-blur-md text-sm font-semibold mb-6 inline-block">
                                        DİJİTAL DEVRİM BURADA
                                    </span>

                                    {/* 3D Text is behind, so we keep this empty or use it for subtitle/buttons only 
                                        Actually, user wants brand alignment. Let's keep the HTML title as fallback/SEO 
                                        or use it for the detailed text while 3D handles the big impact.
                                    */}

                                    <p className="text-md md:text-2xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed mt-[10vh]">
                                        Sıradanlığa meydan okuyun. Markanızı yerçekimsiz bir deneyimle geleceğe taşıyın.
                                    </p>

                                    {/* HTML Buttons Removed - Replaced by Holograms */}
                                </motion.div>
                            </div>
                        </div>
                    </Scroll>
                </ScrollControls>

                <Stars
                    radius={100}
                    depth={50}
                    count={isNight ? 5000 : 500} // Fewer stars in day
                    factor={4}
                    saturation={0}
                    fade
                    speed={1}
                />
            </Canvas>

            <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>
    );
};

const CameraController = ({ target }: { target: THREE.Vector3 | null }) => {
    const { camera } = useThree();

    useFrame((_state, delta) => {
        if (target) {
            // "Wormhole" Acceleration: Move camera towards target
            // Lerp is good, but acceleration is better for "warp" feel.
            // Simple lerp for robustness:
            camera.position.lerp(target, delta * 3);

            // Add some roll for dizziness/portal effect
            camera.rotation.z += delta * 2;
        } else {
            // Return to idle state (optional)
            // camera.position.lerp(new THREE.Vector3(0,0,5), delta);
        }
    });

    return null;
};

export default ZeroGScene;
