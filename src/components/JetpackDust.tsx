import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, Group, Color, Vector3 } from 'three';

export function JetpackDust({ targetRef, isFlying, isSprinting = false, isMoving = false, isFalling = false }: { targetRef: React.RefObject<Group>, isFlying: boolean, isSprinting?: boolean, isMoving?: boolean, isFalling?: boolean }) {
  const meshRef = useRef<InstancedMesh>(null);
  const fireMeshRef = useRef<InstancedMesh>(null);
  const coreMeshRef = useRef<InstancedMesh>(null);
  const windMeshRef = useRef<InstancedMesh>(null);
  const count = 80; // More particles for downdraft
  const fireCount = 150; // Denser stream for "perfect" look
  const windCount = 40; // Wind streaks for falling
  const dummy = useMemo(() => new Object3D(), []);
  const fireLightRef = useRef<any>(null);
  
  // Pre-allocate vectors to avoid GC
  const v1 = useMemo(() => new Vector3(), []);
  const v2 = useMemo(() => new Vector3(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      relPos: [0, 0, 0],
      scale: 0,
      life: 0,
      velocity: [0, 0, 0]
    }));
  }, []);

  const fireParticles = useMemo(() => {
    return Array.from({ length: fireCount }, () => ({
      worldPos: new Vector3(),
      worldVel: new Vector3(),
      life: 0,
      scale: 0,
      color: new Color()
    }));
  }, []);

  const windParticles = useMemo(() => {
    return Array.from({ length: windCount }, () => ({
      pos: new Vector3(),
      vel: new Vector3(),
      life: 0,
      scale: 0
    }));
  }, []);

  const isThrusting = isFlying;

  useFrame((state, delta) => {
    if (!meshRef.current || !targetRef.current || !fireMeshRef.current) return;
    
    // CRITICAL: Ensure world matrix is updated before any calculations
    targetRef.current.updateMatrixWorld();
    const worldMatrix = targetRef.current.matrixWorld;
    const targetPos = v1.setFromMatrixPosition(worldMatrix);
    const time = state.clock.getElapsedTime();
    
    if (fireLightRef.current) {
      if (isThrusting) {
        fireLightRef.current.visible = true;
        // More intense, rapid flicker for cinematic feel
        fireLightRef.current.intensity = (isFlying ? 4 : 2) + Math.sin(time * 60) * 1.0 + Math.random() * 0.5;
        v2.set(0, 0.6, -0.4); // Position light slightly lower than nozzles
        v2.applyMatrix4(worldMatrix);
        fireLightRef.current.position.copy(v2);
      } else {
        fireLightRef.current.visible = false;
      }
    }
    
    // 1. DUST ON GROUND (Centered under player)
    const groundDist = targetPos.y;
    const dustIntensity = Math.max(0, 1 - (groundDist / 8)); // Effect starts at 8m height
    
    if (isThrusting && dustIntensity > 0.1) {
      const spawnRate = Math.floor((isFlying ? 4 : 2) * dustIntensity); 
      for (let i = 0; i < spawnRate; i++) {
        const p = particles.find(p => p.life <= 0);
        if (p) {
          p.life = 1.0;
          const angle = Math.random() * Math.PI * 2;
          const radius = 0.05 + Math.random() * 0.4;
          p.relPos = [
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
          ];
          p.scale = 0.05 + Math.random() * 0.2;
          const speed = (0.3 + Math.random() * 0.6) * dustIntensity;
          p.velocity = [
            Math.cos(angle) * speed, 
            0.01 + Math.random() * 0.03, 
            Math.sin(angle) * speed
          ];
        }
      }
    }

    particles.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= 0.03;
        p.relPos[0] += p.velocity[0] * 0.016;
        p.relPos[1] += p.velocity[1];
        p.relPos[2] += p.velocity[2] * 0.016;
        
        p.velocity[0] *= 0.92;
        p.velocity[2] *= 0.92;
        p.scale += 0.01;
        
        dummy.position.set(
          targetPos.x + p.relPos[0],
          0.05 + p.relPos[1],
          targetPos.z + p.relPos[2]
        );
        
        dummy.scale.setScalar(p.scale * Math.max(0, p.life));
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      }
    });
    meshRef.current.instanceMatrix.needsUpdate = true;

    // 2. JETPACK FIRE STREAM (World Space Simulation)
    if (isThrusting) {
      const spawnCount = isFlying ? 6 : 3; // Slightly less dense for cinematic feel
      for (let i = 0; i < spawnCount; i++) {
        const p = fireParticles.find(p => p.life <= 0);
        if (p) {
          p.life = 1.0;
          const nozzleId = Math.random() > 0.5 ? 0 : 1;
          const nozzleX = nozzleId === 0 ? -0.15 : 0.15;
          
          // Calculate world start position
          // Thrusters are at [+/- 0.15, 1.2, -0.55] relative to player origin
          v2.set(
            nozzleX + (Math.random() - 0.5) * 0.02,
            1.2, 
            -0.55 + (Math.random() - 0.5) * 0.02
          );
          v2.applyMatrix4(worldMatrix);
          p.worldPos.copy(v2);
          
          // Calculate world velocity (Local direction rotated to world)
          const thrustSpeed = isFlying ? 0.8 : 0.4;
          v2.set(
            (Math.random() - 0.5) * 0.05,
            (-4 - Math.random() * 2) * thrustSpeed, // Slower down
            (-1 - Math.random() * 1) * thrustSpeed   // Slower back
          );
          // Rotate local velocity vector by player's world rotation
          v2.applyQuaternion(targetRef.current!.quaternion);
          p.worldVel.copy(v2);
          
          p.scale = (0.06 + Math.random() * 0.08) * (isFlying ? 1 : 0.6); 
        }
      }
    }

    fireParticles.forEach((p, i) => {
      if (p.life > 0) {
        p.life -= 0.12; 
        
        // Move in world space
        p.worldPos.x += p.worldVel.x * 0.016;
        p.worldPos.y += p.worldVel.y * 0.016;
        p.worldPos.z += p.worldVel.z * 0.016;
        
        dummy.position.copy(p.worldPos);
        dummy.scale.setScalar(p.scale * p.life);
        dummy.updateMatrix();
        fireMeshRef.current!.setMatrixAt(i, dummy.matrix);
        
        if (p.life > 0.8) p.color.set('#60a5fa'); 
        else if (p.life > 0.4) p.color.set('#fb923c'); 
        else p.color.set('#ef4444'); 
        
        fireMeshRef.current!.setColorAt(i, p.color);
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        fireMeshRef.current!.setMatrixAt(i, dummy.matrix);
      }
    });
    fireMeshRef.current.instanceMatrix.needsUpdate = true;
    if (fireMeshRef.current.instanceColor) fireMeshRef.current.instanceColor.needsUpdate = true;

    // 3. CORE BEAMS (Always attached and tilting)
    if (isThrusting && coreMeshRef.current) {
      [0, 1].forEach((id) => {
        const nozzleX = id === 0 ? -0.15 : 0.15;
        const beamHeight = (0.4 + Math.sin(time * 50) * 0.1 + Math.random() * 0.1) * (isFlying ? 1 : 0.5);
        
        // Position the beam so its top is at the nozzle
        v2.set(nozzleX, 1.2 - beamHeight / 2, -0.55); 
        v2.applyMatrix4(worldMatrix);
        
        dummy.position.copy(v2);
        dummy.quaternion.setFromRotationMatrix(worldMatrix);
        // Rotate 180 deg to point down (cylinder is Y-up)
        dummy.rotateX(Math.PI);
        dummy.scale.set(0.12 * (isFlying ? 1 : 0.6), beamHeight, 0.12 * (isFlying ? 1 : 0.6)); 
        dummy.updateMatrix();
        coreMeshRef.current!.setMatrixAt(id, dummy.matrix);
      });
      coreMeshRef.current.visible = true;
    } else if (coreMeshRef.current) {
      coreMeshRef.current.visible = false;
    }
    // 4. WIND EFFECTS (Falling)
    if (isFalling && windMeshRef.current) {
      const spawnCount = 2;
      for (let i = 0; i < spawnCount; i++) {
        const p = windParticles.find(p => p.life <= 0);
        if (p) {
          p.life = 0.5 + Math.random() * 0.3;
          p.scale = 0.05 + Math.random() * 0.1;
          // Spawn around player
          p.pos.set(
            targetPos.x + (Math.random() - 0.5) * 3,
            targetPos.y + (Math.random() - 0.5) * 3,
            targetPos.z + (Math.random() - 0.5) * 3
          );
          // Move upwards (relative to falling player)
          p.vel.set((Math.random() - 0.5) * 2, 20 + Math.random() * 15, (Math.random() - 0.5) * 2);
        }
      }
    }

    windParticles.forEach((p, i) => {
      if (p.life > 0) {
        p.pos.addScaledVector(p.vel, delta);
        p.life -= delta;
        
        dummy.position.copy(p.pos);
        dummy.scale.set(p.scale, p.scale * 15, p.scale); // Long streaks
        dummy.lookAt(p.pos.clone().add(p.vel));
        dummy.rotateX(Math.PI / 2);
        dummy.updateMatrix();
        windMeshRef.current?.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        windMeshRef.current?.setMatrixAt(i, dummy.matrix);
      }
    });
    if (windMeshRef.current) windMeshRef.current.instanceMatrix.needsUpdate = true;

    if (coreMeshRef.current) coreMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Ground Dust - Frustum Culled False to prevent disappearing */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial color="#94a3b8" transparent opacity={0.15} depthWrite={false} />
      </instancedMesh>

      {/* Jetpack Fire - Frustum Culled False */}
      <instancedMesh ref={fireMeshRef} args={[undefined, undefined, fireCount]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial transparent opacity={0.9} toneMapped={false} />
      </instancedMesh>

      {/* Core Beams */}
      <instancedMesh ref={coreMeshRef} args={[undefined, undefined, 2]} frustumCulled={false}>
        <cylinderGeometry args={[0.05, 0.1, 1, 8]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.8} toneMapped={false} />
      </instancedMesh>

      {/* Wind Streaks */}
      <instancedMesh ref={windMeshRef} args={[undefined, undefined, windCount]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 1, 4]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.2} blending={2} depthWrite={false} />
      </instancedMesh>

      {/* Cinematic Fire Light */}
      <pointLight 
        ref={fireLightRef}
        position={[0, 0.8, -0.5]} 
        color="#f97316" 
        intensity={2} 
        distance={4} 
        decay={2}
      />
    </group>
  );
}
