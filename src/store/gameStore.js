// Game state management with Zustand
import { create } from 'zustand';

export const LANES = {
  LEFT: -1,
  CENTER: 0,
  RIGHT: 1
};

export const LANE_POSITIONS = {
  [LANES.LEFT]: -2.5,
  [LANES.CENTER]: 0,
  [LANES.RIGHT]: 2.5
};

export const useGameStore = create((set, get) => ({
  // Game state
  gameState: 'menu', // 'menu', 'playing', 'paused', 'gameover'
  score: 0,
  distance: 0,
  highScore: parseInt(localStorage.getItem('spermrun_highscore') || '0'),
  
  // Player state
  currentLane: LANES.CENTER,
  targetLane: LANES.CENTER,
  playerSpeed: 15,
  baseSpeed: 15,
  maxSpeed: 35,
  isInvincible: false,
  
  // Difficulty
  difficulty: 1,
  speedMultiplier: 1,
  
  // Actions
  startGame: () => set({
    gameState: 'playing',
    score: 0,
    distance: 0,
    currentLane: LANES.CENTER,
    targetLane: LANES.CENTER,
    playerSpeed: 15,
    difficulty: 1,
    speedMultiplier: 1
  }),
  
  pauseGame: () => set({ gameState: 'paused' }),
  resumeGame: () => set({ gameState: 'playing' }),
  
  gameOver: () => {
    const { score, highScore } = get();
    const newHighScore = Math.max(score, highScore);
    localStorage.setItem('spermrun_highscore', newHighScore.toString());
    set({ 
      gameState: 'gameover',
      highScore: newHighScore
    });
  },
  
  returnToMenu: () => set({ gameState: 'menu' }),
  
  // Lane switching
  switchLane: (direction) => {
    const { currentLane, gameState } = get();
    if (gameState !== 'playing') return;
    
    let newLane = currentLane + direction;
    newLane = Math.max(LANES.LEFT, Math.min(LANES.RIGHT, newLane));
    
    set({ targetLane: newLane });
  },
  
  updateLane: (lane) => set({ currentLane: lane }),
  
  // Score & progress
  addScore: (points) => set(state => ({ score: state.score + points })),
  
  updateDistance: (delta) => {
    const state = get();
    if (state.gameState !== 'playing') return;
    
    const newDistance = state.distance + delta * state.playerSpeed;
    const newDifficulty = 1 + Math.floor(newDistance / 500) * 0.1;
    const newSpeed = Math.min(
      state.maxSpeed,
      state.baseSpeed * (1 + newDistance / 2000)
    );
    
    set({
      distance: newDistance,
      difficulty: newDifficulty,
      playerSpeed: newSpeed,
      speedMultiplier: newSpeed / state.baseSpeed
    });
  },
  
  // Power-ups
  setInvincible: (value) => set({ isInvincible: value })
}));
