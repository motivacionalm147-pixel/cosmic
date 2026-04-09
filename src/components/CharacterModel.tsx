import React, { useRef } from 'react';
import { Group, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { useKeyboard } from '../hooks/useKeyboard';

export interface CharacterModelProps {
  color?: string;
  isMoving?: boolean;
  isJumping?: boolean;
  headRotationY?: number;
  hasDrill?: boolean;
  isDrillEquipped?: boolean;
  isPlasmaEquipped?: boolean;
  isAiming?: boolean;
  isFiring?: boolean;
  aimPitch?: number;
  hasPlasma?: boolean;
  drillTipRef?: React.RefObject<Group>;
  plasmaTipRef?: React.RefObject<Group>;
  isCollecting?: boolean;
  isFlying?: boolean;
  isSprinting?: boolean;
  isFirstPerson?: boolean;
  isFalling?: boolean;
  isInjured?: boolean;
}

export function DrillMeshes({ drillBitRef, drillTipRef, isFiring }: { drillBitRef: React.RefObject<Group>, drillTipRef?: React.RefObject<Group>, isFiring?: boolean }) {
  const ringRef1 = useRef<Group>(null);
  const ringRef2 = useRef<Group>(null);
  const glowRef = useRef<any>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (drillBitRef.current) {
      drillBitRef.current.rotation.y += isFiring ? 1.2 : 0.08;
    }
    if (ringRef1.current) {
      ringRef1.current.rotation.y = isFiring ? time * 8 : time * 0.5;
    }
    if (ringRef2.current) {
      ringRef2.current.rotation.y = isFiring ? -time * 6 : -time * 0.3;
    }
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = isFiring ? 5 + Math.sin(time * 20) * 2 : 1.5;
    }
  });

  return (
    <>
      {/* Main Body Housing - Heavy industrial look */}
      <mesh castShadow position={[0, -0.15, 0]}>
        <cylinderGeometry args={[0.11, 0.14, 0.5, 12]} />
        <meshPhysicalMaterial color="#2d3748" metalness={0.95} roughness={0.15} clearcoat={0.4} clearcoatRoughness={0.1} />
      </mesh>
      {/* Body Side Panels */}
      <mesh castShadow position={[0.08, -0.1, 0.06]}>
        <boxGeometry args={[0.04, 0.35, 0.08]} />
        <meshPhysicalMaterial color="#1a202c" metalness={0.9} roughness={0.2} clearcoat={0.3} />
      </mesh>
      <mesh castShadow position={[-0.08, -0.1, 0.06]}>
        <boxGeometry args={[0.04, 0.35, 0.08]} />
        <meshPhysicalMaterial color="#1a202c" metalness={0.9} roughness={0.2} clearcoat={0.3} />
      </mesh>
      {/* Yellow Warning Stripes */}
      <mesh castShadow position={[0, -0.05, 0.12]}>
        <boxGeometry args={[0.08, 0.06, 0.03]} />
        <meshStandardMaterial color="#d69e2e" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[0, -0.18, 0.12]}>
        <boxGeometry args={[0.08, 0.06, 0.03]} />
        <meshStandardMaterial color="#d69e2e" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Ergonomic Handle */}
      <mesh castShadow position={[0, -0.28, -0.12]} rotation={[0.25, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.04, 0.22, 8]} />
        <meshPhysicalMaterial color="#0d1117" roughness={0.8} metalness={0.2} />
      </mesh>
      {/* Trigger */}
      <mesh castShadow position={[0, -0.22, -0.04]} rotation={[0.6, 0, 0]}>
        <boxGeometry args={[0.02, 0.08, 0.02]} />
        <meshStandardMaterial color="#1a202c" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Motor Housing - Top section */}
      <mesh castShadow position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.13, 0.12, 0.22, 16]} />
        <meshPhysicalMaterial color="#1a202c" metalness={0.95} roughness={0.1} clearcoat={0.6} clearcoatRoughness={0.05} />
      </mesh>
      {/* Heat Vents */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={`vent-${i}`} position={[Math.cos(i * Math.PI / 2) * 0.12, 0.12, Math.sin(i * Math.PI / 2) * 0.12]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.08, 0.02, 0.04]} />
          <meshStandardMaterial color={isFiring ? "#fb923c" : "#374151"} emissive={isFiring ? "#f97316" : "#000"} emissiveIntensity={isFiring ? 3 : 0} />
        </mesh>
      ))}
      {/* Power Status LED */}
      <mesh ref={glowRef} position={[0, 0.08, 0.13]}>
        <sphereGeometry args={[0.025, 12, 12]} />
        <meshPhysicalMaterial color="#3b82f6" emissive="#2563eb" emissiveIntensity={1.5} transmission={0.7} opacity={1} transparent roughness={0.05} clearcoat={1} />
      </mesh>
      {/* Secondary LED */}
      <mesh position={[0, -0.02, 0.13]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={2} />
      </mesh>
      {/* Rotating Energy Rings */}
      <group position={[0, 0.25, 0]} ref={ringRef1}>
        <mesh>
          <torusGeometry args={[0.12, 0.015, 8, 24]} />
          <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={isFiring ? 4 : 1} />
        </mesh>
      </group>
      <group position={[0, 0.28, 0]} ref={ringRef2}>
        <mesh>
          <torusGeometry args={[0.1, 0.01, 8, 24]} />
          <meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={isFiring ? 3 : 0.5} />
        </mesh>
      </group>
      {/* Drill Bit Assembly */}
      <group position={[0, 0.32, 0]} ref={drillBitRef}>
        {/* Chuck/Collar */}
        <mesh castShadow position={[0, -0.02, 0]}>
          <cylinderGeometry args={[0.1, 0.13, 0.08, 12]} />
          <meshPhysicalMaterial color="#64748b" metalness={0.95} roughness={0.05} clearcoat={0.8} />
        </mesh>
        {/* Main Bit Shaft */}
        <mesh castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.35, 12]} />
          <meshPhysicalMaterial color="#cbd5e1" metalness={0.98} roughness={0.05} clearcoat={0.5} />
        </mesh>
        {/* Bit Tip - Tungsten carbide look */}
        <mesh position={[0, 0.26, 0]} castShadow>
          <coneGeometry args={[0.07, 0.35, 12]} />
          <meshPhysicalMaterial color="#eab308" metalness={0.9} roughness={0.1} clearcoat={0.6} />
        </mesh>
        {/* Spiral Cutting Teeth */}
        {[0, 0.08, 0.16, 0.24, 0.32].map((y, i) => (
          <mesh key={`tooth-${i}`} position={[0, y, 0]} castShadow>
            <torusGeometry args={[0.07 - i * 0.008, 0.018, 6, 16]} />
            <meshPhysicalMaterial color="#94a3b8" metalness={0.95} roughness={0.1} />
          </mesh>
        ))}
        {/* Cooling Grooves */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <torusGeometry args={[0.075, 0.008, 4, 16]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={isFiring ? 3 : 0.3} />
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <torusGeometry args={[0.065, 0.008, 4, 16]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={isFiring ? 3 : 0.3} />
        </mesh>
        {/* Tip Ref for Laser Origin */}
        {drillTipRef && <group position={[0, 0.45, 0]} ref={drillTipRef} />}
      </group>
      {/* Point light for active drill glow */}
      {isFiring && <pointLight position={[0, 0.5, 0]} color="#3b82f6" intensity={5} distance={2} decay={2} />}
    </>
  );
}

export const PlasmaWeaponMeshes = ({ plasmaTipRef, isFiring }: { plasmaTipRef?: React.RefObject<Group>, isFiring?: boolean }) => {
  const flashRef = useRef<Group>(null);
  const coreRef = useRef<any>(null);
  const sightGlowRef = useRef<any>(null);
  
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (flashRef.current) {
      if (isFiring) {
        flashRef.current.scale.setScalar(1 + Math.random() * 0.5);
        flashRef.current.rotation.z = Math.random() * Math.PI;
      } else {
        flashRef.current.scale.setScalar(0);
      }
    }
    if (coreRef.current) {
      coreRef.current.material.emissiveIntensity = 3 + Math.sin(time * 4) * 1.5;
      if (isFiring) {
        coreRef.current.material.emissiveIntensity = 8 + Math.random() * 3;
      }
    }
    if (sightGlowRef.current) {
      sightGlowRef.current.material.emissiveIntensity = 3 + Math.sin(time * 2) * 0.5;
    }
  });

  return (
    <group>
      {/* === RECEIVER / MAIN BODY === */}
      <mesh castShadow position={[0, 0, 0.1]}>
        <boxGeometry args={[0.13, 0.19, 0.48]} />
        <meshPhysicalMaterial color="#111827" metalness={0.95} roughness={0.15} clearcoat={0.5} clearcoatRoughness={0.05} />
      </mesh>
      {/* Body chamfer */}
      <mesh castShadow position={[0, 0.08, 0.1]}>
        <boxGeometry args={[0.14, 0.04, 0.42]} />
        <meshPhysicalMaterial color="#0f172a" metalness={0.9} roughness={0.2} clearcoat={0.3} />
      </mesh>
      {/* Carbon fiber side panels */}
      <mesh castShadow position={[0.065, 0, 0.1]}>
        <boxGeometry args={[0.015, 0.14, 0.35]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh castShadow position={[-0.065, 0, 0.1]}>
        <boxGeometry args={[0.015, 0.14, 0.35]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* === PICATINNY RAIL === */}
      <mesh castShadow position={[0, 0.115, 0.1]}>
        <boxGeometry args={[0.06, 0.02, 0.44]} />
        <meshPhysicalMaterial color="#0f172a" metalness={0.95} roughness={0.1} clearcoat={0.5} />
      </mesh>

      {/* === HOLOGRAPHIC REFLEX SIGHT === */}
      <group position={[0, 0.17, 0.04]}>
        {/* Sight housing */}
        <mesh castShadow>
          <boxGeometry args={[0.07, 0.06, 0.1]} />
          <meshPhysicalMaterial color="#1a202c" metalness={0.95} roughness={0.1} clearcoat={0.6} />
        </mesh>
        {/* Front glass */}
        <mesh position={[0, 0, 0.055]}>
          <boxGeometry args={[0.06, 0.05, 0.005]} />
          <meshPhysicalMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.3} transmission={0.85} opacity={0.4} transparent roughness={0.02} metalness={0.05} clearcoat={1} />
        </mesh>
        {/* Back glass */}
        <mesh position={[0, 0, -0.055]}>
          <boxGeometry args={[0.06, 0.05, 0.005]} />
          <meshPhysicalMaterial color="#0ea5e9" emissive="#0284c7" emissiveIntensity={0.2} transmission={0.9} opacity={0.3} transparent roughness={0.02} clearcoat={1} />
        </mesh>
        {/* Reticle dot */}
        <mesh ref={sightGlowRef} position={[0, 0, 0.03]}>
          <circleGeometry args={[0.008, 12]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={3} />
        </mesh>
        {/* Reticle ring */}
        <mesh position={[0, 0, 0.03]}>
          <ringGeometry args={[0.015, 0.018, 16]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
        </mesh>
        {/* Side brackets */}
        <mesh castShadow position={[0.038, -0.015, 0]}>
          <boxGeometry args={[0.008, 0.04, 0.08]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh castShadow position={[-0.038, -0.015, 0]}>
          <boxGeometry args={[0.008, 0.04, 0.08]} />
          <meshStandardMaterial color="#374151" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Power LED */}
        <mesh position={[0.035, 0.02, 0.04]}>
          <sphereGeometry args={[0.005, 6, 6]} />
          <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={4} />
        </mesh>
      </group>

      {/* === BARREL === */}
      <mesh castShadow position={[0, 0, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.06, 0.12, 16]} />
        <meshPhysicalMaterial color="#0f172a" metalness={0.95} roughness={0.1} clearcoat={0.4} />
      </mesh>
      <mesh castShadow position={[0, 0, 0.46]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.04, 0.2, 16]} />
        <meshPhysicalMaterial color="#374151" metalness={0.95} roughness={0.08} clearcoat={0.5} />
      </mesh>
      {/* Muzzle brake */}
      <mesh castShadow position={[0, 0, 0.52]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.035, 0.03, 0.06, 8]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.9} roughness={0.15} />
      </mesh>

      {/* === ENERGY CORE === */}
      <mesh ref={coreRef} position={[0, 0.02, 0.15]}>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshPhysicalMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={3} transmission={0.6} transparent opacity={0.9} roughness={0.05} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.02, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.065, 0.008, 8, 24]} />
        <meshStandardMaterial color="#64748b" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* === HANDLE === */}
      <mesh castShadow position={[0, -0.18, 0.02]} rotation={[0.15, 0, 0]}>
        <boxGeometry args={[0.065, 0.24, 0.08]} />
        <meshPhysicalMaterial color="#0d1117" roughness={0.7} metalness={0.3} />
      </mesh>
      {/* Trigger Guard */}
      <mesh castShadow position={[0, -0.09, 0.07]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.04, 0.14, 0.015]} />
        <meshPhysicalMaterial color="#111827" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* === STOCK === */}
      <mesh castShadow position={[0, -0.03, -0.18]}>
        <boxGeometry args={[0.08, 0.14, 0.18]} />
        <meshPhysicalMaterial color="#1e293b" metalness={0.7} roughness={0.3} clearcoat={0.2} />
      </mesh>

      {/* === SIDE VENTS === */}
      <mesh castShadow position={[0.075, 0, 0.18]}>
        <boxGeometry args={[0.015, 0.06, 0.18]} />
        <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh castShadow position={[-0.075, 0, 0.18]}>
        <boxGeometry args={[0.015, 0.06, 0.18]} />
        <meshStandardMaterial color="#d97706" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Glowing vent slits */}
      <mesh position={[0.073, 0, 0.15]}>
        <boxGeometry args={[0.018, 0.03, 0.1]} />
        <meshStandardMaterial color={isFiring ? "#38bdf8" : "#0ea5e9"} emissive={isFiring ? "#38bdf8" : "#0284c7"} emissiveIntensity={isFiring ? 6 : 1.5} />
      </mesh>
      <mesh position={[-0.073, 0, 0.15]}>
        <boxGeometry args={[0.018, 0.03, 0.1]} />
        <meshStandardMaterial color={isFiring ? "#38bdf8" : "#0ea5e9"} emissive={isFiring ? "#38bdf8" : "#0284c7"} emissiveIntensity={isFiring ? 6 : 1.5} />
      </mesh>

      {/* === MAGAZINE === */}
      <mesh castShadow position={[0, -0.15, 0.15]} rotation={[0.1, 0, 0]}>
        <boxGeometry args={[0.05, 0.12, 0.06]} />
        <meshPhysicalMaterial color="#1a202c" metalness={0.8} roughness={0.2} clearcoat={0.3} />
      </mesh>
      <mesh position={[0, -0.22, 0.155]}>
        <boxGeometry args={[0.055, 0.02, 0.065]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Tip Ref for Plasma Origin */}
      {plasmaTipRef && <group position={[0, 0, 0.56]} ref={plasmaTipRef} />}
      
      {/* Muzzle Flash */}
      <group position={[0, 0, 0.6]} ref={flashRef} scale={0}>
        <mesh position={[0, 0, 0.12]}>
          <coneGeometry args={[0.18, 0.5, 8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.7} blending={2} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, 0.06]}>
          <coneGeometry args={[0.1, 0.25, 8]} />
          <meshBasicMaterial color="#bae6fd" transparent opacity={0.9} blending={2} depthWrite={false} />
        </mesh>
        <mesh position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.06, 0.02, 8, 16]} />
          <meshBasicMaterial color="#e0f2fe" transparent opacity={0.6} blending={2} depthWrite={false} />
        </mesh>
        <pointLight color="#38bdf8" intensity={5} distance={4} decay={2} />
      </group>
    </group>
  );
};

