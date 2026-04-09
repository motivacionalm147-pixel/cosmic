/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Loader } from '@react-three/drei';
import { Player } from './components/Player';
import { NPC } from './components/NPC';
import { World } from './components/World';
import { MineralCluster } from './components/Minerals';
import { FireEffect } from './components/FireEffect';
import { CrashedShip } from './components/CrashedShip';
import { ShipInterior } from './components/ShipInterior';
import { PlanetCutscene } from './components/PlanetCutscene';
import { Group } from 'three';
import { EffectComposer, DepthOfField } from '@react-three/postprocessing';

import * as THREE from 'three';

function FrontCutscene({ playerRef }: { playerRef: React.RefObject<Group> }) {
  const { camera } = useThree();
  const startTime = useRef(performance.now());
  
  useFrame(() => {
    if (playerRef.current) {
      const pPos = playerRef.current.position;
      const elapsed = (performance.now() - startTime.current) / 1000;
      
      const progress = Math.min(elapsed / 4.5, 1.0);
      const ease = progress * progress * (3 - 2 * progress);
      
      const camY = Math.max(0.5, pPos.y + 0.5 + (1.3 * ease));
      
      camera.position.set(pPos.x + 0.3, camY, pPos.z + 2.5);
      camera.lookAt(pPos.x, camY - 0.2, pPos.z);
    }
  });
  return null;
}

