// Game Configuration - Core settings and difficulty curves
export const GAME_CONFIG = {
  // Target 30-minute gameplay across 8 stages
  TOTAL_STAGES: 8,
  STAGE_DURATION_MS: 225000, // ~3.75 minutes per stage = 30 min total
  
  // Base player stats
  PLAYER: {
    BASE_SPEED: 200,
    MAX_SPEED: 400,
    ACCELERATION: 150,
    TURN_SPEED: 4,
    BOOST_MULTIPLIER: 1.8,
    BOOST_DURATION: 1500,
    BOOST_COOLDOWN: 5000,
    COLLISION_KNOCKBACK: 150,
    SIZE: 24
  },
  
  // Track configuration
  TRACK: {
    BASE_WIDTH: 300,
    MIN_WIDTH: 120,
    SEGMENT_LENGTH: 600,
    CHECKPOINT_INTERVAL: 3, // Every 3 segments
  },
  
  // Visual settings
  COLORS: {
    BACKGROUND: 0x1a0a2e,
    PLAYER: 0x00ff88,
    RIVAL_AGGRESSIVE: 0xff4444,
    RIVAL_DEFENSIVE: 0x4488ff,
    RIVAL_SLIPPERY: 0xffff44,
    RIVAL_BLOCKER: 0xff8844,
    TRACK_WALL: 0x3d1a5c,
    TRACK_FLOOR: 0x2d0a4c,
    OBSTACLE: 0x8844aa,
    CURRENT: 0x44aaff,
    EGG: 0xffccaa,
    POWERUP: 0x00ffff
  }
};

// Stage-specific difficulty settings
// Each stage progressively increases challenge
export const STAGE_CONFIG = [
  // Stage 1: Tutorial-lite
  {
    stage: 1,
    name: "The Beginning",
    rivalCount: 3,
    rivalAggression: 0.2,
    trackWidth: 1.0, // Multiplier of BASE_WIDTH
    turnFrequency: 0.1,
    turnSharpness: 0.3,
    obstacleFrequency: 0.05,
    currentFrequency: 0,
    speedMultiplier: 1.0,
    description: "Learn the basics. Wide lanes, gentle turns."
  },
  // Stage 2: Getting comfortable
  {
    stage: 2,
    name: "First Challenge",
    rivalCount: 5,
    rivalAggression: 0.3,
    trackWidth: 0.95,
    turnFrequency: 0.15,
    turnSharpness: 0.4,
    obstacleFrequency: 0.1,
    currentFrequency: 0,
    speedMultiplier: 1.1,
    description: "More rivals join. Stay focused."
  },
  // Stage 3: Introducing currents
  {
    stage: 3,
    name: "Turbulent Waters",
    rivalCount: 6,
    rivalAggression: 0.4,
    trackWidth: 0.9,
    turnFrequency: 0.2,
    turnSharpness: 0.5,
    obstacleFrequency: 0.15,
    currentFrequency: 0.15,
    speedMultiplier: 1.15,
    description: "Watch for currents pushing you off course."
  },
  // Stage 4: Tighter turns
  {
    stage: 4,
    name: "The Maze",
    rivalCount: 8,
    rivalAggression: 0.45,
    trackWidth: 0.85,
    turnFrequency: 0.3,
    turnSharpness: 0.6,
    obstacleFrequency: 0.2,
    currentFrequency: 0.2,
    speedMultiplier: 1.2,
    description: "Tight turns and choke points ahead."
  },
  // Stage 5: Aggressive AI
  {
    stage: 5,
    name: "The Gauntlet",
    rivalCount: 10,
    rivalAggression: 0.6,
    trackWidth: 0.75,
    turnFrequency: 0.35,
    turnSharpness: 0.7,
    obstacleFrequency: 0.25,
    currentFrequency: 0.25,
    speedMultiplier: 1.3,
    description: "Rivals are getting aggressive. Fight back!"
  },
  // Stage 6: Mixed obstacles
  {
    stage: 6,
    name: "Chaos Zone",
    rivalCount: 12,
    rivalAggression: 0.7,
    trackWidth: 0.65,
    turnFrequency: 0.4,
    turnSharpness: 0.75,
    obstacleFrequency: 0.35,
    currentFrequency: 0.3,
    speedMultiplier: 1.4,
    description: "Pure chaos. Obstacles everywhere."
  },
  // Stage 7: High speed narrow lanes
  {
    stage: 7,
    name: "The Needle",
    rivalCount: 14,
    rivalAggression: 0.8,
    trackWidth: 0.5,
    turnFrequency: 0.45,
    turnSharpness: 0.85,
    obstacleFrequency: 0.4,
    currentFrequency: 0.35,
    speedMultiplier: 1.55,
    description: "Narrow lanes at high speed. Precision required."
  },
  // Stage 8: Final sprint to the egg
  {
    stage: 8,
    name: "The Final Sprint",
    rivalCount: 16,
    rivalAggression: 0.9,
    trackWidth: 0.45,
    turnFrequency: 0.5,
    turnSharpness: 0.9,
    obstacleFrequency: 0.45,
    currentFrequency: 0.4,
    speedMultiplier: 1.7,
    description: "The egg is in sight! Give it everything!"
  }
];

