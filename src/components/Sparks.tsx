import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { Vector3, Group, Mesh } from 'three';

interface SparksProps {
  position: Vector3;
  color?: string;
  isFiring: boolean;
}

export function Sparks({ position, color = '#f59e0b', isFiring }: SparksProps) {
  const groupRef = useRef<Group>(null);
  const { scene } = useThree();
  const [explosions, setExplosions] = useState<{id: number, pos: Vector3, color: string, time: number}[]>([]);
  const [smallExplosions, setSmallExplosions] = useState<{id: number, pos: Vector3, time: number}[]>([]);
  const [mineralDebris, setMineralDebris] = useState<{id: number, pos: Vector3, color: string, time: number}[]>([]);
  
  useEffect(() => {
    const handleSpark = (e: any) => {
      setExplosions(prev => [...prev, {
        id: Date.now() + Math.random(),
        pos: e.detail.position,
        color: e.detail.color || '#f59e0b',
        time: 0
      }]);
    };
    const handleExplosion = (e: any) => {
      setSmallExplosions(prev => [...prev, {
        id: Date.now() + Math.random(),
        pos: e.detail.position,
        time: 0
      }]);
    };
    const handleMineralDebris = (e: any) => {
      setMineralDebris(prev => [...prev, {
        id: Date.now() + Math.random(),
        pos: e.detail.position,
        color: e.detail.color || '#888888',
        time: 0
      }]);
    };
    window.addEventListener('spawn-spark', handleSpark);
    window.addEventListener('spawn-explosion', handleExplosion);
    window.addEventListener('spawn-mineral-debris', handleMineralDebris);
    return () => {
      window.removeEventListener('spawn-spark', handleSpark);
      window.removeEventListener('spawn-explosion', handleExplosion);
      window.removeEventListener('spawn-mineral-debris', handleMineralDebris);
    };
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map(() => ({
      pos: new Vector3(0, 0, 0),
      vel: new Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3),
      life: Math.random() * 0.3,
      maxLife: 0.1 + Math.random() * 0.2,
      size: 0.008 + Math.random() * 0.02
    }));
  }, []);

  useFrame((state, delta) => {
    // Handle continuous firing sparks
    if (groupRef.current && isFiring) {
      const customColor = groupRef.current.userData.color || color;
      
      // Get world position to calculate correct floor collision
      const worldPos = new Vector3();
      groupRef.current.getWorldPosition(worldPos);

      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        p.life += delta;
        
        if (p.life >= p.maxLife) {
          p.life = 0;
          p.pos.set(0, 0, 0);
          p.vel.set((Math.random() - 0.5) * 4, Math.random() * 5 + 2, (Math.random() - 0.5) * 4);
        } else {
          p.vel.y -= 15 * delta;
          p.pos.addScaledVector(p.vel, delta);
          
          // Floor collision using world position
          if (worldPos.y + p.pos.y < 0) {
            p.pos.y = -worldPos.y;
            p.vel.y *= -0.5;
            p.vel.x *= 0.8;
            p.vel.z *= 0.8;
          }
        }
        
        child.position.copy(p.pos);
        const progress = p.life / p.maxLife;
        const scale = (1 - progress) * p.size;
        child.scale.setScalar(scale);
        
        if ((child as Mesh).material) {
          const mat = (child as Mesh).material as any;
          mat.color.set(customColor);
          mat.emissive.set(customColor);
          mat.opacity = (1 - progress) * 0.8; // Fade out
        }
      });
    }

    // Handle one-off explosions
    setExplosions(prev => {
      const updated = prev.map(exp => ({ ...exp, time: exp.time + delta }));
      return updated.filter(exp => exp.time < 0.5); // Remove after 0.5s
    });

    // Handle small explosions
    setSmallExplosions(prev => {
      const updated = prev.map(exp => ({ ...exp, time: exp.time + delta }));
      return updated.filter(exp => exp.time < 0.4); // Remove after 0.4s
    });

    // Handle mineral debris
    setMineralDebris(prev => {
      const updated = prev.map(exp => ({ ...exp, time: exp.time + delta }));
      return updated.filter(exp => exp.time < 0.6); // Remove after 0.6s
    });
  });

  return (
    <>
      {/* Continuous firing sparks */}
      {isFiring && (
        <group ref={groupRef} position={position}>
          {particles.map((_, i) => (
            <mesh key={i}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} toneMapped={false} transparent />
            </mesh>
          ))}
        </group>
      )}

      {createPortal(
        <group>
          {/* Small explosions */}
          {smallExplosions.map(exp => (
            <group key={exp.id} position={exp.pos}>
              {/* Flash */}
              <mesh scale={exp.time * 10}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={Math.max(0, 1 - exp.time * 5)} />
              </mesh>
              {/* Debris */}
              {Array.from({ length: 6 }).map((_, i) => {
                const progress = exp.time / 0.4;
                const angle = (i / 6) * Math.PI * 2;
                const radius = progress * 1.5;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius + (progress * 2) - (progress * progress * 4);
                const z = Math.sin(angle * 1.5) * radius;
                return (
                  <mesh key={i} position={[x, y, z]} scale={Math.max(0, 1 - progress) * 0.05}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshBasicMaterial color="#ffcc00" transparent opacity={Math.max(0, 1 - progress)} />
                  </mesh>
                );
              })}
            </group>
          ))}

          {/* One-off explosions */}
          {explosions.map(exp => (
            <group key={exp.id} position={exp.pos}>
              {Array.from({ length: 4 }).map((_, i) => {
                const progress = exp.time / 0.3;
                const scale = Math.max(0, 1 - progress) * 0.03; // Smaller scale
                const angle = (i / 4) * Math.PI * 2;
                const radius = progress * 0.8;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius + (progress * 1) - (progress * progress * 2); 
                const z = Math.sin(angle * 2) * radius;
                
                return (
                  <mesh key={i} position={[x, y, z]} scale={scale}>
                    <sphereGeometry args={[1, 4, 4]} />
                    <meshStandardMaterial color={exp.color} emissive={exp.color} emissiveIntensity={2} toneMapped={false} transparent opacity={Math.max(0, 1 - progress)} />
                  </mesh>
                );
              })}
              {/* Smoke puff - smaller and more subtle */}
              <mesh position={[0, exp.time * 0.5, 0]} scale={exp.time * 0.8}>
                <sphereGeometry args={[0.2, 4, 4]} />
                <meshBasicMaterial color="#333333" transparent opacity={Math.max(0, 0.2 - exp.time)} />
              </mesh>
            </group>
          ))}

          {/* Mineral Debris */}
          {mineralDebris.map(exp => (
            <group key={exp.id} position={exp.pos}>
              {Array.from({ length: 8 }).map((_, i) => {
                const progress = exp.time / 0.6;
                const scale = Math.max(0, 1 - progress) * 0.08;
                // Random direction for each chunk
                const seed = (exp.id + i) * 123.456;
                const dirX = Math.sin(seed) * 2;
                const dirY = Math.abs(Math.cos(seed)) * 3 + 1; // Always fly somewhat upwards
                const dirZ = Math.sin(seed * 1.5) * 2;
                
                // Parabola trajectory
                const x = dirX * progress;
                const y = dirY * progress - (progress * progress * 5); // Gravity effect
                const z = dirZ * progress;
                
                return (
                  <mesh key={i} position={[x, y, z]} scale={scale} rotation={[progress * 10, progress * 15, 0]}>
                    <dodecahedronGeometry args={[1, 0]} />
                    <meshStandardMaterial color={exp.color} roughness={0.8} metalness={0.2} />
                  </mesh>
                );
              })}
            </group>
          ))}
        </group>,
        scene
      )}
    </>
  );
}
