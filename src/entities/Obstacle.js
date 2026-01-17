// Obstacle entities - debris, mucus walls, moving hazards, currents
import { GAME_CONFIG, OBSTACLE_TYPES } from '../config/GameConfig.js';

export class Obstacle {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.type = type;
    this.x = x;
    this.y = y;
    this.active = true;
    
    // Properties from type
    this.slowdownFactor = type.slowdownFactor;
    this.knockback = type.knockback;
    this.size = type.size;
    this.speed = type.speed || 0;
    
    // Movement for moving hazards
    this.moveDirection = Math.random() > 0.5 ? 1 : -1;
    this.moveRange = 60;
    this.startX = x;
    
    // Create graphics
    this.graphics = scene.add.graphics();
    this.draw();
  }
  
  draw() {
    this.graphics.clear();
    this.graphics.setPosition(this.x, this.y);
    
    const color = GAME_CONFIG.COLORS.OBSTACLE;
    
    switch (this.type.name) {
      case 'debris':
        // Irregular rocky shape
        this.graphics.fillStyle(color, 0.9);
        this.graphics.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const radius = this.size / 2 * (0.7 + Math.random() * 0.3);
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          if (i === 0) {
            this.graphics.moveTo(px, py);
          } else {
            this.graphics.lineTo(px, py);
          }
        }
        this.graphics.closePath();
        this.graphics.fillPath();
        break;
        
      case 'mucus_wall':
        // Stretched blob shape
        this.graphics.fillStyle(0x66338a, 0.7);
        this.graphics.fillEllipse(0, 0, this.size * 1.5, this.size * 0.6);
        this.graphics.fillStyle(0x9955bb, 0.4);
        this.graphics.fillEllipse(0, 0, this.size, this.size * 0.4);
        break;
        
      case 'moving_hazard':
        // Spiky animated hazard
        this.graphics.fillStyle(0xcc4466, 0.9);
        this.graphics.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2 + Date.now() * 0.002;
          const radius = this.size / 2 * (i % 2 === 0 ? 1 : 0.6);
          const px = Math.cos(angle) * radius;
          const py = Math.sin(angle) * radius;
          if (i === 0) {
            this.graphics.moveTo(px, py);
          } else {
            this.graphics.lineTo(px, py);
          }
        }
        this.graphics.closePath();
        this.graphics.fillPath();
        break;
    }
  }
  
  update(delta) {
    // Moving hazards oscillate left/right
    if (this.type.name === 'moving_hazard' && this.speed > 0) {
      const dt = delta / 1000;
      this.x += this.moveDirection * this.speed * dt;
      
      if (Math.abs(this.x - this.startX) > this.moveRange) {
        this.moveDirection *= -1;
      }
      
      this.draw();
    }
  }
  
  checkCollision(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const combinedRadius = this.size / 2 + entity.size / 2;
    
    return dist < combinedRadius;
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
    this.active = false;
  }
}

// Current (pushes entities in a direction)
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
    
    // Create visual
    this.graphics = scene.add.graphics();
    this.draw();
    
    // Animation offset
    this.animOffset = Math.random() * 100;
  }
  
  draw() {
    this.graphics.clear();
    
    // Background flow area
    this.graphics.fillStyle(GAME_CONFIG.COLORS.CURRENT, 0.15);
    this.graphics.fillRect(
      this.x - this.width / 2,
      this.y - this.height / 2,
      this.width,
      this.height
    );
    
    // Flow lines (animated)
    this.graphics.lineStyle(2, GAME_CONFIG.COLORS.CURRENT, 0.4);
    
    const numLines = 5;
    const time = Date.now() * 0.001 + this.animOffset;
    
    for (let i = 0; i < numLines; i++) {
      const offset = ((time + i / numLines) % 1) * this.height;
      const lineY = this.y - this.height / 2 + offset;
      
      this.graphics.beginPath();
      this.graphics.moveTo(this.x - this.width / 3, lineY);
      
      // Wavy line in direction of flow
      for (let j = 0; j < 4; j++) {
        const px = this.x - this.width / 3 + (j / 3) * (this.width * 2 / 3);
        const py = lineY + Math.sin(j + time * 2) * 5;
        this.graphics.lineTo(px, py);
      }
      
      this.graphics.strokePath();
    }
    
    // Arrow indicators
    this.drawArrow(this.x, this.y);
  }
  
  drawArrow(x, y) {
    this.graphics.fillStyle(GAME_CONFIG.COLORS.CURRENT, 0.5);
    
    const angle = Math.atan2(this.directionY, this.directionX);
    const arrowSize = 12;
    
    this.graphics.beginPath();
    this.graphics.moveTo(
      x + Math.cos(angle) * arrowSize,
      y + Math.sin(angle) * arrowSize
    );
    this.graphics.lineTo(
      x + Math.cos(angle + 2.5) * arrowSize * 0.6,
      y + Math.sin(angle + 2.5) * arrowSize * 0.6
    );
    this.graphics.lineTo(
      x + Math.cos(angle - 2.5) * arrowSize * 0.6,
      y + Math.sin(angle - 2.5) * arrowSize * 0.6
    );
    this.graphics.closePath();
    this.graphics.fillPath();
  }
  
  update(delta) {
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
      // Y direction push is gentler to not disrupt forward movement too much
      entity.y += this.directionY * force * 0.3;
      return true;
    }
    return false;
  }
  
  destroy() {
    this.graphics.destroy();
    this.active = false;
  }
}

