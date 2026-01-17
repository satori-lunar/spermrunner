// Player component - 3D Sperm with animated tail
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, LANE_POSITIONS } from '../store/gameStore';

// Sperm head geometry (elongated sphere)
function SpermHead() {
  const meshRef = useRef();
  
  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[0.4, 32, 32]} />
      <meshPhysicalMaterial
        color="#e8f5e9"
        metalness={0.1}
        roughness={0.2}
        transmission={0.3}
        thickness={0.5}
        envMapIntensity={1}
        clearcoat={1}
        clearcoatRoughness={0.1}
      />
      {/* Inner glow */}
      <mesh scale={0.85}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshBasicMaterial color="#a5d6a7" transparent opacity={0.3} />
      </mesh>
    </mesh>
  );
}

// Animated tail using a curved tube
function SpermTail({ speedMultiplier = 1 }) {
  const tailRef = useRef();
  const curveRef = useRef();
  
  // Number of segments for the tail
  const segments = 20;
  const tailLength = 2.5;
  
  // Create initial curve points
  const initialPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push(new THREE.Vector3(0, 0, t * tailLength));
    }
    return points;
  }, []);
  
  // Create tube geometry that we'll update
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(initialPoints);
    curveRef.current = curve;
    return new THREE.TubeGeometry(curve, segments * 2, 0.08, 8, false);
  }, []);
  
  // Animate tail with sine wave
  useFrame((state) => {
    if (!tailRef.current || !curveRef.current) return;
    
    const time = state.clock.elapsedTime;
    const points = curveRef.current.points;
    
    // Wave parameters - amplitude increases with speed
    const baseAmplitude = 0.15;
    const amplitude = baseAmplitude * (0.8 + speedMultiplier * 0.4);
    const frequency = 3;
    const waveSpeed = 8;
    
    // Update each point with sine wave
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      
      // Wave gets stronger toward the end of tail
      const waveFactor = t * t;
      const wave = Math.sin(time * waveSpeed - t * frequency * Math.PI) * amplitude * waveFactor;
      
      // Taper the tail thickness (handled by radius in TubeGeometry)
      points[i].x = wave;
      points[i].y = Math.sin(time * waveSpeed * 0.7 - t * frequency * Math.PI * 0.5) * amplitude * waveFactor * 0.3;
      points[i].z = t * tailLength;
    }
    
    // Recreate geometry with new curve
    const newGeometry = new THREE.TubeGeometry(
      curveRef.current,
      segments * 2,
      0.08 * (1 - 0.7 * 0), // Could taper here
      8,
      false
    );
    
    tailRef.current.geometry.dispose();
    tailRef.current.geometry = newGeometry;
  });
  
  return (
    <mesh ref={tailRef} position={[0, 0, 0.3]} geometry={geometry}>
      <meshPhysicalMaterial
        color="#c8e6c9"
        metalness={0.0}
        roughness={0.4}
        transmission={0.2}
        thickness={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// Main Player component
export function Player() {
  const groupRef = useRef();
  const { currentLane, targetLane, updateLane, speedMultiplier, gameState } = useGameStore();
  
  // Smooth lane transition
  const currentX = useRef(LANE_POSITIONS[currentLane]);
  const velocity = useRef(0);
  
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (gameState !== 'playing') return;
    
    // Smooth lane switching with spring physics
    const targetX = LANE_POSITIONS[targetLane];
    const diff = targetX - currentX.current;
    
    // Spring damping
    const spring = 12;
    const damping = 8;
    
    velocity.current += diff * spring * delta;
    velocity.current *= Math.exp(-damping * delta);
    currentX.current += velocity.current;
    
    // Update position
    groupRef.current.position.x = currentX.current;
    
    // Tilt based on movement
    const tiltAngle = -velocity.current * 0.1;
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      tiltAngle,
      0.1
    );
    
    // Subtle bobbing motion
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.05;
    
    // Update lane state when close enough
    if (Math.abs(diff) < 0.1 && currentLane !== targetLane) {
      updateLane(targetLane);
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 0.5, 0]} rotation={[0, Math.PI, 0]}>
      {/* Rim light for pop effect */}
      <pointLight position={[0, 0.5, 1]} intensity={2} color="#4fc3f7" distance={3} />
      
      <SpermHead />
      <SpermTail speedMultiplier={speedMultiplier} />
    </group>
  );
}
