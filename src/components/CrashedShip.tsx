import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Object3D } from 'three';
import { Html } from '@react-three/drei';

export function CrashedShip({ playerRef }: { playerRef: React.RefObject<Group> }) {
  const [showPrompt, setShowPrompt] = useState(false);
  const shipPos = useMemo(() => new Vector3(-12, 0, -12), []); // Moved closer
  const lightRef = useRef<any>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && showPrompt && playerRef.current) {
        window.dispatchEvent(new CustomEvent('trigger-fade'));
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.position.set(0, 502, 15);
          }
        }, 500);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrompt, playerRef]);

  const showPromptRef = useRef(false);

  useFrame((state) => {
    if (playerRef.current) {
      const dist = playerRef.current.position.distanceTo(shipPos);
      const newPrompt = dist < 25;
      if (newPrompt !== showPromptRef.current) {
        showPromptRef.current = newPrompt;
        setShowPrompt(newPrompt);
      }
    }
    
    // Flickering broken light - only update occasionally
    if (lightRef.current) {
      if (Math.random() > 0.7) {
        lightRef.current.intensity = Math.random() > 0.8 ? Math.random() * 8 : 1;
      }
    }
  });

  return (
    <group position={shipPos} name="crashedShip">
      {/* Ship Model */}
      <group rotation={[0.15, -0.6, 0.2]} position={[0, 2, 0]} scale={1.5}>
        {/* Main Hull */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6, 5, 22]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
        </mesh>
        
        {/* White Accent Stripes */}
        <mesh position={[0, 2.55, 5]}>
          <boxGeometry args={[3, 0.2, 8]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[3.05, 0, 5]}>
          <boxGeometry args={[0.2, 2, 8]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.5} />
        </mesh>
        <mesh position={[-3.05, 0, 5]}>
          <boxGeometry args={[0.2, 2, 8]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.5} />
        </mesh>
        
        {/* Armor Plating */}
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[5.5, 0.5, 20]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[3.1, 0, 0]}>
          <boxGeometry args={[0.5, 4, 18]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[-3.1, 0, 0]}>
          <boxGeometry args={[0.5, 4, 18]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.3} />
        </mesh>
        
        {/* Cockpit */}
        <mesh position={[0, 1.5, 10]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[4.5, 3, 6]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 1.8, 10.5]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[4, 2.5, 5]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.1} transparent opacity={0.6} />
        </mesh>
        {/* Cockpit Frame */}
        <mesh position={[0, 3.1, 10.5]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[4.2, 0.2, 5.2]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
        </mesh>

        {/* Side Thrusters / Pods */}
        <mesh position={[4.5, -0.5, -2]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[2, 2, 14, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[-4.5, -0.5, -2]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[2, 2, 14, 16]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </mesh>

        {/* Wings */}
        <mesh position={[7.5, 0, -4]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[8, 0.6, 10]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.6} />
        </mesh>
        {/* White Wing Accents */}
        <mesh position={[7.5, 0.35, -4]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[6, 0.2, 2]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Broken Wing */}
        <mesh position={[-6, -1.5, -4]} rotation={[0.5, 0.2, -0.4]}>
          <boxGeometry args={[5, 0.6, 8]} />
          <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.6} />
        </mesh>
        {/* Broken Wing White Accent */}
        <mesh position={[-6, -1.15, -4]} rotation={[0.5, 0.2, -0.4]}>
          <boxGeometry args={[3, 0.2, 2]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.3} roughness={0.5} />
        </mesh>

        {/* Main Engines */}
        <mesh position={[2, 0, -11.5]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.8, 4, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[-2, 0, -11.5]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[1.5, 1.8, 4, 16]} />
          <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Engine Glow (Dead) */}
        <mesh position={[2, 0, -13.6]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.2, 16]} />
          <meshStandardMaterial color="#111" metalness={0.5} roughness={0.8} />
        </mesh>
        <mesh position={[-2, 0, -13.6]} rotation={[Math.PI/2, 0, 0]}>
          <cylinderGeometry args={[1.2, 1.2, 0.2, 16]} />
          <meshStandardMaterial color="#111" metalness={0.5} roughness={0.8} />
        </mesh>

        {/* Antennas */}
        <mesh position={[2, 3.5, 8]} rotation={[0.2, 0, 0.2]}>
          <cylinderGeometry args={[0.05, 0.05, 4]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
        <mesh position={[2.4, 5.4, 8.8]}>
           <sphereGeometry args={[0.15]} />
           <meshBasicMaterial color="#ef4444" />
        </mesh>
        
        {/* Broken Antenna */}
        <mesh position={[-2.5, 2.8, 6]} rotation={[1.5, 0, -0.6]}>
          <cylinderGeometry args={[0.08, 0.08, 3]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>

        {/* Greebles / Details */}
        {Array.from({ length: 30 }).map((_, i) => (
          <mesh 
            key={`greeble-${i}`} 
            position={[
              (Math.random() - 0.5) * 5,
              2.6 + Math.random() * 0.5,
              (Math.random() - 0.5) * 18
            ]}
          >
            <boxGeometry args={[0.4 + Math.random() * 0.8, 0.2 + Math.random() * 0.4, 0.4 + Math.random() * 1.5]} />
            <meshStandardMaterial color={Math.random() > 0.5 ? "#64748b" : "#334155"} metalness={0.7} roughness={0.5} />
          </mesh>
        ))}
        
        {/* Scorch Marks */}
        <mesh position={[-2.5, 1.5, -7]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[4.2, 4.2, 5.2]} />
          <meshStandardMaterial color="#000000" roughness={1} />
        </mesh>
        <mesh position={[0, 2.7, -5]} rotation={[Math.PI/2, 0, 0]}>
          <planeGeometry args={[6, 8]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.8} depthWrite={false} />
        </mesh>

        {/* Flickering Light */}
        <pointLight ref={lightRef} position={[-3, 3, -7]} color="#ef4444" distance={15} />
        <mesh position={[-3, 3, -7]}>
          <sphereGeometry args={[0.3]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      </group>

      {/* Debris */}
      <mesh position={[-10, 0.5, -3]} rotation={[0.4, 1.2, -0.3]}>
        <boxGeometry args={[3, 0.3, 6]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[-15, 0.5, 3]} rotation={[-0.2, 0.5, 0.1]}>
        <cylinderGeometry args={[0.8, 0.8, 4]} />
        <meshStandardMaterial color="#475569" />
      </mesh>

      {/* Smoke Effect */}
      <ShipSmoke position={new Vector3(-5, 6, -10)} />
      <ShipSmoke position={new Vector3(2, 4, 5)} />

      {/* UI Prompt */}
      {showPrompt && (
        <Html position={[0, 8, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-slate-900/90 border border-blue-500/50 text-white p-3 rounded-lg backdrop-blur-md w-48 text-center shadow-[0_0_15px_rgba(59,130,246,0.3)] transform transition-all scale-75">
            <div className="flex justify-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/50">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
            </div>
            <h3 className="text-blue-400 font-black tracking-wider mb-1 text-xs">NAVE ESPACIAL</h3>
            <p className="text-[10px] text-slate-300 mb-2 leading-tight">
              Pressione [F] para Entrar
            </p>
            <div className="bg-blue-950/50 border border-blue-900/50 rounded p-1.5">
              <div className="text-[8px] text-blue-500 font-bold animate-pulse tracking-widest">
                ACESSO DISPONÍVEL
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function ShipSmoke({ position }: { position: Vector3 }) {
  const meshRef = useRef<any>(null);
  const count = 30; // Reduced count for less density
  const dummy = useMemo(() => new Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      pos: new Vector3((Math.random() - 0.5) * 3, Math.random() * 3, (Math.random() - 0.5) * 3),
      speed: Math.random() * 0.04 + 0.01,
      life: Math.random(),
      scale: Math.random() * 1.5 + 0.5
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    particles.forEach((p, i) => {
      p.life += delta * 0.15;
      if (p.life > 1) {
        p.life = 0;
        p.pos.set((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2);
      }
      
      p.pos.y += p.speed;
      p.pos.x += (Math.random() - 0.5) * 0.02 + 0.01; // Drift slightly
      p.pos.z += (Math.random() - 0.5) * 0.02;
      
      dummy.position.copy(p.pos);
      const currentScale = p.scale * (1 + p.life * 3);
      dummy.scale.setScalar(currentScale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group position={position}>
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <sphereGeometry args={[1, 6, 6]} />
        <meshBasicMaterial color="#555555" transparent opacity={0.15} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