export function CharacterModel({ color = "#3b82f6", isMoving = false, isJumping = false, headRotationY = 0, hasDrill = false, hasPlasma = false, isDrillEquipped = false, isPlasmaEquipped = false, isAiming = false, isFiring = false, aimPitch = 0, drillTipRef, plasmaTipRef, isCollecting = false, isFlying = false, isSprinting = false, isFirstPerson = false, isFalling = false, isInjured = false }: CharacterModelProps) {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const leftLegRef = useRef<Group>(null);
  const rightLegRef = useRef<Group>(null);
  const leftArmRef = useRef<Group>(null);
  const rightArmRef = useRef<Group>(null);
  const backpackRef = useRef<Group>(null);
  const drillBitRef = useRef<Group>(null);
  const drillOnBackRef = useRef<Group>(null);
  const drillInHandRef = useRef<Group>(null);
  const plasmaOnBackRef = useRef<Group>(null);
  const plasmaInHandRef = useRef<Group>(null);
  const equipProgress = useRef(isDrillEquipped ? 1 : 0);
  const plasmaEquipProgress = useRef(isPlasmaEquipped ? 1 : 0);
  const recoilAmount = useRef(0);
  const keys = useKeyboard();
  const jumpToggle = useRef(false);
  const prevJumping = useRef(false);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (isInjured) {
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.PI / 2 + 0.2;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.PI / 2 + 0.1;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0.2;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0.3;
      if (leftArmRef.current) leftArmRef.current.rotation.z = 0.2;
      if (rightArmRef.current) rightArmRef.current.rotation.z = -0.2;
      if (headRef.current) headRef.current.rotation.x = 0.4 + Math.sin(time * 2) * 0.02;
      if (headRef.current) headRef.current.rotation.y = headRotationY || 0.2;
      
      // Breathing animation for injured state
      if (groupRef.current) {
        groupRef.current.position.y = 0.8 + Math.sin(time * 2) * 0.02;
      }
      return; // Skip other animations
    }
    
    // Toggle jump leg state when jump starts
    if (isJumping && !prevJumping.current) {
      jumpToggle.current = !jumpToggle.current;
    }
    prevJumping.current = !!isJumping;
    
    // Equip animation logic
    const shouldHoldDrill = isDrillEquipped;
    const targetEquip = shouldHoldDrill ? 1 : 0;
    const equipSpeed = 4.0 * delta;
    
    if (equipProgress.current < targetEquip) {
      equipProgress.current = Math.min(1, equipProgress.current + equipSpeed);
    } else if (equipProgress.current > targetEquip) {
      equipProgress.current = Math.max(0, equipProgress.current - equipSpeed);
    }

    if (drillOnBackRef.current) {
      drillOnBackRef.current.scale.setScalar(equipProgress.current < 0.5 ? 1.2 : 0);
    }
    if (drillInHandRef.current) {
      drillInHandRef.current.scale.setScalar(equipProgress.current >= 0.5 ? 1.5 : 0);
    }

    // Plasma Equip animation logic
    const shouldHoldPlasma = isPlasmaEquipped;
    const targetPlasmaEquip = shouldHoldPlasma ? 1 : 0;
    
    if (plasmaEquipProgress.current < targetPlasmaEquip) {
      plasmaEquipProgress.current = Math.min(1, plasmaEquipProgress.current + equipSpeed);
    } else if (plasmaEquipProgress.current > targetPlasmaEquip) {
      plasmaEquipProgress.current = Math.max(0, plasmaEquipProgress.current - equipSpeed);
    }

    if (plasmaOnBackRef.current) {
      plasmaOnBackRef.current.scale.setScalar(plasmaEquipProgress.current < 0.5 ? 1.2 : 0);
    }
    if (plasmaInHandRef.current) {
      plasmaInHandRef.current.scale.setScalar(plasmaEquipProgress.current >= 0.5 ? 1.5 : 0);
    }

    // Remove the unconditional breathing animation from here

    // Recoil effect
    if (isFiring) {
      recoilAmount.current = MathUtils.lerp(recoilAmount.current, 0.15, 0.4);
    } else {
      recoilAmount.current = MathUtils.lerp(recoilAmount.current, 0, 0.2);
    }
    const recoilOffset = Math.sin(time * 40) * (isFiring ? 0.02 : 0);

    // Head rotation
    if (headRef.current) {
      headRef.current.rotation.y = MathUtils.lerp(
        headRef.current.rotation.y,
        headRotationY,
        0.1
      );
    }

    const baseY = 1.55; // Raised slightly to prevent feet clipping

    if (groupRef.current && !isInjured && !isFlying) {
      groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, 0, 0.1);
      groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
    }

    if (isFlying) {
      // Iron Man style heroic flight physics
      const forwardInput = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
      const rightInput = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      
      const sway = Math.sin(time * 6) * 0.05;

      if (groupRef.current) {
        groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, baseY, 0.2);
        groupRef.current.rotation.x = MathUtils.lerp(groupRef.current.rotation.x, forwardInput * 0.65, 0.1);
        groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, -rightInput * 0.4, 0.1);
      }

      if (headRef.current) {
        headRef.current.rotation.x = MathUtils.lerp(headRef.current.rotation.x, -forwardInput * 0.5, 0.1);
      }
      
      // Legs stream behind
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = MathUtils.lerp(leftLegRef.current.rotation.x, 0 + forwardInput * 0.5, 0.1);
        leftLegRef.current.rotation.z = MathUtils.lerp(leftLegRef.current.rotation.z, 0.05, 0.1);
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = MathUtils.lerp(rightLegRef.current.rotation.x, 0 + forwardInput * 0.5, 0.1);
        rightLegRef.current.rotation.z = MathUtils.lerp(rightLegRef.current.rotation.z, -0.05, 0.1);
      }
      
      const isHoldingWeapon = (isDrillEquipped && equipProgress.current >= 0.5) || (isPlasmaEquipped && plasmaEquipProgress.current >= 0.5);

      if (!isHoldingWeapon) {
        // Streamline arms backwards
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, -0.2 + forwardInput * 0.6 + sway, 0.1);
          leftArmRef.current.rotation.z = MathUtils.lerp(leftArmRef.current.rotation.z, 0.2, 0.1);
        }
        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, -0.2 + forwardInput * 0.6 - sway, 0.1);
          rightArmRef.current.rotation.z = MathUtils.lerp(rightArmRef.current.rotation.z, -0.2, 0.1);
        }
      }
    } else if (isFalling) {
      // Falling animation: arms and legs spread, swaying, body tilted
      const fallSway = Math.sin(time * 10) * 0.1;
      const fallSwayLimbs = Math.cos(time * 12) * 0.2;
      
      if (groupRef.current) {
        groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, baseY + fallSway * 0.5, 0.1);
      }
      
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = MathUtils.lerp(leftLegRef.current.rotation.x, -0.5 + fallSwayLimbs, 0.1);
        leftLegRef.current.rotation.z = 0;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = MathUtils.lerp(rightLegRef.current.rotation.x, -0.5 - fallSwayLimbs, 0.1);
        rightLegRef.current.rotation.z = 0;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, -0.5 + fallSwayLimbs, 0.1);
        leftArmRef.current.rotation.z = MathUtils.lerp(leftArmRef.current.rotation.z, 1.2, 0.1);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, -0.5 - fallSwayLimbs, 0.1);
        rightArmRef.current.rotation.z = MathUtils.lerp(rightArmRef.current.rotation.z, -1.2, 0.1);
      }
    } else if (isJumping) {
      // Reset body rotation
      if (groupRef.current) {
        groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, baseY, 0.2);
      }
      
      // Split legs front and back for jump animation (both moving and stationary)
      // Alternate legs based on jumpToggle
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = MathUtils.lerp(leftLegRef.current.rotation.x, jumpToggle.current ? -0.8 : 0.6, 0.2);
        leftLegRef.current.rotation.z = 0;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = MathUtils.lerp(rightLegRef.current.rotation.x, jumpToggle.current ? 0.6 : -0.8, 0.2);
        rightLegRef.current.rotation.z = 0;
      }
      // Swing arms during jump
      if (leftArmRef.current) leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, jumpToggle.current ? 0.8 : -0.6, 0.2);
      if (rightArmRef.current) rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, jumpToggle.current ? -0.6 : 0.8, 0.2);
    } else if (isMoving) {
      // Body inclination when sprinting and subtle bobbing
      if (groupRef.current) {
        // Walking bobbing (up and down)
        const walkSpeed = isSprinting ? 18 : 12;
        const bobbing = Math.abs(Math.sin(time * walkSpeed)) * 0.12;
        groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, baseY + bobbing, 0.3);
        
        // Head bobbing
        if (headRef.current) {
          headRef.current.rotation.x = MathUtils.lerp(headRef.current.rotation.x, Math.sin(time * walkSpeed) * 0.05, 0.2);
        }
      }
      const walkSpeed = isSprinting ? 18 : 12;
      const angle = Math.sin(time * walkSpeed) * (isSprinting ? 1.0 : 0.8);
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = angle;
        leftLegRef.current.rotation.z = 0;
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = -angle;
        rightLegRef.current.rotation.z = 0;
      }
      
      const isHoldingWeapon = (hasDrill && equipProgress.current === 1) || (isPlasmaEquipped && plasmaEquipProgress.current === 1);
      
      if (leftArmRef.current) leftArmRef.current.rotation.x = -angle;
      if (rightArmRef.current) rightArmRef.current.rotation.x = angle;
    } else {
      // Idle breathing posture
      if (groupRef.current) {
        groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, baseY + Math.sin(time * 2) * 0.03, 0.1);
      }
      if (headRef.current) {
        headRef.current.rotation.x = MathUtils.lerp(headRef.current.rotation.x, Math.sin(time * 2) * 0.02, 0.1);
      }
      // Relaxed arms
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, 0.1 + Math.sin(time * 2) * 0.05, 0.1);
        leftArmRef.current.rotation.z = MathUtils.lerp(leftArmRef.current.rotation.z, 0.15, 0.1);
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, 0.1 + Math.sin(time * 2 + Math.PI) * 0.05, 0.1);
        rightArmRef.current.rotation.z = MathUtils.lerp(rightArmRef.current.rotation.z, -0.15, 0.1);
      }
      // Action pose legs if holding weapon
      const isHoldingWeapon = (hasDrill && equipProgress.current === 1) || (isPlasmaEquipped && plasmaEquipProgress.current === 1);
      if (isHoldingWeapon && !isFirstPerson) {
        if (leftLegRef.current) {
          leftLegRef.current.rotation.x = MathUtils.lerp(leftLegRef.current.rotation.x, 0.3, 0.1);
          leftLegRef.current.rotation.z = 0;
        }
        if (rightLegRef.current) {
          rightLegRef.current.rotation.x = MathUtils.lerp(rightLegRef.current.rotation.x, -0.3, 0.1);
          rightLegRef.current.rotation.z = 0;
        }
      } else {
        // Legs slightly apart and more natural
        if (leftLegRef.current) {
          leftLegRef.current.rotation.x = MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1);
          leftLegRef.current.rotation.z = 0;
        }
        if (rightLegRef.current) {
          rightLegRef.current.rotation.x = MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1);
          rightLegRef.current.rotation.z = 0;
        }
      }
    }

    // Reset Y and Z rotation
    if (rightArmRef.current) {
      rightArmRef.current.rotation.y = 0;
      rightArmRef.current.rotation.z = 0;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.y = 0;
      leftArmRef.current.rotation.z = 0;
    }

    // Adjust arm positions for first person view
    if (rightArmRef.current) {
      const bobX = isMoving ? Math.sin(time * 8) * 0.02 : 0;
      const bobY = isMoving ? Math.abs(Math.cos(time * 16)) * 0.02 : 0;
      const swayX = isMoving ? Math.sin(time * 4) * 0.015 : 0;
      
      if (isFirstPerson) {
        // FP: position arm in lower-right of view, holding weapon forward
        // Camera is at y=2.0 relative to player, character group is at y=1.5
        // So arm needs to be at ~0.5 in group space to match camera height
        const recoilZ = isFiring ? 0.12 : 0;
        rightArmRef.current.position.x = MathUtils.lerp(rightArmRef.current.position.x, 0.6 + bobX + swayX, 0.15);
        rightArmRef.current.position.y = MathUtils.lerp(rightArmRef.current.position.y, 0.2 + bobY, 0.15);
        rightArmRef.current.position.z = MathUtils.lerp(rightArmRef.current.position.z, 1.2 - recoilZ, 0.15);
        rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI / 2 + aimPitch * 0.5, 0.2);
        rightArmRef.current.rotation.y = MathUtils.lerp(rightArmRef.current.rotation.y, -0.15, 0.2);
      } else {
        rightArmRef.current.position.x = MathUtils.lerp(rightArmRef.current.position.x, 0.45, 0.2);
        rightArmRef.current.position.y = MathUtils.lerp(rightArmRef.current.position.y, 0.4, 0.2);
        rightArmRef.current.position.z = MathUtils.lerp(rightArmRef.current.position.z, 0, 0.2);
      }
    }
    if (leftArmRef.current) {
      const bobX = isMoving ? Math.sin(time * 8 + Math.PI) * 0.015 : 0;
      const bobY = isMoving ? Math.abs(Math.cos(time * 16 + Math.PI)) * 0.015 : 0;

      if (isFirstPerson) {
        // FP: position left arm supporting weapon from left side
        const isHolding = (isDrillEquipped && equipProgress.current >= 0.5) || (isPlasmaEquipped && plasmaEquipProgress.current >= 0.5);
        if (isHolding) {
          leftArmRef.current.position.x = MathUtils.lerp(leftArmRef.current.position.x, 0.1 + bobX, 0.15);
          leftArmRef.current.position.y = MathUtils.lerp(leftArmRef.current.position.y, 0.0 + bobY, 0.15);
          leftArmRef.current.position.z = MathUtils.lerp(leftArmRef.current.position.z, 1.3, 0.15);
          leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI / 2.2 + aimPitch * 0.4, 0.2);
          leftArmRef.current.rotation.y = MathUtils.lerp(leftArmRef.current.rotation.y, 0.4, 0.2);
          leftArmRef.current.rotation.z = MathUtils.lerp(leftArmRef.current.rotation.z, 0.15, 0.2);
        } else {
          // Move left arm out of view when nothing equipped in FP
          leftArmRef.current.position.x = MathUtils.lerp(leftArmRef.current.position.x, -1.5 + bobX, 0.15);
          leftArmRef.current.position.y = MathUtils.lerp(leftArmRef.current.position.y, -0.5 + bobY, 0.15);
          leftArmRef.current.position.z = MathUtils.lerp(leftArmRef.current.position.z, 0.5, 0.15);
          leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, -Math.PI / 2.5 + aimPitch * 0.4, 0.2);
          leftArmRef.current.rotation.y = MathUtils.lerp(leftArmRef.current.rotation.y, 0.3, 0.2);
          leftArmRef.current.rotation.z = MathUtils.lerp(leftArmRef.current.rotation.z, 0.2, 0.2);
        }
      } else {
        leftArmRef.current.position.x = MathUtils.lerp(leftArmRef.current.position.x, -0.45, 0.2);
        leftArmRef.current.position.y = MathUtils.lerp(leftArmRef.current.position.y, 0.4, 0.2);
        leftArmRef.current.position.z = MathUtils.lerp(leftArmRef.current.position.z, 0, 0.2);
      }
    }

    // Override arms if collecting
    if (isCollecting && !isFirstPerson) {
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, -1.5, 0.2);
        rightArmRef.current.rotation.z = MathUtils.lerp(rightArmRef.current.rotation.z, 0.2, 0.2);
      }
    } 
    // Drill Equip animation override
    else if (equipProgress.current > 0 && equipProgress.current < 1 && !isFirstPerson) {
      const reachBackAmount = Math.sin(equipProgress.current * Math.PI);
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, -Math.PI * 0.8, reachBackAmount);
        rightArmRef.current.rotation.z = MathUtils.lerp(rightArmRef.current.rotation.z, 0.3, reachBackAmount);
        rightArmRef.current.rotation.y = MathUtils.lerp(rightArmRef.current.rotation.y, 0.2, reachBackAmount);
      }
    }
    // Plasma Equip animation override
    else if (plasmaEquipProgress.current > 0 && plasmaEquipProgress.current < 1 && !isFirstPerson) {
      const reachWaistAmount = Math.sin(plasmaEquipProgress.current * Math.PI);
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, -0.2, reachWaistAmount);
        rightArmRef.current.rotation.z = MathUtils.lerp(rightArmRef.current.rotation.z, 0.5, reachWaistAmount);
      }
    }
    // Override arms if holding drill
    else if (hasDrill && equipProgress.current === 1) {
      if (rightArmRef.current) {
        if ((isMoving || isJumping) && !isAiming && !isFiring) {
          const walkSpeed = isSprinting ? 18 : 12;
          const swing = isJumping ? (jumpToggle.current ? -0.8 : 0.6) : Math.sin(time * walkSpeed) * (isSprinting ? 1.0 : 0.8);
          const targetRotX = isFirstPerson ? (-Math.PI / 2 + aimPitch) : (swing - 0.4);
          rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, targetRotX, 0.2);
          if (!isFirstPerson) {
            rightArmRef.current.rotation.y = 0.2;
            rightArmRef.current.rotation.z = 0.2;
            rightArmRef.current.position.z = 0;
          }
        } else if (!isAiming && !isFiring) {
          const targetRotX = isFirstPerson ? (-Math.PI / 2 + aimPitch) : 0.1;
          rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, targetRotX, 0.2);
          if (!isFirstPerson) {
            rightArmRef.current.rotation.y = 0;
            rightArmRef.current.rotation.z = 0;
            rightArmRef.current.position.z = 0;
          }
        } else {
          rightArmRef.current.rotation.x = isFirstPerson ? -Math.PI / 2 + aimPitch : -Math.PI / 2 + aimPitch - recoilAmount.current;
          if (!isFirstPerson) {
            rightArmRef.current.position.z = recoilOffset;
            rightArmRef.current.rotation.y = 0;
            rightArmRef.current.rotation.z = 0.1;
          }
        }
      }
      if (leftArmRef.current && !isFirstPerson) {
        if ((isMoving || isJumping) && !isAiming && !isFiring) {
          const walkSpeed = isSprinting ? 18 : 12;
          const swing = isJumping ? (jumpToggle.current ? 0.8 : -0.6) : -Math.sin(time * walkSpeed) * (isSprinting ? 1.0 : 0.8);
          leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, swing, 0.2);
          leftArmRef.current.rotation.z = MathUtils.lerp(leftArmRef.current.rotation.z, 0.1, 0.1);
        } else if (!isCollecting && !isMoving) {
          leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, 0.2, 0.1);
          leftArmRef.current.rotation.z = MathUtils.lerp(leftArmRef.current.rotation.z, 0.1, 0.1);
        }
      }
    }
    // Override arms if holding plasma weapon
    else if (isPlasmaEquipped && plasmaEquipProgress.current === 1) {
      if (rightArmRef.current) {
        if ((isMoving || isJumping) && !isAiming && !isFiring) {
          const walkSpeed = isSprinting ? 18 : 12;
          const swing = isJumping ? (jumpToggle.current ? -0.8 : 0.6) : Math.sin(time * walkSpeed) * (isSprinting ? 1.0 : 0.8);
          const targetRotX = isFirstPerson ? (-Math.PI / 2 + aimPitch) : (swing - 0.4);
          rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, targetRotX, 0.2);
          if (!isFirstPerson) {
            rightArmRef.current.rotation.y = 0.2;
            rightArmRef.current.rotation.z = 0.2;
            rightArmRef.current.position.z = 0;
          }
        } else if (!isAiming && !isFiring) {
          const targetRotX = isFirstPerson ? (-Math.PI / 2 + aimPitch) : 0.1;
          rightArmRef.current.rotation.x = MathUtils.lerp(rightArmRef.current.rotation.x, targetRotX, 0.2);
          if (!isFirstPerson) {
            rightArmRef.current.rotation.y = 0;
            rightArmRef.current.rotation.z = 0;
            rightArmRef.current.position.z = 0;
          }
        } else {
          rightArmRef.current.rotation.x = isFirstPerson ? -Math.PI / 2 + aimPitch : -Math.PI / 2 + aimPitch - recoilAmount.current;
          if (!isFirstPerson) {
            rightArmRef.current.position.z = recoilOffset;
            rightArmRef.current.rotation.y = 0;
            rightArmRef.current.rotation.z = 0.1;
          }
        }
      }
      if (leftArmRef.current && !isFirstPerson) {
        if ((isMoving || isJumping) && !isAiming && !isFiring) {
          const walkSpeed = isSprinting ? 18 : 12;
          const swing = isJumping ? (jumpToggle.current ? 0.8 : -0.6) : -Math.sin(time * walkSpeed) * (isSprinting ? 1.0 : 0.8);
          leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, swing, 0.2);
          leftArmRef.current.rotation.z = MathUtils.lerp(leftArmRef.current.rotation.z, 0.1, 0.1);
        } else if (!isCollecting && !isMoving) {
          leftArmRef.current.rotation.x = MathUtils.lerp(leftArmRef.current.rotation.x, 0.2, 0.1);
          leftArmRef.current.rotation.z = MathUtils.lerp(leftArmRef.current.rotation.z, 0.1, 0.1);
        }
      }
    }

    if (hasDrill && drillBitRef.current) {
      drillBitRef.current.rotation.y += isAiming ? 0.8 : 0.05;
    }
  });

  // Materials for realistic astronaut look
  const suitMaterial = <meshPhysicalMaterial color={color} roughness={0.5} metalness={0.5} clearcoat={0.2} />;
  const darkMetal = <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.9} />;
  const lightMetal = <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.8} />;
  const armorMaterial = <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />;
  const visorMaterial = <meshPhysicalMaterial color="#020617" metalness={1} roughness={0.05} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={5} />;
  const emissiveMaterial = <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={3} />;

  const isBodyVisible = !isFirstPerson || aimPitch < 0.5;

  return (
    <group ref={groupRef} position={[0, isInjured ? 0.8 : 1.5, 0]} rotation={[isInjured ? 0.2 : 0, 0, 0]}>
      {/* Torso */}
      <mesh position={[0, 0, 0]} castShadow visible={isBodyVisible && !isFirstPerson}>
        <cylinderGeometry args={[0.35, 0.3, 1.1, 16]} />
        {suitMaterial}
      </mesh>
      
      {/* Belt */}
      <mesh position={[0, -0.45, 0]} castShadow visible={isBodyVisible && !isFirstPerson}>
        <cylinderGeometry args={[0.36, 0.36, 0.15, 16]} />
        {darkMetal}
      </mesh>
      {/* Belt Buckle */}
      <mesh position={[0, -0.45, 0.35]} castShadow visible={isBodyVisible && !isFirstPerson}>
        <boxGeometry args={[0.15, 0.1, 0.05]} />
        {lightMetal}
      </mesh>

      {/* Chest Armor Plates */}
      <mesh position={[0, 0.2, 0.25]} castShadow visible={isBodyVisible && !isFirstPerson}>
        <boxGeometry args={[0.5, 0.4, 0.2]} />
        {armorMaterial}
      </mesh>
      <mesh position={[0, -0.1, 0.28]} castShadow visible={isBodyVisible && !isFirstPerson}>
        <boxGeometry args={[0.4, 0.2, 0.15]} />
        {armorMaterial}
      </mesh>
      
      {/* Chest Core / Glowing Status Light */}
      <mesh position={[0, 0.2, 0.36]} castShadow visible={isBodyVisible && !isFirstPerson}>
        <circleGeometry args={[0.08, 16]} />
        {emissiveMaterial}
      </mesh>
      {/* Chest details */}
      <mesh position={[-0.1, 0.05, 0.36]} castShadow visible={isBodyVisible && !isFirstPerson}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0.1, 0.05, 0.36]} castShadow visible={isBodyVisible && !isFirstPerson}>
        <boxGeometry args={[0.05, 0.05, 0.02]} />
        <meshStandardMaterial color="#eab308" />
      </mesh>

      {/* Neck Ring */}
      <mesh position={[0, 0.55, 0]} castShadow visible={isBodyVisible && !isFirstPerson}>
        <cylinderGeometry args={[0.25, 0.3, 0.1, 16]} />
        {darkMetal}
      </mesh>

      {/* Head / Helmet */}
      <group position={[0, 0.75, 0]} ref={headRef} visible={!isFirstPerson}>
        <mesh castShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          {suitMaterial}
        </mesh>
        {/* Visor */}
        <mesh position={[0, 0.02, 0.12]} scale={[1, 0.8, 0.9]} castShadow>
          <sphereGeometry args={[0.3, 32, 32]} />
          {visorMaterial}
        </mesh>
        {/* Visor Rim */}
        <mesh position={[0, 0.02, 0.1]} rotation={[Math.PI/2, 0, 0]} castShadow>
          <torusGeometry args={[0.28, 0.04, 16, 32]} />
          {darkMetal}
        </mesh>
        {/* Helmet Side Modules */}
        <mesh position={[0.32, -0.1, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
          {darkMetal}
        </mesh>
        <mesh position={[-0.32, -0.1, 0]} rotation={[0, 0, Math.PI/2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
          {darkMetal}
        </mesh>
      </group>

      {/* Backpack / Oxygen System */}
      <group position={[0, 0.1, -0.35]} ref={backpackRef} visible={isBodyVisible && !isFirstPerson}>
        <mesh castShadow>
          <boxGeometry args={[0.5, 0.8, 0.3]} />
          {darkMetal}
        </mesh>
        {/* Oxygen Tanks */}
        <mesh position={[-0.15, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.7, 16]} />
          {lightMetal}
        </mesh>
        <mesh position={[0.15, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.7, 16]} />
          {lightMetal}
        </mesh>
        {/* Backpack Core Light */}
        <mesh position={[0, 0.2, -0.16]}>
          <circleGeometry args={[0.06, 16]} />
          {emissiveMaterial}
        </mesh>
        {/* Antenna */}
        <mesh position={[-0.2, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
          {darkMetal}
        </mesh>
        {/* Antenna Light */}
        <mesh position={[-0.2, 0.85, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={2} />
        </mesh>
        {/* Connecting Tubes (Simulated) */}
        <mesh position={[-0.2, 0.4, -0.1]} rotation={[0.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          {darkMetal}
        </mesh>
        <mesh position={[0.2, 0.4, -0.1]} rotation={[0.5, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          {darkMetal}
        </mesh>

        {/* Jetpack Thrusters */}
        <mesh position={[-0.15, -0.4, -0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.2, 16]} />
          {darkMetal}
        </mesh>
        <mesh position={[0.15, -0.4, -0.2]} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.2, 16]} />
          {darkMetal}
        </mesh>
        
        {/* Holstered Drill */}
        {hasDrill && (
          <group ref={drillOnBackRef} position={[0.3, 0.1, 0]} rotation={[0, 0, 0]} scale={[1.2, 1.2, 1.2]}>
            <DrillMeshes drillBitRef={drillBitRef} />
          </group>
        )}
        
        {/* Holstered Plasma Weapon (on back) */}
        {hasPlasma && (
          <group ref={plasmaOnBackRef} position={[-0.35, 0.1, -0.05]} rotation={[0, 0, 0]} scale={[1.0, 1.0, 1.0]}>
            <PlasmaWeaponMeshes />
          </group>
        )}
      </group>

      {/* Left Arm - hidden in FP, Player.tsx renders FPS weapons */}
      <group position={[-0.45, 0.4, 0]} ref={leftArmRef} visible={!isFirstPerson}>
        <mesh castShadow>
          <sphereGeometry args={[0.14, 16, 16]} />
          {darkMetal}
        </mesh>
        {/* Shoulder Pad */}
        <mesh position={[-0.05, 0.1, 0]} rotation={[0, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.2, 16]} />
          {armorMaterial}
        </mesh>
        {/* Upper Arm */}
        <mesh position={[0, -0.35, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.7, 16]} />
          {suitMaterial}
        </mesh>
        {/* Forearm Armor */}
        <mesh position={[0, -0.5, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.11, 0.3, 16]} />
          {armorMaterial}
        </mesh>
        {/* Hand / Glove */}
        <mesh position={[0, -0.75, 0]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          {darkMetal}
        </mesh>
      </group>

        {/* Right Arm - hidden in FP, Player.tsx renders FPS weapons */}
        <group position={[0.45, 0.4, 0]} ref={rightArmRef} visible={!isFirstPerson}>
          <mesh castShadow>
            <sphereGeometry args={[0.14, 16, 16]} />
            {darkMetal}
          </mesh>
          {/* Shoulder Pad */}
          <mesh position={[0.05, 0.1, 0]} rotation={[0, 0, -0.2]} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.2, 16]} />
            {armorMaterial}
          </mesh>
          {/* Upper Arm */}
          <mesh position={[0, -0.35, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.1, 0.7, 16]} />
            {suitMaterial}
          </mesh>
          {/* Forearm Armor */}
          <mesh position={[0, -0.5, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.11, 0.3, 16]} />
            {armorMaterial}
          </mesh>
          {/* Hand / Glove */}
          <mesh position={[0, -0.75, 0]} castShadow>
            <sphereGeometry args={[0.12, 16, 16]} />
            {darkMetal}
          </mesh>
          
          {/* Drill (when equipped) */}
          {hasDrill && (
            <group 
              ref={drillInHandRef} 
              position={[0, -0.75, 0.2]} 
              rotation={[Math.PI, 0, 0]} 
              scale={[1.5, 1.5, 1.5]}
            >
              <DrillMeshes drillBitRef={drillBitRef} drillTipRef={drillTipRef} isFiring={isFiring} />
            </group>
          )}
  
          {/* Plasma Weapon (when equipped) */}
          <group 
            ref={plasmaInHandRef} 
            position={[0, -0.75, 0.1]} 
            rotation={[Math.PI / 2, 0, 0]} 
            scale={[1.5, 1.5, 1.5]}
          >
            <PlasmaWeaponMeshes plasmaTipRef={plasmaTipRef} isFiring={isFiring} />
          </group>
        </group>

      {/* Left Leg */}
      <group position={[-0.22, -0.55, 0]} ref={leftLegRef} visible={isBodyVisible && !isFirstPerson}>
        {/* Hip Joint */}
        <mesh castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          {darkMetal}
        </mesh>
        {/* Thigh Armor */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.14, 0.4, 16]} />
          {armorMaterial}
        </mesh>
        {/* Leg */}
        <mesh position={[0, -0.4, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.8, 16]} />
          {suitMaterial}
        </mesh>
        {/* Knee Pad */}
        <mesh position={[0, -0.4, 0.12]} castShadow>
          <boxGeometry args={[0.18, 0.2, 0.1]} />
          {darkMetal}
        </mesh>
        {/* Heavy Boot */}
        <mesh position={[0, -0.85, 0.05]} castShadow>
          <boxGeometry args={[0.22, 0.2, 0.3]} />
          {darkMetal}
        </mesh>
      </group>

      {/* Right Leg */}
      <group position={[0.22, -0.55, 0]} ref={rightLegRef} visible={isBodyVisible && !isFirstPerson}>
        {/* Hip Joint */}
        <mesh castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          {darkMetal}
        </mesh>
        {/* Thigh Armor */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.14, 0.4, 16]} />
          {armorMaterial}
        </mesh>
        {/* Leg */}
        <mesh position={[0, -0.4, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.8, 16]} />
          {suitMaterial}
        </mesh>
        {/* Knee Pad */}
        <mesh position={[0, -0.4, 0.12]} castShadow>
          <boxGeometry args={[0.18, 0.2, 0.1]} />
          {darkMetal}
        </mesh>
        {/* Heavy Boot */}
        <mesh position={[0, -0.85, 0.05]} castShadow>
          <boxGeometry args={[0.22, 0.2, 0.3]} />
          {darkMetal}
        </mesh>
      </group>
    </group>
  );
}

