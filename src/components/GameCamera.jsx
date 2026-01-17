// Third-person follow camera with lane sway
import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore, LANE_POSITIONS } from '../store/gameStore';

export function GameCamera() {
  const cameraRef = useRef();
  const { camera } = useThree();
  const { targetLane, gameState, speedMultiplier } = useGameStore();
  
  // Camera position state
  const cameraOffset = useRef(new THREE.Vector3(0, 4, -8));
  const currentX = useRef(0);
  const lookAtTarget = useRef(new THREE.Vector3(0, 0.5, 10));
  
  useFrame((state, delta) => {
    if (!cameraRef.current) return;
    
    const time = state.clock.elapsedTime;
    
    // Target X position based on current lane (subtle sway)
    const targetX = LANE_POSITIONS[targetLane] * 0.3;
    
    // Smooth camera movement
    currentX.current = THREE.MathUtils.lerp(currentX.current, targetX, 0.05);
    
    // Base camera position
    const baseX = currentX.current;
    const baseY = 4 + Math.sin(time * 0.5) * 0.1; // Subtle breathing
    const baseZ = -8;
    
    // Speed-based FOV adjustment
    const baseFOV = 65;
    const speedFOV = baseFOV + (speedMultiplier - 1) * 10;
    cameraRef.current.fov = THREE.MathUtils.lerp(cameraRef.current.fov, speedFOV, 0.05);
    cameraRef.current.updateProjectionMatrix();
    
    // Update camera position
    cameraRef.current.position.set(baseX, baseY, baseZ);
    
    // Look at point ahead of player
    lookAtTarget.current.set(currentX.current * 0.5, 0.5, 15);
    cameraRef.current.lookAt(lookAtTarget.current);
    
    // Subtle roll based on lane switching
    const roll = -currentX.current * 0.02;
    cameraRef.current.rotation.z = THREE.MathUtils.lerp(
      cameraRef.current.rotation.z,
      roll,
      0.05
    );
  });
  
  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={65}
      near={0.1}
      far={1000}
      position={[0, 4, -8]}
    />
  );
}
