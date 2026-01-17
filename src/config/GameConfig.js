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
    CHECKPOINT_INTERVAL: 3,
  },
  
  // Whimsical color palette - bright, playful, abstract
  COLORS: {
    // Backgrounds - deep space/underwater feel
    BACKGROUND_TOP: 0x1a0533,
    BACKGROUND_BOTTOM: 0x0d1b2a,
    
    // Player - warm glowing pod
    PLAYER_CORE: 0x00ffcc,
    PLAYER_GLOW: 0x00ff99,
    PLAYER_RIBBON: 0x66ffdd,
    
    // Rivals - each a different bright color
    RIVAL_PINK: 0xff66aa,
    RIVAL_ORANGE: 0xffaa44,
    RIVAL_PURPLE: 0xaa66ff,
    RIVAL_BLUE: 0x44aaff,
    
    // Track - soft flowing gradients
    TRACK_FLOOR_1: 0x1e3a5f,
    TRACK_FLOOR_2: 0x2d4a6f,
    TRACK_WALL: 0x4fc3f7,
    TRACK_WALL_GLOW: 0x81d4fa,
    
    // Obstacles - playful floating shapes
    OBSTACLE_BUBBLE: 0xff7eb3,
    OBSTACLE_CRYSTAL: 0xb388ff,
    OBSTACLE_BOUNCY: 0xffeb3b,
    
    // Currents - flowing energy streams
    CURRENT_STREAM: 0x80deea,
    CURRENT_GLOW: 0x4dd0e1,
    
    // Goal - energy core
    GOAL_CORE: 0xffd700,
    GOAL_GLOW: 0xffeb3b,
    GOAL_RING: 0xfff176,
    
    // Powerups - sparkly collectibles
    POWERUP_SPEED: 0x00e676,
    POWERUP_SHIELD: 0x7c4dff,
    POWERUP_STAR: 0xffea00,
    
    // Particles
    PARTICLE_SPARKLE: 0xffffff,
    PARTICLE_TRAIL: 0x80cbc4
  }
};

// Stage-specific difficulty settings
export const STAGE_CONFIG = [
  {
    stage: 1,
    name: "Gentle Stream",
    rivalCount: 3,
    rivalAggression: 0.2,
    trackWidth: 1.0,
    turnFrequency: 0.1,
    turnSharpness: 0.3,
    obstacleFrequency: 0.05,
    currentFrequency: 0,
    speedMultiplier: 1.0,
    description: "A calm beginning..."
  },
  {
    stage: 2,
    name: "Bubbling Rapids",
    rivalCount: 5,
    rivalAggression: 0.3,
    trackWidth: 0.95,
    turnFrequency: 0.15,
    turnSharpness: 0.4,
    obstacleFrequency: 0.1,
    currentFrequency: 0,
    speedMultiplier: 1.1,
    description: "The pace picks up!"
  },
  {
    stage: 3,
    name: "Swirling Currents",
    rivalCount: 6,
    rivalAggression: 0.4,
    trackWidth: 0.9,
    turnFrequency: 0.2,
    turnSharpness: 0.5,
    obstacleFrequency: 0.15,
    currentFrequency: 0.15,
    speedMultiplier: 1.15,
    description: "Watch for drifting streams!"
  },
  {
    stage: 4,
    name: "Crystal Caverns",
    rivalCount: 8,
    rivalAggression: 0.45,
    trackWidth: 0.85,
    turnFrequency: 0.3,
    turnSharpness: 0.6,
    obstacleFrequency: 0.2,
    currentFrequency: 0.2,
    speedMultiplier: 1.2,
    description: "Navigate the shimmering maze!"
  },
  {
    stage: 5,
    name: "Neon Rush",
    rivalCount: 10,
    rivalAggression: 0.6,
    trackWidth: 0.75,
    turnFrequency: 0.35,
    turnSharpness: 0.7,
    obstacleFrequency: 0.25,
    currentFrequency: 0.25,
    speedMultiplier: 1.3,
    description: "Speed through the glow!"
  },
  {
    stage: 6,
    name: "Cosmic Chaos",
    rivalCount: 12,
    rivalAggression: 0.7,
    trackWidth: 0.65,
    turnFrequency: 0.4,
    turnSharpness: 0.75,
    obstacleFrequency: 0.35,
    currentFrequency: 0.3,
    speedMultiplier: 1.4,
    description: "Everything is moving!"
  },
  {
    stage: 7,
    name: "Starlight Sprint",
    rivalCount: 14,
    rivalAggression: 0.8,
    trackWidth: 0.5,
    turnFrequency: 0.45,
    turnSharpness: 0.85,
    obstacleFrequency: 0.4,
    currentFrequency: 0.35,
    speedMultiplier: 1.55,
    description: "Race among the stars!"
  },
  {
    stage: 8,
    name: "The Core Awaits",
    rivalCount: 16,
    rivalAggression: 0.9,
    trackWidth: 0.45,
    turnFrequency: 0.5,
    turnSharpness: 0.9,
    obstacleFrequency: 0.45,
    currentFrequency: 0.4,
    speedMultiplier: 1.7,
    description: "The energy core is near!"
  }
];

