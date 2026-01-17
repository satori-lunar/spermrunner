// Obstacle entities - Playful abstract floating shapes
import { GAME_CONFIG, OBSTACLE_TYPES } from '../config/GameConfig.js';

export class Obstacle {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;
    
    // Properties
    this.slowdownFactor = type.slowdownFactor;
    this.knockback = type.knockback;
    this.size = type.size;
    this.speed = type.speed || 0;
    this.bouncy = type.bouncy || false;
    
    // Movement
    this.moveDirection = Math.random() > 0.5 ? 1 : -1;
    this.moveRange = 50;
    this.startX = x;
    
    // Animation
    this.animTime = Math.random() * 1000;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 2;
    
    // Graphics
    this.glowGraphics = scene.add.graphics();
    this.bodyGraphics = scene.add.graphics();
  }
  
  draw() {
    const colors = GAME_CONFIG.COLORS;
    
    this.glowGraphics.clear();
    this.bodyGraphics.clear();
    
    // Bobbing animation
    const bob = Math.sin(this.animTime * 0.003 + this.bobOffset) * 3;
    const drawY = this.y + bob;
    const pulse = 1 + Math.sin(this.animTime * 0.005) * 0.1;
    
    switch (this.type.name) {
      case 'bubble':
        this.drawBubble(this.x, drawY, pulse);
        break;
      case 'crystal':
        this.drawCrystal(this.x, drawY, pulse);
        break;
      case 'floater':
        this.drawFloater(this.x, drawY, pulse);
        break;
    }
  }
  
  drawBubble(x, y, pulse) {
    const colors = GAME_CONFIG.COLORS;
    const size = this.size * pulse;
    
    // Outer glow
    this.glowGraphics.fillStyle(colors.OBSTACLE_BUBBLE, 0.2);
    this.glowGraphics.fillCircle(x, y, size + 8);
    
    // Main bubble
    this.bodyGraphics.fillStyle(colors.OBSTACLE_BUBBLE, 0.4);
    this.bodyGraphics.fillCircle(x, y, size);
    
    // Inner highlight
    this.bodyGraphics.fillStyle(0xffffff, 0.5);
    this.bodyGraphics.fillCircle(x - size * 0.25, y - size * 0.25, size * 0.3);
    
    // Outline
    this.bodyGraphics.lineStyle(2, colors.OBSTACLE_BUBBLE, 0.7);
    this.bodyGraphics.strokeCircle(x, y, size);
  }
  
  drawCrystal(x, y, pulse) {
    const colors = GAME_CONFIG.COLORS;
    const size = this.size * pulse;
    
    // Glow
    this.glowGraphics.fillStyle(colors.OBSTACLE_CRYSTAL, 0.25);
    this.glowGraphics.fillCircle(x, y, size + 10);
    
    // Crystal shape (hexagon-ish)
    this.bodyGraphics.save();
    this.bodyGraphics.translateCanvas(x, y);
    this.bodyGraphics.rotateCanvas(Phaser.Math.DegToRad(this.rotation));
    
    this.bodyGraphics.fillStyle(colors.OBSTACLE_CRYSTAL, 0.8);
    this.bodyGraphics.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const r = size * (i % 2 === 0 ? 1 : 0.7);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) {
        this.bodyGraphics.moveTo(px, py);
      } else {
        this.bodyGraphics.lineTo(px, py);
      }
    }
    this.bodyGraphics.closePath();
    this.bodyGraphics.fillPath();
    
    // Highlight
    this.bodyGraphics.fillStyle(0xffffff, 0.4);
    this.bodyGraphics.fillTriangle(-4, -8, 4, -8, 0, -2);
    
    this.bodyGraphics.restore();
  }
  
  drawFloater(x, y, pulse) {
    const colors = GAME_CONFIG.COLORS;
    const size = this.size * pulse;
    
    // Glow
    this.glowGraphics.fillStyle(colors.OBSTACLE_BOUNCY, 0.2);
    this.glowGraphics.fillCircle(x, y, size + 8);
    
    // Star/bouncy shape
    this.bodyGraphics.save();
    this.bodyGraphics.translateCanvas(x, y);
    this.bodyGraphics.rotateCanvas(Phaser.Math.DegToRad(this.rotation));
    
    this.bodyGraphics.fillStyle(colors.OBSTACLE_BOUNCY, 0.9);
    this.bodyGraphics.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      const r = size * (i % 2 === 0 ? 1 : 0.5);
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) {
        this.bodyGraphics.moveTo(px, py);
      } else {
        this.bodyGraphics.lineTo(px, py);
      }
    }
    this.bodyGraphics.closePath();
    this.bodyGraphics.fillPath();
    
    // Center
    this.bodyGraphics.fillStyle(0xffffff, 0.6);
    this.bodyGraphics.fillCircle(0, 0, size * 0.3);
    
    this.bodyGraphics.restore();
  }
  
  update(delta) {
    this.animTime += delta;
    this.rotation += this.rotationSpeed;
    
    // Moving obstacles
    if (this.type.name === 'floater' && this.speed > 0) {
      const dt = delta / 1000;
      this.x += this.moveDirection * this.speed * dt;
      
      if (Math.abs(this.x - this.startX) > this.moveRange) {
        this.moveDirection *= -1;
      }
    }
    
    this.draw();
  }
  
  checkCollision(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.size / 2 + entity.size / 2;
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
    this.glowGraphics.destroy();
    this.bodyGraphics.destroy();
    this.active = false;
  }
}

