import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, Group, Euler } from 'three';
import { Html } from '@react-three/drei';
import { CharacterModel } from './CharacterModel';

interface NPCProps {
  name: string;
  role: string;
  color: string;
  startPosition: [number, number, number];
  playerRef: React.RefObject<Group>;
  showUI?: boolean;
  isInjured?: boolean;
}

const DIALOGUE = [
  "Ugh... minha cabeça...",
  "O asteroide nos atingiu em cheio. Os sistemas da nave estão completamente fritos.",
  "Eu estou muito ferido, não consigo continuar. Preciso voltar para a nave e tentar estabilizar os sistemas.",
  "Escute, você precisa encontrar algo importante naquele buraco ali na frente para melhorar a nave.",
  "Tome minha broca de mineração e minha arma de plasma. Você vai precisar delas."
];

export function NPC({ name, role, color, startPosition, playerRef, showUI = true, isInjured = false }: NPCProps) {
  const groupRef = useRef<Group>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [headRotation, setHeadRotation] = useState(0);
  const [dialogueStep, setDialogueStep] = useState(-1);
  const [showPrompt, setShowPrompt] = useState(false);
  const [hasDroppedWeapon, setHasDroppedWeapon] = useState(false);
  const [hasCollectedWeapon, setHasCollectedWeapon] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [showGoodbye, setShowGoodbye] = useState(false);
  const targetPosition = useRef(new Vector3(...startPosition));
  const velocity = useRef(new Vector3());
  const targetQuaternion = useRef(new Quaternion());
  const weaponRef = useRef<Group>(null);
  
  const speed = 3;

  useEffect(() => {
    if (isInjured) return; // Injured NPCs don't wander around
    
    const interval = setInterval(() => {
      if (!playerRef.current || !groupRef.current) return;
      
      // Decide whether to move or stand still
      if (Math.random() > 0.3) {
        // Pick a random point near their current position
        const currentPos = groupRef.current.position;
        const angle = Math.random() * Math.PI * 2;
        const radius = 2 + Math.random() * 6; // Between 2 and 8 units away
        
        targetPosition.current.set(
          currentPos.x + Math.cos(angle) * radius,
          0,
          currentPos.z + Math.sin(angle) * radius
        );
        setIsMoving(true);
      } else {
        setIsMoving(false);
      }
    }, 2000 + Math.random() * 3000); // Change state every 2-5 seconds

    return () => clearInterval(interval);
  }, [isInjured, playerRef]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE') {
        if (showPrompt && dialogueStep === -1 && !hasDroppedWeapon && !isLeaving) {
          setDialogueStep(0);
        } else if (dialogueStep >= 0 && dialogueStep < DIALOGUE.length - 1) {
          setDialogueStep(prev => prev + 1);
        } else if (dialogueStep === DIALOGUE.length - 1) {
          // Drop items and collect instantly — no freeze or extra E press
          setDialogueStep(-1);
          setHasDroppedWeapon(true);
          setHasCollectedWeapon(true);
          // Dispatch collect events immediately
          window.dispatchEvent(new CustomEvent('collect-drill'));
          window.dispatchEvent(new CustomEvent('collect-weapon'));
          setShowGoodbye(true);
          setTimeout(() => {
            setShowGoodbye(false);
            setIsLeaving(true);
          }, 3000);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPrompt, dialogueStep, hasDroppedWeapon, hasCollectedWeapon, isLeaving]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    if (playerRef.current) {
      const dist = groupRef.current.position.distanceTo(playerRef.current.position);
      const newPrompt = dist < 5;
      if (newPrompt !== showPrompt) setShowPrompt(newPrompt);
      
      if (isInjured && dist < 5 && !isLeaving) {
        // Look at player if injured and player is near
        const dir = new Vector3().subVectors(playerRef.current.position, groupRef.current.position);
        const angle = Math.atan2(dir.x, dir.z);
        setHeadRotation(angle);
      }
    }

    // Weapon floating animation
    if (weaponRef.current && hasDroppedWeapon && !hasCollectedWeapon) {
      weaponRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      weaponRef.current.rotation.y += delta;
    }

    if (isLeaving) {
      // Move towards the ship
      const shipPos = new Vector3(-12, 0, -12);
      const distToShip = groupRef.current.position.distanceTo(shipPos);
      
      if (distToShip > 2) {
        setIsMoving(true);
        velocity.current.subVectors(shipPos, groupRef.current.position).normalize().multiplyScalar(speed);
        groupRef.current.position.addScaledVector(velocity.current, delta);
        
        const angle = Math.atan2(velocity.current.x, velocity.current.z);
        targetQuaternion.current.setFromAxisAngle(new Vector3(0, 1, 0), angle);
        groupRef.current.quaternion.slerp(targetQuaternion.current, 0.1);
      } else {
        // Disappear inside ship
        if (groupRef.current.visible) {
          groupRef.current.visible = false;
          setIsMoving(false);
          window.dispatchEvent(new CustomEvent('hawk-left'));
        }
      }
      return;
    }

    if (isInjured) return; // Skip movement logic if injured

    if (isMoving) {
      const currentPos = groupRef.current.position;
      const distance = currentPos.distanceTo(targetPosition.current);

      if (distance > 0.1) {
        // Move towards target
        velocity.current.subVectors(targetPosition.current, currentPos).normalize().multiplyScalar(speed);
        groupRef.current.position.addScaledVector(velocity.current, delta);

        // Rotate towards target
        const angle = Math.atan2(velocity.current.x, velocity.current.z);
        targetQuaternion.current.setFromAxisAngle(new Vector3(0, 1, 0), angle);
        groupRef.current.quaternion.slerp(targetQuaternion.current, 0.1);
      } else {
        setIsMoving(false);
      }
    }

    // Look in the direction of movement or randomly
    if (isMoving) {
      setHeadRotation(0);
    } else if (Math.random() < 0.01) {
      // Randomly look around when standing still
      setHeadRotation((Math.random() - 0.5) * Math.PI / 2);
    }
  });

  return (
    <group ref={groupRef} position={startPosition}>
      <CharacterModel color={color} isMoving={isMoving} isJumping={false} headRotationY={headRotation} isInjured={isInjured && !isLeaving} />
      
      {/* Dropped Items */}
      {hasDroppedWeapon && !hasCollectedWeapon && (
        <group ref={weaponRef} position={[1, 0.5, 1]}>
          {/* Plasma Weapon Model (enhanced) */}
          <group position={[0, 0, 0.3]}>
            <mesh castShadow>
              <boxGeometry args={[0.15, 0.2, 0.5]} />
              <meshPhysicalMaterial color="#111827" metalness={0.95} roughness={0.15} clearcoat={0.5} />
            </mesh>
            {/* Barrel */}
            <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.05, 0.15, 12]} />
              <meshPhysicalMaterial color="#374151" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Holographic sight */}
            <mesh position={[0, 0.14, -0.05]} castShadow>
              <boxGeometry args={[0.08, 0.06, 0.1]} />
              <meshPhysicalMaterial color="#1a202c" metalness={0.9} roughness={0.1} />
            </mesh>
            {/* Sight glass */}
            <mesh position={[0, 0.14, 0.01]}>
              <boxGeometry args={[0.06, 0.04, 0.003]} />
              <meshPhysicalMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.5} transmission={0.8} transparent opacity={0.4} />
            </mesh>
            {/* Handle */}
            <mesh position={[0, -0.15, 0]} castShadow>
              <boxGeometry args={[0.07, 0.2, 0.08]} />
              <meshPhysicalMaterial color="#0d1117" roughness={0.7} metalness={0.3} />
            </mesh>
            {/* Energy core glow */}
            <mesh position={[0, 0.02, 0.05]}>
              <sphereGeometry args={[0.05, 12, 12]} />
              <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={4} />
            </mesh>
          </group>
          
          {/* Drill Model (enhanced) */}
          <group position={[0, 0, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.1, 0.12, 0.4, 12]} />
              <meshPhysicalMaterial color="#2d3748" metalness={0.95} roughness={0.15} clearcoat={0.4} />
            </mesh>
            {/* Drill bit */}
            <mesh position={[0, 0.3, 0]} castShadow>
              <coneGeometry args={[0.08, 0.3, 12]} />
              <meshPhysicalMaterial color="#eab308" metalness={0.9} roughness={0.1} clearcoat={0.5} />
            </mesh>
            {/* Energy ring */}
            <mesh position={[0, 0.18, 0]}>
              <torusGeometry args={[0.1, 0.012, 8, 20]} />
              <meshStandardMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={2} />
            </mesh>
          </group>

          <pointLight color="#38bdf8" intensity={4} distance={4} />
          <pointLight color="#eab308" intensity={3} distance={3} position={[0, 0, -0.3]} />
        </group>
      )}

      {/* Goodbye Bubble */}
      {showGoodbye && (
        <Html position={[1.5, isInjured ? 1.5 : 2.5, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 text-cyan-100 px-4 py-3 rounded-lg text-sm font-mono shadow-[0_0_15px_rgba(6,182,212,0.3)] max-w-[250px] text-center pointer-events-none">
            <div className="text-cyan-400 font-bold text-xs mb-1 tracking-widest">{name}</div>
            Até mais...
          </div>
        </Html>
      )}

      {/* Dialogue Bubble */}
      {dialogueStep >= 0 && (
        <Html position={[1.5, isInjured ? 1.5 : 2.5, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
          <div className="bg-black/60 backdrop-blur-md border border-cyan-500/30 text-cyan-100 px-4 py-3 rounded-lg text-sm font-mono shadow-[0_0_15px_rgba(6,182,212,0.3)] max-w-[250px] text-center relative pointer-events-none animate-pulse-slow">
            <div className="text-cyan-400 font-bold text-xs mb-1 tracking-widest">{name}</div>
            {DIALOGUE[dialogueStep]}
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-cyan-500/30"></div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-cyan-300/80 text-[10px] whitespace-nowrap bg-black/80 border border-cyan-500/20 px-2 py-0.5 rounded animate-bounce">
              [E] Próximo
            </div>
          </div>
        </Html>
      )}

      {/* Interaction Prompt */}
      {showPrompt && dialogueStep === -1 && !isLeaving && !showGoodbye && (
        <Html position={[0, isInjured ? 1.5 : 2.5, 0]} center distanceFactor={10} zIndexRange={[100, 0]}>
          <div className="bg-black/80 text-white px-2 py-1 rounded text-xs font-bold border border-white/20 whitespace-nowrap pointer-events-none">
            {hasDroppedWeapon && !hasCollectedWeapon ? '[E] COLETAR ARMA' : '[E] FALAR'}
          </div>
        </Html>
      )}

      {/* Distance Indicator */}
      {!showPrompt && !isLeaving && (
        <Html position={[0, isInjured ? 2.0 : 3.0, 0]} center distanceFactor={25} zIndexRange={[100, 0]}>
          <div className="flex flex-col items-center animate-bounce-slight pointer-events-none opacity-70">
            <div className="w-4 h-4 bg-cyan-400 rotate-45 border border-cyan-200 shadow-[0_0_20px_#22d3ee]"></div>
            <div className="w-1 h-6 bg-gradient-to-b from-cyan-400 to-transparent mt-1"></div>
          </div>
        </Html>
      )}

      <Html position={[0.6, isInjured ? 0.5 : 1.2, 0]} center distanceFactor={10} occlude>
        <div className={`transition-opacity duration-300 ${showUI && dialogueStep === -1 && !isLeaving ? 'opacity-100' : 'opacity-0'} flex flex-row items-center pointer-events-none`}>
          <div className="w-6 h-px bg-cyan-500/50 mr-2"></div>
          <div className="bg-black/30 border border-cyan-500/20 text-cyan-400 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap backdrop-blur-md">
            <span className="font-bold text-white">{name}</span> | {role}
          </div>
        </div>
      </Html>
    </group>
  );
}