// Rival archetypes - now as abstract swimmer types
export const RIVAL_ARCHETYPES = {
  SWIFT: {
    name: 'swift',
    color: GAME_CONFIG.COLORS.RIVAL_PINK,
    speedVariance: 1.15,
    bumpProbability: 0.3,
    bumpForce: 0.8,
    turnReaction: 1.3,
    description: 'Quick and nimble'
  },
  STEADY: {
    name: 'steady',
    color: GAME_CONFIG.COLORS.RIVAL_BLUE,
    speedVariance: 0.95,
    bumpProbability: 0.2,
    bumpForce: 1.0,
    turnReaction: 1.1,
    description: 'Consistent and reliable'
  },
  BOUNCY: {
    name: 'bouncy',
    color: GAME_CONFIG.COLORS.RIVAL_ORANGE,
    speedVariance: 1.0,
    bumpProbability: 0.6,
    bumpForce: 1.4,
    turnReaction: 0.9,
    description: 'Loves to bump!'
  },
  FLOATY: {
    name: 'floaty',
    color: GAME_CONFIG.COLORS.RIVAL_PURPLE,
    speedVariance: 0.9,
    bumpProbability: 0.15,
    bumpForce: 0.6,
    turnReaction: 1.4,
    description: 'Drifts gracefully'
  }
};

// Obstacle types - abstract and playful
export const OBSTACLE_TYPES = {
  BUBBLE: {
    name: 'bubble',
    slowdownFactor: 0.6,
    knockback: 30,
    size: 35,
    bouncy: true
  },
  CRYSTAL: {
    name: 'crystal',
    slowdownFactor: 0.4,
    knockback: 60,
    size: 28
  },
  FLOATER: {
    name: 'floater',
    slowdownFactor: 0.7,
    knockback: 40,
    size: 40,
    speed: 60
  }
};

// Powerup types
export const POWERUP_TYPES = {
  SPEED_BURST: {
    name: 'speed_burst',
    duration: 3000,
    effect: 'Instant energy boost!'
  },
  SHIELD_BUBBLE: {
    name: 'shield_bubble',
    duration: 5000,
    effect: 'Protected by energy!'
  },
  STAR_TRAIL: {
    name: 'star_trail',
    duration: 2000,
    effect: 'Leave sparkles behind!'
  }
};

export function getDifficultyAtProgress(stageIndex, progressWithinStage) {
  const currentStage = STAGE_CONFIG[stageIndex];
  const nextStage = STAGE_CONFIG[Math.min(stageIndex + 1, STAGE_CONFIG.length - 1)];
  
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