// Current - Flowing energy stream
export class Current {
  constructor(scene, x, y, width, height, directionX, directionY, strength) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.directionX = directionX;
    this.directionY = directionY;
    this.strength = strength;
    this.active = true;
    
    this.graphics = scene.add.graphics();
    this.particleGraphics = scene.add.graphics();
    
    this.animTime = Math.random() * 1000;
    this.particles = [];
    
    // Spawn initial particles
    for (let i = 0; i < 8; i++) {
      this.spawnParticle();
    }
  }
  
  spawnParticle() {
    this.particles.push({
      x: this.x + (Math.random() - 0.5) * this.width,
      y: this.y + (Math.random() - 0.5) * this.height,
      life: Math.random()
    });
  }
  
  draw() {
    const colors = GAME_CONFIG.COLORS;
    
    this.graphics.clear();
    this.particleGraphics.clear();
    
    // Background stream area
    this.graphics.fillStyle(colors.CURRENT_STREAM, 0.15);
    this.graphics.fillRoundedRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height,
      15
    );
    
    // Flow lines
    const time = this.animTime * 0.001;
    this.graphics.lineStyle(2, colors.CURRENT_GLOW, 0.4);
    
    for (let i = 0; i < 4; i++) {
      const offset = ((time + i * 0.25) % 1) * this.height;
      const lineY = this.y - this.height / 2 + offset;
      
      this.graphics.beginPath();
      for (let j = 0; j <= 8; j++) {
        const t = j / 8;
        const lx = this.x - this.width / 3 + t * (this.width * 2 / 3);
        const ly = lineY + Math.sin(t * Math.PI * 2 + time * 3) * 6;
        
        if (j === 0) {
          this.graphics.moveTo(lx, ly);
        } else {
          this.graphics.lineTo(lx, ly);
        }
      }
      this.graphics.strokePath();
    }
    
    // Particles
    for (const p of this.particles) {
      const alpha = Math.sin(p.life * Math.PI) * 0.6;
      this.particleGraphics.fillStyle(colors.CURRENT_GLOW, alpha);
      this.particleGraphics.fillCircle(p.x, p.y, 3);
    }
    
    // Direction arrow
    this.drawArrow();
  }
  
  drawArrow() {
    const colors = GAME_CONFIG.COLORS;
    const angle = Math.atan2(this.directionY, this.directionX);
    
    this.graphics.fillStyle(colors.CURRENT_GLOW, 0.5);
    this.graphics.save();
    this.graphics.translateCanvas(this.x, this.y);
    this.graphics.rotateCanvas(angle);
    
    this.graphics.beginPath();
    this.graphics.moveTo(12, 0);
    this.graphics.lineTo(-4, -8);
    this.graphics.lineTo(-4, 8);
    this.graphics.closePath();
    this.graphics.fillPath();
    
    this.graphics.restore();
  }
  
  update(delta) {
    this.animTime += delta;
    
    // Update particles
    for (const p of this.particles) {
      p.x += this.directionX * 0.5;
      p.y -= 0.3;
      p.life -= 0.01;
      
      if (p.life <= 0) {
        p.x = this.x + (Math.random() - 0.5) * this.width;
        p.y = this.y + (Math.random() - 0.5) * this.height;
        p.life = 1;
      }
    }
    
    this.draw();
  }
  
  isEntityInside(entity) {
    return (
      entity.x > this.x - this.width / 2 &&
      entity.x < this.x + this.width / 2 &&
      entity.y > this.y - this.height / 2 &&
      entity.y < this.y + this.height / 2
    );
  }
  
  applyForce(entity, delta) {
    if (this.isEntityInside(entity)) {
      const force = this.strength * (delta / 1000);
      entity.x += this.directionX * force;
      entity.y += this.directionY * force * 0.3;
      return true;
    }
    return false;
  }
  
  destroy() {
    this.graphics.destroy();
    this.particleGraphics.destroy();
    this.active = false;
  }
}

// Powerup - Sparkly collectible
export class Powerup {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this.size = 22;
    
    this.startY = y;
    this.animTime = Math.random() * 1000;
    this.rotation = 0;
    
    this.glowGraphics = scene.add.graphics();
    this.bodyGraphics = scene.add.graphics();
    this.sparkleGraphics = scene.add.graphics();
    
