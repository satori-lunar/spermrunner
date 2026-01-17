// Rival Entity - Energy racers with distinct trail styles
import { GAME_CONFIG, RIVAL_ARCHETYPES } from '../config/GameConfig.js';

export class Rival {
  constructor(scene, x, y, archetype) {
    this.scene = scene;
    this.archetype = archetype;
    
    // Graphics layers
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
    
    // Trail with style variation
    this.trail = [];
    this.maxTrailLength = 20;
    this.trailStyle = this.getTrailStyle();
    
    // Animation
    this.animTime = Math.random() * 1000;
    this.pulseOffset = Math.random() * Math.PI * 2;
    
    // Random variation
    this.speedVariation = 0.9 + Math.random() * 0.2;
  }
  
  getTrailStyle() {
    // Different trail styles based on archetype
    switch (this.archetype.name) {
      case 'swift': return 'zigzag';
      case 'steady': return 'solid';
      case 'bouncy': return 'pulse';
      case 'floaty': return 'wave';
      default: return 'solid';
    }
  }
  
  draw() {
    const color = this.archetype.color;
    const alpha = this.isStunned ? 0.4 : 1;
    
    this.trailGraphics.clear();
    this.glowGraphics.clear();
    this.bodyGraphics.clear();
    
    // Draw styled trail
    this.drawStyledTrail(color, alpha);
    
    // Outer glow
    const glowPulse = 1 + Math.sin(this.animTime * 0.005 + this.pulseOffset) * 0.15;
    
    this.glowGraphics.fillStyle(color, 0.1 * alpha);
    this.glowGraphics.fillCircle(this.x, this.y, 22 * glowPulse);
    
    this.glowGraphics.fillStyle(color, 0.2 * alpha);
    this.glowGraphics.fillCircle(this.x, this.y, 15 * glowPulse);
    
    // Main body - capsule shape
    const angleRad = Phaser.Math.DegToRad(this.angle);
    
    this.bodyGraphics.save();
    this.bodyGraphics.translateCanvas(this.x, this.y);
    this.bodyGraphics.rotateCanvas(angleRad + Math.PI / 2);
    
    // Capsule body
    this.bodyGraphics.fillStyle(color, alpha);
    this.bodyGraphics.fillRoundedRect(-5, -9, 10, 18, 5);
    
    // Highlight
    this.bodyGraphics.fillStyle(0xffffff, 0.5 * alpha);
    this.bodyGraphics.fillRoundedRect(-3, -7, 3, 10, 1.5);
    
    // Energy core
    const corePulse = 0.5 + Math.sin(this.animTime * 0.008 + this.pulseOffset) * 0.3;
    this.bodyGraphics.fillStyle(0xffffff, corePulse * alpha);
    this.bodyGraphics.fillCircle(0, 0, 3);
    
    this.bodyGraphics.restore();
  }
  
  drawStyledTrail(color, alpha) {
    if (this.trail.length < 2) return;
    
    switch (this.trailStyle) {
      case 'zigzag':
        this.drawZigzagTrail(color, alpha);
        break;
      case 'pulse':
        this.drawPulseTrail(color, alpha);
        break;
      case 'wave':
        this.drawWaveTrail(color, alpha);
        break;
      default:
        this.drawSolidTrail(color, alpha);
    }
  }
  
