// Player Entity - Glowing swimmer pod with flowing ribbon
import { GAME_CONFIG } from '../config/GameConfig.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    
    // Create graphics layers
    this.ribbonGraphics = scene.add.graphics();
    this.glowGraphics = scene.add.graphics();
    this.bodyGraphics = scene.add.graphics();
    
    // Position
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
    
    // Ribbon trail - stores position history
    this.ribbon = [];
    this.maxRibbonLength = 25;
    
    // Particle effects
    this.particles = [];
    this.particleGraphics = scene.add.graphics();
    
    // Collision
    this.knockbackVelocity = { x: 0, y: 0 };
    
    // Progress tracking
    this.distanceTraveled = 0;
    this.checkpointsPassed = 0;
    
    // Animation time
    this.animTime = 0;
    
    // Container for camera follow
    this.container = scene.add.container(x, y);
  }
  
  draw() {
    const colors = GAME_CONFIG.COLORS;
    
    // Clear all graphics
    this.ribbonGraphics.clear();
    this.glowGraphics.clear();
    this.bodyGraphics.clear();
    this.particleGraphics.clear();
    
    // Draw flowing ribbon trail
    this.drawRibbon();
    
    // Draw particles
    this.drawParticles();
    
    // Draw outer glow
    const glowSize = this.isBoosting ? 35 : 25;
    const glowAlpha = 0.3 + Math.sin(this.animTime * 0.005) * 0.1;
    
    this.glowGraphics.fillStyle(colors.PLAYER_GLOW, glowAlpha);
    this.glowGraphics.fillCircle(this.x, this.y, glowSize);
    
    if (this.isBoosting) {
      this.glowGraphics.fillStyle(0xffffff, 0.2);
      this.glowGraphics.fillCircle(this.x, this.y, glowSize + 10);
    }
    
    // Draw shield bubble if active
    if (this.hasShield) {
      const shieldPulse = 1 + Math.sin(this.animTime * 0.01) * 0.1;
      this.glowGraphics.lineStyle(3, colors.POWERUP_SHIELD, 0.6);
      this.glowGraphics.strokeCircle(this.x, this.y, 30 * shieldPulse);
      this.glowGraphics.fillStyle(colors.POWERUP_SHIELD, 0.1);
      this.glowGraphics.fillCircle(this.x, this.y, 30 * shieldPulse);
    }
    
    // Draw main body - rounded pod shape
    const angleRad = Phaser.Math.DegToRad(this.angle + this.visualTilt);
    
    // Pod body (elongated rounded shape)
    this.bodyGraphics.fillStyle(colors.PLAYER_CORE, 1);
    
    // Draw pod as rotated ellipse
    const podLength = 20;
    const podWidth = 12;
    
    this.bodyGraphics.save();
    this.bodyGraphics.translateCanvas(this.x, this.y);
    this.bodyGraphics.rotateCanvas(angleRad + Math.PI / 2);
    
    // Main pod body
    this.bodyGraphics.fillEllipse(0, 0, podWidth, podLength);
    
    // Inner highlight
    this.bodyGraphics.fillStyle(0xffffff, 0.5);
    this.bodyGraphics.fillEllipse(-2, -4, 4, 6);
    
    // Cute eye/window
    this.bodyGraphics.fillStyle(0xffffff, 0.9);
    this.bodyGraphics.fillCircle(0, -5, 4);
    this.bodyGraphics.fillStyle(colors.PLAYER_CORE, 1);
    this.bodyGraphics.fillCircle(0, -5, 2);
    
    this.bodyGraphics.restore();
    
    // Update container position for camera
    this.container.setPosition(this.x, this.y);
  }
  
  drawRibbon() {
    if (this.ribbon.length < 2) return;
    
    const colors = GAME_CONFIG.COLORS;
    
    // Draw flowing ribbon with gradient opacity
    for (let i = 1; i < this.ribbon.length; i++) {
      const prev = this.ribbon[i - 1];
      const curr = this.ribbon[i];
      
      const t = i / this.ribbon.length;
      const alpha = (1 - t) * 0.7;
      const width = (1 - t) * 8 + 2;
      
      // Wavy offset for organic feel
      const wave = Math.sin(this.animTime * 0.008 + i * 0.5) * (t * 4);
      const perpX = -(curr.y - prev.y);
      const perpY = curr.x - prev.x;
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
      
      const offsetX = (perpX / perpLen) * wave;
      const offsetY = (perpY / perpLen) * wave;
      
      this.ribbonGraphics.lineStyle(width, colors.PLAYER_RIBBON, alpha);
      this.ribbonGraphics.lineBetween(
        prev.x + offsetX, prev.y + offsetY,
        curr.x + offsetX, curr.y + offsetY
      );
    }
  }
  
  drawParticles() {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      const size = p.size * alpha;
      
      this.particleGraphics.fillStyle(p.color, alpha * 0.8);
      this.particleGraphics.fillCircle(p.x, p.y, size);
    }
  }
  
  update(delta, input, trackBounds, speedMultiplier = 1.0) {
    const dt = delta / 1000;
    this.animTime += delta;
    
    // Update boost cooldown
    if (!this.canBoost) {
      this.boostCooldownTimer -= delta;
      if (this.boostCooldownTimer <= 0) {
        this.canBoost = true;
      }
    }
    
    // Update boost state
    if (this.isBoosting) {
      this.boostTimer -= delta;
      if (this.boostTimer <= 0) {
        this.isBoosting = false;
        this.boostCooldownTimer = this.boostCooldown;
        this.canBoost = false;
      }
      // Spawn boost particles
      if (Math.random() < 0.3) {
        this.spawnParticle(true);
      }
    }
    
    // Update shield
    if (this.hasShield) {
      this.shieldTimer -= delta;
      if (this.shieldTimer <= 0) {
        this.hasShield = false;
      }
    }
    
    // Smooth steering
    const steerAmount = input.steerX * this.turnSpeed * dt * 60;
    this.angle += steerAmount;
    this.visualTilt = Phaser.Math.Linear(this.visualTilt, input.steerX * 20, 0.12);
    
    // Calculate target speed
    let targetSpeed = this.baseSpeed * speedMultiplier;
    if (this.isBoosting) {
      targetSpeed *= this.boostMultiplier;
    }
    
    // Auto-forward
    const isActivelyControlling = Math.abs(input.steerX) > 0.1 || input.throttle > 0;
    const forwardInput = isActivelyControlling ? 1.0 : 0.85;
    targetSpeed *= forwardInput;
    
    // Smooth acceleration
    const accelRate = this.speed < targetSpeed ? this.acceleration : this.acceleration * 0.3;
    this.speed = Phaser.Math.Linear(this.speed, targetSpeed, accelRate * dt);
    this.speed = Math.min(this.speed, this.maxSpeed * speedMultiplier);
    
    // Convert angle to velocity
    const angleRad = Phaser.Math.DegToRad(this.angle);
    this.velocity.x = Math.cos(angleRad) * this.speed;
    this.velocity.y = Math.sin(angleRad) * this.speed;
    
    // Apply movement
    this.x += (this.velocity.x + this.knockbackVelocity.x) * dt;
    this.y += (this.velocity.y + this.knockbackVelocity.y) * dt;
    
    // Decay knockback
    this.knockbackVelocity.x *= 0.9;
    this.knockbackVelocity.y *= 0.9;
    
    // Track distance
    this.distanceTraveled += this.speed * dt;
    
    // Constrain to track
    if (trackBounds) {
      const margin = this.size / 2;
      const prevX = this.x;
      this.x = Phaser.Math.Clamp(this.x, trackBounds.left + margin, trackBounds.right - margin);
      
      if (this.x !== prevX) {
        this.knockbackVelocity.x = -this.velocity.x * 0.4;
        this.speed *= 0.85;
        // Spawn bounce particles
        this.spawnParticle(false);
      }
    }
    
    // Update ribbon trail
    this.ribbon.unshift({ x: this.x, y: this.y });
    while (this.ribbon.length > this.maxRibbonLength) {
      this.ribbon.pop();
    }
    
    // Update particles
    this.updateParticles(delta);
    
    // Occasionally spawn trail particles
    if (Math.random() < 0.15) {
      this.spawnParticle(false);
    }
    
    // Draw everything
    this.draw();
  }
  
  spawnParticle(isBoost) {
    const colors = GAME_CONFIG.COLORS;
    const angleRad = Phaser.Math.DegToRad(this.angle + 180);
    
    this.particles.push({
      x: this.x + Math.cos(angleRad) * 10 + (Math.random() - 0.5) * 10,
      y: this.y + Math.sin(angleRad) * 10 + (Math.random() - 0.5) * 10,
      vx: Math.cos(angleRad) * (20 + Math.random() * 20),
      vy: Math.sin(angleRad) * (20 + Math.random() * 20),
      size: isBoost ? 4 + Math.random() * 3 : 2 + Math.random() * 2,
      color: isBoost ? 0xffffff : colors.PARTICLE_TRAIL,
      life: 1,
      maxLife: 1,
      decay: isBoost ? 0.03 : 0.02
    });
  }
  
  updateParticles(delta) {
    const dt = delta / 1000;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
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
      this.scene.cameras.main.shake(100, 0.003);
      
      // Burst of particles
      for (let i = 0; i < 8; i++) {
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
    if (this.isBoosting) {
      return this.boostTimer / this.boostDuration;
    }
    if (!this.canBoost) {
      return 1 - (this.boostCooldownTimer / this.boostCooldown);
    }
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
    this.ribbonGraphics.destroy();
    this.glowGraphics.destroy();
    this.bodyGraphics.destroy();
    this.particleGraphics.destroy();
    this.container.destroy();
  }
}
