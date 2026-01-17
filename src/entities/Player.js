// Player Entity - The user's sperm character
import { GAME_CONFIG } from '../config/GameConfig.js';

export class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    
    // Create player graphics
    this.graphics = scene.add.graphics();
    this.drawSperm();
    
    // Position container
    this.container = scene.add.container(x, y, [this.graphics]);
    
    // Physics body (we'll use manual physics for more control)
    this.x = x;
    this.y = y;
    this.velocity = { x: 0, y: 0 };
    this.angle = -90; // Pointing up initially (in degrees)
    this.speed = 0;
    
    // Player stats from config
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
    
    // Shield powerup
    this.hasShield = false;
    this.shieldTimer = 0;
    
    // Trail effect
    this.trail = [];
    this.trailGraphics = scene.add.graphics();
    
    // Collision state
    this.knockbackVelocity = { x: 0, y: 0 };
    
    // Distance traveled (for scoring)
    this.distanceTraveled = 0;
    this.checkpointsPassed = 0;
  }
  
  drawSperm() {
    this.graphics.clear();
    
    // Tail (wavy line behind)
    this.graphics.lineStyle(3, GAME_CONFIG.COLORS.PLAYER, 0.8);
    this.graphics.beginPath();
    this.graphics.moveTo(0, 0);
    for (let i = 1; i <= 5; i++) {
      const waveX = Math.sin(Date.now() * 0.01 + i) * 4;
      this.graphics.lineTo(waveX, i * 8);
    }
    this.graphics.strokePath();
    
    // Head (oval shape)
    this.graphics.fillStyle(GAME_CONFIG.COLORS.PLAYER, 1);
    this.graphics.fillEllipse(0, -8, 14, 20);
    
    // Glow effect when boosting
    if (this.isBoosting) {
      this.graphics.fillStyle(0xffffff, 0.3);
      this.graphics.fillCircle(0, -8, 18);
    }
    
    // Shield effect
    if (this.hasShield) {
      this.graphics.lineStyle(2, 0x00ffff, 0.6);
      this.graphics.strokeCircle(0, 0, 25);
    }
  }
  
  update(delta, input, trackBounds, speedMultiplier = 1.0) {
    const dt = delta / 1000;
    
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
    }
    
    // Update shield
    if (this.hasShield) {
      this.shieldTimer -= delta;
      if (this.shieldTimer <= 0) {
        this.hasShield = false;
      }
    }
    
    // Smooth steering - directly use input for fluid control
    // The input is already smoothed in TouchControls
    const steerAmount = input.steerX * this.turnSpeed * dt * 60;
    this.angle += steerAmount;
    
    // Add slight visual tilt based on steering
    this.visualTilt = Phaser.Math.Linear(this.visualTilt || 0, input.steerX * 15, 0.1);
    
    // Calculate target speed - always moving forward automatically
    let targetSpeed = this.baseSpeed * speedMultiplier;
    if (this.isBoosting) {
      targetSpeed *= this.boostMultiplier;
    }
    
    // Auto-forward with slight boost when actively steering
    const isActivelyControlling = Math.abs(input.steerX) > 0.1 || input.throttle > 0;
    const forwardInput = isActivelyControlling ? 1.0 : 0.85;
    targetSpeed *= forwardInput;
    
    // Smooth acceleration
    const accelRate = this.speed < targetSpeed ? this.acceleration : this.acceleration * 0.3;
    this.speed = Phaser.Math.Linear(this.speed, targetSpeed, accelRate * dt);
    
    // Cap at max speed
    this.speed = Math.min(this.speed, this.maxSpeed * speedMultiplier);
    
    // Convert angle to velocity
    const angleRad = Phaser.Math.DegToRad(this.angle);
    this.velocity.x = Math.cos(angleRad) * this.speed;
    this.velocity.y = Math.sin(angleRad) * this.speed;
    
    // Apply knockback (decays over time)
    this.x += (this.velocity.x + this.knockbackVelocity.x) * dt;
    this.y += (this.velocity.y + this.knockbackVelocity.y) * dt;
    
    this.knockbackVelocity.x *= 0.9;
    this.knockbackVelocity.y *= 0.9;
    
    // Track distance
    this.distanceTraveled += this.speed * dt;
    
    // Constrain to track bounds
    if (trackBounds) {
      const margin = this.size / 2;
      this.x = Phaser.Math.Clamp(this.x, trackBounds.left + margin, trackBounds.right - margin);
      
      // Bounce off walls
      if (this.x <= trackBounds.left + margin || this.x >= trackBounds.right - margin) {
        this.knockbackVelocity.x = -this.velocity.x * 0.5;
        this.speed *= 0.8;
      }
    }
    
    // Update visual position
    this.container.setPosition(this.x, this.y);
    
    // Combine movement angle with visual tilt for responsive feel
    const displayAngle = this.angle + 90 + (this.visualTilt || 0);
    this.container.setAngle(displayAngle);
    
    // Redraw with current state
    this.drawSperm();
    
    // Update trail
    this.updateTrail();
  }
  
  updateTrail() {
    // Add current position to trail
    this.trail.unshift({ x: this.x, y: this.y, alpha: 1 });
    
    // Limit trail length
    const maxTrailLength = this.isBoosting ? 20 : 10;
    while (this.trail.length > maxTrailLength) {
      this.trail.pop();
    }
    
    // Draw trail
    this.trailGraphics.clear();
    for (let i = 1; i < this.trail.length; i++) {
      const point = this.trail[i];
      const alpha = (1 - i / this.trail.length) * 0.5;
      const width = (1 - i / this.trail.length) * 6;
      
      this.trailGraphics.lineStyle(width, GAME_CONFIG.COLORS.PLAYER, alpha);
      this.trailGraphics.lineBetween(
        this.trail[i - 1].x, this.trail[i - 1].y,
        point.x, point.y
      );
    }
  }
  
  boost() {
    if (this.canBoost && !this.isBoosting) {
      this.isBoosting = true;
      this.boostTimer = this.boostDuration;
      
      // Visual feedback
      this.scene.cameras.main.shake(100, 0.005);
      
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
    this.graphics.destroy();
    this.trailGraphics.destroy();
    this.container.destroy();
  }
}
