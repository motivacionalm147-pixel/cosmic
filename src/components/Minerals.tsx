import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Mesh, InstancedMesh, Object3D } from 'three';
import { Html } from '@react-three/drei';
import { useKeyboard } from '../hooks/useKeyboard';

export const MINERAL_TYPES = [
  { name: 'FERRO', color: '#9ca3af', emissive: '#4b5563', maxHealth: 50, value: 10, rarity: 'COMUM' },
  { name: 'COBRE', color: '#b45309', emissive: '#78350f', maxHealth: 80, value: 25, rarity: 'INCOMUM' },
  { name: 'OURO', color: '#fbbf24', emissive: '#b45309', maxHealth: 150, value: 100, rarity: 'RARO' },
  { name: 'CRISTAL AZUL', color: '#38bdf8', emissive: '#0284c7', maxHealth: 300, value: 500, rarity: 'ÉPICO' },
  { name: 'NÚCLEO ESTELAR', color: '#f43f5e', emissive: '#9f1239', maxHealth: 800, value: 2000, rarity: 'LENDÁRIO' }
];

export function DrillItem({ position, playerRef, onPickUp }: { position: [number, number, number], playerRef: React.RefObject<Group>, onPickUp: () => void }) {
  const ref = useRef<Group>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const keys = useKeyboard();

  const showPromptRef = useRef(false);
  const _drillVec = useMemo(() => new Vector3(), []);

  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y += 0.02;
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }

    if (playerRef.current) {
      _drillVec.set(position[0], position[1], position[2]);
      const dist = playerRef.current.position.distanceTo(_drillVec);
      const newPrompt = dist < 2;
      if (newPrompt !== showPromptRef.current) {
        showPromptRef.current = newPrompt;
        setShowPrompt(newPrompt);
      }
      if (newPrompt && keys.interact) {
        onPickUp();
      }
    }
  });

  return (
    <group position={position} ref={ref} scale={[1.5, 1.5, 1.5]}>
      <mesh castShadow position={[0, -0.1, 0]}>
        <boxGeometry args={[0.15, 0.4, 0.2]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh castShadow position={[0, 0.15, 0.1]}>
        <boxGeometry args={[0.1, 0.2, 0.3]} />
        <meshStandardMaterial color="#1f2937" metalness={0.9} roughness={0.3} />
      </mesh>
      <group position={[0, 0.3, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.3, 16]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.25, 0]} castShadow>
          <coneGeometry args={[0.08, 0.3, 16]} />
          <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
      {showPrompt && (
        <Html position={[0, 1, 0]} center distanceFactor={10}>
          <div className="bg-black/80 text-white px-3 py-1 rounded font-mono text-sm border border-white/20 whitespace-nowrap pointer-events-none">
            [E] Pegar Broca
          </div>
        </Html>
      )}
    </group>
  );
}

