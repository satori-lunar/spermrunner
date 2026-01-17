// Track generation and management
import { GAME_CONFIG, STAGE_CONFIG, OBSTACLE_TYPES, POWERUP_TYPES } from '../config/GameConfig.js';
import { Obstacle, Current, Powerup } from './Obstacle.js';

export class Track {
  constructor(scene) {
    this.scene = scene;
    
    // Track segments (generated as player progresses)
    this.segments = [];
    this.obstacles = [];
    this.currents = [];
    this.powerups = [];
    
    // Current generation state
    this.lastSegmentY = 0;
    this.currentStage = 0;
    this.segmentsGenerated = 0;
    
    // Graphics layers
    this.floorGraphics = scene.add.graphics();
    this.wallGraphics = scene.add.graphics();
    
    // Egg (finish line) - will be placed at the end
    this.eggGraphics = null;
    this.eggY = null;
    
    // Track width cache
    this.currentWidth = GAME_CONFIG.TRACK.BASE_WIDTH;
  }
  
  generateInitialTrack(stageConfig) {
    this.currentStage = stageConfig.stage - 1;
    
    // Generate initial segments ahead of player
    for (let i = 0; i < 10; i++) {
      this.generateSegment(stageConfig);
    }
    
    this.draw();
  }
  
  generateSegment(stageConfig) {
    const segmentLength = GAME_CONFIG.TRACK.SEGMENT_LENGTH;
    const baseWidth = GAME_CONFIG.TRACK.BASE_WIDTH * stageConfig.trackWidth;
    
    // Calculate turn for this segment
    let turnOffset = 0;
    if (Math.random() < stageConfig.turnFrequency) {
      turnOffset = (Math.random() - 0.5) * baseWidth * stageConfig.turnSharpness;
    }
    
    // Previous segment end position
    const prevSegment = this.segments[this.segments.length - 1];
    const startX = prevSegment ? prevSegment.endX : this.scene.cameras.main.width / 2;
    const startY = prevSegment ? prevSegment.endY : 0;
    
    // Calculate end position with clamping to prevent going off screen
    const screenWidth = this.scene.cameras.main.width;
    const margin = baseWidth / 2 + 20;
    let endX = startX + turnOffset;
    endX = Phaser.Math.Clamp(endX, margin, screenWidth - margin);
    
    const segment = {
      index: this.segmentsGenerated,
      startX: startX,
      startY: startY,
      endX: endX,
      endY: startY - segmentLength,
      width: baseWidth,
      isCheckpoint: this.segmentsGenerated % GAME_CONFIG.TRACK.CHECKPOINT_INTERVAL === 0
    };
    
    this.segments.push(segment);
    this.segmentsGenerated++;
    
    // Generate obstacles for this segment
    this.generateObstaclesForSegment(segment, stageConfig);
    
    // Generate currents
    if (Math.random() < stageConfig.currentFrequency) {
      this.generateCurrentForSegment(segment);
    }
    
    // Occasionally spawn powerups
    if (Math.random() < 0.1) {
      this.generatePowerupForSegment(segment);
    }
    
    return segment;
  }
  
