import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, DoubleSide, MathUtils } from 'three';
import { Html, Sparkles } from '@react-three/drei';

interface ShipInteriorProps {
  playerRef: React.RefObject<Group>;
  introStep: number;
  introPhase: string;
  introDialoguesLength: number;
}

function InteriorMineral({ data }: { data: any }) {
  const ref = useRef<Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.01;
      ref.current.rotation.x += 0.005;
      ref.current.position.y = 0.5 * data.scale + Math.sin(state.clock.elapsedTime * 2 + data.id) * 0.2;
    }
  });
  return (
    <group ref={ref} position={[data.x, 0, data.z]} scale={data.scale}>
      <mesh name="interiorMineral" userData={{
        isMineral: true,
        mineralInfo: { type: { name: data.name, rarity: data.rarity, value: data.value }, count: 1, color: data.color }
      }}>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={data.color} emissive={data.color} emissiveIntensity={0.5} roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}

function InteriorSmoke() {
  const groupRef = useRef<Group>(null);
  
  const particles = useMemo(() => {
    return Array.from({ length: 30 }).map(() => ({
      x: (Math.random() - 0.5) * 18,
      y: Math.random() * 10,
      z: (Math.random() - 0.5) * 38,
      speedY: 0.01 + Math.random() * 0.02,
      speedRot: (Math.random() - 0.5) * 0.02,
      scale: 2 + Math.random() * 3,
      baseOpacity: 0.1 + Math.random() * 0.15,
    }));
  }, []);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const p = particles[i];
        if (p) {
          child.position.y += p.speedY;
          child.rotation.z += p.speedRot;
          child.rotation.x += p.speedRot;
          
          if (child.position.y > 9) {
            child.position.y = 0.1;
            child.position.x = (Math.random() - 0.5) * 18;
            child.position.z = (Math.random() - 0.5) * 38;
          }
          
          const mat = (child as any).material;
          if (mat) {
            let opacity = p.baseOpacity;
            if (child.position.y < 2) opacity *= child.position.y / 2;
            if (child.position.y > 7) opacity *= (9 - child.position.y) / 2;
            mat.opacity = opacity;
          }
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} scale={p.scale}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color="#64748b" transparent opacity={p.baseOpacity} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

// Static LED indicator (no useFrame per instance - MUCH better performance)
function LEDIndicator({ position, color, intensity = 1.5 }: { position: [number, number, number], color: string, intensity?: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.2, 0.08, 0.08]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />
    </mesh>
  );
}

// Screen component (simplified - single useFrame for all screens via parent)
function StaticScreen({ position, rotation, size, color }: { position: [number, number, number], rotation: [number, number, number], size: [number, number], color: string }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Screen bezel */}
      <mesh>
        <boxGeometry args={[size[0] + 0.3, size[1] + 0.3, 0.25]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.95} roughness={0.1} />
      </mesh>
      {/* Screen surface */}
      <mesh position={[0, 0, 0.13]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} toneMapped={false} />
      </mesh>
    </group>
  );
}

// Animated console lights that blink realistically
function ConsoleLights() {
  const light1 = useRef<any>(null);
  const light2 = useRef<any>(null);
  const light3 = useRef<any>(null);
  const light4 = useRef<any>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (light1.current) light1.current.intensity = 1.5 + Math.sin(time * 4) * 0.5 + (Math.random() * 0.2);
    if (light2.current) light2.current.intensity = 1.2 + Math.cos(time * 3) * 0.4 + (Math.random() * 0.3);
    if (light3.current) light3.current.intensity = 1.0 + Math.sin(time * 5) * 0.6 + (Math.random() * 0.2);
    if (light4.current) light4.current.intensity = 0.8 + Math.sin(time * 2.5) * 0.4;
  });

  return (
    <>
      <pointLight ref={light1} position={[-3.5, 2, 0]} color="#ef4444" distance={10} decay={2} />
      <pointLight ref={light2} position={[0, 2.5, 0]} color="#3b82f6" distance={12} decay={2} />
      <pointLight ref={light3} position={[3.5, 2, 0]} color="#eab308" distance={10} decay={2} />
      <pointLight ref={light4} position={[0, 1, 2]} color="#22c55e" distance={8} decay={2} />
    </>
  );
}

// LED strip lights for ceiling
function CeilingLEDStrip({ position, length, color }: { position: [number, number, number], length: number, color: string }) {
  const ref = useRef<any>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 1.2 + Math.sin(state.clock.elapsedTime * 0.8) * 0.3;
    }
  });
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[0.15, 0.08, length]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} toneMapped={false} />
    </mesh>
  );
}

