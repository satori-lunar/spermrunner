// Main Game component - R3F scene setup
import { useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../store/gameStore';
import { Player } from './Player';
import { Track } from './Track';
import { GameCamera } from './GameCamera';
import { ObstacleManager } from './Obstacles';
import { GameEnvironment, EggGoal } from './Environment';
import { GameUI } from './UI';

// Keyboard input handler
function useKeyboardControls() {
  const { switchLane, gameState, startGame, pauseGame, resumeGame } = useGameStore();
  
  const handleKeyDown = useCallback((e) => {
    if (gameState === 'playing') {
      switch (e.key.toLowerCase()) {
        case 'a':
        case 'arrowleft':
          switchLane(-1);
          break;
        case 'd':
        case 'arrowright':
          switchLane(1);
          break;
        case 'escape':
        case 'p':
          pauseGame();
          break;
      }
    } else if (gameState === 'paused') {
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        resumeGame();
      }
    } else if (gameState === 'menu') {
      if (e.key === 'Enter' || e.key === ' ') {
        startGame();
      }
    }
  }, [gameState, switchLane, pauseGame, resumeGame, startGame]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Game loop - updates distance/score
function GameLoop() {
  const { updateDistance, gameState } = useGameStore();
  
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    let lastTime = performance.now();
    let animationId;
    
    const gameLoop = () => {
      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      updateDistance(delta);
      
      animationId = requestAnimationFrame(gameLoop);
    };
    
    animationId = requestAnimationFrame(gameLoop);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [gameState, updateDistance]);
  
  return null;
}

// Main Game component
export function Game() {
  useKeyboardControls();
  
  const { gameState, distance } = useGameStore();
  const showEgg = distance > 800; // Show egg after certain distance
  
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        style={{ background: '#0a0a1a' }}
      >
        {/* Camera */}
        <GameCamera />
        
        {/* Environment & Lighting */}
        <GameEnvironment />
        
        {/* Game elements (only render when playing) */}
        {gameState !== 'menu' && (
          <>
            {/* Track */}
            <Track />
            
            {/* Player */}
            <Player />
            
            {/* Obstacles & Rivals */}
            <ObstacleManager />
            
            {/* Egg goal */}
            <EggGoal visible={showEgg} position={[0, 2, 150]} />
          </>
        )}
        
        {/* Menu scene background */}
        {gameState === 'menu' && <MenuBackground />}
      </Canvas>
      
      {/* UI Overlay */}
      <GameUI />
      
      {/* Game Loop */}
      <GameLoop />
    </div>
  );
}

// Simple animated background for menu
function MenuBackground() {
  return (
    <group>
      {/* Ambient particles */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={200}
            array={new Float32Array(200 * 3).map(() => (Math.random() - 0.5) * 50)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.1} color="#4fc3f7" transparent opacity={0.5} />
      </points>
      
      {/* Floating sperm preview */}
      <group position={[0, 0, 10]} rotation={[0.2, 0, 0.1]}>
        <mesh>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial color="#a5d6a7" emissive="#4caf50" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
}