// Optimized Mineral System
export function MineralCluster({ onTarget, playerRef, isDrillEquipped }: { onTarget?: (info: any) => void, playerRef?: React.RefObject<Group>, isDrillEquipped?: boolean }) {
  const [minerals, setMinerals] = useState<any[]>(() => {
    const initialMinerals = [];
    const clusters = [
      { x: -30, z: 40, count: 20, spread: 50 },
      { x: 45, z: -20, count: 25, spread: 50 },
      { x: -50, z: -45, count: 22, spread: 50 },
      { x: 60, z: 50, count: 30, spread: 50 },
      { x: 0, z: 80, count: 18, spread: 40 },
      { x: 80, z: 0, count: 20, spread: 40 },
      { x: -80, z: 0, count: 20, spread: 40 },
      { x: 0, z: -80, count: 18, spread: 40 },
    ];

    let idCounter = 1;
    clusters.forEach(cluster => {
      for (let i = 0; i < cluster.count; i++) {
        const rand = Math.random();
        let type = MINERAL_TYPES[0];
        if (rand > 0.98) type = MINERAL_TYPES[4];
        else if (rand > 0.9) type = MINERAL_TYPES[3];
        else if (rand > 0.7) type = MINERAL_TYPES[2];
        else if (rand > 0.4) type = MINERAL_TYPES[1];

        const isLarge = Math.random() > 0.8;
        const scale = isLarge ? (Math.random() * 1.5 + 2.0) : (Math.random() * 0.8 + 0.5);
        const height = scale * 0.8;

        initialMinerals.push({
          id: idCounter++,
          type,
          pos: [
            cluster.x + (Math.random() - 0.5) * cluster.spread,
            height / 2 - 0.2,
            cluster.z + (Math.random() - 0.5) * cluster.spread
          ],
          rot: [Math.random() * 0.2, Math.random() * Math.PI, Math.random() * 0.2],
          scale: [scale, scale * (1 + Math.random()), scale],
          health: type.maxHealth * (isLarge ? 5 : 1),
          maxHealth: type.maxHealth * (isLarge ? 5 : 1),
          isLarge,
          active: true
        });
      }
    });
    return initialMinerals;
  });

  const [droppedFragments, setDroppedFragments] = useState<any[]>([]);
  const meshRefs = useRef<{ [key: string]: InstancedMesh | null }>({});
  const dummy = useMemo(() => new Object3D(), []);

  // Group minerals by type for instancing
  const mineralsByType = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    MINERAL_TYPES.forEach(t => groups[t.name] = []);
    minerals.forEach(m => {
      if (m.active) groups[m.type.name].push(m);
    });
    return groups;
  }, [minerals]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    MINERAL_TYPES.forEach(type => {
      const mesh = meshRefs.current[type.name];
      if (!mesh) return;
      const activeMinerals = mineralsByType[type.name];
      activeMinerals.forEach((m, i) => {
        dummy.position.set(m.pos[0], m.pos[1] + Math.sin(time * 2 + m.id) * 0.15, m.pos[2]);
        dummy.rotation.set(m.rot[0] + time * 0.1, m.rot[1] + time * 0.2, m.rot[2]);
        dummy.scale.set(m.scale[0], m.scale[1], m.scale[2]);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.count = activeMinerals.length;
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  const hitMineral = (id: number, damage: number) => {
    let droppedFragment: any = null;

    setMinerals(prev => prev.map(m => {
      if (m.id === id && m.active) {
        const newHealth = Math.max(0, m.health - damage);
        
        if (m.isLarge && Math.random() < 0.1) {
          const dist = playerRef?.current ? playerRef.current.position.distanceTo(new Vector3(...m.pos)) : Infinity;
          if (dist < 10) {
            droppedFragment = {
              id: `drop-${m.id}-${Date.now()}-${Math.random()}`,
              pos: new Vector3(m.pos[0], m.pos[1] + 1, m.pos[2]),
              vel: new Vector3((Math.random()-0.5)*8, Math.random()*5 + 3, (Math.random()-0.5)*8),
              rot: new Vector3(Math.random(), Math.random(), Math.random()),
              size: 0.15 + Math.random() * 0.1,
              type: MINERAL_TYPES[0],
              basePosition: m.pos
            };
          }
        }

        if (newHealth <= 0) {
          if (onTarget) onTarget(null);
          
          // Drop final fragments
          const count = m.isLarge ? 5 : 2;
          const frags = Array.from({ length: count }).map(() => ({
            id: `drop-final-${m.id}-${Date.now()}-${Math.random()}`,
            pos: new Vector3(m.pos[0], m.pos[1] + 1, m.pos[2]),
            vel: new Vector3((Math.random()-0.5)*10, Math.random()*6 + 4, (Math.random()-0.5)*10),
            rot: new Vector3(Math.random(), Math.random(), Math.random()),
            size: 0.15 + Math.random() * 0.1,
            type: m.type,
            basePosition: m.pos
          }));
          
          setTimeout(() => {
            setDroppedFragments(prev => [...prev, ...frags]);
          }, 0);

          return { ...m, health: 0, active: false };
        }
        return { ...m, health: newHealth };
      }
      return m;
    }));

    if (droppedFragment) {
      setDroppedFragments(prevFrags => [...prevFrags, droppedFragment]);
    }
  };

  // Find closest mineral for UI and interaction
  const [closestMineral, setClosestMineral] = useState<any>(null);
  const closestIdRef = useRef<number | null>(null);
  const _mineralVec = useMemo(() => new Vector3(), []);
  useFrame((state) => {
    if (!playerRef?.current) return;
    // Only check every 5 frames to reduce work
    if (Math.floor(state.clock.elapsedTime * 60) % 5 !== 0) return;
    
    let minDist = 12;
    let closest: any = null;
    
    minerals.forEach(m => {
      if (!m.active) return;
      _mineralVec.set(m.pos[0], m.pos[1], m.pos[2]);
      const dist = playerRef.current!.position.distanceTo(_mineralVec);
      if (dist < minDist) {
        minDist = dist;
        closest = m;
      }
    });
    const newId = closest?.id ?? null;
    if (newId !== closestIdRef.current) {
      closestIdRef.current = newId;
      setClosestMineral(closest);
    }
  });

  return (
    <group name="mineralCluster">
      {MINERAL_TYPES.map(type => (
        <instancedMesh 
          key={type.name}
          ref={el => meshRefs.current[type.name] = el}
          args={[undefined, undefined, 200]}
          castShadow
          receiveShadow
          frustumCulled={false}
          userData={{ type: 'mineral-group', mineralType: type }}
        >
          <icosahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial 
            color={type.color} 
            roughness={0.2} 
            metalness={0.8} 
            emissive={type.emissive} 
            emissiveIntensity={0.6} 
          />
        </instancedMesh>
      ))}

      {/* Interaction Proxy for the closest mineral */}
      {closestMineral && (
        <group position={[
          closestMineral.pos[0], 
          closestMineral.pos[1] + Math.sin(Date.now() / 500 * 2 + closestMineral.id) * 0.15, 
          closestMineral.pos[2]
        ]}>
          {isDrillEquipped && (
            <mesh scale={[closestMineral.scale[0]*1.4, closestMineral.scale[1]*1.4, closestMineral.scale[2]*1.4]}>
              <icosahedronGeometry args={[1, 1]} />
              <meshBasicMaterial color="#22d3ee" wireframe transparent opacity={0.3} />
            </mesh>
          )}
          <mesh 
            visible={false}
            name="mineral"
            userData={{ 
              type: 'mineral', 
              id: closestMineral.id,
              mineralInfo: { 
                name: closestMineral.isLarge ? `LARGE ${closestMineral.type.name}` : closestMineral.type.name, 
                health: closestMineral.health, 
                maxHealth: closestMineral.maxHealth, 
                value: closestMineral.type.value, 
                rarity: closestMineral.type.rarity, 
                color: closestMineral.type.color 
              },
              onHit: (damage: number) => hitMineral(closestMineral.id, damage)
            }}
          >
            <sphereGeometry args={[closestMineral.scale[0] * 1.5]} />
          </mesh>
          <Html position={[0, closestMineral.scale[1] * 0.8 + 0.8, 0]} center distanceFactor={15}>
            <div className="flex flex-col items-center pointer-events-none w-48 transition-all duration-300">
              {isDrillEquipped && (
                <div className="mb-2 text-cyan-400 font-bold text-[10px] animate-pulse tracking-[0.4em] bg-cyan-950/80 px-3 py-1 rounded-sm border border-cyan-500/40 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.3)] uppercase">
                  Alvo Identificado
                </div>
              )}
              
              <div className="w-full bg-slate-950/80 border border-white/10 p-2 rounded-lg backdrop-blur-xl shadow-2xl relative overflow-hidden">
                {/* Background glow based on rarity */}
                <div className="absolute inset-0 opacity-10 blur-xl" style={{ backgroundColor: closestMineral.type.color }}></div>
                
                <div className="flex justify-between items-end mb-1 relative z-10">
                  <span className="text-[10px] font-black tracking-widest uppercase truncate max-w-[100px]" style={{ color: closestMineral.type.color }}>
                    {closestIdRef.current && closestMineral.isLarge ? `GRANDE ${closestMineral.type.name}` : closestMineral.type.name}
                  </span>
                  <span className="text-[8px] text-white/40 font-mono">
                    {Math.round(closestMineral.health)} / {closestMineral.maxHealth}
                  </span>
                </div>

                {/* Main Health Bar */}
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/5 relative z-10">
                  <div 
                    className="h-full transition-all duration-300 ease-out relative"
                    style={{ 
                      width: `${(closestMineral.health / closestMineral.maxHealth) * 100}%`,
                      backgroundColor: closestMineral.type.color,
                      boxShadow: `0 0 10px ${closestMineral.type.color}44`
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-[pulse_1s_infinite]"></div>
                  </div>
                </div>

                <div className="mt-1.5 flex justify-between items-center relative z-10">
                  <span className="text-[7px] text-white/30 uppercase tracking-[0.2em]">{closestMineral.type.rarity}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 h-1 rounded-full ${i < (closestMineral.type.value > 100 ? 5 : closestMineral.type.value > 50 ? 3 : 1) ? 'bg-white/40' : 'bg-white/5'}`}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}
      
      {droppedFragments.map(frag => (
        <MineralFragment 
          key={frag.id} 
          id={frag.id}
          initialPos={frag.pos} 
          initialVel={frag.vel} 
          initialRot={frag.rot} 
          size={frag.size} 
          type={frag.type} 
          playerRef={playerRef} 
          basePosition={frag.basePosition} 
        />
      ))}
    </group>
  );
}

function Mineral({ m, onHit, onTarget }: { m: any, onHit: (dmg: number) => void, onTarget?: (info: any) => void }) {
  const meshRef = useRef<Mesh>(null);
  const [isHit, setIsHit] = useState(false);
  const [showRarity, setShowRarity] = useState(false);

  const handleHit = (damage: number) => {
    setIsHit(true);
    onHit(damage);
    setTimeout(() => setIsHit(false), 100);
  };

  useFrame((state) => {
    if (meshRef.current && isHit) {
      meshRef.current.position.x = m.pos[0] + (Math.random() - 0.5) * 0.1;
      meshRef.current.position.y = m.pos[1] + (Math.random() - 0.5) * 0.1;
      meshRef.current.position.z = m.pos[2] + (Math.random() - 0.5) * 0.1;
    } else if (meshRef.current) {
      meshRef.current.position.set(m.pos[0], m.pos[1], m.pos[2]);
    }

    const dist = state.camera.position.distanceTo(new Vector3(...m.pos));
    setShowRarity(dist < 12);
  });

  return (
    <group>
      <mesh 
        ref={meshRef}
        name="mineral"
        position={m.pos as [number,number,number]} 
        rotation={m.rot as [number,number,number]}
        scale={m.scale as [number,number,number]}
        castShadow 
        receiveShadow 
        userData={{ 
          type: 'mineral', 
          id: m.id,
          mineralInfo: { name: m.isLarge ? `LARGE ${m.type.name}` : m.type.name, health: m.health, maxHealth: m.maxHealth, value: m.type.value, rarity: m.type.rarity, color: m.type.color },
          onHit: handleHit 
        }}
      >
        <icosahedronGeometry args={[0.8, 0]} />
        <meshStandardMaterial 
          color={isHit ? '#ffffff' : m.type.color} 
          roughness={0.2} 
          metalness={0.8} 
          emissive={isHit ? '#ffffff' : m.type.emissive} 
          emissiveIntensity={isHit ? 1 : 0.6} 
        />
      </mesh>
      
      {showRarity && (
        <Html position={[m.pos[0], m.pos[1] + m.scale[1] * 0.8 + 0.5, m.pos[2]]} center distanceFactor={15} occlude>
          <div className="flex flex-col items-center pointer-events-none opacity-60 transition-opacity duration-300">
            <div className="flex flex-col items-center">
              <span className="text-[8px] font-black tracking-[0.3em] uppercase mb-0.5 drop-shadow-md" style={{ color: m.type.color }}>{m.type.rarity}</span>
              <div className="w-6 h-[2px] bg-white/20 mb-0.5" />
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function MineralFragment({ id, initialPos, initialVel, initialRot, size, type, playerRef, basePosition }: any) {
  const meshRef = useRef<Mesh>(null);
  const [settled, setSettled] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collected, setCollected] = useState(false);
  const [floatText, setFloatText] = useState<{text: string, color: string} | null>(null);
  
  const pos = useRef(initialPos.clone());
  const vel = useRef(initialVel.clone());
  const rot = useRef(initialRot.clone());

  useFrame((state, delta) => {
    if (collected || !meshRef.current) return;

    if (collecting && playerRef?.current) {
      const playerPos = playerRef.current.position.clone().add(new Vector3(0, 1, 0));
      const dir = playerPos.clone().sub(pos.current);
      dir.normalize();
      
      vel.current.lerp(dir.multiplyScalar(25), 5 * delta);
      pos.current.addScaledVector(vel.current, delta);
      
      meshRef.current.position.copy(pos.current);
      meshRef.current.scale.lerp(new Vector3(0,0,0), 5 * delta);
      meshRef.current.rotation.x += 15 * delta;
      meshRef.current.rotation.y += 15 * delta;

      if (pos.current.distanceTo(playerPos) < 1.0 && !floatText) {
        setFloatText({ text: `+1 ${type.name}`, color: type.color });
        window.dispatchEvent(new CustomEvent('mineral-collected', { detail: type }));
        setTimeout(() => setCollected(true), 1000);
      }
      return;
    }

    if (playerRef?.current && !collecting) {
      const playerPos = playerRef.current.position;
      const dist = playerPos.distanceTo(pos.current);
      
      if (dist < 3.0) {
        setCollecting(true);
      }

      if (dist < 1.0) {
        const pushDir = new Vector3().subVectors(pos.current, playerPos).normalize();
        vel.current.x += pushDir.x * 20 * delta;
        vel.current.z += pushDir.z * 20 * delta;
        setSettled(false);
      }
    }

    if (!settled) {
      vel.current.y -= 15 * delta;
      pos.current.addScaledVector(vel.current, delta);
      if (pos.current.y < 0.2) {
        pos.current.y = 0.2;
        vel.current.y *= -0.4;
        vel.current.x *= 0.8;
        vel.current.z *= 0.8;
        if (Math.abs(vel.current.y) < 0.5 && Math.abs(vel.current.x) < 0.5 && Math.abs(vel.current.z) < 0.5) {
          setSettled(true);
        }
      }
      meshRef.current.position.copy(pos.current);
      meshRef.current.rotation.x += rot.current.x * delta * 10;
      meshRef.current.rotation.y += rot.current.y * delta * 10;
    } else {
      meshRef.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 3 + pos.current.x) * 0.1;
      meshRef.current.rotation.y += delta;
    }
  });

  if (collected) return null;

  return (
    <group>
      <mesh ref={meshRef} position={pos.current} scale={[size, size, size]} castShadow receiveShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color={type.color} emissive={type.emissive} emissiveIntensity={0.8} roughness={0.1} metalness={0.8} />
      </mesh>
      {floatText && (
        <Html position={[pos.current.x, pos.current.y + 1, pos.current.z]} center>
          <div className="font-bold text-lg animate-bounce pointer-events-none drop-shadow-md whitespace-nowrap" style={{ color: floatText.color }}>
            {floatText.text}
          </div>
        </Html>
      )}
    </group>
  );
}
