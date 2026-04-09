import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3, TubeGeometry, Mesh, Group, BufferGeometry } from 'three';

interface OxygenCableProps {
  playerRef: React.RefObject<Group>;
  isConnected: boolean;
}

export function OxygenCable({ playerRef, isConnected }: OxygenCableProps) {
  const meshRef = useRef<Mesh>(null);
  const wireframeRef = useRef<Mesh>(null);
  const frameCounter = useRef(0);
  
  // Anchor point on the ship
  const anchorPoint = useMemo(() => new Vector3(-12, 1.5, -12), []);
  
  // Pre-allocate reusable vectors to avoid GC pressure
  const playerPos = useMemo(() => new Vector3(), []);
  const midPoint1 = useMemo(() => new Vector3(), []);
  const midPoint2 = useMemo(() => new Vector3(), []);
  
  // Create a curve with 4 points for a natural hanging look
  const curve = useMemo(() => new CatmullRomCurve3([
    new Vector3(-12, 1.5, -12), 
    new Vector3(-8, 1.5, -8), 
    new Vector3(-4, 1.5, -4), 
    new Vector3(0, 1.5, 0)
  ]), []);

  // Store previous geometries for disposal
  const prevGeo = useRef<{ main: BufferGeometry | null, wire: BufferGeometry | null }>({ main: null, wire: null });

  useFrame(() => {
    if (!meshRef.current || !wireframeRef.current || !playerRef.current) return;

    if (!isConnected) {
      meshRef.current.visible = false;
      wireframeRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;
    wireframeRef.current.visible = true;

    // Only update geometry every 3rd frame to reduce massive GC/alloc pressure
    frameCounter.current++;
    if (frameCounter.current % 3 !== 0) return;

    // Player backpack position - reuse vector
    playerPos.copy(playerRef.current.position);
    playerPos.y += 1.2; 

    // Update curve points
    const dist = anchorPoint.distanceTo(playerPos);
    
    // Calculate sag based on distance
    const sag = Math.max(0.5, 10 - dist * 0.15);

    midPoint1.copy(anchorPoint).lerp(playerPos, 0.33);
    midPoint1.y = Math.max(0.15, midPoint1.y - sag);

    midPoint2.copy(anchorPoint).lerp(playerPos, 0.66);
    midPoint2.y = Math.max(0.15, midPoint2.y - sag);

    curve.points[0].copy(anchorPoint);
    curve.points[1].copy(midPoint1);
    curve.points[2].copy(midPoint2);
    curve.points[3].copy(playerPos);

    // Update geometry with reduced segments (32 instead of 64, 6 instead of 12)
    const newMainGeo = new TubeGeometry(curve, 32, 0.08, 6, false);
    if (prevGeo.current.main) prevGeo.current.main.dispose();
    meshRef.current.geometry = newMainGeo;
    prevGeo.current.main = newMainGeo;
    
    const newWireGeo = new TubeGeometry(curve, 32, 0.085, 6, false);
    if (prevGeo.current.wire) prevGeo.current.wire.dispose();
    wireframeRef.current.geometry = newWireGeo;
    prevGeo.current.wire = newWireGeo;
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow>
        <tubeGeometry args={[curve, 32, 0.08, 6, false]} />
        <meshPhysicalMaterial 
          color="#0284c7" 
          emissive="#0369a1"
          emissiveIntensity={0.5}
          roughness={0.4} 
          metalness={0.8} 
          clearcoat={1}
          clearcoatRoughness={0.2}
        />
      </mesh>
      {/* Glowing rings effect */}
      <mesh ref={wireframeRef}>
        <tubeGeometry args={[curve, 32, 0.085, 6, false]} />
        <meshBasicMaterial 
          color="#38bdf8" 
          wireframe={true} 
          transparent={true} 
          opacity={0.3} 
        />
      </mesh>
    </group>
  );
}
