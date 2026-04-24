import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Icosahedron } from '@react-three/drei';
import * as THREE from 'three';

interface HapticProductProps {
    onShake: (intensity: number) => void;
}

const HapticProduct = ({ onShake }: HapticProductProps) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [active, setActive] = useState(false);
    const [hovered, setHovered] = useState(false);

    useFrame((_, delta) => {
        if (meshRef.current) {
            // Base rotation
            meshRef.current.rotation.x += delta * 0.2;
            meshRef.current.rotation.y += delta * 0.3;

            // "Heavy" physics feel: changing scale with elasticity
            const targetScale = active ? 0.9 : (hovered ? 1.1 : 1);
            meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
        }
    });

    const handlePointerDown = () => {
        setActive(true);
        // Initial impact - light shake
        onShake(0.2);
    };

    const handlePointerUp = () => {
        setActive(false);
        // Release impact - heavy "thud" shake
        onShake(1.0);
    };

    return (
        <group position={[0, -0.5, 0]}>
            <Icosahedron
                ref={meshRef}
                args={[1, 0]} // radius, detail
                onPointerOver={() => {
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
            >
                <MeshDistortMaterial
                    color={hovered ? "#ff6b00" : "#1a1a1a"}
                    attach="material"
                    distort={0.4}
                    speed={2}
                    roughness={0.2}
                    metalness={0.8}
                />
            </Icosahedron>

            {/* Shadow to ground it */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]}>
                <planeGeometry args={[4, 4]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.2} alphaMap={null} />
                {/* Simple shadow simulation */}
            </mesh>
        </group>
    );
};

export default HapticProduct;
