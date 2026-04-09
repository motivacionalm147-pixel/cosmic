import React, { forwardRef, useRef, useState, useImperativeHandle, useEffect, useCallback } from 'react';
import { useFrame, useThree, createPortal } from '@react-three/fiber';
import { Vector3, Quaternion, Group, Raycaster, Vector2, MathUtils, Mesh, PerspectiveCamera, InstancedMesh, Object3D, Color, Euler } from 'three';
import { Html } from '@react-three/drei';
import { useKeyboard } from '../hooks/useKeyboard';
import { CharacterModel, DrillMeshes, PlasmaWeaponMeshes } from './CharacterModel';
import { Smoke } from './Smoke';
import { Sparks } from './Sparks';
import { JetpackDust } from './JetpackDust';
import { OxygenCable } from './OxygenCable';

// Pre-allocated reusable objects to avoid GC pressure in useFrame
const _raycaster = new Raycaster();
const _vec2Zero = new Vector2(0, 0);
const _shipPos = new Vector3(-12, 0, -12);
const _hawkPos = new Vector3(8, 0, -8);
const _exitDoorPos = new Vector3(0, 500, 20);
const _shipEuler = new Euler(0.15, -0.6, 0.2);
const _tempVec3A = new Vector3();
const _tempVec3B = new Vector3();
const _tempVec3C = new Vector3();
const _tempVec3D = new Vector3();
const _tempVec3E = new Vector3();
const _tempQuat = new Quaternion();
const _upVector = new Vector3(0, 1, 0);
const _zeroVec = new Vector3(0, 0, 0);

// Cached ship collision spheres
const SHIP_COLLISION_SPHERES = [
  { x: 0, y: 2, z: 0, r: 11 },
  { x: 0, y: 2, z: 8, r: 5 },
  { x: 0, y: 2, z: -10, r: 6 },
  { x: 6, y: 0, z: -4, r: 5 },
  { x: -6, y: -1.5, z: -4, r: 5 },
];

interface PlayerProps {
  position?: [number, number, number];
  hasDrill?: boolean;
  hasPlasma?: boolean;
  isDrillEquipped?: boolean;
  isPlasmaEquipped?: boolean;
  isAiming?: boolean;
  isFirstPerson?: boolean;
  plasmaAmmo: number;
  setPlasmaAmmo: React.Dispatch<React.SetStateAction<number>>;
  isReloading: boolean;
  setIsReloading: React.Dispatch<React.SetStateAction<boolean>>;
  isFiring: boolean;
  setIsFiring: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAiming?: (v: boolean) => void;
  setTargetInfo?: (info: any) => void;
  isCutsceneActive?: boolean;
  initialCableState?: boolean;
  isInsideShip?: boolean;
}