// AI Rival archetypes with distinct behaviors
export const RIVAL_ARCHETYPES = {
  AGGRESSIVE: {
    name: 'aggressive',
    color: GAME_CONFIG.COLORS.RIVAL_AGGRESSIVE,
    speedVariance: 1.1,
    bumpProbability: 0.7,
    bumpForce: 1.3,
    turnReaction: 0.8,
    description: 'Fast and bumps frequently'
  },
  DEFENSIVE: {
    name: 'defensive',
    color: GAME_CONFIG.COLORS.RIVAL_DEFENSIVE,
    speedVariance: 0.95,
    bumpProbability: 0.2,
    bumpForce: 0.8,
    turnReaction: 1.2,
    description: 'Blocks lanes, hard to pass'
  },
  SLIPPERY: {
    name: 'slippery',
    color: GAME_CONFIG.COLORS.RIVAL_SLIPPERY,
    speedVariance: 1.2,
    bumpProbability: 0.1,
    bumpForce: 0.5,
    turnReaction: 1.5,
    description: 'Very fast but avoids contact'
  },
  BLOCKER: {
    name: 'blocker',
    color: GAME_CONFIG.COLORS.RIVAL_BLOCKER,
    speedVariance: 0.85,
    bumpProbability: 0.5,
    bumpForce: 1.5,
    turnReaction: 0.6,
    description: 'Slow but wide, blocks the path'
  }
};

// Obstacle types
export const OBSTACLE_TYPES = {
  DEBRIS: {
    name: 'debris',
    slowdownFactor: 0.5,
    knockback: 50,
    size: 30
  },
  MUCUS_WALL: {
    name: 'mucus_wall',
    slowdownFactor: 0.3,
    knockback: 0,
    size: 60
  },
  MOVING_HAZARD: {
    name: 'moving_hazard',
    slowdownFactor: 0.7,
    knockback: 100,
    size: 40,
    speed: 80
  }
};

// Powerup types
export const POWERUP_TYPES = {
  SPEED_BOOST: {
    name: 'speed_boost',
    duration: 3000,
    effect: 'Instant boost recharge'
  },
  SHIELD: {
    name: 'shield',
    duration: 5000,
    effect: 'Immune to knockback'
  },
  STICKY_TRAP: {
    name: 'sticky_trap',
    duration: 2000,
    effect: 'Drop trap to slow rivals'
  }
};

// Get interpolated difficulty for smooth progression within a stage
export function getDifficultyAtProgress(stageIndex, progressWithinStage) {
  const currentStage = STAGE_CONFIG[stageIndex];
  const nextStage = STAGE_CONFIG[Math.min(stageIndex + 1, STAGE_CONFIG.length - 1)];
  
  // Smooth interpolation between stages
  const t = progressWithinStage;
  return {
    rivalAggression: lerp(currentStage.rivalAggression, nextStage.rivalAggression, t * 0.3),
    trackWidth: lerp(currentStage.trackWidth, nextStage.trackWidth, t * 0.3),
    obstacleFrequency: lerp(currentStage.obstacleFrequency, nextStage.obstacleFrequency, t * 0.3),
    speedMultiplier: lerp(currentStage.speedMultiplier, nextStage.speedMultiplier, t * 0.3)
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