  drawSolidTrail(color, alpha) {
    // Steady, consistent trail
    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      const trailAlpha = (1 - t) * 0.5 * alpha;
      const width = (1 - t) * 6 + 1;
      
      this.trailGraphics.lineStyle(width, color, trailAlpha);
      this.trailGraphics.lineBetween(
        this.trail[i - 1].x, this.trail[i - 1].y,
        this.trail[i].x, this.trail[i].y
      );
    }
  }
  
  drawZigzagTrail(color, alpha) {
    // Swift - sharp zigzag pattern
    for (let i = 1; i < this.trail.length; i++) {
      const prev = this.trail[i - 1];
      const curr = this.trail[i];
      const t = i / this.trail.length;
      const trailAlpha = (1 - t) * 0.6 * alpha;
      const width = (1 - t) * 5 + 1;
      
      // Calculate perpendicular for zigzag
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const perpX = -dy / len;
      const perpY = dx / len;
      
      // Alternating zigzag
      const zigOffset = (i % 2 === 0 ? 1 : -1) * 6 * (1 - t);
      
      this.trailGraphics.lineStyle(width, color, trailAlpha);
      this.trailGraphics.lineBetween(
        prev.x + perpX * zigOffset, prev.y + perpY * zigOffset,
        curr.x - perpX * zigOffset, curr.y - perpY * zigOffset
      );
    }
  }
  
  drawPulseTrail(color, alpha) {
    // Bouncy - pulsing thickness
    for (let i = 1; i < this.trail.length; i++) {
      const t = i / this.trail.length;
      const trailAlpha = (1 - t) * 0.55 * alpha;
      
      // Pulsing width
      const pulse = Math.sin(this.animTime * 0.015 + i * 0.5) * 0.5 + 0.5;
      const width = ((1 - t) * 8 + 2) * (0.5 + pulse * 0.5);
      
      this.trailGraphics.lineStyle(width, color, trailAlpha);
      this.trailGraphics.lineBetween(
        this.trail[i - 1].x, this.trail[i - 1].y,
        this.trail[i].x, this.trail[i].y
      );
      
      // Pulse glow dots
      if (i % 4 === 0) {
        this.trailGraphics.fillStyle(0xffffff, trailAlpha * pulse);
        this.trailGraphics.fillCircle(this.trail[i].x, this.trail[i].y, 2);
      }
    }
  }
  
  drawWaveTrail(color, alpha) {
    // Floaty - smooth wave pattern
    for (let i = 1; i < this.trail.length; i++) {
      const prev = this.trail[i - 1];
      const curr = this.trail[i];
      const t = i / this.trail.length;
      const trailAlpha = (1 - t) * 0.45 * alpha;
      const width = (1 - t) * 5 + 1;
      
      // Smooth wave offset
      const wave = Math.sin(this.animTime * 0.004 + i * 0.3) * 8 * t;
      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const perpX = -dy / len;
      const perpY = dx / len;
      
      this.trailGraphics.lineStyle(width, color, trailAlpha);
      this.trailGraphics.lineBetween(
        prev.x + perpX * wave, prev.y + perpY * wave,
        curr.x + perpX * wave, curr.y + perpY * wave
      );
    }
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
    
    if (this.bumpCooldown > 0) {
      this.bumpCooldown -= delta;
    }
    
    // AI
    this.updateAI(player, trackBounds, obstacles, aggressionMultiplier);
    
    // Speed
    let targetSpeed = this.baseSpeed * speedMultiplier * this.speedVariation;
    if (this.isStunned) targetSpeed *= 0.3;
    
    const accel = GAME_CONFIG.PLAYER.ACCELERATION * 0.8;
    if (this.speed < targetSpeed) {
      this.speed = Math.min(this.speed + accel * dt, targetSpeed);
    } else {
      this.speed = Math.max(this.speed - accel * 0.5 * dt, targetSpeed);
    }
    
    // Velocity
    const angleRad = Phaser.Math.DegToRad(this.angle);
    this.velocity.x = Math.cos(angleRad) * this.speed;
    this.velocity.y = Math.sin(angleRad) * this.speed;
    
    // Movement
    this.x += (this.velocity.x + this.knockbackVelocity.x) * dt;
    this.y += (this.velocity.y + this.knockbackVelocity.y) * dt;
    
    this.knockbackVelocity.x *= 0.92;
    this.knockbackVelocity.y *= 0.92;
    
    // Track bounds
    if (trackBounds) {
      const margin = this.size / 2;
      this.x = Phaser.Math.Clamp(this.x, trackBounds.left + margin, trackBounds.right - margin);
      
      if (this.x <= trackBounds.left + margin || this.x >= trackBounds.right - margin) {
        this.knockbackVelocity.x = -this.velocity.x * 0.3;
        this.speed *= 0.9;
      }
    }
    
    // Trail
    this.trail.unshift({ x: this.x, y: this.y });
    while (this.trail.length > this.maxTrailLength) {
      this.trail.pop();
    }
    
    this.draw();
  }
  
  updateAI(player, trackBounds, obstacles, aggressionMultiplier) {
    const effectiveAggression = this.aggression * aggressionMultiplier;
    
    let targetAngle = -90;
    
    if (trackBounds) {
      const trackCenter = (trackBounds.left + trackBounds.right) / 2;
      const laneOffset = this.targetLane * 30;
      const targetX = trackCenter + laneOffset;
      
      const dx = targetX - this.x;
      if (Math.abs(dx) > 8) {
        targetAngle += Math.sign(dx) * 12;
      }
      
      if (Math.random() < 0.007) {
        this.targetLane = Math.floor(Math.random() * 5) - 2;
      }
    }
    
    // Bump behavior
    if (player && this.bumpCooldown <= 0) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 70 && Math.random() < this.bumpProbability * effectiveAggression) {
        const angleToPlayer = Math.atan2(dy, dx) * (180 / Math.PI);
        targetAngle = Phaser.Math.Linear(targetAngle, angleToPlayer, 0.35);
        this.bumpCooldown = 700;
      }
    }
    
    // Avoid obstacles
    if (obstacles) {
      for (const obs of obstacles) {
        const dx = obs.x - this.x;
        const dy = obs.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 60) {
          const avoidAngle = Math.atan2(-dy, -dx) * (180 / Math.PI);
          targetAngle = Phaser.Math.Linear(targetAngle, avoidAngle, 0.25);
        }
      }
    }
    
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
