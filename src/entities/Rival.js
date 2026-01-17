// Rival Entity - Abstract colorful swimmer pods
import { GAME_CONFIG, RIVAL_ARCHETYPES } from '../config/GameConfig.js';

export class Rival {
  constructor(scene, x, y, archetype) {
    this.scene = scene;
    this.archetype = archetype;
    
    // Create graphics
    this.trailGraphics = scene.add.graphics();
    this.glowGraphics = scene.add.graphics();
    this.bodyGraphics = scene.add.graphics();
    
    // Position
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.angle = -90;
    this.speed = 0;
    
    // Stats from archetype
    this.baseSpeed = GAME_CONFIG.PLAYER.BASE_SPEED * archetype.speedVariance;
    this.maxSpeed = GAME_CONFIG.PLAYER.MAX_SPEED * archetype.speedVariance;
    this.turnSpeed = GAME_CONFIG.PLAYER.TURN_SPEED * archetype.turnReaction;
    this.size = GAME_CONFIG.PLAYER.SIZE;
    
    // AI behavior
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
    this.maxTrailLength = 15;
    
    // Animation
    this.animTime = Math.random() * 1000;
    this.bobOffset = Math.random() * Math.PI * 2;
    
    // Random variation
    this.speedVariation = 0.9 + Math.random() * 0.2;
  }
  
  draw() {
    const color = this.archetype.color;
    const alpha = this.isStunned ? 0.5 : 1;
    
    this.trailGraphics.clear();
    this.glowGraphics.clear();
    this.bodyGraphics.clear();
    
    // Draw flowing trail
    if (this.trail.length > 1) {
      for (let i = 1; i < this.trail.length; i++) {
        const t = i / this.trail.length;
        const trailAlpha = (1 - t) * 0.4 * alpha;
        const width = (1 - t) * 5 + 1;
        
        this.trailGraphics.lineStyle(width, color, trailAlpha);
        this.trailGraphics.lineBetween(
          this.trail[i - 1].x, this.trail[i - 1].y,
          this.trail[i].x, this.trail[i].y
        );
      }
    }
    
    // Outer glow
    const glowPulse = 1 + Math.sin(this.animTime * 0.006 + this.bobOffset) * 0.15;
    this.glowGraphics.fillStyle(color, 0.25 * alpha);
    this.glowGraphics.fillCircle(this.x, this.y, 18 * glowPulse);
    
    // Main body - cute rounded pod
    const angleRad = Phaser.Math.DegToRad(this.angle);
    
    this.bodyGraphics.save();
    this.bodyGraphics.translateCanvas(this.x, this.y);
    this.bodyGraphics.rotateCanvas(angleRad + Math.PI / 2);
    
    // Pod body
    this.bodyGraphics.fillStyle(color, alpha);
    this.bodyGraphics.fillEllipse(0, 0, 10, 16);
    
    // Highlight
    this.bodyGraphics.fillStyle(0xffffff, 0.4 * alpha);
    this.bodyGraphics.fillEllipse(-1, -3, 3, 5);
    
    // Eye
    this.bodyGraphics.fillStyle(0xffffff, 0.8 * alpha);
    this.bodyGraphics.fillCircle(0, -4, 3);
    this.bodyGraphics.fillStyle(0x333333, alpha);
    this.bodyGraphics.fillCircle(0, -4, 1.5);
    
    this.bodyGraphics.restore();
  }
  
  update(delta, player, trackBounds, obstacles, speedMultiplier = 1.0, aggressionMultiplier = 1.0) {
    const dt = delta / 1000;
    this.animTime += delta;
    
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
    
    // AI behavior
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
    
    // Convert to velocity
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
    
    // Update trail
    this.trail.unshift({ x: this.x, y: this.y });
    while (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }
    
    // Draw
    this.draw();
  }
  
  updateAI(player, trackBounds, obstacles, aggressionMultiplier) {
    const effectiveAggression = this.aggression * aggressionMultiplier;
    
    let targetAngle = -90;
    
    // Stay in lane
    if (trackBounds) {
      const trackCenter = (trackBounds.left + trackBounds.right) / 2;
      const laneOffset = this.targetLane * 35;
      const targetX = trackCenter + laneOffset;
      
      const dx = targetX - this.x;
      if (Math.abs(dx) > 8) {
        targetAngle += Math.sign(dx) * 12;
      }
      
      if (Math.random() < 0.006) {
        this.targetLane = Math.floor(Math.random() * 5) - 2;
      }
    }
    
    // Bump behavior
    if (player && this.bumpCooldown <= 0) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 80 && Math.random() < this.bumpProbability * effectiveAggression) {
        const angleToPlayer = Math.atan2(dy, dx) * (180 / Math.PI);
        targetAngle = Phaser.Math.Linear(targetAngle, angleToPlayer, 0.4);
        this.bumpCooldown = 800;
      }
    }
    
    // Avoid obstacles
    if (obstacles) {
      for (const obs of obstacles) {
        const dx = obs.x - this.x;
        const dy = obs.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 70) {
          const avoidAngle = Math.atan2(-dy, -dx) * (180 / Math.PI);
          targetAngle = Phaser.Math.Linear(targetAngle, avoidAngle, 0.25);
        }
      }
    }
    
    // Smoothly rotate
    const angleDiff = Phaser.Math.Angle.ShortestBetween(this.angle, targetAngle);
    this.angle += angleDiff * this.turnSpeed * 0.04;
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
    this.trailGraphics.destroy();
    this.glowGraphics.destroy();
    this.bodyGraphics.destroy();
  }
}

export function createRival(scene, x, y, preferredArchetype = null) {
  const archetypes = Object.values(RIVAL_ARCHETYPES);
  const archetype = preferredArchetype || archetypes[Math.floor(Math.random() * archetypes.length)];
  return new Rival(scene, x, y, archetype);
}
