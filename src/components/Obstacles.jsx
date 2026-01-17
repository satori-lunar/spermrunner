// Obstacles and rival sperms
import { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, LANE_POSITIONS, LANES } from '../store/gameStore';

// Neutral-colored obstacle (for contrast against rainbow track)
function Obstacle({ position, type = 'block' }) {
  const meshRef = useRef();
  const [active, setActive] = useState(true);
  
  useFrame((state) => {
    if (!meshRef.current || !active) return;
    
    // Gentle floating animation
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[2]) * 0.1;
    meshRef.current.rotation.y += 0.01;
  });
  
  if (!active) return null;
  
  const geometry = useMemo(() => {
    switch (type) {
      case 'sphere':
        return new THREE.SphereGeometry(0.6, 16, 16);
      case 'diamond':
        return new THREE.OctahedronGeometry(0.7);
      default:
        return new THREE.BoxGeometry(1.2, 1.2, 1.2);
    }
  }, [type]);
  
  return (
    <mesh ref={meshRef} position={position} geometry={geometry}>
      <meshStandardMaterial
        color="#607d8b"
        metalness={0.3}
        roughness={0.4}
        emissive="#455a64"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// Rival sperm trying to knock player off
function RivalSperm({ initialPosition, speed = 0.8, lane }) {
  const groupRef = useRef();
  const tailRef = useRef();
  const [active, setActive] = useState(true);
  const zOffset = useRef(0);
  
  // Tail animation similar to player but different phase
  const tailSegments = 15;
  const tailPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= tailSegments; i++) {
      points.push(new THREE.Vector3(0, 0, i * 0.12));
    }
    return points;
  }, []);
  
  const tailCurve = useMemo(() => new THREE.CatmullRomCurve3(tailPoints), [tailPoints]);
  
  useFrame((state, delta) => {
    if (!groupRef.current || !active) return;
    
    const { playerSpeed, gameState, isInvincible, gameOver } = useGameStore.getState();
    if (gameState !== 'playing') return;
    
    const time = state.clock.elapsedTime;
    
    // Move rival forward (relative to player movement)
    zOffset.current += delta * playerSpeed * speed;
    const z = initialPosition[2] + zOffset.current;
    
    // Rival tries to drift toward center lane (aggressive behavior)
    const driftSpeed = 0.5;
    const currentX = groupRef.current.position.x;
    const targetX = LANE_POSITIONS[LANES.CENTER];
    const newX = THREE.MathUtils.lerp(currentX, targetX, delta * driftSpeed);
    
    groupRef.current.position.set(newX, 0.5, z);
    
    // Animate tail
    if (tailRef.current) {
      for (let i = 0; i <= tailSegments; i++) {
        const t = i / tailSegments;
        const wave = Math.sin(time * 6 - t * 4) * 0.1 * t;
        tailCurve.points[i].x = wave;
      }
      
      const newGeometry = new THREE.TubeGeometry(tailCurve, 20, 0.05, 6, false);
      tailRef.current.geometry.dispose();
      tailRef.current.geometry = newGeometry;
    }
    
    // Remove if too far behind
    if (z < -20) {
      setActive(false);
    }
    
    // Collision detection with player
    const { currentLane } = useGameStore.getState();
    const playerX = LANE_POSITIONS[currentLane];
    const playerZ = 0;
    
    const dist = Math.sqrt(
      Math.pow(newX - playerX, 2) + 
      Math.pow(z - playerZ, 2)
    );
    
    if (dist < 1.0 && !isInvincible) {
      gameOver();
    }
  });
  
  if (!active) return null;
  
  return (
    <group ref={groupRef} position={initialPosition} rotation={[0, Math.PI, 0]}>
      {/* Rival head */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color="#ff7043"
          emissive="#ff5722"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Rival tail */}
      <mesh ref={tailRef} position={[0, 0, 0.2]}>
        <tubeGeometry args={[tailCurve, 20, 0.05, 6, false]} />
        <meshStandardMaterial
          color="#ffab91"
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Warning glow */}
      <pointLight color="#ff5722" intensity={1} distance={3} />
    </group>
  );
}

