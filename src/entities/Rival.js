// Rival Entity - AI-controlled competing sperms
import { GAME_CONFIG, RIVAL_ARCHETYPES } from '../config/GameConfig.js';

export class Rival {
  constructor(scene, x, y, archetype) {
    this.scene = scene;
    this.archetype = archetype;
    
    // Create graphics
    this.graphics = scene.add.graphics();
    this.drawSperm();
    
    // Position
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.angle = -90;
    this.speed = 0;
    
    // Stats modified by archetype
    this.baseSpeed = GAME_CONFIG.PLAYER.BASE_SPEED * archetype.speedVariance;
    this.maxSpeed = GAME_CONFIG.PLAYER.MAX_SPEED * archetype.speedVariance;
    this.turnSpeed = GAME_CONFIG.PLAYER.TURN_SPEED * archetype.turnReaction;
    this.size = archetype.name === 'blocker' ? GAME_CONFIG.PLAYER.SIZE * 1.3 : GAME_CONFIG.PLAYER.SIZE;
    
    // AI behavior parameters
    this.bumpProbability = archetype.bumpProbability;
    this.bumpForce = archetype.bumpForce;
    this.aggression = 0.5;
    
    // State
    this.knockbackVelocity = { x: 0, y: 0 };
    this.isStunned = false;
    this.stunTimer = 0;
    this.targetLane = 0;
    this.bumpCooldown = 0;
    
    // Trail
    this.trail = [];
    this.trailGraphics = scene.add.graphics();
    
    // Random variation
    this.speedVariation = 0.9 + Math.random() * 0.2;
    this.reactionDelay = Math.random() * 0.3;
  }
  
  drawSperm() {
    this.graphics.clear();
    
    const color = this.archetype.color;
    const alpha = this.isStunned ? 0.5 : 1;
    
    // Tail
    this.graphics.lineStyle(2, color, 0.7 * alpha);
    this.graphics.beginPath();
    this.graphics.moveTo(0, 0);
    for (let i = 1; i <= 4; i++) {
      const waveX = Math.sin(Date.now() * 0.008 + i + this.x * 0.01) * 3;
      this.graphics.lineTo(waveX, i * 6);
    }
    this.graphics.strokePath();
    
    // Head
    this.graphics.fillStyle(color, alpha);
    const headSize = this.archetype.name === 'blocker' ? 1.3 : 1;
    this.graphics.fillEllipse(0, -6, 10 * headSize, 16 * headSize);
  }
  