// Powerup pickup
export class Powerup {
  constructor(scene, x, y, type) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.type = type;
    this.active = true;
    this.size = 25;
    
    // Bobbing animation
    this.startY = y;
    this.bobOffset = Math.random() * Math.PI * 2;
    
    // Create graphics
    this.graphics = scene.add.graphics();
    this.draw();
  }
  
  draw() {
    this.graphics.clear();
    this.graphics.setPosition(this.x, this.y);
    
    // Outer glow
    this.graphics.fillStyle(GAME_CONFIG.COLORS.POWERUP, 0.2);
    this.graphics.fillCircle(0, 0, this.size + 5);
    
    // Inner circle
    this.graphics.fillStyle(GAME_CONFIG.COLORS.POWERUP, 0.8);
    this.graphics.fillCircle(0, 0, this.size / 2);
    
    // Icon based on type
    this.graphics.fillStyle(0xffffff, 1);
    switch (this.type.name) {
      case 'speed_boost':
        // Lightning bolt
        this.graphics.beginPath();
        this.graphics.moveTo(-3, -8);
        this.graphics.lineTo(3, -2);
        this.graphics.lineTo(0, -2);
        this.graphics.lineTo(3, 8);
        this.graphics.lineTo(-3, 2);
        this.graphics.lineTo(0, 2);
        this.graphics.closePath();
        this.graphics.fillPath();
        break;
        
      case 'shield':
        // Shield shape
        this.graphics.lineStyle(2, 0xffffff, 1);
        this.graphics.strokeCircle(0, 0, 6);
        break;
        
      case 'sticky_trap':
        // Splat shape
        this.graphics.fillCircle(0, 0, 4);
        this.graphics.fillCircle(-5, 3, 2);
        this.graphics.fillCircle(5, 3, 2);
        this.graphics.fillCircle(0, -5, 2);
        break;
    }
  }
  
  update(delta) {
    // Bobbing animation
    const time = Date.now() * 0.003 + this.bobOffset;
    this.y = this.startY + Math.sin(time) * 5;
    this.draw();
  }
  
  checkCollision(entity) {
    const dx = entity.x - this.x;
    const dy = entity.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < this.size / 2 + entity.size / 2;
  }
  
  destroy() {
    this.graphics.destroy();
    this.active = false;
  }
}

// Sticky trap (dropped by player)
export class StickyTrap {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.active = true;
    this.size = 35;
    this.lifetime = 8000;
    this.slowDuration = 2000;
    
    // Create graphics
    this.graphics = scene.add.graphics();
    this.draw();
  }
  
  draw() {
    this.graphics.clear();
    this.graphics.setPosition(this.x, this.y);
    
    // Gooey splat
    this.graphics.fillStyle(0x44aa44, 0.6);
    this.graphics.fillCircle(0, 0, this.size / 2);
    this.graphics.fillCircle(-10, 5, this.size / 3);
    this.graphics.fillCircle(8, -5, this.size / 3);
    this.graphics.fillCircle(5, 10, this.size / 4);
  }
  
  update(delta) {
    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.destroy();
    }
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
