// Environment - Microscopic world atmosphere
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment as DreiEnvironment, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/gameStore';

// Floating particles in the microscopic world
function FloatingParticles({ count = 100 }) {
  const particlesRef = useRef();
  const { distance, gameState } = useGameStore();
  
  // Generate random positions
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 40;
    positions[i * 3 + 1] = Math.random() * 15;
    positions[i * 3 + 2] = Math.random() * 150 - 20;
    
    // Soft pastel colors
    const hue = Math.random();
    const color = new THREE.Color().setHSL(hue, 0.6, 0.7);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
    
    sizes[i] = Math.random() * 0.3 + 0.1;
  }
  
  useFrame((state, delta) => {
    if (!particlesRef.current || gameState !== 'playing') return;
    
    const positions = particlesRef.current.geometry.attributes.position.array;
    const { playerSpeed } = useGameStore.getState();
    
    for (let i = 0; i < count; i++) {
      // Move particles toward camera
      positions[i * 3 + 2] -= delta * playerSpeed * 0.5;
      
      // Reset when behind camera
      if (positions[i * 3 + 2] < -20) {
        positions[i * 3 + 2] = 130;
        positions[i * 3] = (Math.random() - 0.5) * 40;
        positions[i * 3 + 1] = Math.random() * 15;
      }
    }
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// The egg goal (appears in the distance)
export function EggGoal({ visible = false, position = [0, 2, 200] }) {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (!groupRef.current || !visible) return;
    
    // Gentle pulsing
    const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    groupRef.current.scale.setScalar(scale);
  });
  
  if (!visible) return null;
  
  return (
    <group ref={groupRef} position={position}>
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[5, 32, 32]} />
        <meshStandardMaterial
          color="#fff9c4"
          emissive="#ffeb3b"
          emissiveIntensity={0.5}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Main egg */}
      <mesh>
        <sphereGeometry args={[3, 32, 32]} />
        <meshPhysicalMaterial
          color="#fff8e1"
          metalness={0}
          roughness={0.3}
          transmission={0.2}
          thickness={2}
          clearcoat={1}
        />
      </mesh>
      
      {/* Core */}
      <mesh>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#ffd54f" />
      </mesh>
      
      {/* Light */}
      <pointLight color="#fff9c4" intensity={5} distance={30} />
    </group>
  );
}

// Main environment component
export function GameEnvironment() {
  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.3} />
      
      {/* Key light (from top-front) */}
      <directionalLight
        position={[5, 10, -5]}
        intensity={1}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      
      {/* Rim light (behind player) */}
      <directionalLight
        position={[0, 3, 10]}
        intensity={0.8}
        color="#4fc3f7"
      />
      
      {/* Fill light */}
      <directionalLight
        position={[-5, 5, 0]}
        intensity={0.4}
        color="#ce93d8"
      />
      
      {/* Depth fog */}
      <fog attach="fog" args={['#0a0a1a', 30, 150]} />
      
      {/* Floating particles */}
      <FloatingParticles count={150} />
      
      {/* Background elements */}
      <BackgroundCells />
    </>
  );
}

// Floating cell-like background objects
function BackgroundCells() {
  const cells = [];
  
  for (let i = 0; i < 20; i++) {
    cells.push({
      id: i,
      position: [
        (Math.random() - 0.5) * 60,
        Math.random() * 20 - 5,
        Math.random() * 150 + 20
      ],
      scale: Math.random() * 2 + 1,
      color: `hsl(${Math.random() * 60 + 280}, 50%, 60%)`
    });
  }
  
  return (
    <group>
      {cells.map(cell => (
        <Float
          key={cell.id}
          speed={1}
          rotationIntensity={0.2}
          floatIntensity={0.5}
        >
          <mesh position={cell.position} scale={cell.scale}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshStandardMaterial
              color={cell.color}
              transparent
              opacity={0.15}
              roughness={0.8}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}
