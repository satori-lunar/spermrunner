// Track - Flowing abstract tunnels with soft gradients
import { GAME_CONFIG, STAGE_CONFIG, OBSTACLE_TYPES, POWERUP_TYPES } from '../config/GameConfig.js';
import { Obstacle, Current, Powerup } from './Obstacle.js';

export class Track {
  constructor(scene) {
    this.scene = scene;
    
    // Track segments
    this.segments = [];
    this.obstacles = [];
    this.currents = [];
    this.powerups = [];
    
    // Generation state
    this.lastSegmentY = 0;
    this.currentStage = 0;
    this.segmentsGenerated = 0;
    
    // Graphics layers
    this.bgGraphics = scene.add.graphics();
    this.floorGraphics = scene.add.graphics();
    this.wallGraphics = scene.add.graphics();
    this.decorGraphics = scene.add.graphics();
    
    // Energy Core (goal)
    this.coreGraphics = null;
    this.coreY = null;
    this.coreAnimTime = 0;
    
    // Floating particles for atmosphere
    this.bgParticles = [];
    for (let i = 0; i < 40; i++) {
      this.bgParticles.push({
        x: Math.random() * scene.cameras.main.width,
        y: Math.random() * 2000 - 1000,
        size: 1 + Math.random() * 3,
        speed: 10 + Math.random() * 30,
        alpha: 0.1 + Math.random() * 0.3,
        drift: (Math.random() - 0.5) * 20
      });
    }
    
    this.currentWidth = GAME_CONFIG.TRACK.BASE_WIDTH;
  }
  
  generateInitialTrack(stageConfig) {
    this.currentStage = stageConfig.stage - 1;
    
    for (let i = 0; i < 10; i++) {
      this.generateSegment(stageConfig);
    }
    
    this.draw();
  }
  
  generateSegment(stageConfig) {
    const segmentLength = GAME_CONFIG.TRACK.SEGMENT_LENGTH;
    const baseWidth = GAME_CONFIG.TRACK.BASE_WIDTH * stageConfig.trackWidth;
    
    // Smooth turn calculation
    let turnOffset = 0;
    if (Math.random() < stageConfig.turnFrequency) {
      turnOffset = (Math.random() - 0.5) * baseWidth * stageConfig.turnSharpness * 0.8;
    }
    
    const prevSegment = this.segments[this.segments.length - 1];
    const startX = prevSegment ? prevSegment.endX : this.scene.cameras.main.width / 2;
    const startY = prevSegment ? prevSegment.endY : 0;
    
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
      isCheckpoint: this.segmentsGenerated % GAME_CONFIG.TRACK.CHECKPOINT_INTERVAL === 0,
      // Color variation for visual interest
      hueShift: Math.sin(this.segmentsGenerated * 0.1) * 0.1
    };
    
    this.segments.push(segment);
    this.segmentsGenerated++;
    
    this.generateObstaclesForSegment(segment, stageConfig);
    
    if (Math.random() < stageConfig.currentFrequency) {
      this.generateCurrentForSegment(segment);
    }
    
    if (Math.random() < 0.12) {
      this.generatePowerupForSegment(segment);
    }
    
