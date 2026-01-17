// Touch Controls - Smooth finger tracking for mobile
export class TouchControls {
  constructor(scene) {
    this.scene = scene;
    
    // Input state
    this.steerX = 0;
    this.throttle = 0;
    this.boostPressed = false;
    
    // Touch tracking
    this.activeTouch = null;
    this.touchStartX = 0;
    this.touchCurrentX = 0;
    this.lastTouchX = 0;
    
    // Sensitivity settings
    this.steerSensitivity = 0.008; // How much finger movement affects steering
    this.steerSmoothing = 0.15; // Smoothing factor (lower = smoother)
    this.steerDeadzone = 5; // Pixels of movement before steering kicks in
    this.maxSteerFromCenter = 100; // Max pixels from touch start for full turn
    
    // Boost button
    this.boostTouchId = null;
    this.boostButtonActive = false;
    
    // Screen dimensions
    this.updateDimensions();
    
    // Create UI graphics
    this.steerIndicator = scene.add.graphics();
    this.boostGraphics = scene.add.graphics();
    
    // Make UI fixed to camera
    this.steerIndicator.setScrollFactor(0);
    this.boostGraphics.setScrollFactor(0);
    this.steerIndicator.setDepth(1000);
    this.boostGraphics.setDepth(1000);
    
    // Set up input handlers
    this.setupInput();
    
    // Initial draw
    this.draw();
  }
  
  updateDimensions() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Boost button position (right side, bottom)
    this.boostButtonX = width - 70;
    this.boostButtonY = height - 90;
    this.boostButtonRadius = 40;
    
    // Steering zone (entire left 70% of screen, excluding boost button area)
    this.steerZoneWidth = width * 0.7;
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
      
      if (boostDist < this.boostButtonRadius + 15) {
        this.boostButtonActive = true;
        this.boostPressed = true;
        this.boostTouchId = pointer.id;
        this.draw();
        return;
      }
      
