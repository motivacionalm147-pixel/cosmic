import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh, Color } from 'three';

interface MeteorData {
  id: number;
  pos: Vector3;
  vel: Vector3;
  size: number;
  color: string;
  life: number;
}

export function Meteors() {
  const groupRef = useRef<Group>(null);
  const meteors = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: i,
      pos: new Vector3(
        (Math.random() - 0.5) * 400,
        150 + Math.random() * 100,
        (Math.random() - 0.5) * 400
      ),
      vel: new Vector3(
        (Math.random() - 0.5) * 2 - 1,
        -0.5 - Math.random() * 0.5,
        (Math.random() - 0.5) * 2 - 1
      ).multiplyScalar(0.5),
      size: 0.1 + Math.random() * 0.3,
      color: Math.random() > 0.5 ? '#38bdf8' : '#f59e0b',
      life: Math.random() * 10
    }));
  }, []);

  const meteorRefs = useRef<(Mesh | null)[]>([]);
  const trailRefs = useRef<(Mesh | null)[]>([]);

  const _mTempVel = useMemo(() => new Vector3(), []);
  const _mTempTrail = useMemo(() => new Vector3(), []);

  useFrame((state, delta) => {
    meteors.forEach((m, i) => {
      // Avoid clone: manually add scaled velocity
      m.pos.x += m.vel.x * delta * 50;
      m.pos.y += m.vel.y * delta * 50;
      m.pos.z += m.vel.z * delta * 50;
      
      // Reset meteor if it goes too far
      if (m.pos.y < 50 || m.pos.length() > 500) {
        m.pos.set(
          (Math.random() - 0.5) * 400,
          200 + Math.random() * 50,
          (Math.random() - 0.5) * 400
        );
        m.vel.set(
          (Math.random() - 0.5) * 2 - 1,
          -0.5 - Math.random() * 0.5,
          (Math.random() - 0.5) * 2 - 1
        ).multiplyScalar(0.5);
      }

      const mesh = meteorRefs.current[i];
      const trail = trailRefs.current[i];
      
      if (mesh) {
        mesh.position.copy(m.pos);
        _mTempVel.copy(m.pos).add(m.vel);
        mesh.lookAt(_mTempVel);
      }
      
      if (trail) {
        _mTempTrail.copy(m.pos);
        _mTempTrail.x -= m.vel.x * 5;
        _mTempTrail.y -= m.vel.y * 5;
        _mTempTrail.z -= m.vel.z * 5;
        trail.position.copy(_mTempTrail);
        trail.lookAt(m.pos);
        trail.scale.set(1, 1, 10);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {meteors.map((m, i) => (
        <group key={m.id}>
          {/* Meteor Head */}
          <mesh ref={(el) => (meteorRefs.current[i] = el)}>
            <sphereGeometry args={[m.size, 6, 6]} />
            <meshBasicMaterial color={m.color} />
            {i < 3 && <pointLight color={m.color} intensity={2} distance={10} />}
          </mesh>
          {/* Meteor Trail */}
          <mesh ref={(el) => (trailRefs.current[i] = el)}>
            <cylinderGeometry args={[0, m.size * 0.5, 1, 8]} />
            <meshBasicMaterial color={m.color} transparent opacity={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
