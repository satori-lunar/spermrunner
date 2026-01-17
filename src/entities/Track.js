// Track - Flowing tunnel maze with depth and curves
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
    
    // Graphics layers (ordered for depth)
    this.tunnelBgGraphics = scene.add.graphics();    // Deep background
    this.tunnelWallsGraphics = scene.add.graphics(); // Tunnel walls
    this.floorGraphics = scene.add.graphics();       // Track floor
    this.wallGlowGraphics = scene.add.graphics();    // Wall glow effects
    this.decorGraphics = scene.add.graphics();       // Decorations
    this.vignetteGraphics = scene.add.graphics();    // Screen vignette
    
    // Create vignette overlay (fixed to camera)
    this.createVignette();
    
    // Energy Core (goal)
    this.coreGraphics = null;
    this.coreY = null;
    this.coreAnimTime = 0;
    
    // Parallax background particles (different depths)
    this.bgParticlesDeep = [];
    this.bgParticlesMid = [];
    this.bgParticlesNear = [];
    this.initParticleLayers();
    
    this.currentWidth = GAME_CONFIG.TRACK.BASE_WIDTH;
    this.animTime = 0;
  }
  
  createVignette() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    this.vignetteGraphics.setScrollFactor(0);
    this.vignetteGraphics.setDepth(800);
    
    // Create radial vignette effect
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.max(width, height);
    
    // Draw gradient rings from outside in
    for (let r = maxRadius; r > maxRadius * 0.4; r -= 5) {
      const alpha = Math.pow((r - maxRadius * 0.4) / (maxRadius * 0.6), 2) * 0.6;
      this.vignetteGraphics.fillStyle(0x000510, alpha);
      this.vignetteGraphics.fillCircle(centerX, centerY, r);
    }
    
    // Top light gradient (light source from above)
    for (let i = 0; i < 80; i++) {
      const alpha = (1 - i / 80) * 0.08;
      this.vignetteGraphics.fillStyle(0x4fc3f7, alpha);
      this.vignetteGraphics.fillRect(0, i, width, 1);
    }
  }
  
  initParticleLayers() {
    const width = this.scene.cameras.main.width;
    
    // Deep layer (slowest, smallest)
    for (let i = 0; i < 30; i++) {
      this.bgParticlesDeep.push({
        x: Math.random() * width,
        y: Math.random() * 3000 - 1500,
        size: 1 + Math.random() * 1.5,
        speed: 5 + Math.random() * 10,
        alpha: 0.15 + Math.random() * 0.15,
        parallax: 0.3
      });
    }
    
    // Mid layer
    for (let i = 0; i < 20; i++) {
      this.bgParticlesMid.push({
        x: Math.random() * width,
        y: Math.random() * 2000 - 1000,
        size: 2 + Math.random() * 2,
        speed: 15 + Math.random() * 20,
        alpha: 0.2 + Math.random() * 0.2,
        parallax: 0.6
      });
    }
    
    // Near layer (fastest, brightest)
    for (let i = 0; i < 15; i++) {
      this.bgParticlesNear.push({
        x: Math.random() * width,
        y: Math.random() * 1500 - 750,
        size: 2 + Math.random() * 3,
        speed: 30 + Math.random() * 40,
        alpha: 0.3 + Math.random() * 0.3,
        parallax: 0.9
      });
    }
  }
  
  generateInitialTrack(stageConfig) {
    this.currentStage = stageConfig.stage - 1;
    
    for (let i = 0; i < 12; i++) {
      this.generateSegment(stageConfig);
    }
    
    this.draw();
  }
  
  generateSegment(stageConfig) {
    const segmentLength = GAME_CONFIG.TRACK.SEGMENT_LENGTH;
    const baseWidth = GAME_CONFIG.TRACK.BASE_WIDTH * stageConfig.trackWidth;
    
    // More dynamic curves for maze feel
    let turnOffset = 0;
    const turnChance = stageConfig.turnFrequency * 1.5;
    
    if (Math.random() < turnChance) {
      // Sharper, more varied turns
      turnOffset = (Math.random() - 0.5) * baseWidth * stageConfig.turnSharpness * 1.2;
    }
    
    // Width variation for narrow/wide sections (maze feel)
    let widthVariation = 1.0;
    if (Math.random() < 0.3) {
      widthVariation = 0.6 + Math.random() * 0.5; // Narrow choke points
    } else if (Math.random() < 0.2) {
      widthVariation = 1.1 + Math.random() * 0.2; // Wide sections
    }
    
    const prevSegment = this.segments[this.segments.length - 1];
    const startX = prevSegment ? prevSegment.endX : this.scene.cameras.main.width / 2;
    const startY = prevSegment ? prevSegment.endY : 0;
    const startWidth = prevSegment ? prevSegment.endWidth : baseWidth;
    
    const screenWidth = this.scene.cameras.main.width;
    const margin = baseWidth / 2 + 30;
    let endX = startX + turnOffset;
    endX = Phaser.Math.Clamp(endX, margin, screenWidth - margin);
    
    const endWidth = baseWidth * widthVariation;
    
    const segment = {
      index: this.segmentsGenerated,
      startX: startX,
      startY: startY,
      startWidth: startWidth,
      endX: endX,
      endY: startY - segmentLength,
      endWidth: endWidth,
      width: (startWidth + endWidth) / 2,
      isCheckpoint: this.segmentsGenerated % GAME_CONFIG.TRACK.CHECKPOINT_INTERVAL === 0,
      isNarrow: widthVariation < 0.8,
      isWide: widthVariation > 1.1,
      curveIntensity: Math.abs(turnOffset) / baseWidth
    };
    
    this.segments.push(segment);
    this.segmentsGenerated++;
    
    this.generateObstaclesForSegment(segment, stageConfig);
    
    if (Math.random() < stageConfig.currentFrequency) {
      this.generateCurrentForSegment(segment);
    }
    
    if (Math.random() < 0.1) {
      this.generatePowerupForSegment(segment);
    }
    
    return segment;
  }
  
  generateObstaclesForSegment(segment, stageConfig) {
    // More obstacles in narrow sections (risk/reward)
    const obstacleMultiplier = segment.isNarrow ? 1.5 : 1.0;
    const numChecks = 3;
    
    for (let i = 0; i < numChecks; i++) {
      if (Math.random() < stageConfig.obstacleFrequency * obstacleMultiplier) {
        const types = Object.values(OBSTACLE_TYPES);
        const type = types[Math.floor(Math.random() * types.length)];
        
        const progress = (i + 0.5) / numChecks;
        const y = Phaser.Math.Linear(segment.startY, segment.endY, progress);
        const centerX = Phaser.Math.Linear(segment.startX, segment.endX, progress);
        const width = Phaser.Math.Linear(segment.startWidth, segment.endWidth, progress);
        const x = centerX + (Math.random() - 0.5) * width * 0.5;
        
        const obstacle = new Obstacle(this.scene, x, y, type);
        this.obstacles.push(obstacle);
      }
    }
  }
  
  generateCurrentForSegment(segment) {
    const centerX = (segment.startX + segment.endX) / 2;
    const centerY = (segment.startY + segment.endY) / 2;
    const width = (segment.startWidth + segment.endWidth) / 2;
    
    const dirX = Math.random() > 0.5 ? 1 : -1;
    const dirY = (Math.random() - 0.5) * 0.3;
    
    const current = new Current(
      this.scene,
      centerX,
      centerY,
      width * 0.6,
      GAME_CONFIG.TRACK.SEGMENT_LENGTH * 0.3,
      dirX,
      dirY,
      120
    );
    
    this.currents.push(current);
  }
  
  generatePowerupForSegment(segment) {
    const types = Object.values(POWERUP_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    const centerX = (segment.startX + segment.endX) / 2;
    const y = (segment.startY + segment.endY) / 2;
    const width = (segment.startWidth + segment.endWidth) / 2;
    const x = centerX + (Math.random() - 0.5) * width * 0.3;
    
    const powerup = new Powerup(this.scene, x, y, type);
    this.powerups.push(powerup);
  }
  
  update(cameraY, stageConfig) {
    const delta = this.scene.game.loop.delta;
    this.animTime += delta;
    this.coreAnimTime += delta;
    
    // Generate new segments
    const lastSegment = this.segments[this.segments.length - 1];
    const lookAhead = this.scene.cameras.main.height * 2.5;
    
    while (lastSegment && lastSegment.endY > cameraY - lookAhead) {
      this.generateSegment(stageConfig);
    }
    
    // Update entities
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
    
    // Update parallax particles
    this.updateParticles(cameraY, delta);
    
    this.cleanup(cameraY);
    this.draw();
  }
  
  updateParticles(cameraY, delta) {
    const dt = delta / 1000;
    const height = this.scene.cameras.main.height;
    const width = this.scene.cameras.main.width;
    
    const updateLayer = (particles) => {
      for (const p of particles) {
        p.y -= p.speed * dt;
        
        if (p.y < cameraY - height) {
          p.y = cameraY + height + 50;
          p.x = Math.random() * width;
        }
      }
    };
    
    updateLayer(this.bgParticlesDeep);
    updateLayer(this.bgParticlesMid);
    updateLayer(this.bgParticlesNear);
  }
  
  cleanup(cameraY) {
    const cullDistance = this.scene.cameras.main.height * 1.5;
    
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
    const screenWidth = this.scene.cameras.main.width;
    
    this.tunnelBgGraphics.clear();
    this.tunnelWallsGraphics.clear();
    this.floorGraphics.clear();
    this.wallGlowGraphics.clear();
    this.decorGraphics.clear();
    
    // Draw deep background particles
    for (const p of this.bgParticlesDeep) {
      this.tunnelBgGraphics.fillStyle(0x4fc3f7, p.alpha * 0.5);
      this.tunnelBgGraphics.fillCircle(p.x, p.y, p.size);
    }
    
    // Draw mid particles
    for (const p of this.bgParticlesMid) {
      this.tunnelBgGraphics.fillStyle(0x80deea, p.alpha * 0.7);
      this.tunnelBgGraphics.fillCircle(p.x, p.y, p.size);
    }
    
    // Draw tunnel segments
    for (let i = 0; i < this.segments.length - 1; i++) {
      const seg = this.segments[i];
      const nextSeg = this.segments[i + 1];
      
      this.drawTunnelSegment(seg, nextSeg, i);
    }
    
    // Draw near particles (on top of tunnel)
    for (const p of this.bgParticlesNear) {
      this.decorGraphics.fillStyle(0xffffff, p.alpha);
      this.decorGraphics.fillCircle(p.x, p.y, p.size);
    }
    
    // Draw energy core
    if (this.coreY !== null) {
      this.drawEnergyCore();
    }
  }
  
  drawTunnelSegment(seg, nextSeg, index) {
    const colors = GAME_CONFIG.COLORS;
    const screenWidth = this.scene.cameras.main.width;
    
    // Interpolated values
    const segCenterX = seg.startX;
    const nextCenterX = nextSeg.startX;
    const segHalfW = seg.startWidth / 2;
    const nextHalfW = nextSeg.startWidth / 2;
    
    // === TUNNEL FLOOR (center path) ===
    // Gradient based on depth/position
    const depthFactor = Math.sin(index * 0.08) * 0.5 + 0.5;
    const floorColor1 = Phaser.Display.Color.Interpolate.ColorWithColor(
      { r: 15, g: 30, b: 60 },
      { r: 25, g: 50, b: 80 },
      100,
      depthFactor * 100
    );
    const floorHex = Phaser.Display.Color.GetColor(floorColor1.r, floorColor1.g, floorColor1.b);
    
    this.floorGraphics.fillStyle(floorHex, 0.95);
    this.floorGraphics.beginPath();
    this.floorGraphics.moveTo(segCenterX - segHalfW, seg.startY);
    this.floorGraphics.lineTo(segCenterX + segHalfW, seg.startY);
    this.floorGraphics.lineTo(nextCenterX + nextHalfW, nextSeg.startY);
    this.floorGraphics.lineTo(nextCenterX - nextHalfW, nextSeg.startY);
    this.floorGraphics.closePath();
    this.floorGraphics.fillPath();
    
    // === TUNNEL WALLS (3D depth illusion) ===
    const wallDepth = 40;
    const wallAlphaBase = 0.7;
    
    // Left wall - darker (away from light)
    for (let d = 0; d < 3; d++) {
      const depth = d * (wallDepth / 3);
      const alpha = wallAlphaBase - d * 0.2;
      const shade = 0.6 - d * 0.15;
      
      this.tunnelWallsGraphics.fillStyle(
        Phaser.Display.Color.GetColor(20 * shade, 40 * shade, 70 * shade),
        alpha
      );
      this.tunnelWallsGraphics.beginPath();
      this.tunnelWallsGraphics.moveTo(segCenterX - segHalfW - depth, seg.startY);
      this.tunnelWallsGraphics.lineTo(segCenterX - segHalfW, seg.startY);
      this.tunnelWallsGraphics.lineTo(nextCenterX - nextHalfW, nextSeg.startY);
      this.tunnelWallsGraphics.lineTo(nextCenterX - nextHalfW - depth, nextSeg.startY);
      this.tunnelWallsGraphics.closePath();
      this.tunnelWallsGraphics.fillPath();
    }
    
    // Right wall - lighter (toward light)
    for (let d = 0; d < 3; d++) {
      const depth = d * (wallDepth / 3);
      const alpha = wallAlphaBase - d * 0.2;
      const shade = 0.8 - d * 0.15;
      
      this.tunnelWallsGraphics.fillStyle(
        Phaser.Display.Color.GetColor(30 * shade, 55 * shade, 90 * shade),
        alpha
      );
      this.tunnelWallsGraphics.beginPath();
      this.tunnelWallsGraphics.moveTo(segCenterX + segHalfW, seg.startY);
      this.tunnelWallsGraphics.lineTo(segCenterX + segHalfW + depth, seg.startY);
      this.tunnelWallsGraphics.lineTo(nextCenterX + nextHalfW + depth, nextSeg.startY);
      this.tunnelWallsGraphics.lineTo(nextCenterX + nextHalfW, nextSeg.startY);
      this.tunnelWallsGraphics.closePath();
      this.tunnelWallsGraphics.fillPath();
    }
    
    // === WALL EDGE GLOW ===
    const glowPulse = 0.5 + Math.sin(this.animTime * 0.002 + index * 0.3) * 0.3;
    
    // Left edge glow
    this.wallGlowGraphics.lineStyle(3, colors.TRACK_WALL, 0.6 * glowPulse);
    this.wallGlowGraphics.lineBetween(
      segCenterX - segHalfW, seg.startY,
      nextCenterX - nextHalfW, nextSeg.startY
    );
    
    // Left edge outer glow
    this.wallGlowGraphics.lineStyle(8, colors.TRACK_WALL_GLOW, 0.15 * glowPulse);
    this.wallGlowGraphics.lineBetween(
      segCenterX - segHalfW - 2, seg.startY,
      nextCenterX - nextHalfW - 2, nextSeg.startY
    );
    
    // Right edge glow (brighter - toward light)
    this.wallGlowGraphics.lineStyle(3, colors.TRACK_WALL, 0.8 * glowPulse);
    this.wallGlowGraphics.lineBetween(
      segCenterX + segHalfW, seg.startY,
      nextCenterX + nextHalfW, nextSeg.startY
    );
    
    // Right edge outer glow
    this.wallGlowGraphics.lineStyle(10, colors.TRACK_WALL_GLOW, 0.2 * glowPulse);
    this.wallGlowGraphics.lineBetween(
      segCenterX + segHalfW + 2, seg.startY,
      nextCenterX + nextHalfW + 2, nextSeg.startY
    );
    
    // === NARROW SECTION WARNING ===
    if (seg.isNarrow) {
      const warningPulse = 0.3 + Math.sin(this.animTime * 0.006) * 0.2;
      this.decorGraphics.fillStyle(0xff6b6b, warningPulse);
      
      // Warning markers on walls
      const midY = (seg.startY + nextSeg.startY) / 2;
      const midX = (segCenterX + nextCenterX) / 2;
      const midW = (segHalfW + nextHalfW) / 2;
      
      this.decorGraphics.fillTriangle(
        midX - midW + 5, midY - 10,
        midX - midW + 15, midY,
        midX - midW + 5, midY + 10
      );
      this.decorGraphics.fillTriangle(
        midX + midW - 5, midY - 10,
        midX + midW - 15, midY,
        midX + midW - 5, midY + 10
      );
    }
    
    // === CHECKPOINT MARKERS ===
    if (seg.isCheckpoint) {
      const checkY = seg.startY;
      const checkX = segCenterX;
      const checkW = segHalfW;
      
      // Glowing checkpoint line
      this.decorGraphics.lineStyle(2, 0x00e676, 0.6);
      this.decorGraphics.lineBetween(checkX - checkW + 10, checkY, checkX + checkW - 10, checkY);
      
      // Checkpoint sparkles
      for (let s = 0; s < 5; s++) {
        const sparkX = checkX - checkW + 20 + s * ((checkW * 2 - 40) / 4);
        const sparkY = checkY + Math.sin(this.animTime * 0.005 + s) * 3;
        this.decorGraphics.fillStyle(0xffffff, 0.7);
        this.decorGraphics.fillCircle(sparkX, sparkY, 2);
      }
    }
    
    // === FLOOR TEXTURE LINES (motion feel) ===
    const numLines = 3;
    for (let l = 0; l < numLines; l++) {
      const t = (l + 0.5) / numLines;
      const lineY = Phaser.Math.Linear(seg.startY, nextSeg.startY, t);
      const lineX = Phaser.Math.Linear(segCenterX, nextCenterX, t);
      const lineW = Phaser.Math.Linear(segHalfW, nextHalfW, t);
      
      const lineAlpha = 0.1 + Math.sin(this.animTime * 0.003 + l + index) * 0.05;
      this.floorGraphics.lineStyle(1, 0x4fc3f7, lineAlpha);
      this.floorGraphics.lineBetween(lineX - lineW + 20, lineY, lineX + lineW - 20, lineY);
    }
  }
  
  getTrackBoundsAtY(y) {
    for (let i = 0; i < this.segments.length - 1; i++) {
      const seg = this.segments[i];
      const nextSeg = this.segments[i + 1];
      
      if (y <= seg.startY && y >= nextSeg.startY) {
        const t = (seg.startY - y) / (seg.startY - nextSeg.startY);
        const centerX = Phaser.Math.Linear(seg.startX, nextSeg.startX, t);
        const width = Phaser.Math.Linear(seg.startWidth, nextSeg.startWidth, t);
        
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
    for (let i = 4; i >= 0; i--) {
      const ringSize = (50 + i * 25) * pulse;
      const alpha = 0.08 - i * 0.015;
      this.coreGraphics.fillStyle(colors.GOAL_GLOW, alpha);
      this.coreGraphics.fillCircle(x, y, ringSize);
    }
    
    // Rotating energy ring
    this.coreGraphics.lineStyle(4, colors.GOAL_RING, 0.7);
    this.coreGraphics.beginPath();
    for (let i = 0; i <= 40; i++) {
      const angle = (i / 40) * Math.PI * 2 + rotation;
      const wobble = 1 + Math.sin(angle * 5 + this.coreAnimTime * 0.004) * 0.12;
      const radius = 45 * wobble * pulse;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius * 0.5;
      if (i === 0) {
        this.coreGraphics.moveTo(px, py);
      } else {
        this.coreGraphics.lineTo(px, py);
      }
    }
    this.coreGraphics.strokePath();
    
    // Inner core
    this.coreGraphics.fillStyle(colors.GOAL_CORE, 0.95);
    this.coreGraphics.fillCircle(x, y, 28 * pulse);
    
    // Core highlight
    this.coreGraphics.fillStyle(0xffffff, 0.8);
    this.coreGraphics.fillCircle(x - 7, y - 7, 9);
    
    // Orbiting sparkles
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 + rotation * 1.5;
      const dist = 55 + Math.sin(this.coreAnimTime * 0.003 + i) * 12;
      const sx = x + Math.cos(angle) * dist;
      const sy = y + Math.sin(angle) * dist * 0.6;
      const sparkSize = 2.5 + Math.sin(this.coreAnimTime * 0.005 + i * 2) * 1.5;
      
      this.coreGraphics.fillStyle(0xffffff, 0.9);
      this.coreGraphics.fillCircle(sx, sy, sparkSize);
    }
  }
  
  checkCoreCollision(player) {
    if (this.coreY === null) return false;
    
    const x = this.scene.cameras.main.width / 2;
    const dx = player.x - x;
    const dy = player.y - this.coreY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    return dist < 40;
  }
  
  destroy() {
    this.tunnelBgGraphics.destroy();
    this.tunnelWallsGraphics.destroy();
    this.floorGraphics.destroy();
    this.wallGlowGraphics.destroy();
    this.decorGraphics.destroy();
    this.vignetteGraphics.destroy();
    
    for (const obs of this.obstacles) obs.destroy();
    for (const curr of this.currents) curr.destroy();
    for (const pw of this.powerups) pw.destroy();
    
    if (this.coreGraphics) this.coreGraphics.destroy();
  }
}
