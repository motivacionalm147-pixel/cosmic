import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, Color, InstancedMesh, Object3D, MeshBasicMaterial } from 'three';

interface FireInstance {
  id: number;
  position: Vector3;
  startTime: number;
  life: number;
}

export function FireEffect() {
  const [fires, setFires] = useState<FireInstance[]>([]);
  const nextId = useRef(0);
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  useEffect(() => {
    const handleSpawnFire = (e: any) => {
      const { position } = e.detail;
      setFires(prev => {
        const newFires = [
          ...prev,
          {
            id: nextId.current++,
            position: position.clone(),
            startTime: performance.now() / 1000,
            life: 0.25
          }
        ];
        // Keep only active fires
        const now = performance.now() / 1000;
        return newFires.filter(f => now - f.startTime < f.life);
      });
    };

    window.addEventListener('spawn-fire', handleSpawnFire);
    return () => window.removeEventListener('spawn-fire', handleSpawnFire);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const now = performance.now() / 1000;
    
    let instanceIdx = 0;
    fires.forEach(fire => {
      const age = now - fire.startTime;
      if (age >= fire.life) return;
      
      const progress = age / fire.life;
      const scale = Math.max(0, 1 - progress);
      
      // 2 particles per fire
      for (let i = 0; i < 2; i++) {
        const pOffset = i * 0.1;
        const pAge = (time + pOffset) % 0.1;
        const pProgress = pAge / 0.1;
        
        dummy.position.set(
          fire.position.x + (Math.random() - 0.5) * 0.05,
          fire.position.y + pAge * 2,
          fire.position.z + (Math.random() - 0.5) * 0.05
        );
        
        dummy.scale.setScalar(scale * (1 - pProgress) * 0.05);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(instanceIdx, dummy.matrix);
        
        color.setHSL(0.05 + Math.sin(time * 20 + i) * 0.05, 1, 0.5);
        meshRef.current!.setColorAt(instanceIdx, color);
        
        instanceIdx++;
      }
    });

    meshRef.current.count = instanceIdx;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;

    // Cleanup fires occasionally
    if (state.clock.elapsedTime % 2 < 0.02) {
      setFires(prev => prev.filter(f => now - f.startTime < f.life));
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 100]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0.4} />
    </instancedMesh>
  );
}