export default function App() {
  const playerRef = useRef<Group>(null);
  const [showUI, setShowUI] = useState(true);
  const [hasDrill, setHasDrill] = useState(false);
  const [isAiming, setIsAiming] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [targetInfo, setTargetInfo] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const [inventory, setInventory] = useState<any[]>(Array(6).fill(null));
  const [backpack, setBackpack] = useState<any[]>(() => Array(24).fill(null));
  const [showBackpack, setShowBackpack] = useState(false);
  const [draggedItem, setDraggedItem] = useState<{source: 'hotbar' | 'backpack', index: number, item: any} | null>(null);
  const [selectedBackpackItem, setSelectedBackpackItem] = useState<{index: number, item: any} | null>(null);
  const [isDrillUnlocked, setIsDrillUnlocked] = useState(false);
  const [isPlasmaUnlocked, setIsPlasmaUnlocked] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | 'drill' | 'plasma' | null>(null);
  const [isFirstPerson, setIsFirstPerson] = useState(true);
  const [plasmaAmmo, setPlasmaAmmo] = useState(30);
  const [isReloading, setIsReloading] = useState(false);
  const [isFiring, setIsFiring] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [isFading, setIsFading] = useState(false);
  const [isFadingBlack, setIsFadingBlack] = useState(false);
  const [showPlanetCutscene, setShowPlanetCutscene] = useState(false);
  const [showExitCutscene, setShowExitCutscene] = useState(false);
  const [showExitDialogue, setShowExitDialogue] = useState(false);
  const [showHawkYell, setShowHawkYell] = useState(false);
  const [canConnectCable, setCanConnectCable] = useState(true);
  const [isInsideShip, setIsInsideShip] = useState(true);
  const [hasExitedShip, setHasExitedShip] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [introPhase, setIntroPhase] = useState<'start' | 'video' | 'typing' | 'fading' | 'done'>('start');
  const [introText, setIntroText] = useState('');
  const [showPlanetName, setShowPlanetName] = useState(false);
  const [showCutsceneDialogue, setShowCutsceneDialogue] = useState(false);
  const [showWawnkDialogue, setShowWawnkDialogue] = useState(false);
  const [initialCableState, setInitialCableState] = useState(true);
  const [isBlinking, setIsBlinking] = useState(false);
  const [playerSpawnPos, setPlayerSpawnPos] = useState<[number, number, number]>([0, 501, -14]);
  const [oxygenStatus, setOxygenStatus] = useState({ level: 100, isConnected: true });
  const hasExitedShipTracker = useRef(false);

  useEffect(() => {
    const handleOxygenUpdate = (e: any) => {
      setOxygenStatus(e.detail);
    };
    window.addEventListener('oxygen-update', handleOxygenUpdate);
    return () => window.removeEventListener('oxygen-update', handleOxygenUpdate);
  }, []);

  useEffect(() => {
    if (showBackpack && showTutorial) {
      setShowTutorial(false);
    }
  }, [showBackpack, showTutorial]);

  // Intro Dialogue State
  const [introStep, setIntroStep] = useState(5);
  const introDialogues = [
    "Caramba... o que aconteceu?",
    "Que barulho foi esse? A nave parece ter sofrido um impacto massivo.",
    "Os sistemas principais estão offline. O motor de dobra pifou de vez.",
    "Onde eu estou? Os sensores externos estão avariados, não consigo ver nada lá fora.",
    "Preciso abrir a escotilha traseira e ver o que restou... espero que o ar seja respirável."
  ];

  useEffect(() => {
    if (introPhase !== 'typing') return;
    let i = 0;
    const text = "ANO: 2067";
    const interval = setInterval(() => {
      setIntroText(text.substring(0, i + 1));
      i++;
      if (i === text.length) {
        clearInterval(interval);
        setTimeout(() => setIntroPhase('fading'), 2000);
        setTimeout(() => {
          setIntroPhase('done');
          // Fade from black to ship interior
          setIsFadingBlack(true);
          setTimeout(() => {
            setIsFadingBlack(false);
            
            // Now player is inside the ship. Start interior blinking and dialogue.
            setIsBlinking(true);
            setTimeout(() => {
              setIsBlinking(false);
              setIntroStep(0); // This starts the interior dialogues "Caramba... o que aconteceu?"
              
              // After some time, also show Wawnk dialogue and tutorial just to keep original flow
              setTimeout(() => {
                setShowWawnkDialogue(true);
                setTimeout(() => {
                  setShowWawnkDialogue(false);
                  setShowTutorial(true);
                  setTimeout(() => setShowTutorial(false), 10000);
                }, 5000);
              }, 20000);
              
            }, 3000);
          }, 1000);
        }, 4000);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [introPhase]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (introPhase === 'video' && e.code === 'Escape') {
        setIntroPhase('typing');
        return;
      }
      if (introStep >= 0 && introStep < introDialogues.length) {
        if (e.code === 'Enter') {
          setIntroStep(prev => prev + 1);
        } else if (e.code === 'Escape') {
          setIntroStep(introDialogues.length); // Skip intro
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [introStep, introDialogues.length, introPhase]);

  useEffect(() => {
    const handleRadarUpdate = (e: any) => {
      const radarShip = document.getElementById('radar-ship');
      const radarArrow = document.getElementById('radar-player-arrow');
      if (radarShip && radarArrow) {
        const { yaw, playerPos } = e.detail;
        
        const maxRange = 100;
        
        // Calculate vector from player to ship
        const dx = -12 - playerPos.x;
        const dz = -12 - playerPos.z;
        
        const uiRadius = 45; 
        
        const uiPosX = 50 + (dx / maxRange) * uiRadius;
        const uiPosY = 50 + (dz / maxRange) * uiRadius;
        
        radarShip.style.left = `${uiPosX}%`;
        radarShip.style.top = `${uiPosY}%`;
        
        radarArrow.style.transform = `translate(-50%, -50%) rotate(${yaw - Math.PI}rad)`;
      }
    };
    window.addEventListener('radar-update', handleRadarUpdate);
    return () => window.removeEventListener('radar-update', handleRadarUpdate);
  }, []);

  useEffect(() => {
    const handleNotification = (e: any) => {
      setNotification(e.detail);
      setTimeout(() => setNotification(null), 3000);
    };
    const handleFade = () => {
      setIsFading(true);
      setTimeout(() => setIsFading(false), 350);
    };
    const handleCableStatus = (e: any) => {
      setCanConnectCable(e.detail.canConnect);
      setIsInsideShip(e.detail.isInsideShip);
      
      // Only trigger exit sequence flag if intro is done and player actually leaves
      if (!e.detail.isInsideShip && introPhase === 'done') {
        if (!hasExitedShipTracker.current) {
          hasExitedShipTracker.current = true;
          setHasExitedShip(true);
          setShowExitCutscene(true);
          
          // Force player to look at the crater (yaw = Math.PI)
          window.dispatchEvent(new CustomEvent('set-camera-angle', { detail: { yaw: Math.PI, pitch: 0 } }));
          
          setTimeout(() => {
            setShowExitDialogue(true);
            setTimeout(() => {
              setIsFadingBlack(true);
              setTimeout(() => {
                setShowExitCutscene(false);
                setShowExitDialogue(false);
                setIsFirstPerson(true);
                setIsFadingBlack(false);
                setShowPlanetName(true);
                setTimeout(() => setShowPlanetName(false), 5000);
                
                // Hawk yell sequence
                setTimeout(() => {
                  setShowHawkYell(true);
                  setTimeout(() => setShowHawkYell(false), 4000);
                }, 1000);
              }, 1000);
            }, 3500);
          }, 4500);
        }
      }
    };
    
    const handleCollectWeapon = () => {
      setBackpack(prev => {
        const newBackpack = [...prev];
        const emptySlot = newBackpack.findIndex(item => item === null);
        if (emptySlot !== -1) {
          newBackpack[emptySlot] = { 
            type: { 
              name: 'PLASMA BLASTER', 
              rarity: 'RARO', 
              value: 500, 
              isTool: true, 
              toolType: 'plasma', 
              color: '#f97316' 
            }, 
            count: 1, 
            color: '#f97316' 
          };
        }
        return newBackpack;
      });
      setNotification('Arma de Plasma coletada! Abra a mochila (TAB) para equipar.');
    };

    const handleCollectDrill = () => {
      setBackpack(prev => {
        const newBackpack = [...prev];
        const emptySlot = newBackpack.findIndex(item => item === null);
        if (emptySlot !== -1) {
          newBackpack[emptySlot] = { 
            type: { 
              name: 'BROCA DE MINERAÇÃO', 
              rarity: 'COMUM', 
              value: 0, 
              isTool: true, 
              toolType: 'drill', 
              color: '#06b6d4' 
            }, 
            count: 1, 
            color: '#06b6d4' 
          };
        }
        return newBackpack;
      });
      setNotification('Broca de Mineração coletada!');
    };

    const handleHawkLeft = () => {
      setShowTutorial(true);
      setTimeout(() => setShowTutorial(false), 10000);
    };
    
    window.addEventListener('show-notification', handleNotification);
    window.addEventListener('trigger-fade', handleFade);
    window.addEventListener('cable-status', handleCableStatus);
    window.addEventListener('collect-weapon', handleCollectWeapon);
    window.addEventListener('collect-drill', handleCollectDrill);
    window.addEventListener('hawk-left', handleHawkLeft);
    
    return () => {
      window.removeEventListener('show-notification', handleNotification);
      window.removeEventListener('trigger-fade', handleFade);
      window.removeEventListener('cable-status', handleCableStatus);
      window.removeEventListener('collect-weapon', handleCollectWeapon);
      window.removeEventListener('collect-drill', handleCollectDrill);
      window.removeEventListener('hawk-left', handleHawkLeft);
    };
  }, [introPhase]);

  const handleDragStart = (e: React.DragEvent, source: 'hotbar' | 'backpack', index: number, item: any) => {
    setDraggedItem({ source, index, item });
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleToolDrop = (e: React.DragEvent, toolType: 'drill' | 'plasma') => {
    e.preventDefault();
    if (!draggedItem) return;
    
    if (draggedItem.item?.type?.toolType === toolType) {
      if (toolType === 'drill') setIsDrillUnlocked(true);
      if (toolType === 'plasma') setIsPlasmaUnlocked(true);

      if (draggedItem.source === 'backpack') {
        setBackpack(prev => {
          const newB = [...prev];
          newB[draggedItem.index] = null;
          return newB;
        });
      } else {
        setInventory(prev => {
          const newI = [...prev];
          newI[draggedItem.index] = null;
          return newI;
        });
      }
      setSelectedSlot(toolType);
      setDraggedItem(null);
    }
  };

  const handleQuickEquip = (index: number, item: any) => {
    if (!item) return;

    // If it's a tool, try to unlock it first
    if (item.type?.isTool) {
      if (item.type.toolType === 'drill') {
        setIsDrillUnlocked(true);
        setSelectedSlot('drill');
        setBackpack(prev => {
          const newB = [...prev];
          newB[index] = null;
          return newB;
        });
        setSelectedBackpackItem(null);
        setNotification('Broca de Mineração Equipada!');
        return;
      }
      if (item.type.toolType === 'plasma') {
        setIsPlasmaUnlocked(true);
        setSelectedSlot('plasma');
        setBackpack(prev => {
          const newB = [...prev];
          newB[index] = null;
          return newB;
        });
        setSelectedBackpackItem(null);
        setNotification('Plasma Blaster Equipado!');
        return;
      }
    }

    // Otherwise, find first empty hotbar slot
    const emptyIdx = inventory.findIndex(slot => slot === null);
    if (emptyIdx !== -1) {
      setInventory(prev => {
        const newI = [...prev];
        newI[emptyIdx] = item;
        return newI;
      });
      setBackpack(prev => {
        const newB = [...prev];
        newB[index] = null;
        return newB;
      });
      setSelectedBackpackItem(null);
      setNotification(`${item.type.name} movido para a barra de atalhos.`);
    } else {
      setNotification('Barra de atalhos cheia!');
    }
  };

  const handleDrop = (e: React.DragEvent, targetSource: 'hotbar' | 'backpack', targetIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const { source, index, item } = draggedItem;

    if (source === targetSource && index === targetIndex) return;

    let sourceArray = source === 'hotbar' ? [...inventory] : [...backpack];
    let targetArray = targetSource === 'hotbar' ? [...inventory] : [...backpack];

    // If dragging to same array
    if (source === targetSource) {
      const temp = sourceArray[targetIndex];
      sourceArray[targetIndex] = item;
      sourceArray[index] = temp;
      if (source === 'hotbar') setInventory(sourceArray);
      else setBackpack(sourceArray);
    } else {
      // Dragging between arrays
      const temp = targetArray[targetIndex];
      targetArray[targetIndex] = item;
      sourceArray[index] = temp;
      
      if (source === 'hotbar') setInventory(sourceArray);
      else setBackpack(sourceArray);
      
      if (targetSource === 'hotbar') setInventory(targetArray);
      else setBackpack(targetArray);
    }
    
    setDraggedItem(null);
  };

  useEffect(() => {
    const handleCollect = (e: any) => {
      const mineralType = e.detail;
      
      setInventory(prevHotbar => {
        const newHotbar = [...prevHotbar];
        const existingIdx = newHotbar.findIndex(item => item && item.type.name === mineralType.name && item.count < 64);
        if (existingIdx !== -1) {
          newHotbar[existingIdx] = { ...newHotbar[existingIdx], count: newHotbar[existingIdx].count + 1 };
          return newHotbar;
        }
        const emptyIdx = newHotbar.findIndex(item => item === null);
        if (emptyIdx !== -1) {
          newHotbar[emptyIdx] = { type: mineralType, count: 1 };
          return newHotbar;
        }
        
        // If hotbar is full, try backpack
        setBackpack(prevBackpack => {
          const newBackpack = [...prevBackpack];
          const bExistingIdx = newBackpack.findIndex(item => item && item.type.name === mineralType.name && item.count < 64);
          if (bExistingIdx !== -1) {
            newBackpack[bExistingIdx] = { ...newBackpack[bExistingIdx], count: newBackpack[bExistingIdx].count + 1 };
            return newBackpack;
          }
          const bEmptyIdx = newBackpack.findIndex(item => item === null);
          if (bEmptyIdx !== -1) {
            newBackpack[bEmptyIdx] = { type: mineralType, count: 1 };
            return newBackpack;
          }
          return prevBackpack;
        });
        
        return prevHotbar;
      });
    };
    window.addEventListener('mineral-collected', handleCollect);
    return () => window.removeEventListener('mineral-collected', handleCollect);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (hasDrill) {
      setShowInstructions(true);
      const timer = setTimeout(() => {
        setShowInstructions(false);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [hasDrill]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.hotbar-container')) {
        setSelectedSlot(prev => typeof prev === 'number' ? null : prev);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'h') {
        setShowUI(prev => !prev);
      }
      if (e.key.toLowerCase() === 'v') {
        setIsFirstPerson(prev => !prev);
      }
      if (e.key.toLowerCase() === 'b' || e.key.toLowerCase() === 'i' || e.key === 'Tab') {
        e.preventDefault();
        setShowBackpack(prev => {
          if (!prev) {
            document.exitPointerLock();
          }
          setSelectedBackpackItem(null);
          return !prev;
        });
      }
      if (e.key.toLowerCase() === 'e' && showBackpack && selectedBackpackItem) {
        handleQuickEquip(selectedBackpackItem.index, selectedBackpackItem.item);
      }
      
      if (e.key === 'Escape') {
        document.exitPointerLock();
        setShowBackpack(false);
        setSelectedBackpackItem(null);
      }
      
      if (e.key === '1' && isDrillUnlocked) setSelectedSlot('drill');
      if (e.key === '2' && isPlasmaUnlocked) setSelectedSlot('plasma');
      const num = parseInt(e.key);
      if (num >= 3 && num <= 8) {
        setSelectedSlot(num - 3);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      const slots: (number | 'drill' | 'plasma')[] = [];
      if (isDrillUnlocked) slots.push('drill');
      if (isPlasmaUnlocked) slots.push('plasma');
      slots.push(0, 1, 2, 3, 4, 5);

      setSelectedSlot(prev => {
        const currentIdx = prev === null ? -1 : slots.indexOf(prev as any);
        const direction = e.deltaY > 0 ? 1 : -1;
        
        if (currentIdx === -1) {
          return direction > 0 ? slots[0] : slots[slots.length - 1];
        }

        let nextIdx = (currentIdx + direction) % slots.length;
        if (nextIdx < 0) nextIdx = slots.length - 1;
        
        const nextSlot = slots[nextIdx];
        if (typeof nextSlot === 'number' && !inventory[nextSlot]) {
          let searchIdx = nextIdx;
          for (let i = 0; i < slots.length; i++) {
            searchIdx = (searchIdx + direction) % slots.length;
            if (searchIdx < 0) searchIdx = slots.length - 1;
            const s = slots[searchIdx];
            if (s === 'drill' || s === 'plasma' || (typeof s === 'number' && inventory[s])) {
              return s;
            }
          }
          return null;
        }
        return nextSlot;
      });
    };
    
    // Prevent context menu on right click for aiming
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [inventory, isDrillUnlocked, isPlasmaUnlocked, showBackpack, selectedBackpackItem]);

  return (
    <div className="w-full h-screen bg-slate-950 relative font-mono">
      {/* Low Oxygen Pulse Effect */}
      {oxygenStatus.level < 30 && !oxygenStatus.isConnected && !isInsideShip && (
        <div className="absolute inset-0 z-[100] pointer-events-none">
          <div className="absolute inset-0 bg-red-600/10 animate-[pulse_2s_ease-in-out_infinite]"></div>
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(220,38,38,0.3)] animate-[pulse_2s_ease-in-out_infinite]"></div>
        </div>
      )}

      {/* Start Button Overlay */}
      {introPhase === 'start' && (
        <div 
          className="absolute inset-0 z-[300] bg-black flex items-center justify-center cursor-pointer" 
          onClick={() => setIntroPhase('video')}
        >
          <div className="text-cyan-400 font-mono text-xl animate-pulse tracking-[0.3em] border border-cyan-500/50 px-8 py-4 rounded bg-cyan-900/20 hover:bg-cyan-900/40 transition-colors">
            INICIAR SISTEMA
          </div>
        </div>
      )}

      {/* Intro Cinematic */}
      {introPhase === 'video' && (
        <div className="absolute inset-0 z-[250] bg-black flex items-center justify-center">
          <video 
            src="/intro_video.mp4" 
            autoPlay 
            playsInline
            onEnded={() => setIntroPhase('typing')}
            className="w-full h-full object-cover"
          />
          <button 
            onClick={() => setIntroPhase('typing')}
            className="absolute bottom-8 right-8 z-[260] text-white/50 hover:text-white font-mono text-xs tracking-widest border border-white/20 px-3 py-1 rounded"
          >
            PULAR VÍDEO (ESC)
          </button>
        </div>
      )}

      {(introPhase === 'typing' || introPhase === 'fading') && (
        <div className={`absolute inset-0 z-[200] flex flex-col items-center justify-center transition-opacity duration-[2000ms] ${introPhase === 'fading' ? 'opacity-0' : 'opacity-100'} bg-black`}>
          <div className="text-white font-mono text-6xl md:text-8xl tracking-[0.5em] ml-[0.5em] relative">
            <span className="relative z-10 animate-glitch">{introText}</span>
            {introPhase === 'typing' && (
              <div className="absolute inset-0 text-cyan-500/30 blur-sm animate-pulse -z-10 translate-x-1 translate-y-1">{introText}</div>
            )}
          </div>
          <div className="flex gap-4 mt-12">
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" style={{ animationDelay: '0ms' }}></div>
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" style={{ animationDelay: '200ms' }}></div>
            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-ping" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      )}

      {/* Exit Cutscene Dialogue Bubble */}
      {showExitDialogue && (
        <div className="absolute top-[30%] left-[50%] -translate-x-1/2 pointer-events-none z-[160]">
          <div className="bg-slate-900/90 text-cyan-400 border border-cyan-500/50 px-8 py-4 rounded-2xl relative shadow-[0_0_40px_rgba(6,182,212,0.4)] animate-in zoom-in duration-500 max-w-sm text-center">
            <p className="text-xl font-bold italic tracking-tight">Oh merda...<br/><span className="text-lg font-medium text-white">olha o tamanho desse buraco!</span></p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-cyan-500/50"></div>
          </div>
        </div>
      )}

      {/* Intro Character Dialogue */}
      {introPhase === 'done' && introStep >= 0 && introStep < introDialogues.length && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[160] w-full max-w-2xl px-4 pointer-events-none">
          <div className="bg-slate-900/90 border-l-4 border-l-cyan-500 border-t border-r border-b border-cyan-500/30 p-6 shadow-[0_0_20px_rgba(6,182,212,0.3)] animate-in fade-in slide-in-from-bottom-4 duration-300 backdrop-blur-sm">
            <p className="text-cyan-400 font-black mb-2 uppercase tracking-[0.2em] text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              MAICON
            </p>
            <p className="text-white text-lg font-mono italic">"{introDialogues[introStep]}"</p>
            <div className="mt-4 flex justify-end">
              <span className="text-cyan-500 text-[10px] animate-pulse font-mono uppercase font-bold tracking-widest border border-cyan-500/50 px-2 py-0.5 rounded">PRESS [ENTER]</span>
            </div>
          </div>
        </div>
      )}

      {introPhase === 'done' && (
        <div className={`absolute top-4 left-4 z-10 text-cyan-400 bg-slate-900/80 border border-cyan-800 p-4 rounded-lg pointer-events-none shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-opacity duration-1000 ${showInstructions ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-xl font-bold mb-2 tracking-wider">A.R.A. PROTOCOL</h1>
            <p className="text-sm text-slate-300">Click screen to lock camera</p>
            <p className="text-sm text-slate-300">Mouse to look around</p>
            <p className="text-sm text-slate-300">WASD / Arrows to move</p>
            <p className="text-sm text-slate-300">Space to jump</p>
            <p className="text-sm text-yellow-400 mt-2">Press 'V' to toggle 1st/3rd Person</p>
            <p className="text-sm text-yellow-400">Press 'H' to toggle labels</p>
            {hasDrill && (
              <div className="mt-4 border-t border-cyan-800/50 pt-2">
                <p className="text-sm text-yellow-400 font-bold">MINING LASER ACQUIRED</p>
                <p className="text-sm text-slate-300">Hold Right Click to Aim</p>
                <p className="text-sm text-slate-300">Left Click to Fire</p>
              </div>
            )}
          </div>
      )}

      {/* Crosshair & Cinematic Scope */}
      {!showPlanetCutscene && (
        <>
          {/* Scope overlay when aiming */}
          {isAiming ? (
            selectedSlot === 'drill' ? (
              <div className="absolute inset-0 pointer-events-none z-50">
                <div className="absolute inset-0" style={{
                  background: 'radial-gradient(circle at center, transparent 18%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.97) 50%)',
                }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vmin] h-[40vmin] border-[3px] border-dashed border-cyan-400/50 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vmin] h-[30vmin] border-2 border-cyan-400/30 rounded-full flex items-center justify-center">
                  <div className="w-full h-[1px] bg-cyan-400/30"></div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vmin] h-[30vmin] border-2 border-cyan-400/30 rounded-full flex items-center justify-center rotate-90">
                  <div className="w-[1px] h-full bg-cyan-400/30"></div>
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-[2px] border-cyan-400 rotate-45 shadow-[0_0_10px_#22d3ee]"></div>
                
                <div className="absolute top-[40%] left-[calc(50%+18vmin)] text-cyan-400 font-mono text-[10px] tracking-widest bg-cyan-950/60 p-2 border border-cyan-500/30 backdrop-blur-sm rounded">
                  <div className="border-b border-cyan-500/30 mb-1 pb-1 font-bold">MINERAL ANALYST</div>
                  <div>DEPTH: ~3.2m</div>
                  <div>DENSITY: 8.4 g/cm³</div>
                  <div className="animate-pulse text-yellow-400 mt-2 font-bold">SCANNING TARGET...</div>
                </div>
                <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 text-cyan-400/50 font-mono text-[10px] tracking-[0.3em]">
                  MINING MODE
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 pointer-events-none z-50">
                {/* Dark vignette around scope */}
              <div className="absolute inset-0" style={{
                background: 'radial-gradient(circle at center, transparent 18%, rgba(0,0,0,0.85) 35%, rgba(0,0,0,0.97) 50%)',
              }}></div>
              
              {/* Scope ring outer */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[36vmin] h-[36vmin] rounded-full border-2 border-cyan-500/30"></div>
              {/* Scope ring inner */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28vmin] h-[28vmin] rounded-full border border-cyan-500/15"></div>
              {/* Thin inner ring */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[8vmin] h-[8vmin] rounded-full border border-cyan-400/20"></div>
              
              {/* Crosshair lines */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[0.5px] w-[30vmin] h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"></div>
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-[0.5px] w-[1px] h-[30vmin] bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent"></div>
              
              {/* Center dot */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-red-500 rounded-full shadow-[0_0_6px_#ef4444,0_0_12px_#ef4444]"></div>
              
              {/* Mil-dot markers on horizontal */}
              {[-10, -6, -3, 3, 6, 10].map((offset) => (
                <div key={`hdot-${offset}`} className="absolute top-1/2 left-1/2 -translate-y-1/2" style={{ transform: `translate(${offset}vmin, -50%)` }}>
                  <div className="w-[2px] h-[6px] bg-cyan-400/40"></div>
                </div>
              ))}
              {/* Mil-dot markers on vertical */}
              {[-10, -6, -3, 3, 6, 10].map((offset) => (
                <div key={`vdot-${offset}`} className="absolute top-1/2 left-1/2 -translate-x-1/2" style={{ transform: `translate(-50%, ${offset}vmin)` }}>
                  <div className="w-[6px] h-[2px] bg-cyan-400/40"></div>
                </div>
              ))}
              
              {/* Range finder data */}
              <div className="absolute top-1/2 left-[calc(50%+20vmin)] -translate-y-1/2 text-cyan-400/60 font-mono text-[9px] tracking-wider">
                <div>RNG: 42.7m</div>
                <div>WND: 0.2</div>
                <div>ELV: +0.1°</div>
              </div>
              
              {/* Zoom indicator */}
              <div className="absolute bottom-[30%] left-1/2 -translate-x-1/2 text-cyan-400/50 font-mono text-[10px] tracking-[0.3em]">
                ×2.5 ZOOM
              </div>
            </div>
            )
          ) : (
            /* Normal crosshair when not aiming */
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
              <div className="w-1.5 h-1.5 rounded-full bg-white/80"></div>
            </div>
          )}
        </>
      )}

      {/* Dynamic Radar - shows when player is outside the ship */}
      {!isInsideShip && hasExitedShip && !showPlanetCutscene && introPhase === 'done' && (
        <div className="absolute bottom-24 right-6 z-40 pointer-events-none">
          <div className="w-36 h-36 rounded-full border border-cyan-500/40 bg-slate-950/70 backdrop-blur-sm relative overflow-hidden shadow-[0_0_20px_rgba(6,182,212,0.15)]">
            {/* Radar grid lines */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-[1px] bg-cyan-500/15"></div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[1px] h-full bg-cyan-500/15"></div>
            </div>
            {/* Range rings */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[33%] h-[33%] rounded-full border border-cyan-500/10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[66%] h-[66%] rounded-full border border-cyan-500/10"></div>
            
            {/* Radar sweep line */}
            <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left animate-[spin_4s_linear_infinite]" style={{
              background: 'linear-gradient(90deg, rgba(6,182,212,0.6), transparent)',
            }}></div>
            
            {/* Sweep trail glow */}
            <div className="absolute top-1/2 left-1/2 w-1/2 h-[2px] origin-left animate-[spin_4s_linear_infinite]" style={{
              background: 'linear-gradient(90deg, rgba(6,182,212,0.15), transparent)',
              animationDelay: '-0.5s',
            }}></div>
            
            {/* Player dot (always center) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div id="radar-player-arrow" className="w-4 h-4 text-cyan-400 flex items-center justify-center transition-transform duration-75 origin-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_5px_#22d3ee]">
                  <path d="M12 2L4 20L12 17L20 20L12 2Z" />
                </svg>
              </div>
            </div>
            
            {/* Ship indicator - crashed ship is at (-12, 0, -12) relative to world, player spawns at (0, 1, 25) */}
            {/* Ship direction relative to player: northwest, ~37m away */}
            <div id="radar-ship" className="absolute transition-all duration-100 ease-linear z-0" style={{
              top: '25%',
              left: '35%',
              transform: 'translate(-50%, -50%)',
            }}>
              <div className="w-3 h-1.5 bg-orange-500/80 rounded-sm shadow-[0_0_8px_rgba(249,115,22,0.5)] animate-pulse" style={{ animationDuration: '3s' }}></div>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono text-[7px] text-orange-400/70 tracking-wider">
                NAVE
              </div>
            </div>
            
            {/* Cardinal directions */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[7px] text-cyan-500/50 font-mono font-bold">N</div>
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] text-cyan-500/50 font-mono font-bold">S</div>
            <div className="absolute top-1/2 left-1 -translate-y-1/2 text-[7px] text-cyan-500/50 font-mono font-bold">O</div>
            <div className="absolute top-1/2 right-1 -translate-y-1/2 text-[7px] text-cyan-500/50 font-mono font-bold">L</div>
            
            {/* Edge glow */}
            <div className="absolute inset-0 rounded-full shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]"></div>
          </div>
          {/* Label */}
          <div className="text-center mt-1 font-mono text-[8px] text-cyan-500/50 tracking-[0.3em]">RADAR</div>
        </div>
      )}

      {/* Hawk Yell Overlay */}
      {showHawkYell && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-[250] pointer-events-none flex flex-col items-center animate-in fade-in slide-in-from-bottom-5 duration-1000">
          <div className="text-white font-mono text-xl tracking-[0.4em] text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] opacity-90">
            "EI! AQUI! VENHA RÁPIDO!"
          </div>
          <div className="mt-2 text-cyan-400 font-mono text-[10px] uppercase tracking-[0.5em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(239,68,68,1)]"></span>
            TRANS. INCOMING // CPL. HAWK
          </div>
        </div>
      )}

      {/* Target Info UI */}
      {targetInfo && (
        <div className="absolute top-1/2 left-1/2 ml-8 -translate-y-1/2 pointer-events-none z-50 flex flex-col gap-1">
          <div className="bg-slate-900/80 border border-cyan-800/50 p-3 rounded backdrop-blur-sm min-w-[150px]">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold text-sm">{targetInfo.name}</span>
                <span className="text-yellow-400 text-xs">${targetInfo.value}</span>
              </div>
              <span className="text-[8px] font-black tracking-widest text-white/40 px-1 border border-white/10 rounded">{targetInfo.rarity}</span>
            </div>
            {targetInfo.health !== undefined && (
              <>
                <div className="text-[10px] text-slate-400 mb-1">RESISTANCE: {Math.ceil(targetInfo.health)} / {targetInfo.maxHealth}</div>
                <div className="w-full h-1.5 bg-slate-800 rounded overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-100 shadow-[0_0_8px_#22d3ee]" 
                    style={{ width: `${(targetInfo.health / targetInfo.maxHealth) * 100}%` }}
                  ></div>
                </div>
              </>
            )}
            {targetInfo.health === undefined && (
              <div className="text-[10px] text-cyan-400/60 italic">DROPPED ITEM</div>
            )}
          </div>
        </div>
      )}

      {/* Hotbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-50 pointer-events-auto hotbar-container p-1.5 bg-slate-950/40 backdrop-blur-md rounded-xl border border-white/5 shadow-2xl">
        {/* Drill Slot */}
        <div className="relative group">
          {isDrillUnlocked && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950/90 text-cyan-400 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none border border-cyan-500/30 backdrop-blur-sm tracking-tighter uppercase font-bold">
              BROCA DE MINERAÇÃO
            </div>
          )}
          <div
            onClick={() => isDrillUnlocked && setSelectedSlot('drill')}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleToolDrop(e, 'drill')}
            className={`w-11 h-11 bg-slate-900/40 backdrop-blur-sm border rounded-lg flex items-center justify-center transition-all duration-300 relative group/slot ${selectedSlot === 'drill' ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105' : 'border-white/10 hover:border-white/30 hover:bg-white/5'} ${!isDrillUnlocked ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          >
            {isDrillUnlocked ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${selectedSlot === 'drill' ? 'text-cyan-400' : 'text-slate-400 group-hover/slot:text-cyan-300'} transition-colors drop-shadow-[0_0_5px_currentColor]`}>
                <path d="M14 9l3 3"/>
                <path d="M18 13l3-3-3-3-3 3"/>
                <path d="M7 14l-4 4 2 2 4-4"/>
                <path d="M14 14v6h-4v-6"/>
                <path d="M10 14H6v-4h4"/>
              </svg>
            ) : (
              <div className="text-[8px] text-slate-500 font-bold">VAZIO</div>
            )}
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-slate-950/80 border border-white/10 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold">1</div>
          </div>
        </div>

        {/* Plasma Slot */}
        <div className="relative group">
          {isPlasmaUnlocked && (
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950/90 text-orange-400 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none border border-orange-500/30 backdrop-blur-sm tracking-tighter uppercase font-bold">
              PLASMA BLASTER
            </div>
          )}
          <div
            onClick={() => isPlasmaUnlocked && setSelectedSlot('plasma')}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleToolDrop(e, 'plasma')}
            className={`w-11 h-11 bg-slate-900/40 backdrop-blur-sm border rounded-lg flex items-center justify-center transition-all duration-300 relative group/slot ${selectedSlot === 'plasma' ? 'border-orange-400 bg-orange-400/10 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-105' : 'border-white/10 hover:border-white/30 hover:bg-white/5'} ${!isPlasmaUnlocked ? 'opacity-50 cursor-default' : 'cursor-pointer'}`}
          >
            {isPlasmaUnlocked ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${selectedSlot === 'plasma' ? 'text-orange-400' : 'text-slate-400 group-hover/slot:text-orange-300'} transition-colors drop-shadow-[0_0_5px_currentColor]`}>
                <path d="M5 12h14"/>
                <path d="M12 5v14"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            ) : (
              <div className="text-[8px] text-slate-500 font-bold">VAZIO</div>
            )}
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-slate-950/80 border border-white/10 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold">2</div>
          </div>
        </div>

        {/* Inventory Slots */}
        {inventory.map((item, i) => (
          <div key={i} className="relative group">
            {item && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950/90 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none border border-white/10 backdrop-blur-sm tracking-tighter uppercase font-bold" style={{ color: item.type.color }}>
                {item.type.name}
              </div>
            )}
            <div 
              onClick={() => item && setSelectedSlot(i)}
              draggable={!!item}
              onDragStart={(e) => handleDragStart(e, 'hotbar', i, item)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'hotbar', i)}
              className={`w-11 h-11 bg-slate-900/40 backdrop-blur-sm border rounded-lg flex items-center justify-center transition-all duration-300 relative group/slot ${item ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} ${selectedSlot === i ? 'border-cyan-400 bg-cyan-400/10 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
            >
              {item && (
                <>
                  {item.type.isTool ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: item.type.color }} className="drop-shadow-[0_0_5px_currentColor]">
                      {item.type.toolType === 'drill' ? (
                        <>
                          <path d="M14 9l3 3"/>
                          <path d="M18 13l3-3-3-3-3 3"/>
                          <path d="M7 14l-4 4 2 2 4-4"/>
                          <path d="M14 14v6h-4v-6"/>
                          <path d="M10 14H6v-4h4"/>
                        </>
                      ) : (
                        <>
                          <path d="M5 12h14"/>
                          <path d="M12 5v14"/>
                          <circle cx="12" cy="12" r="3"/>
                        </>
                      )}
                    </svg>
                  ) : (
                    <div 
                      className="w-6 h-6 rounded-sm shadow-[0_0_8px_currentColor]"
                      style={{ backgroundColor: item.type.color, color: item.type.color }}
                    />
                  )}
                  {!item.type.isTool && <div className="absolute bottom-0.5 right-1 text-[9px] text-white font-black drop-shadow-md">{item.count}</div>}
                </>
              )}
              <div className="absolute -top-1 -left-1 w-4 h-4 bg-slate-950/80 border border-white/10 rounded flex items-center justify-center text-[8px] text-slate-400 font-bold">{i + 3}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Backpack UI */}
      {showBackpack && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-auto backdrop-blur-md bg-slate-950/60 transition-all duration-300">
          <div className="bg-slate-900/95 border border-cyan-800/50 rounded-xl p-5 shadow-[0_0_40px_rgba(0,0,0,0.5)] max-w-xl w-full mx-4 scale-90">
            <div className="flex justify-between items-center mb-4 border-b border-cyan-800/30 pb-2">
              <h2 className="text-cyan-400 font-bold text-base tracking-[0.2em]">INVENTORY</h2>
              <button onClick={() => { setShowBackpack(false); setSelectedBackpackItem(null); }} className="text-slate-500 hover:text-white transition-colors cursor-pointer">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left side: Equipment */}
              <div className="space-y-3">
                <h3 className="text-slate-500 text-[9px] font-black tracking-widest uppercase">Equipment Slots</h3>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className={`bg-slate-950/50 border rounded-lg p-2.5 flex items-center gap-2.5 transition-all ${selectedSlot === 'drill' ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-800/50'}`}>
                    <div className="w-9 h-9 bg-cyan-900/20 border border-cyan-500/20 rounded flex items-center justify-center text-cyan-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9l3 3"/><path d="M18 13l3-3-3-3-3 3"/><path d="M7 14l-4 4 2 2 4-4"/><path d="M14 14v6h-4v-6"/><path d="M10 14H6v-4h4"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-cyan-400 font-bold text-[11px]">Mining Laser</div>
                      <div className="text-slate-500 text-[8px]">Hotbar [1]</div>
                    </div>
                  </div>
                  <div className={`bg-slate-950/50 border rounded-lg p-2.5 flex items-center gap-2.5 transition-all ${selectedSlot === 'plasma' ? 'border-orange-500 bg-orange-950/20' : 'border-slate-800/50'}`}>
                    <div className="w-9 h-9 bg-orange-900/20 border border-orange-500/20 rounded flex items-center justify-center text-orange-400">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="M12 5v14"/><circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-orange-400 font-bold text-[11px]">Plasma Blaster</div>
                      <div className="text-slate-500 text-[8px]">Hotbar [2]</div>
                    </div>
                  </div>
                </div>

                <h3 className="text-slate-500 text-[9px] font-black tracking-widest uppercase mt-3">Hotbar</h3>
                <div className="grid grid-cols-6 gap-1">
                  {inventory.map((item, i) => (
                    <div 
                      key={`hotbar-ui-${i}`}
                      draggable={!!item}
                      onDragStart={(e) => handleDragStart(e, 'hotbar', i, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'hotbar', i)}
                      className={`w-9 h-9 bg-slate-950/80 border rounded flex items-center justify-center relative transition-all ${item ? 'border-cyan-800/30 cursor-grab active:cursor-grabbing hover:bg-slate-800/50' : 'border-slate-800/30 hover:bg-slate-900/50'} ${selectedSlot === i ? 'border-cyan-400 ring-1 ring-cyan-400/30' : ''}`}
                    >
                      {item ? (
                        <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: item.type.color }} />
                      ) : (
                        <div className="text-[6px] text-slate-800 font-bold uppercase">Vazio</div>
                      )}
                      <div className="absolute -top-1 -left-1 w-3 h-3 bg-slate-900 border border-slate-700 rounded flex items-center justify-center text-[6px] text-slate-500 font-bold">{i + 3}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right side: Backpack */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-500 text-[9px] font-black tracking-widest uppercase">Backpack</h3>
                  {selectedBackpackItem && (
                    <div className="text-cyan-400 text-[8px] font-bold animate-pulse">APERTE [E] PARA EQUIPAR</div>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {backpack.map((item, i) => (
                    <div 
                      key={`backpack-${i}`}
                      draggable={!!item}
                      onDragStart={(e) => handleDragStart(e, 'backpack', i, item)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, 'backpack', i)}
                      onClick={() => item && setSelectedBackpackItem({ index: i, item })}
                      className={`w-9 h-9 bg-slate-950/80 border rounded flex items-center justify-center relative transition-all ${item ? 'border-cyan-800/30 cursor-grab active:cursor-grabbing hover:bg-slate-800/50' : 'border-slate-800/30 hover:bg-slate-900/50'} ${selectedBackpackItem?.index === i ? 'border-cyan-400 ring-1 ring-cyan-400/30 bg-cyan-900/10' : ''}`}
                    >
                      {item ? (
                        <>
                          {item.type.isTool ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: item.type.color }}>
                              {item.type.toolType === 'drill' ? (
                                <>
                                  <path d="M14 9l3 3"/><path d="M18 13l3-3-3-3-3 3"/><path d="M7 14l-4 4 2 2 4-4"/><path d="M14 14v6h-4v-6"/><path d="M10 14H6v-4h4"/>
                                </>
                              ) : (
                                <>
                                  <path d="M5 12h14"/><path d="M12 5v14"/><circle cx="12" cy="12" r="3"/>
                                </>
                              )}
                            </svg>
                          ) : (
                            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: item.type.color }} />
                          )}
                          {!item.type.isTool && <div className="absolute bottom-0.5 right-0.5 text-[7px] text-white font-black drop-shadow-md">{item.count}</div>}
                          {selectedBackpackItem?.index === i && (
                            <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-cyan-500 text-white rounded-full flex items-center justify-center text-[7px] font-black shadow-lg border border-white/20">E</div>
                          )}
                        </>
                      ) : (
                        <div className="text-[6px] text-slate-800 font-bold uppercase">Vazio</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-cyan-900/80 border border-cyan-400 text-cyan-100 px-6 py-3 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.5)] z-50 animate-bounce">
          <p className="font-bold tracking-wider text-sm">{notification}</p>
        </div>
      )}

      {/* Oxygen UI */}
      {!showPlanetCutscene && (
        <div id="oxygen-container" className={`absolute bottom-24 left-6 w-48 bg-slate-900/60 border ${oxygenStatus.level < 30 && !oxygenStatus.isConnected ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-slate-700/50'} p-2 rounded-lg backdrop-blur-md z-50 transition-all duration-300`}>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-[10px] font-bold tracking-wider ${oxygenStatus.level < 30 && !oxygenStatus.isConnected ? 'text-red-400 animate-pulse' : 'text-slate-300'}`}>
              {oxygenStatus.level < 30 && !oxygenStatus.isConnected ? 'LOW OXYGEN!' : 'OXYGEN LEVEL'}
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={oxygenStatus.level < 30 && !oxygenStatus.isConnected ? 'text-red-500' : 'text-cyan-400'}>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800 mb-2">
            <div id="oxygen-fill" className="h-full bg-cyan-400 transition-all duration-75 shadow-[0_0_8px_currentColor]" style={{ width: '100%' }}></div>
          </div>
          {oxygenStatus.level < 30 && !oxygenStatus.isConnected && !isInsideShip && (
            <div className="text-[9px] text-red-400 font-black text-center mb-2 animate-pulse uppercase tracking-tighter">
              Ative o cabo da nave!
            </div>
          )}
          {canConnectCable && (
            <button 
              id="cable-btn"
              onClick={() => window.dispatchEvent(new CustomEvent('toggle-cable'))}
              className="w-full py-1 bg-cyan-900/50 hover:bg-cyan-800/80 border border-cyan-700/50 rounded text-[10px] text-cyan-100 font-bold tracking-wider transition-colors pointer-events-auto cursor-pointer"
            >
              CONNECT CABLE (C)
            </button>
          )}
        </div>
      )}

      {/* Small blinking reminder */}
      {isInsideShip && introStep >= introDialogues.length && !showPlanetCutscene && (
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-full border border-orange-500/30 animate-[pulse_3s_ease-in-out_infinite] z-50 pointer-events-none">
          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
          <span className="text-orange-400 text-[10px] font-bold tracking-wider">LEMBRETE: CABO DE O2 (C)</span>
        </div>
      )}

      {/* Fade Transition Overlay */}
      <div className={`absolute inset-0 bg-black z-[200] pointer-events-none transition-opacity duration-300 ${isFading ? 'opacity-100' : 'opacity-0'}`} />

      {/* Selected Item Info */}
      {typeof selectedSlot === 'number' && inventory[selectedSlot] && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-cyan-800 p-4 rounded-lg z-50 min-w-[200px] text-center backdrop-blur-sm pointer-events-auto">
          <h3 className="text-cyan-400 font-bold text-lg mb-1">{inventory[selectedSlot].type.name}</h3>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">RARITY:</span>
            <span style={{ color: inventory[selectedSlot].type.rarity === 'LEGENDARY' ? '#f59e0b' : inventory[selectedSlot].type.rarity === 'RARE' ? '#3b82f6' : '#9ca3af' }} className="font-bold">
              {inventory[selectedSlot].type.rarity}
            </span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">VALUE:</span>
            <span className="text-yellow-400 font-bold">${inventory[selectedSlot].type.value}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">QUANTITY:</span>
            <span className="text-white font-bold">{inventory[selectedSlot].count}</span>
          </div>
          <button 
            onClick={() => setSelectedSlot(null)}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/80 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-500 cursor-pointer"
          >
            X
          </button>
        </div>
      )}



      {/* Blinking Effect Overlay */}
      {isBlinking && (
        <div className="absolute inset-0 z-[150] pointer-events-none" style={{ 
          backgroundColor: 'rgba(0,0,0,0.9)',
          animation: 'blink 3s ease-in-out forwards'
        }} />
      )}

      {/* Tutorial Message */}
      {showTutorial && (
        <div className="absolute top-32 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-cyan-500/50 p-4 rounded-lg text-center backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.3)] z-50 animate-pulse">
          <p className="text-cyan-100 text-sm font-medium">
            Abra a mochila (<span className="text-cyan-400 font-bold">TAB</span>) e arraste a Broca para a barra de atalhos.
          </p>
        </div>
      )}

      {/* Black Fade Overlay */}
      {isFadingBlack && (
        <div className="fixed inset-0 bg-black z-[300] transition-opacity duration-1000 opacity-100" />
      )}

      {introPhase !== 'start' && (
      <Canvas dpr={[1, 1.5]} gl={{ alpha: false, antialias: true, powerPreference: "high-performance" }} shadows={{ type: THREE.PCFShadowMap }} camera={{ position: [0, 5, 10], fov: 50 }}>
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 15, 120]} />
        <Environment preset="night" />
        
        <World />
        
        {showPlanetCutscene && (
          <PlanetCutscene targetPosition={new THREE.Vector3(0, 2.6, 30)} />
        )}
        
        <FireEffect />
        <CrashedShip playerRef={playerRef} />
        <ShipInterior playerRef={playerRef} introStep={introStep} introDialoguesLength={introDialogues.length} introPhase={introPhase} />
        
        {showExitCutscene && (
          <FrontCutscene playerRef={playerRef} />
        )}
        
        {/* Pass ref to Player so NPCs can track it */}
        <Player 
          key={initialCableState ? 'inside' : 'outside'}
          ref={playerRef} 
          position={playerSpawnPos}
          hasDrill={inventory.some(item => item?.type?.toolType === 'drill') || backpack.some(item => item?.type?.toolType === 'drill') || isDrillUnlocked} 
          hasPlasma={inventory.some(item => item?.type?.toolType === 'plasma') || backpack.some(item => item?.type?.toolType === 'plasma') || isPlasmaUnlocked}
          isDrillEquipped={selectedSlot === 'drill' || (typeof selectedSlot === 'number' && inventory[selectedSlot]?.type?.toolType === 'drill')}
          isPlasmaEquipped={selectedSlot === 'plasma' || (typeof selectedSlot === 'number' && inventory[selectedSlot]?.type?.toolType === 'plasma')}
          isAiming={isAiming} 
          isFirstPerson={isFirstPerson && !showPlanetCutscene && !showExitCutscene}
          plasmaAmmo={plasmaAmmo}
          setPlasmaAmmo={setPlasmaAmmo}
          isReloading={isReloading}
          setIsReloading={setIsReloading}
          isFiring={isFiring}
          setIsFiring={setIsFiring}
          setIsAiming={setIsAiming} 
          setTargetInfo={setTargetInfo}
          isCutsceneActive={showPlanetCutscene || showExitCutscene}
          initialCableState={initialCableState}
          isInsideShip={isInsideShip}
        />
        
        <MineralCluster onTarget={setTargetInfo} playerRef={playerRef} isDrillEquipped={selectedSlot === 'drill'} />
        
        {/* Other characters based on the videos */}
        {/* Soldier (Muted Red/Burgundy) */}
        <NPC name="CPL. HAWK" role="ASSAULT" color="#451a1a" startPosition={[8, 0, -8]} playerRef={playerRef} showUI={showUI} isInjured={true} />

        {/* Effect composer removed for better optimization */}
      </Canvas>
      )}
      <Loader 
        containerStyles={{ background: 'rgba(5, 10, 20, 0.9)', zIndex: 350 }} 
        innerStyles={{ width: '300px' }}
        barStyles={{ background: '#06b6d4', height: '10px' }}
        dataStyles={{ color: '#06b6d4', fontSize: '1rem', fontFamily: 'monospace', letterSpacing: '0.2em' }}
      />
    </div>
  );
}
