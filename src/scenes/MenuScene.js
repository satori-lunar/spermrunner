// Menu Scene - Whimsical, colorful main menu
import { GAME_CONFIG } from '../config/GameConfig.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }
  
  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    this.createBackground();
    this.createTitle();
    this.createButtons();
    this.createFloatingPods();
    this.loadProgress();
  }
  
  createBackground() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const colors = GAME_CONFIG.COLORS;
    
    // Gradient background
    this.bgGraphics = this.add.graphics();
    
    for (let i = 0; i < height; i += 2) {
      const t = i / height;
      const color1 = Phaser.Display.Color.ValueToColor(colors.BACKGROUND_TOP);
      const color2 = Phaser.Display.Color.ValueToColor(colors.BACKGROUND_BOTTOM);
      const blended = Phaser.Display.Color.Interpolate.ColorWithColor(color1, color2, 100, t * 100);
      const hex = Phaser.Display.Color.GetColor(blended.r, blended.g, blended.b);
      
      this.bgGraphics.fillStyle(hex, 1);
      this.bgGraphics.fillRect(0, i, width, 2);
    }
    
    // Sparkle particles
    this.particles = [];
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1 + Math.random() * 3,
        speed: 15 + Math.random() * 25,
        alpha: 0.2 + Math.random() * 0.5,
        twinkle: Math.random() * Math.PI * 2
      });
    }
    
    this.particleGraphics = this.add.graphics();
  }
  
  createTitle() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const colors = GAME_CONFIG.COLORS;
    
    // Responsive title size
    const titleSize = Math.min(32, width * 0.08);
    
    // Title glow
    this.titleGlow = this.add.text(width / 2, height * 0.12, 'STREAMRACER', {
      fontFamily: 'Georgia, serif',
      fontSize: `${titleSize}px`,
      color: '#00ffcc',
      stroke: '#00ffcc',
      strokeThickness: 6
    }).setOrigin(0.5).setAlpha(0.3);
    
    // Main title
    this.title = this.add.text(width / 2, height * 0.12, 'STREAMRACER', {
      fontFamily: 'Georgia, serif',
      fontSize: `${titleSize}px`,
      color: '#ffffff',
      stroke: '#1a0533',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    // Subtitle
    this.subtitle = this.add.text(width / 2, height * 0.20, '✨ Race to the Energy Core! ✨', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#80deea'
    }).setOrigin(0.5);
    
    // Pulsing glow animation
    this.tweens.add({
      targets: this.titleGlow,
      alpha: 0.5,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Floating title animation
    this.tweens.add({
      targets: [this.title, this.titleGlow],
      y: height * 0.12 + 5,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  createButtons() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    const buttonY = height * 0.45;
    const buttonSpacing = 65;
    
    this.createButton(width / 2, buttonY, '🚀 START RACE', () => this.startGame(), 0x00ffcc);
    
    this.continueButton = this.createButton(
      width / 2,
      buttonY + buttonSpacing,
      '📍 CONTINUE',
      () => this.continueGame(),
      0x7c4dff,
      true
    );
    
    this.createButton(
      width / 2,
      buttonY + buttonSpacing * 2,
      '❓ HOW TO PLAY',
      () => this.showTutorial(),
      0xff66aa
    );
    
    // Best time display
    this.bestTimeText = this.add.text(width / 2, height * 0.88, '', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#80cbc4'
    }).setOrigin(0.5);
  }
  
  createButton(x, y, text, callback, accentColor, hidden = false) {
    const buttonWidth = 180;
    const buttonHeight = 45;
    
    const container = this.add.container(x, y);
    
    // Button glow
    const glow = this.add.graphics();
    glow.fillStyle(accentColor, 0.2);
    glow.fillRoundedRect(-buttonWidth / 2 - 5, -buttonHeight / 2 - 5, buttonWidth + 10, buttonHeight + 10, 15);
    
    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a0533, 0.9);
    bg.fillRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
    bg.lineStyle(2, accentColor, 0.8);
    bg.strokeRoundedRect(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight, 12);
    
    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontFamily: 'Georgia, serif',
      fontSize: '15px',
      color: Phaser.Display.Color.IntegerToColor(accentColor).rgba
    }).setOrigin(0.5);
    
    container.add([glow, bg, buttonText]);
    
    const hitArea = new Phaser.Geom.Rectangle(-buttonWidth / 2, -buttonHeight / 2, buttonWidth, buttonHeight);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    
    container.on('pointerover', () => {
      glow.clear();
      glow.fillStyle(accentColor, 0.35);
      glow.fillRoundedRect(-buttonWidth / 2 - 8, -buttonHeight / 2 - 8, buttonWidth + 16, buttonHeight + 16, 18);
      buttonText.setColor('#ffffff');
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100
      });
    });
    
    container.on('pointerout', () => {
      glow.clear();
      glow.fillStyle(accentColor, 0.2);
      glow.fillRoundedRect(-buttonWidth / 2 - 5, -buttonHeight / 2 - 5, buttonWidth + 10, buttonHeight + 10, 15);
      buttonText.setColor(Phaser.Display.Color.IntegerToColor(accentColor).rgba);
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 100
      });
    });
    
    container.on('pointerdown', callback);
    
    if (hidden) {
      container.setVisible(false);
    }
    
    return container;
  }
  
  createFloatingPods() {
    // Cute floating pods in background
    this.bgPods = [];
    const colors = [
      GAME_CONFIG.COLORS.RIVAL_PINK,
      GAME_CONFIG.COLORS.RIVAL_ORANGE,
      GAME_CONFIG.COLORS.RIVAL_PURPLE,
      GAME_CONFIG.COLORS.RIVAL_BLUE,
      GAME_CONFIG.COLORS.PLAYER_CORE
    ];
    
    for (let i = 0; i < 10; i++) {
      const pod = this.add.graphics();
      this.bgPods.push({
        graphics: pod,
        x: Math.random() * this.cameras.main.width,
        y: Math.random() * this.cameras.main.height,
        speed: 20 + Math.random() * 40,
        angle: -90 + (Math.random() - 0.5) * 50,
        size: 0.4 + Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.15 + Math.random() * 0.25,
        wobble: Math.random() * Math.PI * 2
      });
    }
  }
  
  loadProgress() {
    try {
      const saved = localStorage.getItem('streamracer_progress');
      if (saved) {
        const data = JSON.parse(saved);
        
        if (data.currentStage > 1) {
          this.continueButton.setVisible(true);
          this.savedProgress = data;
        }
        
        if (data.bestTime) {
          const minutes = Math.floor(data.bestTime / 60000);
          const seconds = Math.floor((data.bestTime % 60000) / 1000);
          this.bestTimeText.setText(`🏆 Best: ${minutes}:${seconds.toString().padStart(2, '0')}`);
        }
      }
    } catch (e) {
      console.log('No saved progress');
    }
  }
  
  startGame() {
    localStorage.removeItem('streamracer_progress');
    
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.scene.start('GameScene', { stage: 1 });
    });
  }
  
  continueGame() {
    if (this.savedProgress) {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
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
    
    const overlay = this.add.graphics();
    overlay.fillStyle(0x0d1b2a, 0.95);
    overlay.fillRoundedRect(20, height * 0.1, width - 40, height * 0.8, 20);
    overlay.setDepth(100);
    
    const tutorialText = [
      '🎮 HOW TO PLAY',
      '',
      '👆 Touch & drag to steer your pod',
      '⚡ Tap BOOST for a speed burst',
      '',
      '💥 Bump rivals to slow them down',
      '🌀 Avoid obstacles & currents',
      '✨ Collect powerups for bonuses',
      '',
      '🎯 Race through 8 stages',
      '💫 Reach the Energy Core!',
      '',
      '[ Tap anywhere to close ]'
    ];
    
    const text = this.add.text(width / 2, height / 2, tutorialText.join('\n'), {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#ffffff',
      align: 'center',
      lineSpacing: 6
    }).setOrigin(0.5);
    text.setDepth(101);
    
    overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, width, height), Phaser.Geom.Rectangle.Contains);
    overlay.on('pointerdown', () => {
      overlay.destroy();
      text.destroy();
    });
  }
  
  update(time, delta) {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Animate sparkles
    this.particleGraphics.clear();
    for (const p of this.particles) {
      p.y -= p.speed * (delta / 1000);
      p.twinkle += delta * 0.005;
      
      if (p.y < -10) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      
      const twinkleAlpha = p.alpha * (0.5 + Math.sin(p.twinkle) * 0.5);
      this.particleGraphics.fillStyle(0xffffff, twinkleAlpha);
      this.particleGraphics.fillCircle(p.x, p.y, p.size);
    }
    
    // Animate floating pods
    for (const pod of this.bgPods) {
      const angleRad = Phaser.Math.DegToRad(pod.angle);
      pod.x += Math.cos(angleRad) * pod.speed * (delta / 1000);
      pod.y += Math.sin(angleRad) * pod.speed * (delta / 1000);
      pod.wobble += delta * 0.003;
      
      // Wrap around
      if (pod.y < -50) {
        pod.y = height + 50;
        pod.x = Math.random() * width;
      }
      if (pod.x < -50) pod.x = width + 50;
      if (pod.x > width + 50) pod.x = -50;
      
      // Draw cute pod
      pod.graphics.clear();
      pod.graphics.setPosition(pod.x, pod.y);
      
      // Trail ribbon
      pod.graphics.lineStyle(3 * pod.size, pod.color, pod.alpha * 0.4);
      pod.graphics.beginPath();
      pod.graphics.moveTo(0, 0);
      for (let i = 1; i <= 4; i++) {
        const wave = Math.sin(pod.wobble + i) * 4 * pod.size;
        pod.graphics.lineTo(wave, i * 8 * pod.size);
      }
      pod.graphics.strokePath();
      
      // Body
      pod.graphics.fillStyle(pod.color, pod.alpha);
      pod.graphics.fillEllipse(0, -5 * pod.size, 8 * pod.size, 12 * pod.size);
      
      // Eye highlight
      pod.graphics.fillStyle(0xffffff, pod.alpha * 0.6);
      pod.graphics.fillCircle(-1 * pod.size, -7 * pod.size, 2 * pod.size);
    }
  }
}