  update(delta, player, trackBounds, obstacles, speedMultiplier = 1.0, aggressionMultiplier = 1.0) {
    const dt = delta / 1000;
    
    // Update stun
    if (this.isStunned) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
      }
    }
    
    // Update bump cooldown
    if (this.bumpCooldown > 0) {
      this.bumpCooldown -= delta;
    }
    
    // AI decision making
    this.updateAI(player, trackBounds, obstacles, aggressionMultiplier);
    
    // Calculate speed
    let targetSpeed = this.baseSpeed * speedMultiplier * this.speedVariation;
    if (this.isStunned) {
      targetSpeed *= 0.3;
    }
    
    // Accelerate
    const accel = GAME_CONFIG.PLAYER.ACCELERATION * 0.8;
    if (this.speed < targetSpeed) {
      this.speed = Math.min(this.speed + accel * dt, targetSpeed);
    } else {
      this.speed = Math.max(this.speed - accel * 0.5 * dt, targetSpeed);
    }
    
    // Convert angle to velocity
    const angleRad = Phaser.Math.DegToRad(this.angle);
    this.velocity.x = Math.cos(angleRad) * this.speed;
    this.velocity.y = Math.sin(angleRad) * this.speed;
    
    // Apply movement
    this.x += (this.velocity.x + this.knockbackVelocity.x) * dt;
    this.y += (this.velocity.y + this.knockbackVelocity.y) * dt;
    
    // Decay knockback
    this.knockbackVelocity.x *= 0.92;
    this.knockbackVelocity.y *= 0.92;
    
    // Constrain to track
    if (trackBounds) {
      const margin = this.size / 2;
      this.x = Phaser.Math.Clamp(this.x, trackBounds.left + margin, trackBounds.right - margin);
      
      if (this.x <= trackBounds.left + margin || this.x >= trackBounds.right - margin) {
        this.knockbackVelocity.x = -this.velocity.x * 0.3;
        this.speed *= 0.9;
      }
    }
    
    // Update visuals
    this.graphics.setPosition(this.x, this.y);
    this.graphics.setAngle(this.angle + 90);
    this.drawSperm();
    
    // Update trail
    this.updateTrail();
  }
  
  updateAI(player, trackBounds, obstacles, aggressionMultiplier) {
    const effectiveAggression = this.aggression * aggressionMultiplier;
    
    // Basic forward movement with slight randomness
    let targetAngle = -90; // Default: straight up
    
    // Stay in lane (center of track with some variation)
    if (trackBounds) {
      const trackCenter = (trackBounds.left + trackBounds.right) / 2;
      const laneOffset = this.targetLane * 40;
      const targetX = trackCenter + laneOffset;
      
      // Steer towards target lane
      const dx = targetX - this.x;
      if (Math.abs(dx) > 10) {
        targetAngle += Math.sign(dx) * 15;
      }
      
      // Occasionally change lanes
      if (Math.random() < 0.005) {
        this.targetLane = Math.floor(Math.random() * 5) - 2;
      }
    }
    
    // Bump behavior - try to hit player if close and aggressive
    if (player && this.bumpCooldown <= 0) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 100 && Math.random() < this.bumpProbability * effectiveAggression) {
        // Steer towards player
        const angleToPlayer = Math.atan2(dy, dx) * (180 / Math.PI);
        targetAngle = Phaser.Math.Linear(targetAngle, angleToPlayer, 0.5);
        this.bumpCooldown = 1000;
      }
    }
    
    // Avoid obstacles
    if (obstacles) {
      for (const obs of obstacles) {
        const dx = obs.x - this.x;
        const dy = obs.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 80) {
          // Steer away from obstacle
          const avoidAngle = Math.atan2(-dy, -dx) * (180 / Math.PI);
          targetAngle = Phaser.Math.Linear(targetAngle, avoidAngle, 0.3);
        }
      }
    }
    
    // Smoothly rotate towards target angle
    const angleDiff = Phaser.Math.Angle.ShortestBetween(this.angle, targetAngle);
    this.angle += angleDiff * this.turnSpeed * 0.05;
  }
  
  updateTrail() {
    this.trail.unshift({ x: this.x, y: this.y });
    
    while (this.trail.length > 8) {
      this.trail.pop();
    }
    
    this.trailGraphics.clear();
    for (let i = 1; i < this.trail.length; i++) {
      const alpha = (1 - i / this.trail.length) * 0.3;
      const width = (1 - i / this.trail.length) * 4;
      
      this.trailGraphics.lineStyle(width, this.archetype.color, alpha);
      this.trailGraphics.lineBetween(
        this.trail[i - 1].x, this.trail[i - 1].y,
        this.trail[i].x, this.trail[i].y
      );
    }
  }
  
  applyKnockback(directionX, directionY, force) {
    this.knockbackVelocity.x += directionX * force * (1 / this.bumpForce);
    this.knockbackVelocity.y += directionY * force * (1 / this.bumpForce);
    this.speed *= 0.6;
    this.isStunned = true;
    this.stunTimer = 300;
  }
  
  applySlowdown(factor, duration) {
    this.isStunned = true;
    this.stunTimer = duration;
  }
  
  getBounds() {
    return {
      x: this.x - this.size / 2,
      y: this.y - this.size / 2,
      width: this.size,
      height: this.size,
      centerX: this.x,
      centerY: this.y,
      radius: this.size / 2
    };
  }
  
  destroy() {
    this.graphics.destroy();
    this.trailGraphics.destroy();
  }
}

// Factory function to create rivals with random archetypes
export function createRival(scene, x, y, preferredArchetype = null) {
  const archetypes = Object.values(RIVAL_ARCHETYPES);
  const archetype = preferredArchetype || archetypes[Math.floor(Math.random() * archetypes.length)];
  return new Rival(scene, x, y, archetype);
}