    return segment;
  }
  
  generateObstaclesForSegment(segment, stageConfig) {
    const numChecks = 3;
    for (let i = 0; i < numChecks; i++) {
      if (Math.random() < stageConfig.obstacleFrequency) {
        const types = Object.values(OBSTACLE_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        const progress = (i + 0.5) / numChecks;
        const y = Phaser.Math.Linear(segment.startY, segment.endY, progress);
        const centerX = Phaser.Math.Linear(segment.startX, segment.endX, progress);
        const x = centerX + (Math.random() - 0.5) * segment.width * 0.6;
        
        const obstacle = new Obstacle(this.scene, x, y, type);
        this.obstacles.push(obstacle);
      }
    }
  }
  
  generateCurrentForSegment(segment) {
    const centerX = (segment.startX + segment.endX) / 2;
    const centerY = (segment.startY + segment.endY) / 2;
    
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = (Math.random() - 0.5) * 0.4;
    
    const current = new Current(
      this.scene,
      centerX,
      centerY,
      segment.width * 0.7,
      GAME_CONFIG.TRACK.SEGMENT_LENGTH * 0.35,
      dirX,
      dirY,
      130
    );
    
    this.currents.push(current);
  }
  
  generatePowerupForSegment(segment) {
    const types = Object.values(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    const centerX = (segment.startX + segment.endX) / 2;
    const y = (segment.startY + segment.endY) / 2;
    const x = centerX + (Math.random() - 0.5) * segment.width * 0.4;
    
    const powerup = new Powerup(this.scene, x, y, type);
    this.powerups.push(powerup);
  }
  
  update(cameraY, stageConfig) {
    const delta = this.scene.game.loop.delta;
    this.coreAnimTime += delta;
    
    // Generate new segments
    const lastSegment = this.segments[this.segments.length - 1];
    const lookAhead = this.scene.cameras.main.height * 2;
    
    while (lastSegment && lastSegment.endY > cameraY - lookAhead) {
      this.generateSegment(stageConfig);
    }
    
    // Update all entities
    for (const obstacle of this.obstacles) {
      obstacle.update(delta);
    }
    
    for (const current of this.currents) {
      current.update(delta);
    }
    
    for (const powerup of this.powerups) {
      if (powerup.active) {
        powerup.update(delta);
      }
    }
    
    // Update background particles
    this.updateBgParticles(cameraY, delta);
    
    // Cleanup
    this.cleanup(cameraY);
    
    // Redraw
    this.draw();
  }
  
  updateBgParticles(cameraY, delta) {
    const dt = delta / 1000;
    const height = this.scene.cameras.main.height;
    
    for (const p of this.bgParticles) {
      p.y -= p.speed * dt;
      p.x += p.drift * dt;
      
      // Reset when off screen
      if (p.y < cameraY - height) {
        p.y = cameraY + height + 50;
        p.x = Math.random() * this.scene.cameras.main.width;
      }
    }
  }
  
  cleanup(cameraY) {
    const cullDistance = this.scene.cameras.main.height;
    
    this.segments = this.segments.filter(seg => seg.startY < cameraY + cullDistance);
    
    this.obstacles = this.obstacles.filter(obs => {
      if (obs.y > cameraY + cullDistance) {
        obs.destroy();
        return false;
      }
      return true;
    });
    
    this.currents = this.currents.filter(curr => {
      if (curr.y > cameraY + cullDistance) {
        curr.destroy();
        return false;
      }
      return true;
    });
    
    this.powerups = this.powerups.filter(pw => {
      if (!pw.active || pw.y > cameraY + cullDistance) {
        pw.destroy();
        return false;
      }
      return true;
    });
  }
  
  draw() {
    const colors = GAME_CONFIG.COLORS;
    
    this.bgGraphics.clear();
    this.floorGraphics.clear();
    this.wallGraphics.clear();
    this.decorGraphics.clear();
    
    // Draw background particles
    for (const p of this.bgParticles) {
      this.bgGraphics.fillStyle(0xffffff, p.alpha);
      this.bgGraphics.fillCircle(p.x, p.y, p.size);
    }
    
    // Draw each segment
    for (let i = 0; i < this.segments.length - 1; i++) {
      const seg = this.segments[i];
      const nextSeg = this.segments[i + 1];
      
      // Floor with gradient effect
      const floorColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(colors.TRACK_FLOOR_1),
        Phaser.Display.Color.ValueToColor(colors.TRACK_FLOOR_2),
        100,
        Math.abs(Math.sin(seg.index * 0.05)) * 100
      );
      const floorHex = Phaser.Display.Color.GetColor(floorColor.r, floorColor.g, floorColor.b);
      
      this.floorGraphics.fillStyle(floorHex, 0.9);
      this.floorGraphics.beginPath();
      this.floorGraphics.moveTo(seg.startX - seg.width / 2, seg.startY);
      this.floorGraphics.lineTo(seg.startX + seg.width / 2, seg.startY);
      this.floorGraphics.lineTo(nextSeg.startX + nextSeg.width / 2, nextSeg.startY);
      this.floorGraphics.lineTo(nextSeg.startX - nextSeg.width / 2, nextSeg.startY);
      this.floorGraphics.closePath();
      this.floorGraphics.fillPath();
      
      // Soft glowing walls
      const wallGlow = 8 + Math.sin(seg.index * 0.1) * 3;
      
      // Left wall glow
      this.wallGraphics.fillStyle(colors.TRACK_WALL_GLOW, 0.15);
      this.wallGraphics.beginPath();
      this.wallGraphics.moveTo(seg.startX - seg.width / 2 - wallGlow, seg.startY);
      this.wallGraphics.lineTo(seg.startX - seg.width / 2, seg.startY);
      this.wallGraphics.lineTo(nextSeg.startX - nextSeg.width / 2, nextSeg.startY);
      this.wallGraphics.lineTo(nextSeg.startX - nextSeg.width / 2 - wallGlow, nextSeg.startY);
      this.wallGraphics.closePath();
      this.wallGraphics.fillPath();
      
      // Right wall glow
      this.wallGraphics.beginPath();
      this.wallGraphics.moveTo(seg.startX + seg.width / 2, seg.startY);
      this.wallGraphics.lineTo(seg.startX + seg.width / 2 + wallGlow, seg.startY);
      this.wallGraphics.lineTo(nextSeg.startX + nextSeg.width / 2 + wallGlow, nextSeg.startY);
      this.wallGraphics.lineTo(nextSeg.startX + nextSeg.width / 2, nextSeg.startY);
      this.wallGraphics.closePath();
      this.wallGraphics.fillPath();
      
      // Wall lines
      this.wallGraphics.lineStyle(3, colors.TRACK_WALL, 0.7);
      this.wallGraphics.lineBetween(
        seg.startX - seg.width / 2, seg.startY,
        nextSeg.startX - nextSeg.width / 2, nextSeg.startY
      );
      this.wallGraphics.lineBetween(
        seg.startX + seg.width / 2, seg.startY,
        nextSeg.startX + nextSeg.width / 2, nextSeg.startY
      );
      
      // Checkpoint glow
      if (seg.isCheckpoint) {
        this.decorGraphics.lineStyle(4, colors.POWERUP_SPEED, 0.4);
        this.decorGraphics.lineBetween(
          seg.startX - seg.width / 2 + 15, seg.startY,
          seg.startX + seg.width / 2 - 15, seg.startY
        );
        
        // Checkpoint sparkles
        for (let j = 0; j < 3; j++) {
          const sparkX = seg.startX + (j - 1) * (seg.width / 4);
          this.decorGraphics.fillStyle(0xffffff, 0.5);
          this.decorGraphics.fillCircle(sparkX, seg.startY, 3);
        }
      }
    }
    
    // Draw energy core if placed
    if (this.coreY !== null) {
      this.drawEnergyCore();
    }
  }
  
  getTrackBoundsAtY(y) {
    for (let i = 0; i < this.segments.length - 1; i++) {
      const seg = this.segments[i];
      const nextSeg = this.segments[i + 1];
      
      if (y <= seg.startY && y >= nextSeg.startY) {
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
    
    const screenWidth = this.scene.cameras.main.width;
    return {
      left: 50,
      right: screenWidth - 50,
      center: screenWidth / 2,
      width: screenWidth - 100
    };
  }
  
  placeEnergyCore(y) {
    this.coreY = y;
    
    if (!this.coreGraphics) {
      this.coreGraphics = this.scene.add.graphics();
    }
  }
  
  drawEnergyCore() {
    if (!this.coreGraphics || this.coreY === null) return;
    
    const colors = GAME_CONFIG.COLORS;
    const x = this.scene.cameras.main.width / 2;
    const y = this.coreY;
    
    this.coreGraphics.clear();
    
    const pulse = 1 + Math.sin(this.coreAnimTime * 0.003) * 0.15;
    const rotation = this.coreAnimTime * 0.001;
    
    // Outer glow rings
    for (let i = 3; i >= 0; i--) {
      const ringSize = (60 + i * 20) * pulse;
      const alpha = 0.1 - i * 0.02;
      this.coreGraphics.fillStyle(colors.GOAL_GLOW, alpha);
      this.coreGraphics.fillCircle(x, y, ringSize);
    }
    
    // Rotating ring
    this.coreGraphics.lineStyle(3, colors.GOAL_RING, 0.6);
    this.coreGraphics.beginPath();
    for (let i = 0; i <= 32; i++) {
      const angle = (i / 32) * Math.PI * 2 + rotation;
      const wobble = 1 + Math.sin(angle * 4 + this.coreAnimTime * 0.005) * 0.1;
      const radius = 50 * wobble * pulse;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius * 0.6; // Flatten for perspective
      if (i === 0) {
        this.coreGraphics.moveTo(px, py);
      } else {
        this.coreGraphics.lineTo(px, py);
      }
    }
    this.coreGraphics.strokePath();
    
    // Inner core
    this.coreGraphics.fillStyle(colors.GOAL_CORE, 0.9);
    this.coreGraphics.fillCircle(x, y, 30 * pulse);
    
    // Core highlight
    this.coreGraphics.fillStyle(0xffffff, 0.7);
    this.coreGraphics.fillCircle(x - 8, y - 8, 10);
    
    // Sparkles around core
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + rotation * 2;
      const dist = 45 + Math.sin(this.coreAnimTime * 0.004 + i) * 10;
      const sx = x + Math.cos(angle) * dist;
      const sy = y + Math.sin(angle) * dist;
      const sparkSize = 3 + Math.sin(this.coreAnimTime * 0.006 + i * 2) * 2;
      
      this.coreGraphics.fillStyle(0xffffff, 0.8);
      this.coreGraphics.fillCircle(sx, sy, sparkSize);
    }
  }
  
  checkCoreCollision(player) {
    if (this.coreY === null) return false;
    
    const x = this.scene.cameras.main.width / 2;
    const dx = player.x - x;
    const dy = player.y - this.coreY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist < 45;
  }
  
  destroy() {
    this.bgGraphics.destroy();
    this.floorGraphics.destroy();
    this.wallGraphics.destroy();
    this.decorGraphics.destroy();
    
    for (const obs of this.obstacles) {
      obs.destroy();
    }
    
    for (const curr of this.currents) {
      curr.destroy();
    }
    
    for (const pw of this.powerups) {
      pw.destroy();
    }
    
    if (this.coreGraphics) {
      this.coreGraphics.destroy();
    }
  }
}
