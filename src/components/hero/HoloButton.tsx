import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { playHoverSound } from './SonicManager';

interface HoloButtonProps {
    text: string;
    onClick: () => void;
    position: [number, number, number];
    color?: string;
    primary?: boolean;
}

const HoloButton = ({ text, onClick, position, color = "#f97316", primary = false }: HoloButtonProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Store exact initial position to return to
    const [initialPos] = useState(() => new THREE.Vector3(...position));

    useFrame((state, delta) => {
        if (meshRef.current) {
            // 1. Continuous Rotation
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.3;

            // 2. Hover Scale
            const targetScale = hovered ? 1.4 : 1; // Increased scale for effect
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
            if (hovered) meshRef.current.rotation.z += delta * 1;

            // 3. Neuro-Cursor (Magnetic Attraction)
            // Convert 2D mouse (-1 to 1) to 3D World Position at Z=0
            const vec = new THREE.Vector3(state.mouse.x, state.mouse.y, 0);
            vec.unproject(state.camera);
            const dir = vec.sub(state.camera.position).normalize();
            const distance = -state.camera.position.z / dir.z; // Distance to Z=0 plane
            const cursorPos = state.camera.position.clone().add(dir.multiplyScalar(distance));

            // Calculate distance to initial position of the button
            const distToCursor = cursorPos.distanceTo(initialPos);

            // Physics: Attraction Threshold (Influence Radius)
            const influenceRadius = 2.5;

            if (distToCursor < influenceRadius) {
                // MAGNETIC ENGAGED: Move towards cursor
                // We want it to "lag" behind cursor slightly for weight
                const targetPos = cursorPos.clone().lerp(initialPos, 0.2); // Don't go 100% to cursor, keep some tether
                meshRef.current.position.lerp(targetPos, 0.1);
            } else {
                // TETHER SNAP BACK: Return to orbit
                meshRef.current.position.lerp(initialPos, 0.1);
            }
        }
    });

    return (
        <group position={position}>
            <mesh
                ref={meshRef}
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                onPointerOver={() => {
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                    playHoverSound();
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
            >
                {/* The Holographic Sphere */}
                <icosahedronGeometry args={[primary ? 0.8 : 0.6, 1]} />
                <meshStandardMaterial
                    color={color}
                    wireframe={true}
                    transparent
                    opacity={primary ? 0.8 : 0.4}
                    emissive={color}
                    emissiveIntensity={hovered ? 2 : 0.5}
                />
            </mesh>

            {/* The Label - Floating slightly in front or center */}
            <Text
                position={[0, 0, 0]}
                fontSize={primary ? 0.25 : 0.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
                font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
            >
                {text}
            </Text>

            {/* Optional glow for primary */}
            {primary && (
                <pointLight color={color} intensity={hovered ? 2 : 1} distance={3} />
            )}
        </group>
    );
};

export default HoloButton;
