import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, Vector3, MathUtils } from 'three';
import { Text, Float } from '@react-three/drei';

export function Syringe3D({ onUse }: { onUse: () => void }) {
  const groupRef = useRef<Group>(null);
  const liquidRef = useRef<Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [pulse, setPulse] = useState(0);

  useFrame((state) => {
    if (groupRef.current && !isClicked) {
      // Floating animation
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05;
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
    
    if (liquidRef.current) {
      const p = Math.sin(state.clock.elapsedTime * 4) * 0.1 + 0.9;
      setPulse(p);
    }

    if (isClicked && groupRef.current) {
      // Animation when used: move towards camera and shrink
      groupRef.current.position.z = MathUtils.lerp(groupRef.current.position.z, 1.5, 0.1);
      groupRef.current.scale.lerp(new Vector3(0,0,0), 0.1);
    }
  });

  const handleClick = () => {
    if (isClicked) return;
    setIsClicked(true);
    // Visual feedback immediately, then callback
    setTimeout(onUse, 1000);
  };

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <group 
        ref={groupRef} 
        position={[0, 0, -1]} 
        rotation={[Math.PI / 4, Math.PI / 4, 0]}
        onPointerOver={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onClick={handleClick}
      >
        {/* Syringe Body (Outer Glass) */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.5, 16]} />
          <meshPhysicalMaterial 
            transparent 
            opacity={0.3} 
            roughness={0} 
            transmission={0.9} 
            thickness={0.05} 
            color="#ffffff" 
          />
        </mesh>

        {/* Liquid Inside */}
        <mesh ref={liquidRef} position={[0, -0.05, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.35, 16]} />
          <meshStandardMaterial 
            color="#f43f5e" 
            emissive="#f43f5e" 
            emissiveIntensity={2 * pulse} 
            roughness={0.1}
            metalness={0.8}
          />
        </mesh>

        {/* Needle Base */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.03, 0.08, 0.1, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Needle */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.005, 0.005, 0.2, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0} />
        </mesh>

        {/* Plunger Handle */}
        <mesh position={[0, -0.35, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.02, 16]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
        </mesh>

        {/* Glow Effect */}
        <pointLight color="#f43f5e" intensity={1} distance={2} />

        {/* Label */}
        <Text
          position={[0, 0.7, 0]}
          fontSize={0.08}
          color="#f43f5e"
          font="/fonts/Inter-Bold.woff" // Assuming a standard path or default
          anchorX="center"
          anchorY="middle"
        >
          {isHovered ? "[ CLIQUE PARA USAR ]" : "ADRENALINA-X"}
        </Text>
      </group>
    </Float>
  );
}
