import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Group } from 'three';

export function Smoke({ targetRef, isActive, isSprinting = false }: { targetRef: React.RefObject<Group>, isActive: boolean, isSprinting?: boolean }) {
  const meshRef = useRef<InstancedMesh>(null);
  const count = 60; // Increased count to handle sprinting and landing
  const dummy = useMemo(() => new Object3D(), []);
  const lastSpawnTime = useRef(0);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: [0, 0, 0],
      scale: 0,
      life: 0,
      velocity: [0, 0, 0]
    }));
  }, []);

  useEffect(() => {
    const handleLandingDust = (e: any) => {
      const { position } = e.detail;
      let spawned = 0;
      for (let i = 0; i < particles.length && spawned < 20; i++) {
        const p = particles[i];
        if (p.life <= 0) {
          p.life = 1.0;
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 0.8;
          p.position = [
            position.x + Math.cos(angle) * radius,
            position.y + 0.1,
            position.z + Math.sin(angle) * radius
          ];
          p.scale = 0.2 + Math.random() * 0.2;
          const speed = 0.08 + Math.random() * 0.12;
          p.velocity = [
            Math.cos(angle) * speed,
            0.02 + Math.random() * 0.05,
            Math.sin(angle) * speed
          ];
          spawned++;
        }
      }
    };
    
    window.addEventListener('spawn-landing-dust', handleLandingDust);
    return () => window.removeEventListener('spawn-landing-dust', handleLandingDust);
  }, [particles]);

  useFrame((state) => {
    if (!meshRef.current || !targetRef.current) return;
    
    const targetPos = targetRef.current.position;
    const time = state.clock.getElapsedTime();

    // Walk speed is 12, sprint is 18
    const stepInterval = isSprinting ? 0.1 : 0.25;
    
    // Spawn a particle if active
    if (isActive && time - lastSpawnTime.current > stepInterval) {
      lastSpawnTime.current = time;
      
      // Spawn more particles when sprinting
      const spawnCount = isSprinting ? 2 : 1;
      
      for (let j = 0; j < spawnCount; j++) {
        const p = particles.find(p => p.life <= 0);
        if (p) {
          p.life = 1;
          // Alternate feet roughly
          const isLeft = Math.sin(time * (isSprinting ? 18 : 12)) > 0;
          p.position = [
            targetPos.x + (isLeft ? -0.2 : 0.2) + (Math.random() - 0.5) * 0.2, 
            targetPos.y + 0.1, 
            targetPos.z + (Math.random() - 0.5) * 0.3
          ];
          p.scale = (isSprinting ? 0.12 : 0.08) + Math.random() * 0.1; // Smaller scale
          p.velocity = [
            (Math.random() - 0.5) * (isSprinting ? 0.05 : 0.02), 
            (isSprinting ? 0.04 : 0.02) + Math.random() * 0.03, 
            (Math.random() - 0.5) * (isSprinting ? 0.05 : 0.02)
          ];
        }
      }
    }

    particles.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= 0.02; // Faster fade
        p.position[0] += p.velocity[0];
        p.position[1] += p.velocity[1];
        p.position[2] += p.velocity[2];
        p.scale += 0.005;
        
        dummy.position.set(p.position[0], p.position[1], p.position[2]);
        dummy.scale.setScalar(p.scale * Math.max(0, p.life));
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
      }
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial color="#64748b" transparent opacity={0.15} depthWrite={false} />
    </instancedMesh>
  );
}
