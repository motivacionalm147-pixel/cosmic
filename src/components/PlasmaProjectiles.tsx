import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Vector3, Color, PointLight } from 'three';

export interface Projectile {
  position: Vector3;
  velocity: Vector3;
  life: number;
}

interface PlasmaProjectilesProps {
  projectiles: Projectile[];
}

export function PlasmaProjectiles({ projectiles }: PlasmaProjectilesProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Create refs for a few dynamic lights to follow projectiles
  const lightRefs = [
    useRef<PointLight>(null),
    useRef<PointLight>(null),
    useRef<PointLight>(null),
    useRef<PointLight>(null),
    useRef<PointLight>(null)
  ];

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let activeLightIndex = 0;

    projectiles.forEach((p, i) => {
      if (p.life > 0) {
        p.position.addScaledVector(p.velocity, delta);
        p.life -= delta;

        // Collision with ground
        if (p.position.y <= 0.2) {
          p.position.y = 0.2;
          p.life = 0; // Destroy on impact
        }

        dummy.position.copy(p.position);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
        
        // Assign light to this active projectile if we have lights available
        if (activeLightIndex < lightRefs.length) {
          const light = lightRefs[activeLightIndex].current;
          if (light) {
            light.position.copy(p.position);
            light.intensity = 100; // Much brighter light
            light.distance = 40;
          }
          activeLightIndex++;
        }
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      }
    });

    // Turn off unused lights
    for (let i = activeLightIndex; i < lightRefs.length; i++) {
      const light = lightRefs[i].current;
      if (light) {
        light.intensity = 0;
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, 100]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#f97316" 
          emissive="#ea580c" 
          emissiveIntensity={2} 
          toneMapped={false} 
        />
      </instancedMesh>
      
      {/* Dynamic lights for projectiles */}
      {lightRefs.map((ref, i) => (
        <pointLight 
          key={`proj-light-${i}`} 
          ref={ref} 
          color="#f97316" 
          intensity={0} 
          distance={30} 
          decay={1.5} 
        />
      ))}
    </>
  );
}