      // Steering touch - anywhere else on screen
      if (this.activeTouch === null && x < this.steerZoneWidth) {
        this.activeTouch = pointer.id;
        this.touchStartX = x;
        this.touchCurrentX = x;
        this.lastTouchX = x;
        this.draw();
      }
    });
    
    // Touch/pointer move - smooth tracking
    scene.input.on('pointermove', (pointer) => {
      if (pointer.id === this.activeTouch) {
        this.lastTouchX = this.touchCurrentX;
        this.touchCurrentX = pointer.x;
        this.updateSteering();
        this.draw();
      }
    });
    
    // Touch/pointer up
    scene.input.on('pointerup', (pointer) => {
      if (pointer.id === this.activeTouch) {
        this.activeTouch = null;
        // Don't immediately zero out - let it smooth back
        this.draw();
      }
      
      if (pointer.id === this.boostTouchId) {
        this.boostButtonActive = false;
        this.boostTouchId = null;
        this.draw();
      }
    });
    
    // Keyboard support for desktop testing
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyA = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyW = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyS = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  }
  
  updateSteering() {
    if (this.activeTouch === null) return;
    
    // Calculate steering based on finger position relative to touch start
    const deltaX = this.touchCurrentX - this.touchStartX;
    
    // Apply deadzone
    if (Math.abs(deltaX) < this.steerDeadzone) {
      // Smooth back to center when in deadzone
      return;
    }
    
    // Normalize to -1 to 1 range based on max distance
    let rawSteer = deltaX / this.maxSteerFromCenter;
    rawSteer = Phaser.Math.Clamp(rawSteer, -1, 1);
    
    // Apply non-linear curve for finer control at small angles
    // This makes small movements more precise while still allowing full turns
    const sign = Math.sign(rawSteer);
    const magnitude = Math.abs(rawSteer);
    rawSteer = sign * Math.pow(magnitude, 0.7);
    
    this.targetSteerX = rawSteer;
  }
  
  update(delta) {
    // Reset boost press (one-shot trigger)
    this.boostPressed = false;
    
    // Smooth steering interpolation
    if (this.activeTouch !== null) {
      // Smoothly move towards target
      this.steerX = Phaser.Math.Linear(
        this.steerX,
        this.targetSteerX || 0,
        this.steerSmoothing
      );
    } else {
      // Smoothly return to center when not touching
      this.steerX = Phaser.Math.Linear(this.steerX, 0, this.steerSmoothing * 0.5);
      if (Math.abs(this.steerX) < 0.01) this.steerX = 0;
    }
    
    // Throttle is always forward on mobile (auto-accelerate)
    this.throttle = this.activeTouch !== null ? 0.3 : 0;
    
    // Handle keyboard input for desktop
    let keyboardActive = false;
    
    if (this.cursors.left.isDown || this.keyA.isDown) {
      this.steerX = Phaser.Math.Linear(this.steerX, -1, 0.15);
      keyboardActive = true;
    } else if (this.cursors.right.isDown || this.keyD.isDown) {
      this.steerX = Phaser.Math.Linear(this.steerX, 1, 0.15);
      keyboardActive = true;
    } else if (this.activeTouch === null) {
      // Only zero keyboard steering if no touch active
      if (!this.cursors.left.isDown && !this.cursors.right.isDown && 
          !this.keyA.isDown && !this.keyD.isDown) {
        // Already handled above
      }
    }
    
    // Throttle from keyboard
    if (this.cursors.up.isDown || this.keyW.isDown) {
      this.throttle = 1;
    } else if (this.cursors.down.isDown || this.keyS.isDown) {
      this.throttle = -0.5;
    }
    
    // Boost from keyboard
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.boostPressed = true;
    }
  }
  
  draw() {
    this.updateDimensions();
    
    // Draw steering indicator
    this.steerIndicator.clear();
    
    if (this.activeTouch !== null) {
      const width = this.scene.cameras.main.width;
      const height = this.scene.cameras.main.height;
      
      // Show touch origin point
      this.steerIndicator.fillStyle(0xffffff, 0.15);
      this.steerIndicator.fillCircle(this.touchStartX, height / 2, 8);
      
      // Show current touch position as a line indicator
      this.steerIndicator.lineStyle(3, 0x00ff88, 0.4);
      this.steerIndicator.lineBetween(
        this.touchStartX, height / 2 - 30,
        this.touchStartX, height / 2 + 30
      );
      
      // Direction indicator
      const indicatorX = this.touchStartX + (this.steerX * 50);
      this.steerIndicator.fillStyle(0x00ff88, 0.6);
      this.steerIndicator.fillTriangle(
        indicatorX, height / 2 - 15,
        indicatorX + (this.steerX > 0 ? 15 : -15), height / 2,
        indicatorX, height / 2 + 15
      );
    }
    
    // Draw boost button
    this.boostGraphics.clear();
    
    const boostAlpha = this.boostButtonActive ? 0.8 : 0.5;
    const boostColor = 0x00ff88;
    
    // Outer glow when active
    if (this.boostButtonActive) {
      this.boostGraphics.fillStyle(boostColor, 0.2);
      this.boostGraphics.fillCircle(
        this.boostButtonX,
        this.boostButtonY,
        this.boostButtonRadius + 10
      );
    }
    
    // Button background
    this.boostGraphics.fillStyle(0x1a0a2e, 0.8);
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
    
    // Lightning bolt icon
    this.boostGraphics.fillStyle(boostColor, boostAlpha);
    const bx = this.boostButtonX;
    const by = this.boostButtonY;
    this.boostGraphics.beginPath();
    this.boostGraphics.moveTo(bx - 6, by - 15);
    this.boostGraphics.lineTo(bx + 8, by - 3);
    this.boostGraphics.lineTo(bx + 1, by - 3);
    this.boostGraphics.lineTo(bx + 6, by + 15);
    this.boostGraphics.lineTo(bx - 8, by + 3);
    this.boostGraphics.lineTo(bx - 1, by + 3);
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
  
  destroy() {
    this.steerIndicator.destroy();
    this.boostGraphics.destroy();
  }
}
