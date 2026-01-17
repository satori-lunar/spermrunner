// Game Scene - Main gameplay
import { GAME_CONFIG, STAGE_CONFIG, RIVAL_ARCHETYPES, POWERUP_TYPES } from '../config/GameConfig.js';
import { Player } from '../entities/Player.js';
import { Rival, createRival } from '../entities/Rival.js';
import { Track } from '../entities/Track.js';
import { StickyTrap } from '../entities/Obstacle.js';
import { TouchControls } from '../ui/TouchControls.js';
import { HUD } from '../ui/HUD.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  init(data) {
    this.startStage = data.stage || 1;
    this.initialElapsedTime = data.elapsedTime || 0;
  }
  
  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Game state
    this.currentStage = this.startStage;
    this.stageConfig = STAGE_CONFIG[this.currentStage - 1];
    this.elapsedTime = this.initialElapsedTime;
    this.stageStartTime = 0;
    this.isPaused = false;
    this.isGameOver = false;
    this.hasWon = false;
    
    // Create track
    this.track = new Track(this);
    this.track.generateInitialTrack(this.stageConfig);
    
    // Create player at bottom center
    this.player = new Player(this, width / 2, height * 0.8);
    
    // Create rivals
    this.rivals = [];
    this.spawnRivals();
    
    // Sticky traps dropped by player
    this.stickyTraps = [];
    
    // Set up camera to follow player
    this.cameras.main.startFollow(this.player.container, true, 0.1, 0.3);
    this.cameras.main.setFollowOffset(0, height * 0.3);
    
    // Create controls
    this.controls = new TouchControls(this);
    
    // Create HUD
    this.hud = new HUD(this);
    
    // Show stage intro
    this.hud.showStageTransition(this.currentStage, this.stageConfig.name);
    
    // Calculate total distance for all stages (for progress bar)
    this.calculateTotalDistance();
    
    // Distance tracking
    this.totalDistanceTraveled = 0;
    this.stageDistanceTraveled = 0;
    
    // Pause button
    this.createPauseButton();
    
    // Fade in
    this.cameras.main.fadeIn(500);
    
    // Auto-save periodically
    this.time.addEvent({
      delay: 30000,
      callback: this.saveProgress,
      callbackScope: this,
      loop: true
    });
  }
  
  calculateTotalDistance() {
    // Estimate total distance based on 30-minute gameplay
    // Average speed ~250 * 30 * 60 seconds = ~450,000 units total
    const avgSpeed = (GAME_CONFIG.PLAYER.BASE_SPEED + GAME_CONFIG.PLAYER.MAX_SPEED) / 2;
    this.totalGameDistance = avgSpeed * 30 * 60; // 30 minutes
    this.distancePerStage = this.totalGameDistance / STAGE_CONFIG.length;
  }
  
  spawnRivals() {
    const width = this.cameras.main.width;
    const count = this.stageConfig.rivalCount;
    
    // Clear existing rivals
    for (const rival of this.rivals) {
      rival.destroy();
    }
    this.rivals = [];
    
    // Spawn new rivals
    const archetypeKeys = Object.keys(RIVAL_ARCHETYPES);
    
    for (let i = 0; i < count; i++) {
      // Distribute rivals ahead of and around player
      const offsetY = -100 - Math.random() * 400;
      const offsetX = (Math.random() - 0.5) * (width * 0.6);
      
      // Pick archetype with some weighting
      const archetypeKey = archetypeKeys[Math.floor(Math.random() * archetypeKeys.length)];
      const archetype = RIVAL_ARCHETYPES[archetypeKey];
      
      const rival = createRival(
        this,
        width / 2 + offsetX,
        this.player.y + offsetY,
        archetype
      );
      rival.aggression = this.stageConfig.rivalAggression;
      
      this.rivals.push(rival);
    }
  }
  
  createPauseButton() {
    const pauseBtn = this.add.text(20, 80, '❚❚', {
      fontFamily: '"Courier New", monospace',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    });
    pauseBtn.setScrollFactor(0);
    pauseBtn.setDepth(1000);
    pauseBtn.setInteractive();
    
    pauseBtn.on('pointerdown', () => this.togglePause());
  }
  
  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.showPauseMenu();
    } else {
      this.hidePauseMenu();
    }
  }
  
  showPauseMenu() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.pauseOverlay = this.add.graphics();
    this.pauseOverlay.setScrollFactor(0);
    this.pauseOverlay.setDepth(1100);
    this.pauseOverlay.fillStyle(0x000000, 0.8);
    this.pauseOverlay.fillRect(0, 0, width, height);
    
    this.pauseText = this.add.text(width / 2, height / 2 - 50, 'PAUSED', {
      fontFamily: '"Courier New", monospace',
      fontSize: '36px',
      color: '#00ff88'
    }).setOrigin(0.5);
    this.pauseText.setScrollFactor(0);
    this.pauseText.setDepth(1101);
    
    // Resume button
    this.resumeText = this.add.text(width / 2, height / 2 + 20, 'Tap to Resume', {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.resumeText.setScrollFactor(0);
    this.resumeText.setDepth(1101);
    
    // Quit button
    this.quitText = this.add.text(width / 2, height / 2 + 60, 'Quit to Menu', {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#ff8888'
    }).setOrigin(0.5);
    this.quitText.setScrollFactor(0);
    this.quitText.setDepth(1101);
    this.quitText.setInteractive();
    this.quitText.on('pointerdown', () => {
      this.saveProgress();
      this.scene.start('MenuScene');
    });
    
    this.pauseOverlay.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    this.pauseOverlay.on('pointerdown', (pointer) => {
      // Check if not clicking quit
      const quitBounds = this.quitText.getBounds();
      if (!quitBounds.contains(pointer.x, pointer.y)) {
        this.togglePause();
      }
    });
  }
  
  hidePauseMenu() {
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
      this.pauseText.destroy();
      this.resumeText.destroy();
      this.quitText.destroy();
    }
  }
  
  update(time, delta) {
    if (this.isPaused || this.isGameOver) return;
    
    // Update elapsed time
    this.elapsedTime += delta;
    this.stageStartTime += delta;
    
    // Update controls with delta for smooth interpolation
    this.controls.update(delta);
    const input = this.controls.getInput();
    
    // Handle boost
    if (input.boost) {
      this.player.boost();
    }
    
    // Get track bounds at player position
    const trackBounds = this.track.getTrackBoundsAtY(this.player.y);
    
    // Update player
    this.player.update(delta, input, trackBounds, this.stageConfig.speedMultiplier);
    
    // Track distance
    const distThisFrame = this.player.speed * (delta / 1000);
    this.totalDistanceTraveled += distThisFrame;
    this.stageDistanceTraveled += distThisFrame;
    
    // Update rivals
    for (const rival of this.rivals) {
      const rivalBounds = this.track.getTrackBoundsAtY(rival.y);
      rival.update(
        delta,
        this.player,
        rivalBounds,
        this.track.obstacles,
        this.stageConfig.speedMultiplier,
        this.stageConfig.rivalAggression
      );
      
      // Keep rivals roughly in the race (respawn if too far behind)
      if (rival.y > this.player.y + 800) {
        rival.y = this.player.y - 200 - Math.random() * 300;
        rival.x = trackBounds.center + (Math.random() - 0.5) * trackBounds.width * 0.6;
      }
      
      // Prevent rivals from getting too far ahead
      if (rival.y < this.player.y - 600) {
        rival.speed *= 0.8;
      }
    }
    
    // Update track
    this.track.update(this.cameras.main.scrollY, this.stageConfig);
    
    // Update sticky traps
    for (let i = this.stickyTraps.length - 1; i >= 0; i--) {
      const trap = this.stickyTraps[i];
      trap.update(delta);
      if (!trap.active) {
        this.stickyTraps.splice(i, 1);
      }
    }
    
    // Check collisions
    this.checkCollisions();
    
    // Check stage progression
    this.checkStageProgression();
    
    // Update HUD
    this.updateHUD();
  }
  
  checkCollisions() {
    const playerBounds = this.player.getBounds();
    
    // Player vs Rivals
    for (const rival of this.rivals) {
      const rivalBounds = rival.getBounds();
      
      if (this.circleCollision(playerBounds, rivalBounds)) {
        // Calculate collision direction
        const dx = rival.x - this.player.x;
        const dy = rival.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = dx / dist;
        const ny = dy / dist;
        
        // Apply knockback to both
        const knockbackForce = GAME_CONFIG.PLAYER.COLLISION_KNOCKBACK;
        
        this.player.applyKnockback(-nx, -ny, knockbackForce * 0.5);
        rival.applyKnockback(nx, ny, knockbackForce * rival.bumpForce);
        
        // Separate them
        const overlap = (playerBounds.radius + rivalBounds.radius) - dist;
        if (overlap > 0) {
          rival.x += nx * overlap * 0.5;
          rival.y += ny * overlap * 0.5;
          this.player.x -= nx * overlap * 0.5;
          this.player.y -= ny * overlap * 0.5;
        }
        
        // Visual/haptic feedback
        this.cameras.main.shake(50, 0.003);
      }
    }
    
    // Player vs Obstacles
    for (const obstacle of this.track.obstacles) {
      if (obstacle.checkCollision(this.player)) {
        this.player.applySlowdown(obstacle.slowdownFactor);
        
        if (obstacle.knockback > 0) {
          const dx = this.player.x - obstacle.x;
          const dy = this.player.y - obstacle.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          this.player.applyKnockback(dx / dist, dy / dist, obstacle.knockback);
        }
      }
    }
    
    // Rivals vs Obstacles
    for (const rival of this.rivals) {
      for (const obstacle of this.track.obstacles) {
        if (obstacle.checkCollision(rival)) {
          rival.applySlowdown(obstacle.slowdownFactor, 500);
        }
      }
    }
    
    // Player vs Currents
    for (const current of this.track.currents) {
      current.applyForce(this.player, this.game.loop.delta);
      
      // Also apply to rivals
      for (const rival of this.rivals) {
        current.applyForce(rival, this.game.loop.delta);
      }
    }
    
    // Player vs Powerups
    for (const powerup of this.track.powerups) {
      if (powerup.active && powerup.checkCollision(this.player)) {
        this.collectPowerup(powerup);
        powerup.destroy();
      }
    }
    
    // Rivals vs Sticky Traps
    for (const trap of this.stickyTraps) {
      if (!trap.active) continue;
      
      for (const rival of this.rivals) {
        if (trap.checkCollision(rival)) {
          rival.applySlowdown(0.3, trap.slowDuration);
          this.hud.showMessage('Rival trapped!', 1000);
        }
      }
    }
  }
  
  circleCollision(a, b) {
    const dx = a.centerX - b.centerX;
    const dy = a.centerY - b.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < a.radius + b.radius;
  }
  
  collectPowerup(powerup) {
    switch (powerup.type.name) {
      case 'speed_boost':
        this.player.refillBoost();
        this.hud.showMessage('Boost Refilled!', 1000);
        break;
        
      case 'shield':
        this.player.activateShield(POWERUP_TYPES.SHIELD.duration);
        this.hud.showMessage('Shield Active!', 1000);
        break;
        
      case 'sticky_trap':
        // Drop a trap at current position
        const trap = new StickyTrap(this, this.player.x, this.player.y + 50);
        this.stickyTraps.push(trap);
        this.hud.showMessage('Trap Dropped!', 1000);
        break;
    }
  }
  
  checkStageProgression() {
    // Check if stage time/distance reached
    const stageComplete = this.stageDistanceTraveled >= this.distancePerStage;
    
    if (stageComplete) {
      if (this.currentStage >= STAGE_CONFIG.length) {
        // Final stage complete - player wins!
        this.winGame();
      } else {
        // Progress to next stage
        this.advanceStage();
      }
    }
  }
  
  advanceStage() {
    this.currentStage++;
    this.stageConfig = STAGE_CONFIG[this.currentStage - 1];
    this.stageDistanceTraveled = 0;
    this.stageStartTime = 0;
    
    // Show stage transition
    this.hud.showStageTransition(this.currentStage, this.stageConfig.name);
    
    // Spawn additional rivals for new stage
    this.addRivalsForStage();
    
    // Save progress
    this.saveProgress();
  }
  
  addRivalsForStage() {
    const currentCount = this.rivals.length;
    const targetCount = this.stageConfig.rivalCount;
    const toAdd = Math.max(0, targetCount - currentCount);
    
    const archetypeKeys = Object.keys(RIVAL_ARCHETYPES);
    const trackBounds = this.track.getTrackBoundsAtY(this.player.y);
    
    for (let i = 0; i < toAdd; i++) {
      const archetypeKey = archetypeKeys[Math.floor(Math.random() * archetypeKeys.length)];
      const archetype = RIVAL_ARCHETYPES[archetypeKey];
      
      const rival = createRival(
        this,
        trackBounds.center + (Math.random() - 0.5) * trackBounds.width * 0.6,
        this.player.y - 100 - Math.random() * 300,
        archetype
      );
      rival.aggression = this.stageConfig.rivalAggression;
      
      this.rivals.push(rival);
    }
    
    // Update aggression for existing rivals
    for (const rival of this.rivals) {
      rival.aggression = this.stageConfig.rivalAggression;
    }
  }
  
  winGame() {
    this.isGameOver = true;
    this.hasWon = true;
    
    // Place egg at current position
    this.track.placeEgg(this.player.y - 200);
    
    // Save best time
    this.saveBestTime();
    
    // Show victory screen
    this.showVictoryScreen();
  }
  
  showVictoryScreen() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Overlay
    const overlay = this.add.graphics();
    overlay.setScrollFactor(0);
    overlay.setDepth(1200);
    overlay.fillStyle(0x000000, 0.85);
    overlay.fillRect(0, 0, width, height);
    
    // Victory text
    const victoryText = this.add.text(width / 2, height * 0.3, 'YOU REACHED THE EGG!', {
      fontFamily: '"Courier New", monospace',
      fontSize: '28px',
      color: '#00ff88',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    victoryText.setScrollFactor(0);
    victoryText.setDepth(1201);
    
    // Time
    const minutes = Math.floor(this.elapsedTime / 60000);
    const seconds = Math.floor((this.elapsedTime % 60000) / 1000);
    const timeText = this.add.text(width / 2, height * 0.45, 
      `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    timeText.setScrollFactor(0);
    timeText.setDepth(1201);
    
    // Play again button
    const playAgain = this.add.text(width / 2, height * 0.65, 'PLAY AGAIN', {
      fontFamily: '"Courier New", monospace',
      fontSize: '22px',
      color: '#00ff88',
      backgroundColor: '#2d1a4c',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    playAgain.setScrollFactor(0);
    playAgain.setDepth(1201);
    playAgain.setInteractive();
    playAgain.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
    
    // Egg animation
    this.tweens.add({
      targets: victoryText,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1
    });
  }
  
  updateHUD() {
    // Calculate position among racers
    const allY = [this.player.y, ...this.rivals.map(r => r.y)];
    allY.sort((a, b) => a - b); // Lower Y = further ahead
    const position = allY.indexOf(this.player.y) + 1;
    
    // Calculate overall progress
    const overallProgress = Math.min(
      this.totalDistanceTraveled / this.totalGameDistance,
      1
    );
    
    // Calculate stage progress
    const stageProgress = Math.min(
      this.stageDistanceTraveled / this.distancePerStage,
      1
    );
    
    this.hud.update({
      stage: this.currentStage,
      stageName: this.stageConfig.name,
      progress: overallProgress,
      boostProgress: this.player.getBoostProgress(),
      canBoost: this.player.canBoost,
      position: position,
      totalRacers: this.rivals.length + 1,
      elapsedTime: this.elapsedTime,
      stageProgress: stageProgress
    });
  }
  
  saveProgress() {
    try {
      const data = {
        currentStage: this.currentStage,
        elapsedTime: this.elapsedTime,
        totalDistance: this.totalDistanceTraveled
      };
      localStorage.setItem('spermrunner_progress', JSON.stringify(data));
    } catch (e) {
      console.log('Could not save progress');
    }
  }
  
  saveBestTime() {
    try {
      const saved = localStorage.getItem('spermrunner_progress');
      const data = saved ? JSON.parse(saved) : {};
      
      if (!data.bestTime || this.elapsedTime < data.bestTime) {
        data.bestTime = this.elapsedTime;
      }
      
      data.currentStage = 1; // Reset stage progress
      localStorage.setItem('spermrunner_progress', JSON.stringify(data));
    } catch (e) {
      console.log('Could not save best time');
    }
  }
  
  shutdown() {
    // Clean up
    this.player.destroy();
    this.track.destroy();
    this.controls.destroy();
    this.hud.destroy();
    
    for (const rival of this.rivals) {
      rival.destroy();
    }
    
    for (const trap of this.stickyTraps) {
      trap.destroy();
    }
  }
}
