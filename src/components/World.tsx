import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Stars, Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, InstancedMesh, Object3D, BackSide, DoubleSide } from 'three';
import { Meteors } from './Meteors';

function DustParticles() {
  const meshRef = useRef<InstancedMesh>(null);
  const count = 1000; // Reduced count
  const dummy = useMemo(() => new Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      pos: new Vector3((Math.random() - 0.5) * 150, Math.random() * 30, (Math.random() - 0.5) * 150),
      speed: Math.random() * 0.01 + 0.005,
      offset: Math.random() * Math.PI * 2
    }));
  }, [count]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const s = 0.02 + Math.sin(time * 1 + p.offset) * 0.01;
      dummy.position.set(
        p.pos.x + Math.sin(time * p.speed + p.offset) * 0.5,
        p.pos.y,
        p.pos.z + Math.cos(time * p.speed + p.offset) * 0.5
      );
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={true}>
      <sphereGeometry args={[1, 3, 3]} />
      <meshBasicMaterial color="#e6c280" transparent opacity={0.2} />
    </instancedMesh>
  );
}

const MOUNTAINS_DATA = (() => {
  const items = [];
  for (let i = 0; i < 40; i++) {
    const angle = (i / 40) * Math.PI * 2 + (Math.random() * 0.2);
    const radius = 100 + Math.random() * 150;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    
    // Stretched height and randomized width/depth for jagged peaks
    const height = 100 + Math.random() * 180;
    const width = 40 + Math.random() * 60;
    const depth = 40 + Math.random() * 60;
    
    // Tilt the mountains slightly
    items.push({ x, z, height, width, depth, rotationX: Math.random() * 0.2, rotationY: Math.random() * Math.PI, rotationZ: Math.random() * 0.2 });
  }
  return items;
})();

function Mountains() {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    MOUNTAINS_DATA.forEach((m, i) => {
      dummy.position.set(m.x, m.height / 2 - 20, m.z);
      dummy.rotation.set(m.rotationX, m.rotationY, m.rotationZ);
      dummy.scale.set(m.width, m.height, m.depth);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MOUNTAINS_DATA.length]} castShadow receiveShadow frustumCulled={false}>
      {/* Detail 1 is critical to give it the rugged rocky look */}
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#78350f" roughness={1.0} metalness={0.1} flatShading={true} />
    </instancedMesh>
  );
}

function SkyObjects() {
  const blackHoleRef = useRef<Object3D>(null);
  const accretionDiskRef = useRef<Object3D>(null);
  const accretionDisk2Ref = useRef<Object3D>(null);
  const glowRef = useRef<Object3D>(null);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (accretionDiskRef.current) {
      accretionDiskRef.current.rotation.z = time * 0.5;
      accretionDiskRef.current.rotation.x = Math.PI / 2.2 + Math.sin(time * 0.2) * 0.1;
    }
    if (accretionDisk2Ref.current) {
      accretionDisk2Ref.current.rotation.z = -time * 0.3;
      accretionDisk2Ref.current.rotation.x = Math.PI / 2.4 + Math.cos(time * 0.15) * 0.1;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(time * 2) * 0.1;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <>
      {/* Giant Gas Planet */}
      <mesh position={[-150, 80, -200]}>
        <sphereGeometry args={[60, 64, 64]} />
        <meshStandardMaterial color="#c2410c" roughness={0.4} metalness={0.1} />
        {/* Rings */}
        <mesh rotation={[Math.PI / 2.5, 0.2, 0]}>
          <ringGeometry args={[70, 100, 64]} />
          <meshStandardMaterial color="#fdba74" transparent opacity={0.6} side={2} />
        </mesh>
      </mesh>

      {/* Distant Blue Planet */}
      <mesh position={[200, 120, -100]}>
        <sphereGeometry args={[30, 32, 32]} />
        <meshStandardMaterial color="#0369a1" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Black Hole */}
      <group position={[50, 150, 250]}>
        {/* Event Horizon */}
        <mesh ref={blackHoleRef}>
          <sphereGeometry args={[20, 32, 32]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        {/* Accretion Disk 1 */}
        <mesh ref={accretionDiskRef} rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[22, 45, 64]} />
          <meshBasicMaterial color="#fcd34d" transparent opacity={0.8} side={2} blending={2} />
        </mesh>
        {/* Accretion Disk 2 */}
        <mesh ref={accretionDisk2Ref} rotation={[Math.PI / 2.4, 0, 0]}>
          <ringGeometry args={[25, 55, 64]} />
          <meshBasicMaterial color="#f59e0b" transparent opacity={0.5} side={2} blending={2} />
        </mesh>
        {/* Glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[35, 32, 32]} />
          <meshBasicMaterial color="#fbbf24" transparent opacity={0.15} blending={2} />
        </mesh>
      </group>
    </>
  );
}

export function World() {
  return (
    <>
      <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
      <ambientLight intensity={0.1} color="#334155" />
      
      {/* Nighttime moon/ambient light */}
      <directionalLight 
        castShadow 
        position={[30, 40, 20]} 
        intensity={0.4} 
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
        shadow-bias={-0.001}
        color="#94a3b8"
      />
      
      {/* Secondary bounce light */}
      <directionalLight 
        position={[-15, -10, -15]} 
        intensity={0.1} 
        color="#1e293b"
      />
      
      <Mountains />
      <SkyObjects />
      <Meteors />
      <DustParticles />
      
      {/* Dark Ground */}
      <mesh name="ground" rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[300, 300]} />
        <meshStandardMaterial color="#9a3412" roughness={0.9} metalness={0.1} />
      </mesh>
    </>
  );
}
