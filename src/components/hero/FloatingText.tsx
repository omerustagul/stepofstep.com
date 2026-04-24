import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Float } from '@react-three/drei';
import * as THREE from 'three';

const FloatingText = ({ isNight = true }: { isNight?: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  const textRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Gentle floating motion based on time
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;

      // Subtle rotation based on mouse position
      const x = state.mouse.x * 0.5;
      const y = state.mouse.y * 0.5;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -y * 0.2, 0.1);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, x * 0.2, 0.1);
    }
  });

  return (
    <group ref={groupRef}>
      <Float
        speed={2}
        rotationIntensity={0.5}
        floatIntensity={0.5}
      >
        <Text
          ref={textRef}
          fontSize={1.2}
          color="#f97316" // Orange-500
          fontWeight="bold"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/raleway/v14/1Ptrg8zYS_SKggPNwK4vaqI.woff"
        >
          STEP OF STEP
          <meshStandardMaterial metalness={0.8} roughness={0.1} />
        </Text>

        <Text
          position={[0, -0.8, 0]}
          fontSize={0.15}
          color={isNight ? "#a1a1aa" : "#52525b"} // Zinc-400 (Night) vs Zinc-600 (Day)
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.2}
        >
          ANTIGRAVITY EDITION
        </Text>
      </Float>
    </group>
  );
};

export default FloatingText;