export const Player = forwardRef<Group, PlayerProps>(
  ({ position = [0, 501, 10], hasDrill = false, hasPlasma = false, isDrillEquipped = true, isPlasmaEquipped = false, isAiming = false, isFirstPerson = false, plasmaAmmo, setPlasmaAmmo, isReloading, setIsReloading, isFiring, setIsFiring, setIsAiming, setTargetInfo, isCutsceneActive = false, initialCableState = true, isInsideShip = true }, ref) => {
    const groupRef = useRef<Group>(null);
    const characterGroupRef = useRef<Group>(null);
    const laserMeshRef = useRef<Mesh>(null);
    const drillTipRef = useRef<Group>(null);
    const plasmaTipRef = useRef<Group>(null);
    const sparksGroupRef = useRef<Group>(null);
    const hudGroupRef = useRef<Group>(null);
    const hudTargetPos = useRef(new Vector3());
    const hudTargetQuat = useRef(new Quaternion());
    const fpWeaponRef = useRef<Group>(null);
    const drillBitFPRef = useRef<Group>(null);
    const fpBobOffset = useRef({ x: 0, y: 0 });
    
    // Forward the internal ref to the parent
    useImperativeHandle(ref, () => groupRef.current as Group);

    const keys = useKeyboard();
    const { camera, gl, scene } = useThree();
    
    const [isMoving, setIsMoving] = useState(false);
    const [isJumping, setIsJumping] = useState(false);
    const [isCollecting, setIsCollecting] = useState(false);
    const [isFlying, setIsFlying] = useState(false);
    const [isSprinting, setIsSprinting] = useState(false);
    const [isFalling, setIsFalling] = useState(false);
    const oxygenLevel = useRef(100);
    const [isCableConnected, setIsCableConnected] = useState(initialCableState);
    const lastJumpTime = useRef(0);
    const lastForwardPressTime = useRef(0);
    const isForwardPressed = useRef(false);
    const collectTimerRef = useRef<NodeJS.Timeout | null>(null);
    const wasFalling = useRef(false);

    const isFP = isFirstPerson || ((isPlasmaEquipped || isDrillEquipped) && isAiming);
    
    // New Flashlight and dedicated 3P refs
    const [flashlightOn, setFlashlightOn] = useState(false);
    const flashTargetRef = useRef<Object3D>(new Object3D());
    const drillTip3PRef = useRef<Group>(null);
    const plasmaTip3PRef = useRef<Group>(null);
    
    const velocity = useRef(new Vector3());
    const direction = useRef(new Vector3());
    const frontVector = useRef(new Vector3());
    const sideVector = useRef(new Vector3());
    const targetQuaternion = useRef(new Quaternion());
    
    const yaw = useRef(Math.PI); // Start looking towards negative Z (panel/monitors)
    const pitch = useRef(0.1); // Slight downward angle to see panel
    const zoomLevel = useRef(4.5); // Default zoom
    const cameraSideOffset = useRef(0);
    const cameraMovementOffset = useRef(0);
    const hitLightRef = useRef<any>(null);
    const drillLightRef = useRef<any>(null);

    // Cached scene object references to avoid scene.getObjectByName every frame
    const cachedMineralCluster = useRef<Object3D | null>(null);
    const cachedMountains = useRef<Object3D | null>(null);
    const cachedCrashedShip = useRef<Object3D | null>(null);
    const sceneSearchFrame = useRef(0);
    
    // Refs to avoid setState inside useFrame (prevents re-render every frame)
    const isMovingRef = useRef(false);
    const isJumpingRef = useRef(false);
    const isFallingRef = useRef(false);
    const isFlyingRef = useRef(false);
    const isSprintingRef = useRef(false);

    // Burn marks logic
    const MAX_MARKS = 100;
    const dummy = useRef(new Object3D());
    const burnMarksRef = useRef<{pos: Vector3, time: number}[]>([]);
    const burnMeshRef = useRef<InstancedMesh>(null);

    const speed = 8;
    const jumpForce = 12;
    const gravity = -30;

    // Plasma Logic
    const lastPlasmaFireTime = useRef(0);
    const plasmaProjectilesRef = useRef<{pos: Vector3, vel: Vector3, life: number}[]>([]);
    const plasmaMeshRef = useRef<InstancedMesh>(null);
    const plasmaSpiralRef = useRef<InstancedMesh>(null);
    const MAX_PLASMA = 30; // Synchronized with App.tsx
    
    // Health logic
    const healthRef = useRef(100);

    // Use a ref for state to avoid re-binding event listeners

    const stateRef = useRef({ isAiming, hasDrill, isFiring, isDrillEquipped, isPlasmaEquipped, plasmaAmmo, isReloading });
    useEffect(() => {
      if (groupRef.current && position) {
        groupRef.current.position.set(...position);
      }
    }, []); // Only on mount

    useEffect(() => {
      stateRef.current = { isAiming, hasDrill, isFiring, isDrillEquipped, isPlasmaEquipped, plasmaAmmo, isReloading };
    }, [isAiming, hasDrill, isFiring, isDrillEquipped, isPlasmaEquipped, plasmaAmmo, isReloading]);

    useEffect(() => {
      if (keys.jump) {
        const now = performance.now();
        if (now - lastJumpTime.current < 300) {
          setIsFlying(prev => {
            if (!prev) {
              velocity.current.y = 5; // Initial boost to prevent immediate ground collision
            }
            return !prev;
          });
        }
        lastJumpTime.current = now;
      }
    }, [keys.jump]);

    useEffect(() => {
      const handleCollect = () => {
        setIsCollecting(true);
        if (collectTimerRef.current) clearTimeout(collectTimerRef.current);
        collectTimerRef.current = setTimeout(() => {
          setIsCollecting(false);
        }, 500); // 0.5s animation
      };
      
      const toggleFlashlight = (e: KeyboardEvent) => {
        if (e.code === 'KeyL' || e.code === 'KeyF') {
          setFlashlightOn(prev => !prev);
        }
      };

      window.addEventListener('keydown', toggleFlashlight);
      window.addEventListener('mineral-collected', handleCollect);
      return () => {
        window.removeEventListener('keydown', toggleFlashlight);
        window.removeEventListener('mineral-collected', handleCollect);
        if (collectTimerRef.current) clearTimeout(collectTimerRef.current);
      };
    }, []);

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (document.pointerLockElement === gl.domElement) {
          yaw.current -= e.movementX * 0.003;
          pitch.current += e.movementY * 0.003; // Inverted Y-axis for standard look feel
          // Clamp pitch
          pitch.current = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch.current));
        }
      };
      
      const handleClick = async () => {
        if (document.pointerLockElement !== gl.domElement) {
          try {
            await gl.domElement.requestPointerLock();
          } catch (e) {
            console.warn('Pointer lock failed:', e);
          }
        }
      };

      const handleMouseDown = (e: MouseEvent) => {
        if (document.pointerLockElement === gl.domElement) {
          if (e.button === 2 && setIsAiming) {
            if ((stateRef.current.hasDrill && stateRef.current.isDrillEquipped) || stateRef.current.isPlasmaEquipped) {
              setIsAiming(true);
            }
          }
          if (e.button === 0) {
            if (stateRef.current.isDrillEquipped && stateRef.current.hasDrill) {
              setIsFiring(true);
            } else if (stateRef.current.isPlasmaEquipped && !stateRef.current.isReloading) {
              setIsFiring(true);
            }
          }
        }
      };

      const handleMouseUp = (e: MouseEvent) => {
        if (e.button === 2 && setIsAiming) {
          setIsAiming(false);
          setIsFiring(false);
        }
        if (e.button === 0) {
          setIsFiring(false);
        }
      };

      const handleWheel = (e: WheelEvent) => {
        if (document.pointerLockElement === gl.domElement) {
          zoomLevel.current += e.deltaY * 0.005;
          zoomLevel.current = Math.max(2.0, Math.min(10.0, zoomLevel.current));
        }
      };

      const handleSetCameraAngle = (e: any) => {
        yaw.current = e.detail.yaw;
        pitch.current = e.detail.pitch;
      };

      gl.domElement.addEventListener('mousemove', handleMouseMove);
      gl.domElement.addEventListener('click', handleClick);
      gl.domElement.addEventListener('mousedown', handleMouseDown);
      gl.domElement.addEventListener('mouseup', handleMouseUp);
      gl.domElement.addEventListener('wheel', handleWheel);
      window.addEventListener('set-camera-angle', handleSetCameraAngle as EventListener);
      
      return () => {
        gl.domElement.removeEventListener('mousemove', handleMouseMove);
        gl.domElement.removeEventListener('click', handleClick);
        gl.domElement.removeEventListener('mousedown', handleMouseDown);
        gl.domElement.removeEventListener('mouseup', handleMouseUp);
        gl.domElement.removeEventListener('wheel', handleWheel);
        window.removeEventListener('set-camera-angle', handleSetCameraAngle as EventListener);
      };
    }, [gl.domElement, setIsAiming]);

    useEffect(() => {
      const handleToggleCable = () => {
        if (!groupRef.current) return;
        const shipPos = new Vector3(-12, 0, -12);
        const distToShip = groupRef.current.position.distanceTo(shipPos);
        
        setIsCableConnected(prev => {
          const newState = !prev;
          if (newState) {
            if (distToShip > 60) {
              window.dispatchEvent(new CustomEvent('show-notification', { detail: 'Nave muito distante para conectar o cabo!' }));
              return false;
            }
            window.dispatchEvent(new CustomEvent('show-notification', { detail: 'Cabo de Oxigênio Conectado!' }));
          } else {
            window.dispatchEvent(new CustomEvent('show-notification', { detail: 'Cabo de Oxigênio Desconectado!' }));
          }
          return newState;
        });
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'KeyC') {
          handleToggleCable();
        }
      };

      const handleRespawnReset = () => {
        healthRef.current = 100;
        oxygenLevel.current = 100;
        setIsCableConnected(true);
        velocity.current.set(0, 0, 0);
      };

      window.addEventListener('toggle-cable', handleToggleCable);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('player-respawn', handleRespawnReset);
      return () => {
        window.removeEventListener('toggle-cable', handleToggleCable);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('player-respawn', handleRespawnReset);
      };

    }, []);

    const isPlayerPart = (obj: any) => {
      let curr = obj;
      while (curr) {
        if (curr.userData?.isPlayer) return true;
        curr = curr.parent;
      }
      return false;
    };     useFrame((state, delta) => {
      if (!groupRef.current || isCutsceneActive) return;

      // Cache scene lookups periodically (every 60 frames instead of every frame)
      sceneSearchFrame.current++;
      if (sceneSearchFrame.current % 60 === 0) {
        cachedMineralCluster.current = scene.getObjectByName('mineralCluster') || null;
        cachedMountains.current = scene.getObjectByName('mountains') || null;
        cachedCrashedShip.current = scene.getObjectByName('crashedShip') || null;
      }

      // Sprint logic (double tap forward)
      if (keys.forward && !isForwardPressed.current) {
        const now = state.clock.getElapsedTime();
        if (now - lastForwardPressTime.current < 0.3) {
          if (!isSprintingRef.current) {
            isSprintingRef.current = true;
            setIsSprinting(true);
          }
        }
        lastForwardPressTime.current = now;
      }
      isForwardPressed.current = keys.forward;

      if (!keys.forward && !keys.left && !keys.right && !keys.backward) {
        if (isSprintingRef.current) {
          isSprintingRef.current = false;
          setIsSprinting(false);
        }
      }

      // Oxygen & Cable Logic
      let currentFloor = 0;
      const isInsideShip = groupRef.current.position.y > 250;
      if (isInsideShip) currentFloor = 500.1;
      
      const distToShip = groupRef.current.position.distanceTo(_shipPos);
      
      // Dispatch cable status - throttled
      const canConnect = distToShip <= 60 || isInsideShip;
      if (state.clock.getElapsedTime() % 0.5 < delta) {
        window.dispatchEvent(new CustomEvent('cable-status', { detail: { canConnect, isInsideShip } }));
      }
      
      // Dispatch radar update - throttled
      if (!isInsideShip && state.clock.getElapsedTime() % 0.1 < delta) {
        window.dispatchEvent(new CustomEvent('radar-update', { 
          detail: { yaw: yaw.current, playerPos: groupRef.current.position.clone() }
        }));
      } 

      if (isInsideShip) {
        setIsCableConnected(true);
        oxygenLevel.current = Math.min(100, oxygenLevel.current + delta * 20); // Fast recharge inside
      } else {
        if (isCableConnected) {
          if (distToShip > 60) {
            setIsCableConnected(false); // Cable breaks
            window.dispatchEvent(new CustomEvent('show-notification', { detail: 'Cabo de Oxigênio Rompido! Distância máxima atingida.' }));
          } else {
            oxygenLevel.current = Math.min(100, oxygenLevel.current + delta * 5); // Recharge while connected
          }
        } else {
          // Deplete oxygen
          oxygenLevel.current = Math.max(0, oxygenLevel.current - delta * 2.5); // Deplete slightly faster
          
          if (oxygenLevel.current <= 0) {
            healthRef.current = Math.max(0, healthRef.current - delta * 15); // Lose 15 HP per second without O2
            window.dispatchEvent(new CustomEvent('health-update', { 
              detail: { health: healthRef.current, cause: 'OXIGENIO' } 
            }));
          }
        }
      }


      // Update Oxygen UI
      const oxygenBar = document.getElementById('oxygen-fill');
      const oxygenContainer = document.getElementById('oxygen-container');
      if (oxygenBar && oxygenContainer) {
        oxygenBar.style.width = `${oxygenLevel.current}%`;
        
        // Dispatch event for App.tsx to handle pulsing/blinking
        window.dispatchEvent(new CustomEvent('oxygen-update', { 
          detail: { 
            level: oxygenLevel.current, 
            isConnected: isCableConnected 
          } 
        }));

        if (oxygenLevel.current < 20 && !isCableConnected && !isInsideShip) {
          oxygenBar.style.backgroundColor = '#ef4444'; // Red
          oxygenContainer.classList.add('animate-pulse');
        } else if (oxygenLevel.current < 50) {
          oxygenBar.style.backgroundColor = '#eab308'; // Yellow
          oxygenContainer.classList.remove('animate-pulse');
        } else {
          oxygenBar.style.backgroundColor = '#06b6d4'; // Cyan
          oxygenContainer.classList.remove('animate-pulse');
        }
      }

      // Movement logic
      if (isFlying) {
         _tempVec3A.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
        _tempVec3B.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
        const forward = _tempVec3A;
        const right = _tempVec3B;
        
        const currentSpeed = isSprinting ? speed * 2.5 : speed * 1.5;

         direction.current.set(0,0,0)
          .addScaledVector(forward, Number(keys.forward) - Number(keys.backward))
          .addScaledVector(right, Number(keys.right) - Number(keys.left))
          .addScaledVector(_upVector, Number(keys.jump))
          .normalize()
          .multiplyScalar(currentSpeed);
                  if (direction.current.length() > 0.1) {
           velocity.current.lerp(direction.current, 0.1);
           if (!isMovingRef.current) { isMovingRef.current = true; setIsMoving(true); }
         } else {
           velocity.current.lerp(_zeroVec, 0.1); // Hover
           if (isMovingRef.current) { isMovingRef.current = false; setIsMoving(false); }
        }
        
        // Rotate character
        if (isAiming) {
          targetQuaternion.current.setFromAxisAngle(_upVector, yaw.current + Math.PI);
          groupRef.current.quaternion.slerp(targetQuaternion.current, 0.2);
        } else if (isMoving && (Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.z) > 0.1)) {
          const angle = Math.atan2(velocity.current.x, velocity.current.z);
          targetQuaternion.current.setFromAxisAngle(_upVector, angle);
          groupRef.current.quaternion.slerp(targetQuaternion.current, 0.3);
        }
        
        // Check for landing
      if (isFalling) {
        wasFalling.current = true;
      } else if (wasFalling.current) {
        wasFalling.current = false;
        // Just landed
        const landingEvent = new CustomEvent('spawn-landing-dust', {
          detail: { position: groupRef.current.position.clone() }
        });
        window.dispatchEvent(landingEvent);
      }

      // Apply tilting to characterGroupRef while flying
        if (characterGroupRef.current) {
          const forwardInput = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
          const rightInput = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
          const time = state.clock.getElapsedTime();
          
          const targetLeanX = isSprinting ? forwardInput * 1.5 : forwardInput * 0.8;
          const sway = Math.sin(time * 5) * 0.1;
          const targetLeanZ = -rightInput * 0.8 + sway * 0.2;
          
          if (!isNaN(targetLeanX) && !isNaN(targetLeanZ)) {
            const leanX = isFP ? 0 : targetLeanX;
            const leanZ = isFP ? 0 : targetLeanZ;
            characterGroupRef.current.rotation.x = MathUtils.lerp(characterGroupRef.current.rotation.x || 0, leanX, 0.1);
            characterGroupRef.current.rotation.z = MathUtils.lerp(characterGroupRef.current.rotation.z || 0, leanZ, 0.1);
          }
        }

        // Update position
        groupRef.current.position.addScaledVector(velocity.current, delta);
        
        // Floor collision
        let floorHeight = 0;
        if (groupRef.current.position.y > 250) floorHeight = 500.1;

        if (groupRef.current.position.y < floorHeight) {
          groupRef.current.position.y = floorHeight;
          setIsFlying(false); // Disable flying if hit ground
        }
      } else {
        frontVector.current.set(0, 0, Number(keys.backward) - Number(keys.forward));
        sideVector.current.set(Number(keys.left) - Number(keys.right), 0, 0);
        
        direction.current
          .subVectors(frontVector.current, sideVector.current)
          .normalize()
          .multiplyScalar(isSprinting ? speed * 1.8 : speed);
          
        // Move relative to camera yaw
        direction.current.applyAxisAngle(new Vector3(0, 1, 0), yaw.current);

        const _isMovingNow = direction.current.length() > 0.1;
       if (_isMovingNow !== isMovingRef.current) { isMovingRef.current = _isMovingNow; setIsMoving(_isMovingNow); }

        // Apply horizontal velocity
        if (isMoving) {
          velocity.current.x = direction.current.x;
          velocity.current.z = direction.current.z;
        } else {
          // Decelerate smoothly
          velocity.current.x *= 0.8;
          velocity.current.z *= 0.8;
        }

        // Rotate character
        if (isAiming || isFiring || isFP) {
          // Force character to face camera yaw when aiming, firing, or in first person
          targetQuaternion.current.setFromAxisAngle(_upVector, yaw.current + Math.PI);
          groupRef.current.quaternion.slerp(targetQuaternion.current, 0.2);
        } else if (isMoving) {
          // Rotate character to face movement direction
          const angle = Math.atan2(velocity.current.x, velocity.current.z);
          targetQuaternion.current.setFromAxisAngle(_upVector, angle);
          groupRef.current.quaternion.slerp(targetQuaternion.current, 0.15);
        }

        // Apply tilting to characterGroupRef
        if (characterGroupRef.current) {
          const time = state.clock.getElapsedTime();

          if (isFalling) {
            const fallSway = Math.sin(time * 10) * 0.1;
            const leanX = isFP ? 0 : Math.PI / 2.5;
            const leanZ = isFP ? 0 : fallSway;
            characterGroupRef.current.rotation.x = MathUtils.lerp(characterGroupRef.current.rotation.x || 0, leanX, 0.1);
            characterGroupRef.current.rotation.z = MathUtils.lerp(characterGroupRef.current.rotation.z || 0, leanZ, 0.1);
          } else if (isMoving) {
            const leanX = isFP ? 0 : (isSprinting ? 0.3 : 0);
            characterGroupRef.current.rotation.x = MathUtils.lerp(characterGroupRef.current.rotation.x || 0, leanX, 0.2);
            characterGroupRef.current.rotation.z = MathUtils.lerp(characterGroupRef.current.rotation.z || 0, 0, 0.2);
          } else {
            const leanX = isFP ? 0 : 0.05;
            characterGroupRef.current.rotation.x = MathUtils.lerp(characterGroupRef.current.rotation.x || 0, leanX, 0.1);
            characterGroupRef.current.rotation.z = MathUtils.lerp(characterGroupRef.current.rotation.z || 0, 0, 0.1);
          }
        }

        // Jump logic
        let currentFloor = 0;
        if (groupRef.current.position.y > 250) currentFloor = 500.1;

        if (keys.jump && groupRef.current.position.y <= currentFloor + 0.1) {
           velocity.current.y = jumpForce;
          if (!isJumpingRef.current) { isJumpingRef.current = true; setIsJumping(true); }
        }

        // Apply gravity
        velocity.current.y += gravity * delta;

        // Update position
        groupRef.current.position.addScaledVector(velocity.current, delta);

        // Spaceship Interior Walls Collision
        if (groupRef.current.position.y > 250) {
          // Interior bounds: X from -9.5 to 9.5, Z from -19.5 to 39.5
          if (groupRef.current.position.x < -9.5) groupRef.current.position.x = -9.5;
          if (groupRef.current.position.x > 9.5) groupRef.current.position.x = 9.5;
          if (groupRef.current.position.z < -19.5) groupRef.current.position.z = -19.5;
          if (groupRef.current.position.z > 39.5) groupRef.current.position.z = 39.5;

          // Interior mineral collision - only check every 3 frames
          if (sceneSearchFrame.current % 3 === 0) {
            const interiorMinerals = scene.getObjectsByProperty('name', 'interiorMineral');
            interiorMinerals.forEach(mineral => {
              _tempVec3C.set(0,0,0);
              mineral.getWorldPosition(_tempVec3C);
              const dx = groupRef.current.position.x - _tempVec3C.x;
              const dz = groupRef.current.position.z - _tempVec3C.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              const parentScale = mineral.parent?.scale.x || 1;
              const minDist = 0.5 + parentScale * 0.7;
              if (dist < minDist && dist > 0.001) {
                const pushAmt = minDist - dist;
                groupRef.current.position.x += (dx / dist) * pushAmt;
                groupRef.current.position.z += (dz / dist) * pushAmt;
              }
            });
          }
        }

        // Hawk Collision
        if (groupRef.current.position.y < 5) {
          const dx = groupRef.current.position.x - _hawkPos.x;
          const dz = groupRef.current.position.z - _hawkPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const minDist = 1.2;
          if (dist < minDist && dist > 0.001) {
            const pushAmt = minDist - dist;
            groupRef.current.position.x += (dx / dist) * pushAmt;
            groupRef.current.position.z += (dz / dist) * pushAmt;
          }
        }

        // Floor collision
        let floorHeight = 0;
        if (groupRef.current.position.y > 250) {
          floorHeight = 500.1; // Spaceship interior floor
        }

        if (groupRef.current.position.y < floorHeight) {
          groupRef.current.position.y = floorHeight;
           velocity.current.y = 0;
          if (isJumpingRef.current) { isJumpingRef.current = false; setIsJumping(false); }
          if (isFallingRef.current) { isFallingRef.current = false; setIsFalling(false); }
        }

        // Falling detection
        if (velocity.current.y < -15 && groupRef.current.position.y > floorHeight + 5) {
           if (isFlyingRef.current) { isFlyingRef.current = false; setIsFlying(false); }
          if (!isFallingRef.current) { isFallingRef.current = true; setIsFalling(true); }
        }
        
        if (!isFlying && !isJumping && velocity.current.y < -12 && groupRef.current.position.y > floorHeight + 3) {
          if (!isFallingRef.current) { isFallingRef.current = true; setIsFalling(true); }
        }
        if (groupRef.current.position.y < floorHeight + 0.5) {
          if (isFallingRef.current) { isFallingRef.current = false; setIsFalling(false); }
        }
      }

      // Mineral collision - use cached reference
      if (cachedMineralCluster.current && groupRef.current.position.y < 100) {
        const playerPos = groupRef.current.position;
        const playerRadius = 0.5;
        
        cachedMineralCluster.current.children.forEach(group => {
          group.children.forEach(child => {
            if (child.name === 'mineral') {
              child.getWorldPosition(_tempVec3C);
              const dx = playerPos.x - _tempVec3C.x;
              const dz = playerPos.z - _tempVec3C.z;
              const dist = Math.sqrt(dx * dx + dz * dz);
              const minDist = playerRadius + child.scale.x * 0.7;
              if (dist < minDist && dist > 0.001) {
                const pushAmt = minDist - dist;
                playerPos.x += (dx / dist) * pushAmt;
                playerPos.z += (dz / dist) * pushAmt;
              }
            }
          });
        });
      }         // Mountain collision - use cached reference, skip if too far or inside ship
      if (cachedMountains.current && groupRef.current.position.y < 100) {
        const playerPos = groupRef.current.position;
        const playerRadius = 0.5;
        
        cachedMountains.current.children.forEach(group => {
          group.children.forEach(child => {
            if (child.name === 'mountainLayer') {
              child.getWorldPosition(_tempVec3C);
              const mountainRadius = child.userData.radius;
              const layerY = _tempVec3C.y;
              const layerHeight = (child as any).geometry?.parameters?.height || 2;
              
              if (playerPos.y >= layerY - layerHeight/2 - 2 && playerPos.y <= layerY + layerHeight/2 + 2) {
                const dx = playerPos.x - _tempVec3C.x;
                const dz = playerPos.z - _tempVec3C.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                const minDist = playerRadius + mountainRadius;
                if (dist < minDist && dist > 0.001) {
                  const pushAmt = minDist - dist;
                  playerPos.x += (dx / dist) * pushAmt;
                  playerPos.z += (dz / dist) * pushAmt;
                }
              }
            }
          });
        });
      }    

      // Crashed ship collision - use cached reference and pre-allocated objects
      if (cachedCrashedShip.current && groupRef.current.position.y < 100) {
        const playerPos = groupRef.current.position;
        cachedCrashedShip.current.getWorldPosition(_tempVec3D);
        const playerRadius = 0.5;
        
        SHIP_COLLISION_SPHERES.forEach(sphere => {
          _tempVec3E.set(sphere.x, sphere.y, sphere.z);
          _tempVec3E.multiplyScalar(1.5);
          _tempVec3E.applyEuler(_shipEuler);
          _tempVec3E.add(_tempVec3D);
          
          const dx = playerPos.x - _tempVec3E.x;
          const dz = playerPos.z - _tempVec3E.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          const minDist = playerRadius + sphere.r * 1.5;
          
          if (dist < minDist && dist > 0.001) {
            const pushAmt = minDist - dist;
            playerPos.x += (dx / dist) * pushAmt;
            playerPos.z += (dz / dist) * pushAmt;
          }
        });
      }    

      // Camera Positioning
       const lookDir = _tempVec3A.set(
        -Math.sin(yaw.current) * Math.cos(pitch.current),
        -Math.sin(pitch.current),
        -Math.cos(yaw.current) * Math.cos(pitch.current)
      );

      const rightDir = _tempVec3B.set(
        Math.sin(yaw.current - Math.PI/2),
        0,
        Math.cos(yaw.current - Math.PI/2)
      ).normalize();

      let targetCameraPos;
      
      if (isFP) {
        // First Person Camera - Positioned slightly above and to the right of the weapon
        // Moved slightly back to see more of the arm and tool
        targetCameraPos = groupRef.current.position.clone()
          .add(new Vector3(0, 2.0, 0)) 
          .add(lookDir.clone().multiplyScalar(0.05)) 
          .add(rightDir.clone().multiplyScalar(0.2)); 
      } else {
        // Third Person Over-the-Shoulder Camera
        const isDrillAiming = isDrillEquipped && (isAiming || isFiring);
        const targetOrbitRadius = isDrillAiming ? 2.8 : zoomLevel.current;
        const heightOffset = isDrillAiming ? 1.6 : 1.4;
        
        let targetDynamicOffset = isDrillAiming ? 0.3 : 0;
        cameraSideOffset.current = MathUtils.lerp(cameraSideOffset.current, targetDynamicOffset, 0.1);
        
        let targetMovementOffset = 0;
        if (isFiring) {
          const rightInput = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
          targetMovementOffset = rightInput * 1.5; // Shift camera based on movement
        }
        cameraMovementOffset.current = MathUtils.lerp(cameraMovementOffset.current, targetMovementOffset, 0.1);
        
        const sideOffset = (isDrillAiming ? 0.9 : 1.2) + cameraSideOffset.current + cameraMovementOffset.current;

        targetCameraPos = groupRef.current.position.clone()
          .sub(lookDir.clone().multiplyScalar(targetOrbitRadius))
          .add(rightDir.clone().multiplyScalar(sideOffset))
          .add(new Vector3(0, heightOffset, 0));
      }

      targetCameraPos.y = Math.max(0.5, targetCameraPos.y);
      
      // Prevent camera from clipping through spaceship interior walls
      if (groupRef.current.position.y > 250) {
        // Interior bounds: X from -9.5 to 9.5, Z from -19.5 to 39.5
        targetCameraPos.x = MathUtils.clamp(targetCameraPos.x, -9.0, 9.0);
        targetCameraPos.z = MathUtils.clamp(targetCameraPos.z, -19.0, 39.0);
        targetCameraPos.y = MathUtils.clamp(targetCameraPos.y, 501, 509);
        
        // Camera collision with sliding door
         const isDoorClosed = groupRef.current.position.distanceTo(_exitDoorPos) >= 8;
        if (isDoorClosed && Math.abs(targetCameraPos.z - 20) < 1.0) {
          if (groupRef.current.position.z < 20) {
            targetCameraPos.z = Math.min(targetCameraPos.z, 19.0);
          } else {
            targetCameraPos.z = Math.max(targetCameraPos.z, 21.0);
          }
        }
        
        // Camera collision with sliding door side walls
        if (Math.abs(targetCameraPos.z - 20) < 1.0 && (targetCameraPos.x < -4 || targetCameraPos.x > 4)) {
          if (groupRef.current.position.z < 20) {
            targetCameraPos.z = Math.min(targetCameraPos.z, 19.0);
          } else {
            targetCameraPos.z = Math.max(targetCameraPos.z, 21.0);
          }
        }
      }
      
      // Snap to first person, or snap if distance is large (teleport), otherwise lerp
      if (isFP || camera.position.distanceTo(targetCameraPos) > 20) {
        camera.position.copy(targetCameraPos);
      } else {
        camera.position.lerp(targetCameraPos, 0.1); // Smoother camera stabilization
      }
      
      const targetLookAt = camera.position.clone().add(lookDir);
      
      if (isFP) {
        // Instant snap for FPS view to prevent input lag and initial quaternion mismatch black screens
        camera.lookAt(targetLookAt);
      } else {
        const currentQuat = camera.quaternion.clone();
        camera.lookAt(targetLookAt);
        const targetQuat = camera.quaternion.clone();
        camera.quaternion.copy(currentQuat);
        camera.quaternion.slerp(targetQuat, 0.3); // Smooth rotation stabilization
      }

      // Zoom camera when aiming - cinematic scope zoom
      const pCamera = camera as PerspectiveCamera;
      const targetFov = isAiming ? 28 : 50; // Deep zoom when scoped in
      pCamera.fov = MathUtils.lerp(pCamera.fov, targetFov, isAiming ? 0.08 : 0.12); // Smooth transition
      pCamera.updateProjectionMatrix();

      // Recoil and shake logic
      if (characterGroupRef.current) {
        if (isFiring && isAiming && hasDrill && isDrillEquipped) {
          const time = state.clock.getElapsedTime();
          // Shake
          characterGroupRef.current.position.x = (Math.random() - 0.5) * 0.05;
          characterGroupRef.current.position.y = (Math.random() - 0.5) * 0.05;
          // Recoil (push backward slightly)
          characterGroupRef.current.position.z = MathUtils.lerp(characterGroupRef.current.position.z, -0.1, 0.2);
        } else if (isFiring && isPlasmaEquipped) {
          // Plasma recoil
          characterGroupRef.current.position.z = MathUtils.lerp(characterGroupRef.current.position.z, -0.05, 0.2);
        } else {
          // Return to normal
           characterGroupRef.current.position.lerp(_zeroVec, 0.1);
        }
      }

      // Plasma Firing Logic
      if (isFiring && isPlasmaEquipped && !isReloading) {
        const now = state.clock.getElapsedTime();
        if (now - lastPlasmaFireTime.current > 0.15) { // Fire rate
          lastPlasmaFireTime.current = now;
          
          if (plasmaAmmo > 0) {
            setPlasmaAmmo(prev => {
              const newAmmo = prev - 1;
              if (newAmmo <= 0) {
                setIsReloading(true);
                setIsFiring(false);
                setTimeout(() => {
                  setPlasmaAmmo(MAX_PLASMA);
                  setIsReloading(false);
                }, 2000); // 2s reload time
              }
              return newAmmo;
            });

            // Spawn projectile
             _raycaster.setFromCamera(_vec2Zero, camera);
            
            // Find where the crosshair is pointing
             const intersects = _raycaster.intersectObjects(scene.children, true);
            
            let hitPoint = _raycaster.ray.at(50, _tempVec3C.set(0,0,0)); // Default far point
            const validIntersects = intersects.filter(hit => 
              !isPlayerPart(hit.object) && 
              !hit.object.userData?.isTrigger &&
              hit.distance > 0.5
            );
            if (validIntersects.length > 0) {
              hitPoint = validIntersects[0].point;
            }
                     let startPos = _tempVec3D.set(0,0,0);
            if (plasmaTipRef.current) {
              plasmaTipRef.current.updateMatrixWorld(true);
              plasmaTipRef.current.getWorldPosition(startPos);
            } else {
              _tempVec3E.set(Math.sin(yaw.current - Math.PI/2), 0, Math.cos(yaw.current - Math.PI/2)).normalize();
              startPos.copy(groupRef.current.position)
                .add(_tempVec3C.set(0, 1.2, 0))
                .add(_tempVec3E.multiplyScalar(0.4))
                .add(_raycaster.ray.direction.clone().multiplyScalar(0.5));
            }    
            
            // Calculate direction from weapon tip to crosshair hit point
            const shootDir = new Vector3().subVectors(hitPoint, startPos).normalize();
            
            // Push startPos slightly forward to avoid self-collision
            _tempVec3E.copy(shootDir).multiplyScalar(0.8);
            startPos.add(_tempVec3E);
            
            // Find dead projectile or add new
            const deadIdx = plasmaProjectilesRef.current.findIndex(p => p.life <= 0);
            const projectileData = { pos: startPos.clone(), vel: shootDir.multiplyScalar(80), life: 2.5 };
            
            if (deadIdx !== -1) {
              plasmaProjectilesRef.current[deadIdx] = projectileData;
            } else if (plasmaProjectilesRef.current.length < MAX_PLASMA) {
              plasmaProjectilesRef.current.push(projectileData);
            }
          }

        }
      }

      // Update Plasma Projectiles
      if (plasmaMeshRef.current) {
        const time = state.clock.getElapsedTime();
        plasmaProjectilesRef.current.forEach((p, i) => {
          if (p.life > 0) {
            p.pos.addScaledVector(p.vel, delta);
            p.life -= delta;

            // Collision with ground
            if (p.pos.y <= 0.2) {
              p.pos.y = 0.2;
              p.life = 0;
            } else if (p.pos.y > 250) {
              // Interior collision (walls, floor, ceiling)
              if (p.pos.x < -9.5 || p.pos.x > 9.5 || p.pos.z < -19.5 || p.pos.z > 39.5 || p.pos.y < 500.1 || p.pos.y > 510) {
                p.life = 0;
              }
              // Sliding door collision
               const isDoorClosed = groupRef.current && groupRef.current.position.distanceTo(_exitDoorPos) >= 8;
              if (isDoorClosed && Math.abs(p.pos.z - 20) < 0.5 && p.pos.x > -4 && p.pos.x < 4) {
                p.life = 0;
              }
            } else {
              // Check collision with mount               // Mountain collision for projectiles - use cached reference
              if (cachedMountains.current) {
                cachedMountains.current.children.forEach(group => {
                  group.children.forEach(child => {
                    if (child.name === 'mountainLayer' && p.life > 0) {
                      child.getWorldPosition(_tempVec3C);
                      const mountainRadius = child.userData.radius;
                      const layerY = _tempVec3C.y;
                      const layerHeight = (child as any).geometry?.parameters?.height || 2;
                      
                      if (p.pos.y >= layerY - layerHeight/2 && p.pos.y <= layerY + layerHeight/2) {
                        const dx = p.pos.x - _tempVec3C.x;
                        const dz = p.pos.z - _tempVec3C.z;
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        if (dist < mountainRadius) {
                          p.life = 0;
                        }
                      }
                    }
                  });
                });
              }    
              
              // Check collision with crashed                // Crashed ship projectile collision - use cached reference
              if (cachedCrashedShip.current && p.life > 0) {
                cachedCrashedShip.current.getWorldPosition(_tempVec3D);
                SHIP_COLLISION_SPHERES.forEach(sphere => {
                  if (p.life <= 0) return;
                  _tempVec3E.set(sphere.x, sphere.y, sphere.z);
                  _tempVec3E.multiplyScalar(1.5);
                  _tempVec3E.applyEuler(_shipEuler);
                  _tempVec3E.add(_tempVec3D);
                  const dx = p.pos.x - _tempVec3E.x;
                  const dz = p.pos.z - _tempVec3E.z;
                  const dy = p.pos.y - _tempVec3E.y;
                  const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                  if (dist < sphere.r * 1.5) {
                    p.life = 0;
                  }
                });
              }    
            }

            if (p.life <= 0) {
              // Add burn mark
              burnMarksRef.current.push({ pos: p.pos.clone(), time: state.clock.getElapsedTime() });
              if (burnMarksRef.current.length > MAX_MARKS) {
                burnMarksRef.current.shift();
              }
              
              // Add spark and fire explosion - Reduced count
              if (sparksGroupRef.current) {
                const sparkEvent = new CustomEvent('spawn-spark', { 
                  detail: { position: p.pos.clone(), color: '#38bdf8', count: 5 } 
                });
                window.dispatchEvent(sparkEvent);
              }
            }

            dummy.current.position.copy(p.pos);
            
            // Orient along velocity vector
            const lookTarget = p.pos.clone().add(p.vel);
            dummy.current.lookAt(lookTarget);
            
            // Sphere scale
            dummy.current.scale.setScalar(1.0);
            dummy.current.updateMatrix();
            plasmaMeshRef.current!.setMatrixAt(i, dummy.current.matrix);
            
            // Spiral scale and rotation
            if (plasmaSpiralRef.current) {
              dummy.current.rotation.z += time * 15; // Spin spiral
              dummy.current.scale.set(1.5, 1.5, 2.0);
              dummy.current.updateMatrix();
              plasmaSpiralRef.current.setMatrixAt(i, dummy.current.matrix);
            }
          } else {
            dummy.current.scale.setScalar(0);
            dummy.current.updateMatrix();
            plasmaMeshRef.current!.setMatrixAt(i, dummy.current.matrix);
            if (plasmaSpiralRef.current) {
              plasmaSpiralRef.current.setMatrixAt(i, dummy.current.matrix);
            }
          }
        });
        plasmaMeshRef.current.instanceMatrix.needsUpdate = true;
        if (plasmaSpiralRef.current) plasmaSpiralRef.current.instanceMatrix.needsUpdate = true;
      }

      // Raycasting for aiming, firing, and targeting
       _raycaster.setFromCamera(_vec2Zero, camera);
      const intersects = _raycaster.intersectObjects(scene.children, true);

      let hitPoint = _raycaster.ray.at(20, _tempVec3C.set(0,0,0));
      let validHit = false;
      let targetedMineral = null;
      let targetedFragment = null;

      for (const hit of intersects) {
        if (hit.object.userData?.isPlayer || (hit.object as any).transparent) continue;
        if (hit.object.userData?.type === 'mineral' || hit.object.userData?.type === 'fragment' || hit.object.name === 'ground') {
          hitPoint = hit.point;
          validHit = true;
          if (hit.object.userData?.type === 'mineral') {
            targetedMineral = hit.object.userData;
            if (isFiring && hasDrill && isDrillEquipped) {
              hit.object.userData.onHit?.(50 * delta);
              
              // Spawn mineral debris occasionally (not every frame to save performance)
              if (Math.random() < 0.2) {
                window.dispatchEvent(new CustomEvent('spawn-mineral-debris', {
                  detail: { position: hitPoint.clone(), color: targetedMineral.mineralInfo.color }
                }));
              }
            }
          } else if (hit.object.userData?.type === 'fragment') {
            targetedFragment = hit.object.userData;
            // Dispatch event for the targeted fragment
            window.dispatchEvent(new CustomEvent('target-fragment', { detail: { id: targetedFragment.id } }));
          }
          break;
        }
      }

      // If no fragment targeted, clear it
      if (!targetedFragment) {
        window.dispatchEvent(new CustomEvent('target-fragment', { detail: { id: null } }));
      }

      // Update target info UI
      if (setTargetInfo) {
        setTargetInfo(targetedMineral?.mineralInfo || targetedFragment?.mineralInfo || null);
      }
      
      const activeTipRef = isFP ? drillTipRef : drillTip3PRef;
      
      if (isFiring && hasDrill && isDrillEquipped && laserMeshRef.current && groupRef.current && validHit && activeTipRef.current) {
          const origin = new Vector3();
          activeTipRef.current.updateMatrixWorld(true);
          activeTipRef.current.getWorldPosition(origin);
          
          // Push the origin slightly forward so it doesn't clip through the drill model
          const dir = new Vector3().subVectors(hitPoint, origin).normalize();
          origin.addScaledVector(dir, 0.1);
          
          const distance = origin.distanceTo(hitPoint);
          laserMeshRef.current.position.copy(origin).lerp(hitPoint, 0.5);
          laserMeshRef.current.lookAt(hitPoint);
          laserMeshRef.current.rotateX(Math.PI / 2);
          laserMeshRef.current.scale.set(1, distance, 1);

          // Update laser color based on mineral
          const laserColor = targetedMineral ? targetedMineral.mineralInfo.color : '#38bdf8';
          laserMeshRef.current.children.forEach((child, i) => {
            if (i === 1) { // Glow cylinder
              (child as any).material.color.set(laserColor);
            }
          });

          // Dynamic pulsing effect for laser
          const time = state.clock.getElapsedTime();
          laserMeshRef.current.children.forEach((child, i) => {
            if (i === 1) { // Glow cylinder
              child.scale.setScalar(1.5 + Math.random() * 0.5);
              (child as any).material.opacity = 0.5 + Math.random() * 0.3;
            }
          });

          // Update lights
          if (hitLightRef.current) {
            hitLightRef.current.position.copy(hitPoint);
            hitLightRef.current.color.set(laserColor);
            hitLightRef.current.intensity = 20 + Math.random() * 10; // Brighter and blinking
          }
          if (drillLightRef.current) {
            drillLightRef.current.position.copy(origin);
            drillLightRef.current.color.set(laserColor);
            drillLightRef.current.intensity = 10 + Math.random() * 5; // Brighter and blinking
          }
          if (sparksGroupRef.current) {
            sparksGroupRef.current.position.copy(hitPoint);
            sparksGroupRef.current.scale.setScalar(1);
            // Pass color if hitting mineral
            if (targetedMineral) {
              (sparksGroupRef.current as any).userData.color = targetedMineral.mineralInfo.color;
            } else {
              (sparksGroupRef.current as any).userData.color = '#f59e0b';
            }
          }

          // Add burn mark if hitting ground
          if (!targetedMineral && hitPoint.y < 0.1) {
            if (Math.random() < 0.5) { // Increased frequency
              burnMarksRef.current.push({ pos: hitPoint.clone(), time });
              if (burnMarksRef.current.length > MAX_MARKS) {
                burnMarksRef.current.shift();
              }
            }
          }

        } else if (laserMeshRef.current) {
        laserMeshRef.current.scale.set(0, 0, 0); // Hide laser
        if (hitLightRef.current) hitLightRef.current.intensity = 0;
        if (drillLightRef.current) drillLightRef.current.intensity = 0;
        if (sparksGroupRef.current) sparksGroupRef.current.scale.setScalar(0);
      }

      // Flashlight logic
      if (flashlightOn) {
        const activeFlashlightRef = isDrillEquipped ? (isFP ? drillTipRef : drillTip3PRef) : (isPlasmaEquipped ? (isFP ? plasmaTipRef : plasmaTip3PRef) : null);
        if (activeFlashlightRef && activeFlashlightRef.current) {
          flashTargetRef.current.position.copy(activeFlashlightRef.current.position);
          flashTargetRef.current.quaternion.copy(activeFlashlightRef.current.quaternion);
        }
      }
      // Update burn marks
      if (burnMeshRef.current) {
        const currentTime = state.clock.getElapsedTime();
        burnMarksRef.current.forEach((mark, i) => {
          const age = currentTime - mark.time;
          if (age > 10) {
            dummy.current.scale.set(0, 0, 0);
          } else {
            const scale = Math.max(0, 1 - age / 10); // Fade out over 10 seconds
            dummy.current.position.copy(mark.pos);
            dummy.current.position.y = 0.01 + i * 0.0001; // Avoid z-fighting
            dummy.current.rotation.x = -Math.PI / 2;
            dummy.current.scale.set(scale, scale, scale);
          }
          dummy.current.updateMatrix();
          burnMeshRef.current!.setMatrixAt(i, dummy.current.matrix);
        });
        // Hide unused instances
        for (let i = burnMarksRef.current.length; i < MAX_MARKS; i++) {
          dummy.current.scale.set(0, 0, 0);
          dummy.current.updateMatrix();
          burnMeshRef.current!.setMatrixAt(i, dummy.current.matrix);
        }
        burnMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      // Smooth HUD positioning
      if (isPlasmaEquipped) {
        if (isFP) {
          const offset = new Vector3(0.3, -0.25, -0.8);
          offset.applyQuaternion(camera.quaternion);
          hudTargetPos.current.copy(camera.position).add(offset);
          hudTargetQuat.current.copy(camera.quaternion);
        } else {
          const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
          const up = new Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
          
          hudTargetPos.current.copy(groupRef.current.position)
            .add(right.multiplyScalar(1.5))
            .add(up.multiplyScalar(1.2));
            
          hudTargetQuat.current.copy(camera.quaternion);
        }

        if (hudGroupRef.current) {
          hudGroupRef.current.position.copy(hudTargetPos.current);
          hudGroupRef.current.quaternion.copy(hudTargetQuat.current);
        }
      }

      // FPS Weapon HUD - position weapon relative to camera in lower-right corner
      if (fpWeaponRef.current && isFP) {
        // Bob effect when moving
        const bobSpeed = isSprinting ? 18 : 12;
        const bobAmountX = isMoving ? Math.sin(state.clock.elapsedTime * bobSpeed) * 0.015 : 0;
        const bobAmountY = isMoving ? Math.abs(Math.cos(state.clock.elapsedTime * bobSpeed * 2)) * 0.01 : 0;
        fpBobOffset.current.x = MathUtils.lerp(fpBobOffset.current.x, bobAmountX, 0.15);
        fpBobOffset.current.y = MathUtils.lerp(fpBobOffset.current.y, bobAmountY, 0.15);
        
        // Recoil when firing
        const recoilZ = isFiring ? 0.04 : 0;
        const recoilRot = isFiring ? 0.05 : 0;
        
        // Position: lower-right corner of camera view
        const weaponOffset = new Vector3(
          0.35 + fpBobOffset.current.x,  // Right side
          -0.3 + fpBobOffset.current.y,  // Below center
          -0.6 + recoilZ                  // In front of camera
        );
        weaponOffset.applyQuaternion(camera.quaternion);
        
        fpWeaponRef.current.position.copy(camera.position).add(weaponOffset);
        fpWeaponRef.current.quaternion.copy(camera.quaternion);
        
        // Apply slight tilt for natural look
         _tempQuat.setFromEuler(new Euler(-0.05 + recoilRot, 0.1, 0));
        fpWeaponRef.current.quaternion.multiply(_tempQuat);
      }

    });

    // Jack is orange
    return (
      <>
        <group ref={groupRef} position={[0, 501, 10]} userData={{ isPlayer: true }}>
          <group ref={characterGroupRef}>
            <CharacterModel 
              color="#e67e22" 
              isMoving={isMoving} 
              isJumping={isJumping} 
              headRotationY={0} 
              hasDrill={hasDrill}
              hasPlasma={hasPlasma}
              isDrillEquipped={isDrillEquipped}
              isPlasmaEquipped={isPlasmaEquipped}
              isAiming={isAiming}
              isFiring={isFiring}
              aimPitch={pitch.current}
              drillTipRef={drillTip3PRef}
              plasmaTipRef={plasmaTip3PRef}
              isCollecting={isCollecting}
              isFlying={isFlying}
              isSprinting={isSprinting}
              isFirstPerson={isFP}
              isFalling={isFalling}
            />
          </group>
        </group>

        {/* FPS Weapon View - Camera-attached, lower-right corner */}
        {isFP && (isDrillEquipped || isPlasmaEquipped) && (
          <group ref={fpWeaponRef}>
            {/* Arm / Forearm */}
            <group position={[0.02, -0.08, 0.05]}>
              {/* Forearm */}
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.035, 0.03, 0.25, 8]} />
                <meshStandardMaterial color="#64748b" metalness={0.6} roughness={0.4} />
              </mesh>
              {/* Forearm Armor */}
              <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.02]}>
                <cylinderGeometry args={[0.04, 0.035, 0.18, 8]} />
                <meshStandardMaterial color="#e67e22" metalness={0.5} roughness={0.5} />
              </mesh>
              {/* Glove/Hand */}
              <mesh position={[0, 0, 0.15]}>
                <sphereGeometry args={[0.035, 8, 8]} />
                <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.3} />
              </mesh>
            </group>
            
            {/* Weapon */}
            {isDrillEquipped && hasDrill && (
              <group position={[0, -0.02, 0.15]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.8, 1.8, 1.8]}>
                <DrillMeshes drillBitRef={drillBitFPRef} drillTipRef={drillTipRef} isFiring={isFiring} />
              </group>
            )}
            {isPlasmaEquipped && (
              <group position={[0, 0, 0.08]} scale={[1.8, 1.8, 1.8]}>
                <PlasmaWeaponMeshes plasmaTipRef={plasmaTipRef} isFiring={isFiring} />
              </group>
            )}
            
            {/* Small light to illuminate the weapon */}
            <pointLight position={[0, 0.1, 0]} intensity={0.5} distance={1} color="#ffffff" />
          </group>
        )}

        <Smoke targetRef={groupRef} isActive={isMoving && !isJumping && !isFlying} isSprinting={isSprinting} />
        <JetpackDust 
          targetRef={characterGroupRef} 
          isFlying={isFlying} 
          isSprinting={isSprinting}
          isMoving={isMoving}
          isFalling={isFalling} 
        />
        {/* Oxygen Cable - Hide when inside ship */}
        {!isInsideShip && <OxygenCable playerRef={groupRef} isConnected={isCableConnected} />}

      {/* Smooth Floating Ammo HUD - Visible in both FP and 3P */}
      {isPlasmaEquipped && (
        <group ref={hudGroupRef}>
          <Html center distanceFactor={isFP ? 5 : 10}>
            <div className="select-none pointer-events-none scale-50">
              <div className={`flex items-center gap-2 transition-all duration-500 ${isFiring ? 'opacity-20' : 'opacity-100'}`}>
                {/* Circular Indicator - Smaller */}
                <div className="w-4 h-4 rounded-full border border-orange-500/40 flex items-center justify-center relative">
                  <div className="w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_4px_#f97316]"></div>
                  <div className="absolute inset-0 rounded-full border border-orange-500/10 animate-ping"></div>
                </div>
                
                <div className="flex flex-col items-start">
                  <div className="text-orange-500 text-[4px] font-black tracking-[0.4em] mb-0.5 opacity-70">PLASMA CORE</div>
                  {/* Vertical Ammo Bars - Smaller */}
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({ length: 10 }).map((_, i) => {
                      const isActive = (plasmaAmmo / 30) * 10 > i;
                      return (
                        <div 
                          key={i} 
                          className={`w-1.5 h-1 transform -skew-x-[30deg] transition-all duration-300 ${isActive ? 'bg-orange-500 shadow-[0_0_2px_#f97316]' : 'bg-slate-800/40'}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-baseline gap-0.5">
                    <span className={`text-sm font-black tracking-tighter ${isReloading ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                      {isReloading ? 'RELOAD' : plasmaAmmo}
                    </span>
                    <span className="text-white/20 text-[6px] font-bold">/ 30</span>
                  </div>
                </div>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* Visual Effects (Rendered in World Space) */}
      
      {/* Burn Marks */}
      <instancedMesh ref={burnMeshRef} args={[undefined, undefined, MAX_MARKS]}>
        <circleGeometry args={[0.25, 8]} />
        <meshBasicMaterial color="#0a0a0a" transparent opacity={0.8} depthWrite={false} blending={2} />
      </instancedMesh>

      {/* Plasma Projectiles */}
      <instancedMesh ref={plasmaMeshRef} args={[undefined, undefined, MAX_PLASMA]} frustumCulled={false}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={10} toneMapped={false} />
      </instancedMesh>
      
      <instancedMesh ref={plasmaSpiralRef} args={[undefined, undefined, MAX_PLASMA]} frustumCulled={false}>
        <torusKnotGeometry args={[0.15, 0.04, 24, 4, 2, 3]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.8} />
      </instancedMesh>

      {/* Continuous Laser Beam */}
      <group ref={laserMeshRef} scale={0}>
        {/* Core Beam */}
        <mesh>
          <cylinderGeometry args={[0.03, 0.03, 1, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {/* Outer Glow */}
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 1, 8]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} blending={2} />
        </mesh>
        {/* Emitter Flash at the base of the cylinder */}
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={2} />
        </mesh>
      </group>

      {/* Dynamic Lights for Laser & Flashlight */}
      {flashlightOn && (
        <group>
          <primitive object={flashTargetRef.current} />
          {/* Main Flashlight SpotLight - Uses the active tip position via useFrame but we attach it to the camera to ensure its always shining precisely where the player looks */}
          <spotLight 
            position={[0, 501, 10]} // updated dynamically in useFrame
            ref={(spot: any) => {
              if (spot && camera) {
                // Attach spotlight to camera directly so it always illuminates perfectly
                camera.add(spot);
                spot.position.set(0.2, -0.2, 0); // Slight offset to look like it comes from weapon
                spot.target.position.set(0, 0, -10);
                camera.add(spot.target);
              }
            }}
            color="#ffffff" 
            angle={Math.PI / 6} 
            penumbra={0.4} 
            intensity={8} 
            distance={50} 
            decay={1.2} 
            castShadow 
          />
        </group>
      )}

      <pointLight ref={hitLightRef} color="#38bdf8" distance={15} decay={1.5} intensity={0} castShadow />
      <pointLight ref={drillLightRef} color="#7dd3fc" distance={10} decay={1.5} intensity={0} />
      
      <group ref={sparksGroupRef} scale={0}>
        <Sparks position={new Vector3(0,0,0)} isFiring={isFiring} />
      </group>
    </>
    );
  }
);
