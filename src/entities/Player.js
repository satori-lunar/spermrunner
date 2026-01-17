// Player Entity - Glowing energy capsule with ribbon trail
import { GAME_CONFIG } from '../config/GameConfig.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    
    // Graphics layers (ordered for depth)
    this.trailGraphics = scene.add.graphics();
    this.glowGraphics = scene.add.graphics();
    this.bodyGraphics = scene.add.graphics();
    this.sparkleGraphics = scene.add.graphics();
    
    // Position & physics
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.angle = -90;
    this.speed = 0;
    this.visualTilt = 0;
    
    // Stats
    this.baseSpeed = GAME_CONFIG.PLAYER.BASE_SPEED;
    this.maxSpeed = GAME_CONFIG.PLAYER.MAX_SPEED;
    this.acceleration = GAME_CONFIG.PLAYER.ACCELERATION;
    this.turnSpeed = GAME_CONFIG.PLAYER.TURN_SPEED;
    this.size = GAME_CONFIG.PLAYER.SIZE;
    
    // Boost system
    this.boostMultiplier = GAME_CONFIG.PLAYER.BOOST_MULTIPLIER;
    this.boostDuration = GAME_CONFIG.PLAYER.BOOST_DURATION;
    this.boostCooldown = GAME_CONFIG.PLAYER.BOOST_COOLDOWN;
    this.isBoosting = false;
    this.boostTimer = 0;
    this.boostCooldownTimer = 0;
    this.canBoost = true;
    
    // Shield
    this.hasShield = false;
    this.shieldTimer = 0;
    
    // Energy ribbon trail - stores position history
    this.ribbon = [];
    this.maxRibbonLength = 30;
    
    // Speed particles
    this.particles = [];
    
    // Collision
    this.knockbackVelocity = { x: 0, y: 0 };
    
    // Progress
    this.distanceTraveled = 0;
    this.checkpointsPassed = 0;
    
    // Animation
    this.animTime = 0;
    this.wobbleOffset = 0;
    
    // Container for camera
    this.container = scene.add.container(x, y);
  }
  
  draw() {
    const colors = GAME_CONFIG.COLORS;
    
    this.trailGraphics.clear();
    this.glowGraphics.clear();
    this.bodyGraphics.clear();
    this.sparkleGraphics.clear();
    
    // Draw energy ribbon trail
    this.drawRibbon();
    
    // Draw speed particles
    this.drawParticles();
    
    // Wobble animation
    this.wobbleOffset = Math.sin(this.animTime * 0.008) * 2;
    
    // === OUTER GLOW ===
    const glowIntensity = this.isBoosting ? 1.4 : 1.0;
    const baseGlowSize = 30 * glowIntensity;
    
    // Multi-layer glow for bloom effect
    this.glowGraphics.fillStyle(colors.PLAYER_GLOW, 0.08);
    this.glowGraphics.fillCircle(this.x, this.y, baseGlowSize + 15);
    
    this.glowGraphics.fillStyle(colors.PLAYER_GLOW, 0.15);
    this.glowGraphics.fillCircle(this.x, this.y, baseGlowSize + 5);
    
    this.glowGraphics.fillStyle(colors.PLAYER_GLOW, 0.25);
    this.glowGraphics.fillCircle(this.x, this.y, baseGlowSize - 5);
    
    // Boost extra glow
    if (this.isBoosting) {
      this.glowGraphics.fillStyle(0xffffff, 0.15);
      this.glowGraphics.fillCircle(this.x, this.y, baseGlowSize + 25);
    }
    
    // Shield bubble
    if (this.hasShield) {
      const shieldPulse = 1 + Math.sin(this.animTime * 0.01) * 0.08;
      this.glowGraphics.lineStyle(3, colors.POWERUP_SHIELD, 0.5);
      this.glowGraphics.strokeCircle(this.x, this.y, 32 * shieldPulse);
      this.glowGraphics.fillStyle(colors.POWERUP_SHIELD, 0.1);
      this.glowGraphics.fillCircle(this.x, this.y, 32 * shieldPulse);
    }
    
    // === MAIN BODY - Capsule/Droplet Shape ===
    const angleRad = Phaser.Math.DegToRad(this.angle + this.visualTilt);
    
    this.bodyGraphics.save();
    this.bodyGraphics.translateCanvas(this.x, this.y + this.wobbleOffset);
    this.bodyGraphics.rotateCanvas(angleRad + Math.PI / 2);
    
    // Capsule body (elongated rounded rectangle)
    const capsuleLength = 22;
    const capsuleWidth = 13;
    
    // Body gradient simulation
    this.bodyGraphics.fillStyle(colors.PLAYER_CORE, 1);
    this.bodyGraphics.fillRoundedRect(
      -capsuleWidth / 2, -capsuleLength / 2,
      capsuleWidth, capsuleLength,
      capsuleWidth / 2
    );
    
    // Inner highlight (left side - light reflection)
    this.bodyGraphics.fillStyle(0xffffff, 0.6);
    this.bodyGraphics.fillRoundedRect(
      -capsuleWidth / 2 + 2, -capsuleLength / 2 + 3,
      4, capsuleLength - 10,
      2
    );
    
    // Top highlight
    this.bodyGraphics.fillStyle(0xffffff, 0.4);
    this.bodyGraphics.fillEllipse(0, -capsuleLength / 2 + 5, 6, 4);
    
    // Energy core glow inside
    const corePulse = 0.6 + Math.sin(this.animTime * 0.006) * 0.2;
    this.bodyGraphics.fillStyle(0xffffff, corePulse);
    this.bodyGraphics.fillCircle(0, 0, 4);
    
    this.bodyGraphics.restore();
    
    // Update container
    this.container.setPosition(this.x, this.y);
  }
  
  drawRibbon() {
    if (this.ribbon.length < 2) return;
    
    const colors = GAME_CONFIG.COLORS;
    const boostIntensity = this.isBoosting ? 1.5 : 1.0;
    
    // Draw energy ribbon with glow
    for (let pass = 0; pass < 2; pass++) {
      const isGlow = pass === 0;
      
      for (let i = 1; i < this.ribbon.length; i++) {
        const prev = this.ribbon[i - 1];
        const curr = this.ribbon[i];
        
        const t = i / this.ribbon.length;
        const baseAlpha = (1 - t) * 0.8;
        const alpha = isGlow ? baseAlpha * 0.3 : baseAlpha;
        const width = isGlow 
          ? ((1 - t) * 12 + 4) * boostIntensity 
          : ((1 - t) * 6 + 2) * boostIntensity;
        
        // Wave motion for organic feel
        const wave = Math.sin(this.animTime * 0.006 + i * 0.4) * (t * 6);
        const perpX = -(curr.y - prev.y);
        const perpY = curr.x - prev.x;
        const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
        
        const offsetX = (perpX / perpLen) * wave;
        const offsetY = (perpY / perpLen) * wave;
        
        const color = isGlow ? colors.PLAYER_GLOW : colors.PLAYER_RIBBON;
        this.trailGraphics.lineStyle(width, color, alpha);
        this.trailGraphics.lineBetween(
          prev.x + offsetX, prev.y + offsetY,
          curr.x + offsetX, curr.y + offsetY
        );
      }
    }
    
    // Ribbon sparkles
    if (this.ribbon.length > 5) {
      for (let i = 0; i < 3; i++) {
        const idx = Math.floor((this.animTime * 0.02 + i * 10) % (this.ribbon.length - 1)) + 1;
        if (idx < this.ribbon.length) {
          const point = this.ribbon[idx];
          const sparkleAlpha = 0.5 + Math.sin(this.animTime * 0.01 + i) * 0.3;
          this.sparkleGraphics.fillStyle(0xffffff, sparkleAlpha);
          this.sparkleGraphics.fillCircle(point.x, point.y, 2);
        }
      }
    }
  }
  
  drawParticles() {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      const size = p.size * alpha;
      
      this.sparkleGraphics.fillStyle(p.color, alpha * 0.9);
      this.sparkleGraphics.fillCircle(p.x, p.y, size);
    }
  }
  
  update(delta, input, trackBounds, speedMultiplier = 1.0) {
    const dt = delta / 1000;
    this.animTime += delta;
    
    // Boost cooldown
    if (!this.canBoost) {
      this.boostCooldownTimer -= delta;
      if (this.boostCooldownTimer <= 0) {
        this.canBoost = true;
      }
    }
    
    // Boost state
    if (this.isBoosting) {
      this.boostTimer -= delta;
      if (this.boostTimer <= 0) {
        this.isBoosting = false;
        this.boostCooldownTimer = this.boostCooldown;
        this.canBoost = false;
      }
      // Spawn boost particles
      if (Math.random() < 0.4) {
        this.spawnParticle(true);
      }
    }
    
    // Shield
    if (this.hasShield) {
      this.shieldTimer -= delta;
      if (this.shieldTimer <= 0) {
        this.hasShield = false;
      }
    }
    
    // Smooth steering
    const steerAmount = input.steerX * this.turnSpeed * dt * 60;
    this.angle += steerAmount;
    this.visualTilt = Phaser.Math.Linear(this.visualTilt, input.steerX * 25, 0.12);
    
    // Speed calculation
    let targetSpeed = this.baseSpeed * speedMultiplier;
    if (this.isBoosting) {
      targetSpeed *= this.boostMultiplier;
    }
    
    // Auto-forward
    const isActive = Math.abs(input.steerX) > 0.1 || input.throttle > 0;
    targetSpeed *= isActive ? 1.0 : 0.85;
    
    // Smooth acceleration
    const accelRate = this.speed < targetSpeed ? this.acceleration : this.acceleration * 0.3;
    this.speed = Phaser.Math.Linear(this.speed, targetSpeed, accelRate * dt);
    this.speed = Math.min(this.speed, this.maxSpeed * speedMultiplier);
    
    // Velocity
    const angleRad = Phaser.Math.DegToRad(this.angle);
    this.velocity.x = Math.cos(angleRad) * this.speed;
    this.velocity.y = Math.sin(angleRad) * this.speed;
    
    // Apply movement
    this.x += (this.velocity.x + this.knockbackVelocity.x) * dt;
    this.y += (this.velocity.y + this.knockbackVelocity.y) * dt;
    
    // Decay knockback
    this.knockbackVelocity.x *= 0.9;
    this.knockbackVelocity.y *= 0.9;
    
    // Distance tracking
    this.distanceTraveled += this.speed * dt;
    
    // Track bounds
    if (trackBounds) {
      const margin = this.size / 2;
      const prevX = this.x;
      this.x = Phaser.Math.Clamp(this.x, trackBounds.left + margin, trackBounds.right - margin);
      
      if (this.x !== prevX) {
        this.knockbackVelocity.x = -this.velocity.x * 0.4;
        this.speed *= 0.85;
        this.spawnParticle(false);
        this.spawnParticle(false);
      }
    }
    
    // Update ribbon
    this.ribbon.unshift({ x: this.x, y: this.y });
    while (this.ribbon.length > this.maxRibbonLength) {
      this.ribbon.pop();
    }
    
    // Update particles
    this.updateParticles(delta);
    
    // Trail particles
    if (Math.random() < 0.2 && this.speed > this.baseSpeed * 0.5) {
      this.spawnParticle(false);
    }
    
    this.draw();
  }
  
  spawnParticle(isBoost) {
    const colors = GAME_CONFIG.COLORS;
    const angleRad = Phaser.Math.DegToRad(this.angle + 180);
    const spread = isBoost ? 25 : 15;
    
    this.particles.push({
      x: this.x + Math.cos(angleRad) * 12 + (Math.random() - 0.5) * spread,
      y: this.y + Math.sin(angleRad) * 12 + (Math.random() - 0.5) * spread,
      vx: Math.cos(angleRad) * (30 + Math.random() * 30) + (Math.random() - 0.5) * 20,
      vy: Math.sin(angleRad) * (30 + Math.random() * 30) + (Math.random() - 0.5) * 20,
      size: isBoost ? 3 + Math.random() * 3 : 2 + Math.random() * 2,
      color: isBoost ? 0xffffff : colors.PLAYER_GLOW,
      life: 1,
      maxLife: 1,
      decay: isBoost ? 0.025 : 0.02
    });
  }
  
  updateParticles(delta) {
    const dt = delta / 1000;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= p.decay;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  boost() {
    if (this.canBoost && !this.isBoosting) {
      this.isBoosting = true;
      this.boostTimer = this.boostDuration;
      this.scene.cameras.main.shake(80, 0.004);
      
      // Burst particles
      for (let i = 0; i < 12; i++) {
        this.spawnParticle(true);
      }
      
      return true;
    }
    return false;
  }
  
  applyKnockback(directionX, directionY, force) {
    if (this.hasShield) return;
    
    this.knockbackVelocity.x += directionX * force;
    this.knockbackVelocity.y += directionY * force;
    this.speed *= 0.7;
  }
  
  applySlowdown(factor) {
    this.speed *= factor;
  }
  
  activateShield(duration) {
    this.hasShield = true;
    this.shieldTimer = duration;
  }
  
  refillBoost() {
    this.canBoost = true;
    this.boostCooldownTimer = 0;
  }
  
  getBoostProgress() {
    if (this.isBoosting) return this.boostTimer / this.boostDuration;
    if (!this.canBoost) return 1 - (this.boostCooldownTimer / this.boostCooldown);
    return 1;
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
    this.sparkleGraphics.destroy();
    this.container.destroy();
  }
}