export function ShipInterior({ playerRef, introStep, introPhase, introDialoguesLength }: ShipInteriorProps) {
  const groupRef = useRef<Group>(null);
  const exitDoorRef = useRef<Group>(null);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [showPanelError, setShowPanelError] = useState(false);
  const [isExitDoorOpen, setIsExitDoorOpen] = useState(false);
  const [inStorage, setInStorage] = useState(false);
  
  // Refs to avoid setState every frame
  const showExitPromptRef = useRef(false);
  const showPanelErrorRef = useRef(false);
  const isExitDoorOpenRef = useRef(false);
  const inStorageRef = useRef(false);

  const interiorMineralsData = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => {
      const x = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 16;
      const rand = Math.random();
      let color = "#38bdf8";
      let rarity = "COMUM";
      let value = 100;
      let name = "GELO ESTELAR";
      if (rand > 0.8) { color = "#f472b6"; rarity = "RARO"; value = 500; name = "CRISTAL ROSA"; }
      else if (rand > 0.5) { color = "#a3e635"; rarity = "INCOMUM"; value = 250; name = "LÍTIO VERDE"; }
      const scale = 0.5 + Math.random() * 0.8;
      return { id: i, x, z, color, scale, rarity, value, name };
    });
  }, []);

  useFrame((state, delta) => {
    if (!playerRef.current || !groupRef.current) return;

    const exitDoorActualPos = new Vector3(0, 500, 39.9);
    const distToExitDoor = playerRef.current.position.distanceTo(exitDoorActualPos);
    const newDoorOpen = distToExitDoor < 8 && inStorageRef.current;
    if (newDoorOpen !== isExitDoorOpenRef.current) {
      isExitDoorOpenRef.current = newDoorOpen;
      setIsExitDoorOpen(newDoorOpen);
    }

    if (exitDoorRef.current) {
      const targetY = isExitDoorOpen ? 9 : 4;
      exitDoorRef.current.position.y = MathUtils.lerp(exitDoorRef.current.position.y, targetY, delta * 5);
    }

    const newInStorage = playerRef.current.position.z > 20 && playerRef.current.position.z < 39 && playerRef.current.position.y > 250;
    if (newInStorage !== inStorageRef.current) {
      inStorageRef.current = newInStorage;
      setInStorage(newInStorage);
    }

    const globeCenter = new Vector3(0, 500, 2);
    const distToGlobe = playerRef.current.position.distanceTo(globeCenter);
    const isIntroDone = introPhase === 'done' && (introStep >= introDialoguesLength || introStep === -1);
    const newExitPrompt = distToGlobe < 4 && isIntroDone;
    if (newExitPrompt !== showExitPromptRef.current) {
      showExitPromptRef.current = newExitPrompt;
      setShowExitPrompt(newExitPrompt);
    }

    const panelPos = new Vector3(0, 500, -18);
    const distToPanel = playerRef.current.position.distanceTo(panelPos);
    const newPanelError = distToPanel < 10;
    if (newPanelError !== showPanelErrorRef.current) {
      showPanelErrorRef.current = newPanelError;
      setShowPanelError(newPanelError);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && showExitPrompt && playerRef.current) {
        const isIntroDone = introStep >= introDialoguesLength || introStep === -1;
        if (!isIntroDone) return;

        window.dispatchEvent(new CustomEvent('trigger-fade'));
        setTimeout(() => {
          if (playerRef.current) {
            playerRef.current.position.set(-12, 0.2, -5);
            window.dispatchEvent(new CustomEvent('show-notification', { detail: 'Lembre-se de conectar o Cabo de Oxigênio (C)!' }));
          }
        }, 300);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExitPrompt, playerRef]);

  return (
    <group ref={groupRef} position={[0, 500, 0]}>
      {/* ========== HULL STRUCTURE ========== */}
      {/* Main cabin walls - dark metallic hull */}
      <mesh position={[0, 5, 10]} receiveShadow castShadow>
        <boxGeometry args={[20, 10, 60]} />
        <meshStandardMaterial color="#0a0f1a" roughness={0.7} metalness={0.8} side={DoubleSide} />
      </mesh>

      {/* ========== FLOOR ========== */}
      {/* Main floor - industrial metal grating look */}
      <mesh position={[0, 0.1, 10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[19.8, 59.8]} />
        <meshStandardMaterial color="#151e2d" roughness={0.85} metalness={0.9} />
      </mesh>
      
      {/* Floor center runner strip (illuminated) */}
      <mesh position={[0, 0.12, 10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.5, 55]} />
        <meshStandardMaterial color="#0c4a6e" emissive="#0369a1" emissiveIntensity={0.3} roughness={0.6} metalness={0.7} />
      </mesh>

      {/* Floor Grates with detail */}
      {Array.from({ length: 8 }).map((_, i) => (
        <group key={`grate-${i}`} position={[0, 0.14, -15 + i * 7]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4.5, 2.5]} />
            <meshStandardMaterial color="#020617" roughness={0.95} metalness={0.95} />
          </mesh>
          {/* Grate crossbars */}
          {Array.from({ length: 5 }).map((_, j) => (
            <mesh key={`bar-${j}`} position={[-1.8 + j * 0.9, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.08, 2.3]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
            </mesh>
          ))}
        </group>
      ))}

      {/* ========== CEILING LED STRIPS ========== */}
      <CeilingLEDStrip position={[-4, 9.85, 10]} length={55} color="#0ea5e9" />
      <CeilingLEDStrip position={[4, 9.85, 10]} length={55} color="#0ea5e9" />
      {/* Center ceiling warm strip */}
      <CeilingLEDStrip position={[0, 9.9, 10]} length={55} color="#f59e0b" />

      {/* ========== CEILING PANELS ========== */}
      {/* Ceiling panel grid */}
      {Array.from({ length: 10 }).map((_, i) => (
        <group key={`cpanel-${i}`} position={[0, 9.7, -18 + i * 6]}>
          {/* Panel frame */}
          <mesh>
            <boxGeometry args={[18, 0.15, 0.3]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Cross beams */}
          <mesh position={[-5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.15]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[0.3, 0.1, 0.15]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* ========== CEILING PIPES & CONDUITS ========== */}
      {Array.from({ length: 6 }).map((_, i) => (
        <group key={`pipe-${i}`} position={[0, 9.5, -18 + i * 8]}>
          {/* Main pipe */}
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.15, 0.15, 19.5, 6]} />
            <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.9} />
          </mesh>
          {/* Glowing coolant line */}
          <mesh rotation={[0, 0, Math.PI / 2]} position={[0, -0.2, 0.2]}>
            <cylinderGeometry args={[0.04, 0.04, 19.5, 6]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ))}

      {/* ========== WALL PANELS (LEFT) ========== */}
      <group position={[-9.5, 4, -10]} rotation={[0, Math.PI / 2, 0]}>
        {/* Wall backing */}
        <mesh>
          <boxGeometry args={[12, 5, 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.8} />
        </mesh>
        
        {/* Wall panel dividers */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`ldiv-${i}`} position={[-5 + i * 2.5, 0, 0.45]}>
            <boxGeometry args={[0.08, 4.8, 0.15]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}

        {/* Server Racks / Data Banks - MORE DETAILED */}
        {Array.from({ length: 4 }).map((_, i) => (
          <group key={`rack-l-${i}`} position={[-4 + i * 2.5, 0, 0.5]}>
            {/* Rack frame */}
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[2.2, 4.2, 0.15]} />
              <meshStandardMaterial color="#0a0f1a" roughness={0.4} metalness={0.9} />
            </mesh>
            {/* Drive bays */}
            {Array.from({ length: 4 }).map((_, j) => (
              <mesh key={`drive-l-${i}-${j}`} position={[0, 2.2 - j * 0.8, 0.12]}>
                <boxGeometry args={[1.8, 0.5, 0.1]} />
                <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
              </mesh>
            ))}
            {/* Status LEDs - static (no per-instance useFrame) */}
            {Array.from({ length: 4 }).map((_, j) => (
              <LEDIndicator
                key={`led-l-${i}-${j}`}
                position={[-0.85, 2.2 - j * 0.8, 0.18]}
                color={j % 2 === 0 ? "#ef4444" : "#22c55e"}
                intensity={1.5}
              />
            ))}
          </group>
        ))}
      </group>

      {/* ========== WALL PANELS (RIGHT) ========== */}
      <group position={[9.5, 4, -10]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[12, 5, 0.8]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.8} />
        </mesh>
        
        {/* Wall panel dividers */}
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={`rdiv-${i}`} position={[-5 + i * 2.5, 0, 0.45]}>
            <boxGeometry args={[0.08, 4.8, 0.15]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
          </mesh>
        ))}

        {/* Right side: Life support systems & power distribution */}
        {Array.from({ length: 4 }).map((_, i) => (
          <group key={`rack-r-${i}`} position={[-4 + i * 2.5, 0, 0.5]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[2.2, 4.2, 0.15]} />
              <meshStandardMaterial color="#0a0f1a" roughness={0.4} metalness={0.9} />
            </mesh>
            {/* Power distribution modules */}
            {Array.from({ length: 3 }).map((_, j) => (
              <mesh key={`pmod-${i}-${j}`} position={[0, 2 - j * 1.2, 0.12]}>
                <boxGeometry args={[1.8, 0.8, 0.1]} />
                <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.2} />
              </mesh>
            ))}
            {/* Status indicators */}
            {Array.from({ length: 4 }).map((_, j) => (
              <LEDIndicator
                key={`led-r-${i}-${j}`}
                position={[-0.85, 2.2 - j * 0.8, 0.18]}
                color={j % 2 === 0 ? "#f59e0b" : "#3b82f6"}
                intensity={1.2}
              />
            ))}
          </group>
        ))}
      </group>

      {/* ========== PILOT SEATS (Enhanced) ========== */}
      {[-2.5, 2.5].map((xPos, idx) => (
        <group key={`seat-${idx}`} position={[xPos, 0, -14]} scale={[0.8, 0.8, 0.8]}>
          {/* Seat Base - hydraulic column */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.35, 0.4, 0.6, 8]} />
            <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.65, 0]}>
            <cylinderGeometry args={[0.12, 0.15, 0.5, 6]} />
            <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Seat Cushion */}
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[1.5, 0.25, 1.5]} />
            <meshPhysicalMaterial color="#0f172a" roughness={0.95} metalness={0.05} />
          </mesh>
          {/* Backrest with padding */}
          <mesh position={[0, 2.0, 0.65]} rotation={[-0.1, 0, 0]}>
            <boxGeometry args={[1.5, 1.9, 0.25]} />
            <meshPhysicalMaterial color="#0f172a" roughness={0.95} metalness={0.05} />
          </mesh>
          {/* Headrest */}
          <mesh position={[0, 3.1, 0.7]} rotation={[-0.05, 0, 0]}>
            <boxGeometry args={[0.8, 0.5, 0.2]} />
            <meshPhysicalMaterial color="#0f172a" roughness={0.95} metalness={0.05} />
          </mesh>
          {/* Armrests */}
          <mesh position={[-0.85, 1.6, 0]}>
            <boxGeometry args={[0.15, 0.12, 1.2]} />
            <meshPhysicalMaterial color="#1e293b" metalness={0.8} roughness={0.3} clearcoat={0.2} />
          </mesh>
          <mesh position={[0.85, 1.6, 0]}>
            <boxGeometry args={[0.15, 0.12, 1.2]} />
            <meshPhysicalMaterial color="#1e293b" metalness={0.8} roughness={0.3} clearcoat={0.2} />
          </mesh>
          {/* Harness buckle */}
          <mesh position={[0, 1.8, 0.5]}>
            <cylinderGeometry args={[0.08, 0.08, 0.05, 6]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* ========== FRONT WINDOW (Enhanced) ========== */}
      <mesh position={[0, 5, -19.9]}>
        <planeGeometry args={[16, 6]} />
        <meshPhysicalMaterial color="#020617" transparent opacity={0.5} roughness={0.02} metalness={0.95} clearcoat={1} clearcoatRoughness={0.02} />
      </mesh>
      {/* Window frame */}
      <mesh position={[0, 5, -19.85]}>
        <boxGeometry args={[17, 6.5, 0.15]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.95} roughness={0.1} clearcoat={0.3} />
      </mesh>
      {/* Window frame dividers */}
      {[-5, 0, 5].map((x, i) => (
        <mesh key={`wdiv-${i}`} position={[x, 5, -19.82]}>
          <boxGeometry args={[0.12, 6, 0.08]} />
          <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.15} />
        </mesh>
      ))}

      {/* ========== CONTROL PANELS (Completely Redesigned) ========== */}
      <group position={[0, 1.2, -18]} scale={[0.8, 0.8, 0.8]}>
        {/* Main Console Base - angled */}
        <mesh rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[13, 1.8, 3.5]} />
          <meshPhysicalMaterial color="#0f172a" roughness={0.4} metalness={0.9} clearcoat={0.2} />
        </mesh>
        {/* Console trim/edge */}
        <mesh position={[0, 0.95, -0.3]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[13.2, 0.08, 3.6]} />
          <meshStandardMaterial color="#475569" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Left Screen - RED (Warning/Damage) */}
        <StaticScreen
          position={[-3.8, 1.8, -1.0]}
          rotation={[0.1, 0.2, 0]}
          size={[2.8, 1.8]}
          color="#dc2626"
        />

        {/* Center Screen - BLUE (Navigation/Main) */}
        <StaticScreen
          position={[0, 2.0, -1.2]}
          rotation={[0.1, 0, 0]}
          size={[4.0, 2.5]}
          color="#1d4ed8"
        />

        {/* Right Screen - AMBER (Systems) */}
        <StaticScreen
          position={[3.8, 1.8, -1.0]}
          rotation={[0.1, -0.2, 0]}
          size={[2.8, 1.8]}
          color="#d97706"
        /> 

        {/* Joysticks - enhanced */}
        {[-2.8, 2.8].map((x, i) => (
          <group key={`joystick-${i}`} position={[x, 0.8, 0.6]} rotation={[-0.2, 0, 0]}>
            {/* Base plate */}
            <mesh position={[0, -0.05, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.06, 16]} />
              <meshPhysicalMaterial color="#1e293b" metalness={0.9} roughness={0.1} clearcoat={0.4} />
            </mesh>
            {/* Boot/gaiter */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.08, 0.15, 0.2, 12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} metalness={0.1} />
            </mesh>
            {/* Stick */}
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 0.5]} />
              <meshPhysicalMaterial color="#475569" metalness={0.95} roughness={0.1} clearcoat={0.5} />
            </mesh>
            {/* Ball grip */}
            <mesh position={[0, 0.55, 0]}>
              <sphereGeometry args={[0.12]} />
              <meshPhysicalMaterial color={i === 0 ? "#dc2626" : "#2563eb"} roughness={0.3} metalness={0.2} clearcoat={0.4} />
            </mesh>
            {/* Thumb button on grip */}
            <mesh position={[0, 0.6, 0.08]}>
              <cylinderGeometry args={[0.03, 0.03, 0.03, 8]} />
              <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}

        {/* Button grid - optimized but visible */}
        {Array.from({ length: 24 }).map((_, i) => {
          const row = Math.floor(i / 8);
          const col = i % 8;
          const rand = (i * 7 + 3) % 11 / 11; // deterministic pseudo-random
          const color = rand > 0.85 ? "#ef4444" : rand > 0.6 ? "#22c55e" : rand > 0.3 ? "#3b82f6" : "#f59e0b";
          return (
            <group key={`btn-${i}`} position={[-2.8 + col * 0.8, 0.65 - row * 0.2, 0.3 + row * 0.2]} rotation={[-0.2, 0, 0]}>
              <mesh>
                <cylinderGeometry args={[0.08, 0.08, 0.04, 6]} />
                <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[0, 0.03, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.03, 6]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={rand > 0.5 ? 1.5 : 0.4} toneMapped={false} />
              </mesh>
            </group>
          );
        })}

        {/* Toggle switches row */}
        {Array.from({ length: 8 }).map((_, i) => (
          <group key={`toggle-${i}`} position={[-3 + i * 0.85, 0.85, -0.2]} rotation={[-0.2, 0, 0]}>
            <mesh>
              <boxGeometry args={[0.08, 0.04, 0.12]} />
              <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
            </mesh>
            <mesh position={[0, 0.06, i % 2 === 0 ? 0.03 : -0.03]} rotation={[i % 2 === 0 ? 0.4 : -0.4, 0, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.12, 6]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.05} />
            </mesh>
          </group>
        ))}

        <ConsoleLights />
      </group>

      {/* ========== WALL-MOUNTED DISPLAYS (Side corridor) ========== */}
      {/* Left wall small data screens */}
      {[0, 12].map((z, i) => (
        <group key={`lscreen-${i}`} position={[-9.35, 5, -5 + z]} rotation={[0, Math.PI / 2, 0]}>
          <StaticScreen
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            size={[2, 1.5]}
            color={i === 0 ? "#22c55e" : "#3b82f6"}
          />
        </group>
      ))}

      {/* Right wall small data screens */}
      {[0, 12].map((z, i) => (
        <group key={`rscreen-${i}`} position={[9.35, 5, -5 + z]} rotation={[0, -Math.PI / 2, 0]}>
          <StaticScreen
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            size={[2, 1.5]}
            color={i === 0 ? "#dc2626" : "#0ea5e9"}
          />
        </group>
      ))}

      {/* ========== HOLOGRAPHIC TABLE (Enhanced) ========== */}
      <group position={[0, 0, 2]}>
        {/* Table base - hexagonal style */}
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.6, 0.8, 0.6, 6]} />
          <meshPhysicalMaterial color="#1e293b" roughness={0.4} metalness={0.9} clearcoat={0.3} />
        </mesh>
        {/* Table column */}
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.2, 0.5, 0.6, 12]} />
          <meshPhysicalMaterial color="#0f172a" metalness={0.95} roughness={0.1} clearcoat={0.5} />
        </mesh>
        {/* Table surface */}
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[1.6, 1.3, 0.15, 32]} />
          <meshPhysicalMaterial color="#1e293b" roughness={0.3} metalness={0.9} clearcoat={0.4} />
        </mesh>
        {/* Surface emissive ring */}
        <mesh position={[0, 1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 1.15, 32]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        {/* Hologram projection lens */}
        <mesh position={[0, 1.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.9, 32]} />
          <meshPhysicalMaterial color="#0c4a6e" emissive="#0ea5e9" emissiveIntensity={0.3} roughness={0.05} clearcoat={1} />
        </mesh>
        {/* Planet Hologram */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.8, 24, 24]} />
          <meshBasicMaterial color="#38bdf8" wireframe transparent opacity={0.35} />
        </mesh>
        {/* Hologram atmosphere glow */}
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[0.95, 16, 16]} />
          <meshBasicMaterial color="#0ea5e9" transparent opacity={0.08} />
        </mesh>
        {/* Orbital rings */}
        <mesh position={[0, 2.5, 0]} rotation={[0.5, 0.5, 0]}>
          <torusGeometry args={[1.2, 0.015, 8, 48]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 2.5, 0]} rotation={[1.2, 0.2, 0.5]}>
          <torusGeometry args={[1.0, 0.01, 8, 48]} />
          <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
        </mesh>
        {/* Data points orbiting */}
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={`datapt-${i}`} position={[Math.cos(i * 1.26) * 1.1, 2.5, Math.sin(i * 1.26) * 1.1]}>
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshBasicMaterial color="#22d3ee" transparent opacity={0.8} />
          </mesh>
        ))}
        <pointLight position={[0, 2.0, 0]} color="#38bdf8" intensity={2} distance={10} />
      </group>

      {/* ========== AMBIENT LIGHTING (More realistic) ========== */}
      {/* Main overhead lights (warm white) */}
      <pointLight position={[0, 8.5, -5]} intensity={0.6} color="#fef3c7" distance={18} castShadow />
      <pointLight position={[0, 8.5, 8]} intensity={0.5} color="#fef3c7" distance={18} />
      <pointLight position={[0, 8.5, 20]} intensity={0.5} color="#fef3c7" distance={18} />
      {/* Accent lights */}
      <pointLight position={[-8, 3, -15]} intensity={0.3} color="#ef4444" distance={12} />
      <pointLight position={[8, 3, -15]} intensity={0.3} color="#f59e0b" distance={12} />
      <pointLight position={[0, 8, -15]} intensity={0.6} color="#93c5fd" distance={15} />
      {/* Storage area warm light */}
      <pointLight position={[0, 8, 30]} intensity={0.8} color="#f59e0b" distance={22} />
      <pointLight position={[-6, 4, 30]} intensity={0.3} color="#0ea5e9" distance={10} />
      <pointLight position={[6, 4, 30]} intensity={0.3} color="#0ea5e9" distance={10} />

      {/* ========== STORAGE / ARMAZÉM (Enhanced) ========== */}
      <group position={[0, 0, 30]}>
        {/* Animated Minerals */}
        {interiorMineralsData.map((data) => (
          <InteriorMineral key={`mineral-${data.id}`} data={data} />
        ))}
        
        {/* Storage Shelves Left - Industrial Racking */}
        <group position={[-8, 0, 0]}>
          {/* Main shelf structure */}
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[3, 8, 16]} />
            <meshPhysicalMaterial color="#1a202c" roughness={0.7} metalness={0.8} clearcoat={0.1} />
          </mesh>
          {/* Shelf tiers with lips */}
          {Array.from({ length: 4 }).map((_, i) => (
            <group key={`shelf-l-${i}`} position={[0.5, 1.5 + i * 2, 0]}>
              <mesh>
                <boxGeometry args={[2.5, 0.15, 15.8]} />
                <meshPhysicalMaterial color="#334155" roughness={0.5} metalness={0.9} clearcoat={0.2} />
              </mesh>
              {/* Front lip */}
              <mesh position={[1.2, 0.15, 0]}>
                <boxGeometry args={[0.05, 0.3, 15.8]} />
                <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* Cargo crates on shelves */}
          {Array.from({ length: 12 }).map((_, i) => (
            <group key={`item-l-${i}`} position={[0.5, 1.85 + Math.floor(i / 3) * 2, -6 + (i % 3) * 5]}>
              <mesh>
                <boxGeometry args={[1.2, 1, 1.8]} />
                <meshPhysicalMaterial color={i % 3 === 0 ? "#334155" : i % 3 === 1 ? "#1e293b" : "#0f172a"} roughness={0.6} metalness={0.6} clearcoat={0.1} />
              </mesh>
              {/* Crate handle */}
              <mesh position={[0, 0.3, 0.92]}>
                <boxGeometry args={[0.4, 0.08, 0.05]} />
                <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
              </mesh>
              {/* Label sticker */}
              <mesh position={[0, 0, 0.93]}>
                <planeGeometry args={[0.6, 0.4]} />
                <meshStandardMaterial color={i % 2 === 0 ? "#0369a1" : "#7c2d12"} emissive={i % 2 === 0 ? "#0284c7" : "#9a3412"} emissiveIntensity={0.1} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Storage Shelves Right */}
        <group position={[8, 0, 0]}>
          <mesh position={[0, 4, 0]}>
            <boxGeometry args={[3, 8, 16]} />
            <meshPhysicalMaterial color="#1a202c" roughness={0.7} metalness={0.8} clearcoat={0.1} />
          </mesh>
          {Array.from({ length: 4 }).map((_, i) => (
            <group key={`shelf-r-${i}`} position={[-0.5, 1.5 + i * 2, 0]}>
              <mesh>
                <boxGeometry args={[2.5, 0.15, 15.8]} />
                <meshPhysicalMaterial color="#334155" roughness={0.5} metalness={0.9} clearcoat={0.2} />
              </mesh>
              <mesh position={[-1.2, 0.15, 0]}>
                <boxGeometry args={[0.05, 0.3, 15.8]} />
                <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
          {/* Cylindrical containers */}
          {Array.from({ length: 15 }).map((_, i) => (
            <group key={`item-r-${i}`} position={[-0.5, 1.85 + Math.floor(i / 4) * 2, -6 + (i % 4) * 4]}>
              <mesh>
                <cylinderGeometry args={[0.4, 0.4, 1.2, 12]} />
                <meshPhysicalMaterial color={i % 3 === 0 ? "#0284c7" : i % 3 === 1 ? "#0369a1" : "#1e40af"} roughness={0.2} metalness={0.85} clearcoat={0.4} />
              </mesh>
              {/* Cap */}
              <mesh position={[0, 0.65, 0]}>
                <cylinderGeometry args={[0.42, 0.42, 0.1, 12]} />
                <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
              </mesh>
              {/* Status light */}
              <mesh position={[0, 0, 0.42]}>
                <sphereGeometry args={[0.05, 6, 6]} />
                <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={2} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Storage Crates Center - stacked pallets */}
        {Array.from({ length: 8 }).map((_, i) => (
          <group key={`crate-${i}`} position={[-4 + (i % 3) * 4, 1 + Math.floor(i / 3) * 2.2, 5 + Math.floor(i / 3) * 2]}>
            <mesh rotation={[0, Math.random() * 0.3, 0]}>
              <boxGeometry args={[2, 2, 2]} />
              <meshPhysicalMaterial color={i % 2 === 0 ? "#475569" : "#334155"} roughness={0.7} metalness={0.5} clearcoat={0.1} />
            </mesh>
            {/* Crate strapping */}
            <mesh position={[0, 0, 1.02]} rotation={[0, 0, 0]}>
              <boxGeometry args={[1.6, 0.08, 0.02]} />
              <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 1.02]} rotation={[0, 0, Math.PI / 2]}>
              <boxGeometry args={[1.6, 0.08, 0.02]} />
              <meshStandardMaterial color="#d97706" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Glowing Containment Units - enhanced */}
        {Array.from({ length: 3 }).map((_, i) => (
          <group key={`containment-${i}`} position={[-5 + i * 5, 0, -6]}>
            {/* Base ring */}
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[1.15, 1.2, 0.3, 20]} />
              <meshPhysicalMaterial color="#1e293b" roughness={0.4} metalness={0.9} clearcoat={0.3} />
            </mesh>
            {/* Outer shell */}
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[1.05, 1.05, 2.8, 20]} />
              <meshPhysicalMaterial color="#0f172a" roughness={0.5} metalness={0.85} clearcoat={0.2} />
            </mesh>
            {/* Glass cylinder */}
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.9, 0.9, 2.6, 20]} />
              <meshPhysicalMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.4} transmission={0.92} opacity={1} transparent roughness={0.02} clearcoat={1} />
            </mesh>
            {/* Top cap */}
            <mesh position={[0, 2.95, 0]}>
              <cylinderGeometry args={[1.15, 1.05, 0.3, 20]} />
              <meshPhysicalMaterial color="#1e293b" roughness={0.4} metalness={0.9} clearcoat={0.3} />
            </mesh>
            {/* Status ring */}
            <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.0, 1.1, 20]} />
              <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={1.5} toneMapped={false} />
            </mesh>
            <pointLight color="#0ea5e9" intensity={1} distance={6} position={[0, 1.5, 0]} />
          </group>
        ))}
      </group>

      {/* ========== EXIT DOOR (Enhanced) ========== */}
      <group position={[0, 4, 39.9]} ref={exitDoorRef}>
        <mesh>
          <boxGeometry args={[6, 8, 0.4]} />
          <meshPhysicalMaterial color="#2d3748" roughness={0.5} metalness={0.8} clearcoat={0.2} />
        </mesh>
        
        {/* Inner Panels */}
        <mesh position={[1.5, 0, 0.21]}>
          <boxGeometry args={[2.5, 7, 0.08]} />
          <meshPhysicalMaterial color="#1e293b" roughness={0.4} metalness={0.85} clearcoat={0.15} />
        </mesh>
        <mesh position={[-1.5, 0, 0.21]}>
          <boxGeometry args={[2.5, 7, 0.08]} />
          <meshPhysicalMaterial color="#1e293b" roughness={0.4} metalness={0.85} clearcoat={0.15} />
        </mesh>
        
        {/* Central Split Line */}
        <mesh position={[0, 0, 0.22]}>
          <boxGeometry args={[0.1, 8, 0.08]} />
          <meshPhysicalMaterial color="#0a0f1a" roughness={0.6} metalness={0.95} />
        </mesh>

        {/* Horizontal Iron Bars */}
        {[-2, 0, 2].map((y, i) => (
          <mesh key={`hbar-${i}`} position={[0, y, 0.25]}>
            <boxGeometry args={[5.8, 0.15, 0.08]} />
            <meshPhysicalMaterial color="#0a0f1a" roughness={0.5} metalness={0.95} clearcoat={0.3} />
          </mesh>
        ))}

        {/* Warning Stripes */}
        <group position={[0, -3.5, 0.21]}>
          <mesh>
            <boxGeometry args={[5.8, 0.6, 0.05]} />
            <meshStandardMaterial color="#eab308" roughness={0.7} metalness={0.3} />
          </mesh>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={`stripe-${i}`} position={[-2.5 + i * 0.55, 0, 0.03]} rotation={[0, 0, 0.5]}>
              <planeGeometry args={[0.3, 0.8]} />
              <meshBasicMaterial color="#000000" />
            </mesh>
          ))}
        </group>

        {/* Door status lights */}
        <mesh position={[2.8, 3, 0.22]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={isExitDoorOpen ? "#22c55e" : "#ef4444"} emissive={isExitDoorOpen ? "#16a34a" : "#dc2626"} emissiveIntensity={3} />
        </mesh>
        <mesh position={[-2.8, 3, 0.22]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={isExitDoorOpen ? "#22c55e" : "#ef4444"} emissive={isExitDoorOpen ? "#16a34a" : "#dc2626"} emissiveIntensity={3} />
        </mesh>
      </group>
      
      {/* Exit Door Frame */}
      <mesh position={[0, 4, 39.8]}>
        <boxGeometry args={[7, 9, 0.2]} />
        <meshPhysicalMaterial color="#1e293b" roughness={0.5} metalness={0.95} clearcoat={0.2} />
      </mesh>

      {/* ========== EFFECTS ========== */}
      <InteriorSmoke />
      <Sparkles count={40} scale={[18, 8, 58]} position={[0, 4, 10]} size={1.5} speed={0.3} opacity={0.4} color="#fef3c7" />
      <Sparkles count={20} scale={[16, 6, 16]} position={[0, 4, 30]} size={2} speed={0.5} opacity={0.5} color="#0ea5e9" />

      {/* ========== UI PROMPTS ========== */}
      {inStorage && (
        <Html fullscreen zIndexRange={[0, 0]}>
          <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none animate-pulse">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300 tracking-[0.2em] drop-shadow-[0_0_10px_rgba(251,146,60,0.8)] uppercase text-center">
              Armazém de Minérios
            </h1>
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent mt-2"></div>
          </div>
        </Html>
      )}

      {showExitPrompt && (
        <Html position={[0, 0, 0]} center style={{ position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%)' }}>
          <div className="pointer-events-none select-none">
            <div className="flex flex-col items-center gap-2 opacity-90 animate-pulse">
              <span className="text-[10px] text-cyan-400 uppercase tracking-[0.4em] font-bold shadow-cyan-500/50 drop-shadow-md">Protocolo de Desembarque</span>
              <div className="flex items-center gap-3 border border-cyan-500/80 bg-cyan-950/60 px-8 py-3 backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.4)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-cyan-400"></div>
                <div className="absolute bottom-0 right-0 w-2 h-full bg-cyan-400"></div>
                <div className="text-black font-mono font-black text-sm bg-cyan-400 px-3 py-1 ml-2">F</div>
                <span className="text-cyan-100 font-black tracking-widest uppercase text-sm ml-2 mr-2">Sair da Nave</span>
              </div>
            </div>
          </div>
        </Html>
      )}

      {showPanelError && (
        <Html position={[0, 4.5, -17.5]} transform rotation={[-0.2, 0, 0]} distanceFactor={8}>
          <div className="bg-red-950/90 border border-red-500/60 text-red-100 px-6 py-4 rounded-lg flex flex-col items-center gap-2 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.4)] pointer-events-none select-none">
            <div className="text-red-400 font-bold tracking-widest text-lg flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              ERRO DE SISTEMA
            </div>
            <div className="text-center font-mono text-sm leading-relaxed">
              Módulo de navegação offline.<br/>
              Motor de dobra danificado.<br/>
              Reparos necessários antes da decolagem.
            </div>
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent mt-1"></div>
          </div>
        </Html>
      )}
    </group>
  );
}
