import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, CatmullRomCurve3 } from 'three';

export function PlanetCutscene({ targetPosition }: { targetPosition?: Vector3 }) {
  const { camera } = useThree();
  const startTime = useRef(Date.now());
  const duration = 18000; // 18 seconds for a smooth cinematic feel

  const shipPos = new Vector3(-12, 0, -12);

  const cameraPath = useRef(new CatmullRomCurve3([
    // Phase 1: High orbital establishing shot - way above everything
    new Vector3(350, 400, -300),
    // Fly forward high above the mountain peaks (peaks max ~280)
    new Vector3(200, 350, -200),
    // Still above mountains - sweeping over the ring from outside
    new Vector3(100, 320, -120),
    // Cross the mountain ring from ABOVE (safe altitude > 300)
    new Vector3(40, 300, -60),
    // Now INSIDE the ring, begin descent - mountains are behind us at radius 100+
    new Vector3(10, 120, -40),
    // Descend towards the crash site area - well inside the ring (radius < 50)
    new Vector3(2, 40, -25),
    // Pass over the valley, approaching the ship
    new Vector3(-4, 18, -18),
    // Swing around the side of the crashed ship
    new Vector3(-18, 8, -5),
    // Final approach - come to the front cockpit window of the crashed ship
    new Vector3(-14, 3.5, -5),
    // Settle looking directly at the crashed ship hull
    new Vector3(-11.5, 2.8, -8),
  ], false, 'catmullrom', 0.25));

  // Look-at targets along the path - smooth progression
  const lookPath = useRef(new CatmullRomCurve3([
    // Look at the planet surface/center
    new Vector3(0, 0, 0),
    // Look at the mountain ring panorama
    new Vector3(0, 100, 0),
    // Start looking towards the center of the valley
    new Vector3(0, 50, 0),
    // Look down into the valley towards the ship
    new Vector3(-10, 10, -10),
    // Look at crash site as we descend
    new Vector3(-12, 5, -12),
    // Focus on the crash site
    new Vector3(-12, 3, -12),
    // Keeping focus on ship as we pass
    new Vector3(-12, 2, -12),
    // Transition to looking at the cockpit
    new Vector3(-11, 2.5, -11),
    // Lock on the hull details
    new Vector3(-12, 2.5, -12),
    // Final lock
    new Vector3(-12, 2.5, -12),
  ], false, 'catmullrom', 0.25));

  useFrame(() => {
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // 4-phase easing for cinematic pacing
    let easedProgress;
    if (progress < 0.12) {
      // Phase 1: Majestic slow orbital pan (0-12%)
      const p = progress / 0.12;
      easedProgress = p * p * 0.12;
    } else if (progress < 0.45) {
      // Phase 2: Fast sweep over mountains - the exciting descent (12-45%)
      const p = (progress - 0.12) / 0.33;
      const smoothP = p * p * (3 - 2 * p);
      easedProgress = 0.12 + smoothP * 0.33;
    } else if (progress < 0.75) {
      // Phase 3: Slow flyby of crashed ship (45-75%)
      const p = (progress - 0.45) / 0.30;
      const smoothP = p * p * (3 - 2 * p);
      easedProgress = 0.45 + smoothP * 0.30;
    } else {
      // Phase 4: Very slow dramatic settle in front of character (75-100%)
      const p = (progress - 0.75) / 0.25;
      const easeOut = 1 - Math.pow(1 - p, 5);
      easedProgress = 0.75 + easeOut * 0.25;
    }

    // Get position and look target from splines
    const pos = cameraPath.current.getPoint(easedProgress);
    const lookTarget = lookPath.current.getPoint(easedProgress);

    camera.position.copy(pos);

    // Subtle camera shake only during fast descent phase (12%-45%)
    if (progress > 0.15 && progress < 0.45) {
      const intensity = 0.2;
      camera.position.x += Math.sin(elapsed * 0.008) * intensity;
      camera.position.y += Math.cos(elapsed * 0.011) * intensity * 0.3;
    }

    // Gentle camera banking during the descent
    if (progress > 0.12 && progress < 0.6) {
      const bankAmount = Math.sin(easedProgress * Math.PI * 2) * 0.08;
      camera.up.set(bankAmount, 1, 0).normalize();
    } else {
      camera.up.set(0, 1, 0);
    }

    camera.lookAt(lookTarget);
  });

  return null;
}