    // Sparkle particles
    this.sparkles = [];
    for (let i = 0; i < 5; i++) {
      this.sparkles.push({
        angle: (i / 5) * Math.PI * 2,
        dist: 20 + Math.random() * 10,
        size: 2 + Math.random() * 2,
        speed: 0.5 + Math.random() * 0.5
      });
    }
  }
  
  draw() {
    const colors = GAME_CONFIG.COLORS;
    
    this.glowGraphics.clear();
    this.bodyGraphics.clear();
    this.sparkleGraphics.clear();
    
    const bob = Math.sin(this.animTime * 0.004) * 4;
    const drawY = this.y + bob;
    const pulse = 1 + Math.sin(this.animTime * 0.006) * 0.15;
    
    let mainColor;
    switch (this.type.name) {
      case 'speed_burst': mainColor = colors.POWERUP_SPEED; break;
      case 'shield_bubble': mainColor = colors.POWERUP_SHIELD; break;
      case 'star_trail': mainColor = colors.POWERUP_STAR; break;
      default: mainColor = 0xffffff;
    }
    
    // Outer glow
    this.glowGraphics.fillStyle(mainColor, 0.25);
    this.glowGraphics.fillCircle(this.x, drawY, this.size + 12);
    this.glowGraphics.fillStyle(mainColor, 0.15);
    this.glowGraphics.fillCircle(this.x, drawY, this.size + 20);
    
    // Main body
    this.bodyGraphics.fillStyle(mainColor, 0.9);
    this.bodyGraphics.fillCircle(this.x, drawY, this.size * pulse);
    
    // Inner highlight
    this.bodyGraphics.fillStyle(0xffffff, 0.6);
    this.bodyGraphics.fillCircle(this.x - 5, drawY - 5, 6);
    
    // Icon
    this.bodyGraphics.fillStyle(0xffffff, 0.9);
    switch (this.type.name) {
      case 'speed_burst':
        // Lightning bolt
        this.bodyGraphics.beginPath();
        this.bodyGraphics.moveTo(this.x - 3, drawY - 8);
        this.bodyGraphics.lineTo(this.x + 4, drawY - 1);
        this.bodyGraphics.lineTo(this.x, drawY - 1);
        this.bodyGraphics.lineTo(this.x + 3, drawY + 8);
        this.bodyGraphics.lineTo(this.x - 4, drawY + 1);
        this.bodyGraphics.lineTo(this.x, drawY + 1);
        this.bodyGraphics.closePath();
        this.bodyGraphics.fillPath();
        break;
      case 'shield_bubble':
        // Shield
        this.bodyGraphics.lineStyle(3, 0xffffff, 0.9);
        this.bodyGraphics.strokeCircle(this.x, drawY, 8);
        break;
      case 'star_trail':
        // Star
        this.bodyGraphics.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const r = i % 2 === 0 ? 8 : 4;
          const px = this.x + Math.cos(angle) * r;
          const py = drawY + Math.sin(angle) * r;
          if (i === 0) this.bodyGraphics.moveTo(px, py);
          else this.bodyGraphics.lineTo(px, py);
        }
        this.bodyGraphics.closePath();
        this.bodyGraphics.fillPath();
        break;
    }
    
    // Orbiting sparkles
    for (const s of this.sparkles) {
      const sx = this.x + Math.cos(s.angle) * s.dist;
      const sy = drawY + Math.sin(s.angle) * s.dist;
      this.sparkleGraphics.fillStyle(0xffffff, 0.7);
      this.sparkleGraphics.fillCircle(sx, sy, s.size);
    }
  }
  
  update(delta) {
    this.animTime += delta;
    this.rotation += 0.02;
    
    // Update sparkles
    for (const s of this.sparkles) {
      s.angle += s.speed * (delta / 1000);
    }
    
    this.draw();
  }
  
  checkCollision(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.size / 2 + entity.size / 2;
  }
  
  destroy() {
    this.glowGraphics.destroy();
    this.bodyGraphics.destroy();
    this.sparkleGraphics.destroy();
    this.active = false;
  }
}

// Sticky trap - Sparkle puddle
export class StickyTrap {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.active = true;
    this.size = 35;
    this.lifetime = 8000;
    this.slowDuration = 2000;
    
    this.graphics = scene.add.graphics();
    this.animTime = 0;
  }
  
  draw() {
    this.graphics.clear();
    this.graphics.setPosition(this.x, this.y);
    
    const alpha = Math.min(this.lifetime / 2000, 1);
    const pulse = 1 + Math.sin(this.animTime * 0.005) * 0.1;
    
    // Glowing puddle
    this.graphics.fillStyle(GAME_CONFIG.COLORS.POWERUP_STAR, 0.3 * alpha);
    this.graphics.fillCircle(0, 0, this.size * pulse);
    
    this.graphics.fillStyle(GAME_CONFIG.COLORS.POWERUP_STAR, 0.5 * alpha);
    this.graphics.fillCircle(0, 0, this.size * 0.6 * pulse);
    
    // Sparkles
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + this.animTime * 0.002;
      const dist = this.size * 0.4;
      const sx = Math.cos(angle) * dist;
      const sy = Math.sin(angle) * dist;
      this.graphics.fillStyle(0xffffff, 0.6 * alpha);
      this.graphics.fillCircle(sx, sy, 2);
    }
  }
  
  update(delta) {
    this.animTime += delta;
    this.lifetime -= delta;
    
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }
    
    this.draw();
  }
  
  checkCollision(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.size / 2 + entity.size / 2;
  }
  
  destroy() {
    if (this.graphics) {
      this.graphics.destroy();
    }
    this.active = false;
  }
}
