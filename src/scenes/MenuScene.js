// Menu Scene - Main menu and start screen
import { GAME_CONFIG } from '../config/GameConfig.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }
  
  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Animated background
    this.createBackground();
    
    // Title
    this.createTitle();
    
    // Menu buttons
    this.createButtons();
    
    // Animated sperm in background
    this.createBackgroundAnimation();
    
    // Load saved progress
    this.loadProgress();
  }
  
  createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Gradient background
    this.bgGraphics = this.add.graphics();
    
    // Deep purple to pink gradient (simulated with rectangles)
    for (let i = 0; i < height; i += 4) {
      const t = i / height;
      const r = Math.floor(26 + t * 40);
      const g = Math.floor(10 + t * 20);
      const b = Math.floor(46 + t * 30);
      const color = Phaser.Display.Color.GetColor(r, g, b);
      
      this.bgGraphics.fillStyle(color, 1);
      this.bgGraphics.fillRect(0, i, width, 4);
    }
    
    // Floating particles
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 2 + Math.random() * 4,
        speed: 10 + Math.random() * 20,
        alpha: 0.1 + Math.random() * 0.3
      });
    }
    
    this.particleGraphics = this.add.graphics();
  }
  
  createTitle() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Game title with glow effect - responsive font size
    const fontSize = Math.min(42, width * 0.1);
    
    this.titleGlow = this.add.text(width / 2, height * 0.15, 'SPERMRUNNER', {
      fontFamily: '"Courier New", monospace',
      fontSize: `${fontSize}px`,
      color: '#00ff88',
      stroke: '#00ff88',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0.3);
    
    this.title = this.add.text(width / 2, height * 0.15, 'SPERMRUNNER', {
      fontFamily: '"Courier New", monospace',
      fontSize: `${fontSize}px`,
      color: '#ffffff',
      stroke: '#1a0a2e',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Subtitle
    this.subtitle = this.add.text(width / 2, height * 0.22, 'Race to the Egg!', {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#88ffbb'
    }).setOrigin(0.5);
    
    // Pulsing animation on title
    this.tweens.add({
      targets: this.titleGlow,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  createButtons() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const buttonY = height * 0.5;
    const buttonSpacing = 70;
    
    // Start Game button
    this.createButton(
      width / 2,
      buttonY,
      'START RACE',
      () => this.startGame()
    );
    
    // Continue button (if saved progress)
    this.continueButton = this.createButton(
      width / 2,
      buttonY + buttonSpacing,
      'CONTINUE',
      () => this.continueGame(),
      true // Initially hidden
    );
    
    // How to Play
    this.createButton(
      width / 2,
      buttonY + buttonSpacing * 2,
      'HOW TO PLAY',
      () => this.showTutorial()
    );
    
    // Best time display
    this.bestTimeText = this.add.text(width / 2, height * 0.85, '', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#888888'
    }).setOrigin(0.5);
  }
  
  createButton(x, y, text, callback, hidden = false) {
    const buttonWidth = 200;
    const buttonHeight = 50;
    
    // Button container
    const container = this.add.container(x, y);
    
    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x2d1a4c, 0.9);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
    bg.lineStyle(2, 0x00ff88, 0.8);
    bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
    
    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: '"Courier New", monospace',
      fontSize: '18px',
      color: '#00ff88'
    }).setOrigin(0.5);
    
    container.add([bg, buttonText]);
    
    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(
      -buttonWidth / 2, -buttonHeight / 2,
      buttonWidth, buttonHeight
    );
    
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    
    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x3d2a5c, 1);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      bg.lineStyle(3, 0x00ff88, 1);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      buttonText.setColor('#ffffff');
    });
    
    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x2d1a4c, 0.9);
      bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      bg.lineStyle(2, 0x00ff88, 0.8);
      bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 10);
      buttonText.setColor('#00ff88');
    });
    
    container.on('pointerdown', callback);
    
    if (hidden) {
      container.setVisible(false);
    }
    
    return container;
  }
  
  createBackgroundAnimation() {
    // Animated sperms swimming in background
    this.bgSperms = [];
    
    for (let i = 0; i < 8; i++) {
      const sperm = this.add.graphics();
      const x = Math.random() * this.cameras.main.width;
      const y = Math.random() * this.cameras.main.height;
      
      this.bgSperms.push({
        graphics: sperm,
        x: x,
        y: y,
        speed: 30 + Math.random() * 50,
        angle: -90 + (Math.random() - 0.5) * 40,
        size: 0.5 + Math.random() * 0.5,
        alpha: 0.1 + Math.random() * 0.2
      });
    }
  }
  
  loadProgress() {
    try {
      const saved = localStorage.getItem('spermrunner_progress');
      if (saved) {
        const data = JSON.parse(saved);
        
        if (data.currentStage > 1) {
          this.continueButton.setVisible(true);
          this.savedProgress = data;
        }
        
        if (data.bestTime) {
          const minutes = Math.floor(data.bestTime / 60000);
          const seconds = Math.floor((data.bestTime % 60000) / 1000);
          this.bestTimeText.setText(
            `Best Time: ${minutes}:${seconds.toString().padStart(2, '0')}`
          );
        }
      }
    } catch (e) {
      console.log('No saved progress');
    }
  }
  
  startGame() {
    // Clear saved progress
    localStorage.removeItem('spermrunner_progress');
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('GameScene', { stage: 1 });
    });
  }
  
  continueGame() {
    if (this.savedProgress) {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('GameScene', { 
          stage: this.savedProgress.currentStage,
          elapsedTime: this.savedProgress.elapsedTime || 0
        });
      });
    }
  }
  
  showTutorial() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Tutorial overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.9);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(100);
    
    const tutorialText = [
      'HOW TO PLAY',
      '',
      'Touch & drag on the left side to steer',
      'Tap the BOOST button for speed burst',
      '',
      'Bump into rivals to knock them off course',
      'Avoid obstacles and currents',
      'Collect powerups for advantages',
      '',
      'Race through 8 stages to reach the EGG!',
      '',
      'Tap anywhere to close'
    ];
    
    const text = this.add.text(width / 2, height / 2, tutorialText.join('\n'), {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 8
    }).setOrigin(0.5);
    text.setDepth(101);
    
    // Close on tap
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    overlay.on('pointerdown', () => {
      overlay.destroy();
      text.destroy();
    });
  }
  
  update(time, delta) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Update background particles
    this.particleGraphics.clear();
    for (const p of this.particles) {
      p.y -= p.speed * (delta / 1000);
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      
      this.particleGraphics.fillStyle(0xffffff, p.alpha);
      this.particleGraphics.fillCircle(p.x, p.y, p.size);
    }
    
    // Update background sperms
    for (const sperm of this.bgSperms) {
      const angleRad = Phaser.Math.DegToRad(sperm.angle);
      sperm.x += Math.cos(angleRad) * sperm.speed * (delta / 1000);
      sperm.y += Math.sin(angleRad) * sperm.speed * (delta / 1000);
      
      // Wrap around screen
      if (sperm.y < -50) {
        sperm.y = height + 50;
        sperm.x = Math.random() * width;
      }
      
      // Draw sperm
      sperm.graphics.clear();
      sperm.graphics.setPosition(sperm.x, sperm.y);
      sperm.graphics.setAngle(sperm.angle + 90);
      
      // Tail
      sperm.graphics.lineStyle(2 * sperm.size, 0x00ff88, sperm.alpha * 0.5);
      sperm.graphics.beginPath();
      sperm.graphics.moveTo(0, 0);
      for (let i = 1; i <= 4; i++) {
        const waveX = Math.sin(time * 0.005 + i) * 3 * sperm.size;
        sperm.graphics.lineTo(waveX, i * 5 * sperm.size);
      }
      sperm.graphics.strokePath();
      
      // Head
      sperm.graphics.fillStyle(0x00ff88, sperm.alpha);
      sperm.graphics.fillEllipse(0, -5 * sperm.size, 8 * sperm.size, 12 * sperm.size);
    }
  }
}
