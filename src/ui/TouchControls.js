// Touch Controls - Virtual joystick and boost button
export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    
    // Input state
    this.steerX = 0;
    this.throttle = 0;
    this.boostPressed = false;
    
    // Joystick config
    this.joystickRadius = 50;
    this.joystickDeadzone = 0.15;
    
    // Joystick state
    this.joystickActive = false;
    this.joystickStartPos = { x: 0, y: 0 };
    this.joystickCurrentPos = { x: 0, y: 0 };
    this.joystickPointerId = null;
    
    // Boost button state
    this.boostButtonActive = false;
    this.boostPointerId = null;
    
    // UI dimensions
    this.updateDimensions();
    
    // Create UI graphics
    this.joystickGraphics = scene.add.graphics();
    this.boostGraphics = scene.add.graphics();
    
    // Make UI fixed to camera
    this.joystickGraphics.setScrollFactor(0);
    this.boostGraphics.setScrollFactor(0);
    
    // Set high depth so controls are always visible
    this.joystickGraphics.setDepth(1000);
    this.boostGraphics.setDepth(1000);
    
    // Set up input handlers
    this.setupInput();
    
    // Initial draw
    this.draw();
  }
  
  updateDimensions() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Joystick area (left side)
    this.joystickAreaX = 0;
    this.joystickAreaY = height * 0.5;
    this.joystickAreaWidth = width * 0.5;
    this.joystickAreaHeight = height * 0.5;
    
    // Boost button (right side, bottom)
    this.boostButtonX = width - 80;
    this.boostButtonY = height - 100;
    this.boostButtonRadius = 45;
  }
  
  setupInput() {
    const scene = this.scene;
    
    // Touch/pointer down
    scene.input.on('pointerdown', (pointer) => {
      const x = pointer.x;
      const y = pointer.y;
      
      // Check boost button first
      const boostDist = Math.sqrt(
        Math.pow(x - this.boostButtonX, 2) +
        Math.pow(y - this.boostButtonY, 2)
      );
      
      if (boostDist < this.boostButtonRadius + 20) {
        this.boostButtonActive = true;
        this.boostPressed = true;
        this.boostPointerId = pointer.id;
        this.draw();
        return;
      }
      
      // Check joystick area
      if (x < this.joystickAreaX + this.joystickAreaWidth &&
          y > this.joystickAreaY) {
        this.joystickActive = true;
        this.joystickStartPos = { x, y };
        this.joystickCurrentPos = { x, y };
        this.joystickPointerId = pointer.id;
        this.draw();
      }
    });
    
    // Touch/pointer move
    scene.input.on('pointermove', (pointer) => {
      if (this.joystickActive && pointer.id === this.joystickPointerId) {
        this.joystickCurrentPos = { x: pointer.x, y: pointer.y };
        this.updateJoystickInput();
        this.draw();
      }
    });
    
    // Touch/pointer up
    scene.input.on('pointerup', (pointer) => {
      if (pointer.id === this.joystickPointerId) {
        this.joystickActive = false;
        this.joystickPointerId = null;
        this.steerX = 0;
        this.throttle = 0;
        this.draw();
      }
      
      if (pointer.id === this.boostPointerId) {
        this.boostButtonActive = false;
        this.boostPointerId = null;
        this.draw();
      }
    });
    
    // Keyboard support for desktop testing
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    
    // WASD support
    this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  }
  
  updateJoystickInput() {
    const dx = this.joystickCurrentPos.x - this.joystickStartPos.x;
    const dy = this.joystickCurrentPos.y - this.joystickStartPos.y;
    
    // Normalize to joystick radius
    const dist = Math.sqrt(dx * dx + dy * dy);
    const normalizedDist = Math.min(dist / this.joystickRadius, 1);
    
    if (normalizedDist > this.joystickDeadzone) {
      // Steering (horizontal)
      this.steerX = (dx / this.joystickRadius);
      this.steerX = Phaser.Math.Clamp(this.steerX, -1, 1);
      
      // Throttle (vertical, negative = forward)
      this.throttle = -(dy / this.joystickRadius);
      this.throttle = Phaser.Math.Clamp(this.throttle, -1, 1);
    } else {
      this.steerX = 0;
      this.throttle = 0;
    }
  }
  
  update() {
    // Reset boost press (it's a one-shot trigger)
    this.boostPressed = false;
    
    // Handle keyboard input for desktop
    if (!this.joystickActive) {
      // Steering
      if (this.cursors.left.isDown || this.keyA.isDown) {
        this.steerX = -1;
      } else if (this.cursors.right.isDown || this.keyD.isDown) {
        this.steerX = 1;
      } else {
        this.steerX = 0;
      }
      
      // Throttle
      if (this.cursors.up.isDown || this.keyW.isDown) {
        this.throttle = 1;
      } else if (this.cursors.down.isDown || this.keyS.isDown) {
        this.throttle = -0.5;
      } else {
        this.throttle = 0;
      }
    }
    
    // Boost button (space)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.boostPressed = true;
    }
  }
  
  draw() {
    this.updateDimensions();
    
    // Draw joystick
    this.joystickGraphics.clear();
    
    if (this.joystickActive) {
      // Joystick base
      this.joystickGraphics.fillStyle(0xffffff, 0.15);
      this.joystickGraphics.fillCircle(
        this.joystickStartPos.x,
        this.joystickStartPos.y,
        this.joystickRadius
      );
      
      this.joystickGraphics.lineStyle(2, 0xffffff, 0.3);
      this.joystickGraphics.strokeCircle(
        this.joystickStartPos.x,
        this.joystickStartPos.y,
        this.joystickRadius
      );
      
      // Joystick thumb
      const thumbX = Phaser.Math.Clamp(
        this.joystickCurrentPos.x,
        this.joystickStartPos.x - this.joystickRadius,
        this.joystickStartPos.x + this.joystickRadius
      );
      const thumbY = Phaser.Math.Clamp(
        this.joystickCurrentPos.y,
        this.joystickStartPos.y - this.joystickRadius,
        this.joystickStartPos.y + this.joystickRadius
      );
      
      this.joystickGraphics.fillStyle(0xffffff, 0.5);
      this.joystickGraphics.fillCircle(thumbX, thumbY, 25);
    } else {
      // Hint text area
      this.joystickGraphics.fillStyle(0xffffff, 0.05);
      this.joystickGraphics.fillRect(
        10,
        this.joystickAreaY + 10,
        this.joystickAreaWidth - 20,
        this.joystickAreaHeight - 20
      );
    }
    
    // Draw boost button
    this.boostGraphics.clear();
    
    const boostAlpha = this.boostButtonActive ? 0.7 : 0.4;
    const boostColor = 0x00ff88;
    
    // Button background
    this.boostGraphics.fillStyle(boostColor, boostAlpha * 0.3);
    this.boostGraphics.fillCircle(
      this.boostButtonX,
      this.boostButtonY,
      this.boostButtonRadius
    );
    
    // Button border
    this.boostGraphics.lineStyle(3, boostColor, boostAlpha);
    this.boostGraphics.strokeCircle(
      this.boostButtonX,
      this.boostButtonY,
      this.boostButtonRadius
    );
    
    // "BOOST" indicator (lightning bolt shape)
    this.boostGraphics.fillStyle(boostColor, boostAlpha);
    this.boostGraphics.beginPath();
    this.boostGraphics.moveTo(this.boostButtonX - 8, this.boostButtonY - 18);
    this.boostGraphics.lineTo(this.boostButtonX + 5, this.boostButtonY - 5);
    this.boostGraphics.lineTo(this.boostButtonX - 2, this.boostButtonY - 5);
    this.boostGraphics.lineTo(this.boostButtonX + 8, this.boostButtonY + 18);
    this.boostGraphics.lineTo(this.boostButtonX - 5, this.boostButtonY + 5);
    this.boostGraphics.lineTo(this.boostButtonX + 2, this.boostButtonY + 5);
    this.boostGraphics.closePath();
    this.boostGraphics.fillPath();
  }
  
  getInput() {
    return {
      steerX: this.steerX,
      throttle: this.throttle,
      boost: this.boostPressed
    };
  }
  
  setBoostAvailable(available, progress) {
    // Could update button visual based on cooldown
    const alpha = available ? 0.4 : 0.15;
    // Redraw will handle this via boostButtonActive
  }
  
  destroy() {
    this.joystickGraphics.destroy();
    this.boostGraphics.destroy();
  }
}