// Obstacle manager - spawns obstacles and rivals
export function ObstacleManager() {
  const [obstacles, setObstacles] = useState([]);
  const [rivals, setRivals] = useState([]);
  const spawnTimerRef = useRef(0);
  const rivalTimerRef = useRef(0);
  
  const { gameState, distance, difficulty } = useGameStore();
  
  // Spawn logic
  useFrame((state, delta) => {
    if (gameState !== 'playing') return;
    
    // Spawn obstacles
    spawnTimerRef.current += delta;
    const spawnInterval = Math.max(0.8, 2 - difficulty * 0.2);
    
    if (spawnTimerRef.current > spawnInterval) {
      spawnTimerRef.current = 0;
      
      // Random lane
      const lanes = [LANES.LEFT, LANES.CENTER, LANES.RIGHT];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      const x = LANE_POSITIONS[lane];
      
      // Random obstacle type
      const types = ['block', 'sphere', 'diamond'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      const newObstacle = {
        id: Date.now() + Math.random(),
        position: [x, 0.8, 80 + Math.random() * 20],
        type
      };
      
      setObstacles(prev => [...prev.slice(-15), newObstacle]);
    }
    
    // Spawn rivals (less frequently)
    rivalTimerRef.current += delta;
    const rivalInterval = Math.max(3, 8 - difficulty * 0.5);
    
    if (rivalTimerRef.current > rivalInterval && rivals.length < 3) {
      rivalTimerRef.current = 0;
      
      const lanes = [LANES.LEFT, LANES.CENTER, LANES.RIGHT];
      const lane = lanes[Math.floor(Math.random() * lanes.length)];
      
      const newRival = {
        id: Date.now() + Math.random(),
        position: [LANE_POSITIONS[lane], 0.5, 100],
        lane,
        speed: 0.7 + Math.random() * 0.3
      };
      
      setRivals(prev => [...prev.slice(-3), newRival]);
    }
  });
  
  // Clean up when game resets
  useEffect(() => {
    if (gameState === 'menu') {
      setObstacles([]);
      setRivals([]);
    }
  }, [gameState]);
  
  return (
    <group>
      {obstacles.map(obs => (
        <MovingObstacle key={obs.id} {...obs} />
      ))}
      {rivals.map(rival => (
        <RivalSperm key={rival.id} initialPosition={rival.position} {...rival} />
      ))}
    </group>
  );
}

// Obstacle that moves with the track
function MovingObstacle({ position, type, id }) {
  const meshRef = useRef();
  const [active, setActive] = useState(true);
  const zOffset = useRef(0);
  
  useFrame((state, delta) => {
    if (!meshRef.current || !active) return;
    
    const { playerSpeed, gameState, isInvincible, gameOver, currentLane } = useGameStore.getState();
    if (gameState !== 'playing') return;
    
    // Move obstacle toward player
    zOffset.current += delta * playerSpeed;
    const z = position[2] - zOffset.current;
    
    meshRef.current.position.z = z;
    meshRef.current.rotation.y += 0.02;
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + id) * 0.1;
    
    // Remove if behind player
    if (z < -10) {
      setActive(false);
      return;
    }
    
    // Collision detection
    const playerX = LANE_POSITIONS[currentLane];
    const playerZ = 0;
    
    const dist = Math.sqrt(
      Math.pow(position[0] - playerX, 2) + 
      Math.pow(z - playerZ, 2)
    );
    
    if (dist < 1.2 && !isInvincible) {
      gameOver();
    }
  });
  
  if (!active) return null;
  
  return (
    <mesh ref={meshRef} position={position}>
      {type === 'sphere' && <sphereGeometry args={[0.6, 16, 16]} />}
      {type === 'diamond' && <octahedronGeometry args={[0.7]} />}
      {type === 'block' && <boxGeometry args={[1.2, 1.2, 1.2]} />}
      <meshStandardMaterial
        color="#78909c"
        metalness={0.4}
        roughness={0.3}
        emissive="#546e7a"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}
