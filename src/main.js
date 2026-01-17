// Spermrunner - Main entry point
import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';

// Get optimal game dimensions for mobile
function getGameDimensions() {
  const maxWidth = 450;
  const maxHeight = 800;
  
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;
  
  // Maintain aspect ratio
  const aspectRatio = maxWidth / maxHeight;
  
  let width, height;
  
  if (windowWidth / windowHeight > aspectRatio) {
    // Window is wider than game aspect ratio
    height = Math.min(windowHeight, maxHeight);
    width = height * aspectRatio;
  } else {
    // Window is taller than game aspect ratio
    width = Math.min(windowWidth, maxWidth);
    height = width / aspectRatio;
  }
  
  return { width: Math.floor(width), height: Math.floor(height) };
}

const dimensions = getGameDimensions();

// Phaser game configuration
const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: dimensions.width,
  height: dimensions.height,
  backgroundColor: '#1a0a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  input: {
    activePointers: 3 // Support multi-touch
  },
  scene: [MenuScene, GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  render: {
    pixelArt: false,
    antialias: true,
    antialiasGL: true
  },
  fps: {
    target: 60,
    forceSetTimeOut: true
  }
};

// Create the game
const game = new Phaser.Game(config);

// Handle window resize
window.addEventListener('resize', () => {
  const newDimensions = getGameDimensions();
  game.scale.resize(newDimensions.width, newDimensions.height);
});

// Prevent default touch behaviors
document.addEventListener('touchstart', (e) => {
  if (e.target.closest('#game-container')) {
    e.preventDefault();
  }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
  if (e.target.closest('#game-container')) {
    e.preventDefault();
  }
}, { passive: false });

// Handle visibility change (pause when tab hidden)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    game.scene.scenes.forEach(scene => {
      if (scene.scene.key === 'GameScene' && scene.scene.isActive()) {
        scene.isPaused = true;
      }
    });
  }
});

console.log('🏊 Spermrunner initialized! Race to the egg!');