  generateObstaclesForSegment(segment, stageConfig) {
    const obstacleChance = stageConfig.obstacleFrequency;
    
    // Multiple obstacle chances per segment
    const numChecks = 3;
    for (let i = 0; i < numChecks; i++) {
      if (Math.random() < obstacleChance) {
        // Pick random obstacle type
        const types = Object.values(OBSTACLE_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Random position within segment
        const progress = (i + 0.5) / numChecks;
        const y = Phaser.Math.Linear(segment.startY, segment.endY, progress);
        const centerX = Phaser.Math.Linear(segment.startX, segment.endX, progress);
        const x = centerX + (Math.random() - 0.5) * segment.width * 0.7;
        
        const obstacle = new Obstacle(this.scene, x, y, type);
        this.obstacles.push(obstacle);
      }
    }
  }
  
  generateCurrentForSegment(segment) {
    const centerX = (segment.startX + segment.endX) / 2;
    const centerY = (segment.startY + segment.endY) / 2;
    
    // Random direction (mostly horizontal to push off course)
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = (Math.random() - 0.5) * 0.5;
    
    const current = new Current(
      this.scene,
      centerX,
      centerY,
      segment.width * 0.8,
      GAME_CONFIG.TRACK.SEGMENT_LENGTH * 0.4,
      dirX,
      dirY,
      150
    );
    
    this.currents.push(current);
  }
  
  generatePowerupForSegment(segment) {
    const types = Object.values(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    const centerX = (segment.startX + segment.endX) / 2;
    const y = (segment.startY + segment.endY) / 2;
    const x = centerX + (Math.random() - 0.5) * segment.width * 0.5;
    
    const powerup = new Powerup(this.scene, x, y, type);
    this.powerups.push(powerup);
  }
  
  update(cameraY, stageConfig) {
    // Generate new segments as camera moves
    const lastSegment = this.segments[this.segments.length - 1];
    const lookAhead = this.scene.cameras.main.height * 2;
    
    while (lastSegment && lastSegment.endY > cameraY - lookAhead) {
      this.generateSegment(stageConfig);
    }
    
    // Update obstacles
    for (const obstacle of this.obstacles) {
      obstacle.update(this.scene.game.loop.delta);
    }
    
    // Update currents
    for (const current of this.currents) {
      current.update(this.scene.game.loop.delta);
    }
    
    // Update powerups
    for (const powerup of this.powerups) {
      if (powerup.active) {
        powerup.update(this.scene.game.loop.delta);
      }
    }
    
    // Clean up off-screen elements
    this.cleanup(cameraY);
    
    // Redraw track
    this.draw();
  }
  
  cleanup(cameraY) {
    const cullDistance = this.scene.cameras.main.height;
    
    // Remove old segments
    this.segments = this.segments.filter(seg => seg.startY < cameraY + cullDistance);
    
    // Remove old obstacles
    this.obstacles = this.obstacles.filter(obs => {
      if (obs.y > cameraY + cullDistance) {
        obs.destroy();
        return false;
      }
      return true;
    });
    
    // Remove old currents
    this.currents = this.currents.filter(curr => {
      if (curr.y > cameraY + cullDistance) {
        curr.destroy();
        return false;
      }
      return true;
    });
    
    // Remove old powerups
    this.powerups = this.powerups.filter(pw => {
      if (!pw.active || pw.y > cameraY + cullDistance) {
        pw.destroy();
        return false;
      }
      return true;
    });
  }
  
  draw() {
    this.floorGraphics.clear();
    this.wallGraphics.clear();
    
    // Draw each segment
    for (let i = 0; i < this.segments.length - 1; i++) {
      const seg = this.segments[i];
      const nextSeg = this.segments[i + 1];
      
      // Floor (track surface)
      this.floorGraphics.fillStyle(GAME_CONFIG.COLORS.TRACK_FLOOR, 1);
      this.floorGraphics.beginPath();
      this.floorGraphics.moveTo(seg.startX - seg.width / 2, seg.startY);
      this.floorGraphics.lineTo(seg.startX + seg.width / 2, seg.startY);
      this.floorGraphics.lineTo(nextSeg.startX + nextSeg.width / 2, nextSeg.startY);
      this.floorGraphics.lineTo(nextSeg.startX - nextSeg.width / 2, nextSeg.startY);
      this.floorGraphics.closePath();
      this.floorGraphics.fillPath();
      
      // Walls (side boundaries)
      this.wallGraphics.lineStyle(8, GAME_CONFIG.COLORS.TRACK_WALL, 1);
      this.wallGraphics.lineBetween(
        seg.startX - seg.width / 2, seg.startY,
        nextSeg.startX - nextSeg.width / 2, nextSeg.startY
      );
      this.wallGraphics.lineBetween(
        seg.startX + seg.width / 2, seg.startY,
        nextSeg.startX + nextSeg.width / 2, nextSeg.startY
      );
      
      // Checkpoint marker
      if (seg.isCheckpoint) {
        this.floorGraphics.lineStyle(4, 0x00ffaa, 0.5);
        this.floorGraphics.lineBetween(
          seg.startX - seg.width / 2 + 10, seg.startY,
          seg.startX + seg.width / 2 - 10, seg.startY
        );
      }
    }
  }
  
  getTrackBoundsAtY(y) {
    // Find the segment at this Y position
    for (let i = 0; i < this.segments.length - 1; i++) {
      const seg = this.segments[i];
      const nextSeg = this.segments[i + 1];
      
      if (y <= seg.startY && y >= nextSeg.startY) {
        // Interpolate width and center position
        const t = (seg.startY - y) / (seg.startY - nextSeg.startY);
        const centerX = Phaser.Math.Linear(seg.startX, nextSeg.startX, t);
        const width = Phaser.Math.Linear(seg.width, nextSeg.width, t);
        
        return {
          left: centerX - width / 2,
          right: centerX + width / 2,
          center: centerX,
          width: width
        };
      }
    }
    
    // Default bounds if not found
    const screenWidth = this.scene.cameras.main.width;
    return {
      left: 50,
      right: screenWidth - 50,
      center: screenWidth / 2,
      width: screenWidth - 100
    };
  }
  
  placeEgg(y) {
    this.eggY = y;
    
    // Create egg visual
    this.eggGraphics = this.scene.add.graphics();
    this.drawEgg();
  }
  
  drawEgg() {
    if (!this.eggGraphics || this.eggY === null) return;
    
    const x = this.scene.cameras.main.width / 2;
    
    this.eggGraphics.clear();
    
    // Glow effect
    this.eggGraphics.fillStyle(GAME_CONFIG.COLORS.EGG, 0.2);
    this.eggGraphics.fillCircle(x, this.eggY, 80);
    this.eggGraphics.fillStyle(GAME_CONFIG.COLORS.EGG, 0.3);
    this.eggGraphics.fillCircle(x, this.eggY, 60);
    
    // Main egg
    this.eggGraphics.fillStyle(GAME_CONFIG.COLORS.EGG, 1);
    this.eggGraphics.fillCircle(x, this.eggY, 40);
    
    // Highlight
    this.eggGraphics.fillStyle(0xffffff, 0.4);
    this.eggGraphics.fillCircle(x - 10, this.eggY - 10, 12);
  }
  
  checkEggCollision(player) {
    if (this.eggY === null) return false;
    
    const x = this.scene.cameras.main.width / 2;
    const dx = player.x - x;
    const dy = player.y - this.eggY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist < 50;
  }
  
  destroy() {
    this.floorGraphics.destroy();
    this.wallGraphics.destroy();
    
    for (const obs of this.obstacles) {
      obs.destroy();
    }
    
    for (const curr of this.currents) {
      curr.destroy();
    }
    
    for (const pw of this.powerups) {
      pw.destroy();
    }
    
    if (this.eggGraphics) {
      this.eggGraphics.destroy();
    }
  }
}
