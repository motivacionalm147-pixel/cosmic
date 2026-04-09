import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh, MathUtils, Vector3 } from 'three';
import { Text, Float } from '@react-three/drei';

export function OxygenTube3D({ onActivate }: { onActivate: () => void }) {
  const groupRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [pulse, setPulse] = useState(0);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    
    if (groupRef.current && !isActivated) {
      // Gentle floating and rotating
      groupRef.current.position.y = Math.sin(time * 1.5) * 0.05;
      groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
    }

    if (coreRef.current) {
      setPulse(0.8 + Math.sin(time * 3) * 0.2);
    }

    if (isActivated && groupRef.current) {
      // Zoom into camera effect
      groupRef.current.position.z = MathUtils.lerp(groupRef.current.position.z, 2, 0.08);
      groupRef.current.scale.lerp(new Vector3(0, 0, 0), 0.1);
    }
  });

  const handleActivate = () => {
    if (isActivated) return;
    setIsActivated(true);
    setTimeout(onActivate, 1200);
  };

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group 
        ref={groupRef} 
        position={[0, 0, -1.2]} 
        rotation={[Math.PI / 6, 0, 0]}
        onClick={handleActivate}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
      >
        {/* Main Body - Outer Hexagon Case */}
        <mesh>
          <cylinderGeometry args={[0.15, 0.18, 0.4, 6]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Central Core (The Oxygen Level) */}
        <mesh ref={coreRef} position={[0, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.35, 16]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#06b6d4" 
            emissiveIntensity={2 * pulse} 
            transparent 
            opacity={0.8}
          />
        </mesh>

        {/* Glass Cover */}
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.38, 16]} />
          <meshPhysicalMaterial 
            transparent 
            opacity={0.2} 
            transmission={0.9} 
            thickness={0.05} 
            roughness={0} 
          />
        </mesh>

        {/* Connector Rings */}
        <mesh position={[0, 0.22, 0]}>
          <torusGeometry args={[0.13, 0.02, 12, 24]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <torusGeometry args={[0.13, 0.02, 12, 24]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>

        {/* High-Tech Label */}
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.06}
          color="#06b6d4"
          font="/fonts/Inter-Bold.woff"
          anchorX="center"
          anchorY="middle"
        >
          {isHovered ? "[ CLIQUE PARA ATIVAR ]" : "SUPORTE DE O2"}
        </Text>

        <pointLight position={[0, 0, 0]} color="#06b6d4" intensity={1.5} distance={3} />
      </group>
    </Float>
  );
}
