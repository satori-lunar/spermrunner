// HUD - Whimsical heads-up display
import { GAME_CONFIG, STAGE_CONFIG } from '../config/GameConfig.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(900);
    
    this.createStageDisplay();
    this.createProgressBar();
    this.createBoostMeter();
    this.createPositionDisplay();
    this.createTimeDisplay();
  }
  
  createStageDisplay() {
    // Stage indicator with playful style
    this.stageText = this.scene.add.text(20, 18, '✨ Stage 1', {
      fontFamily: 'Georgia, serif',
      fontSize: '18px',
      color: '#00ffcc',
      stroke: '#0d1b2a',
      strokeThickness: 3
    });
    
    this.stageNameText = this.scene.add.text(20, 40, 'Gentle Stream', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#80deea',
      stroke: '#0d1b2a',
      strokeThickness: 2
    });
    
    this.container.add([this.stageText, this.stageNameText]);
  }
  
  createProgressBar() {
    const width = this.scene.cameras.main.width;
    
    // Progress bar with rounded ends
    this.progressBg = this.scene.add.graphics();
    this.progressBg.fillStyle(0x1a0533, 0.8);
    this.progressBg.fillRoundedRect(width / 2 - 80, 15, 160, 14, 7);
    this.progressBg.lineStyle(1, 0x4fc3f7, 0.5);
    this.progressBg.strokeRoundedRect(width / 2 - 80, 15, 160, 14, 7);
    
    this.progressFill = this.scene.add.graphics();
    
    this.progressLabel = this.scene.add.text(width / 2, 36, '0%', {
      fontFamily: 'Georgia, serif',
      fontSize: '11px',
      color: '#80cbc4',
      stroke: '#0d1b2a',
      strokeThickness: 2
    }).setOrigin(0.5, 0);
    
    this.container.add([this.progressBg, this.progressFill, this.progressLabel]);
  }
  
  createBoostMeter() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Boost meter near button
    this.boostMeterBg = this.scene.add.graphics();
    this.boostMeterBg.fillStyle(0x1a0533, 0.7);
    this.boostMeterBg.fillRoundedRect(width - 115, height - 145, 50, 8, 4);
    
    this.boostMeterFill = this.scene.add.graphics();
    
    this.boostLabel = this.scene.add.text(width - 90, height - 158, '⚡', {
      fontSize: '14px'
    }).setOrigin(0.5, 0);
    
    this.container.add([this.boostMeterBg, this.boostMeterFill, this.boostLabel]);
  }
  
  createPositionDisplay() {
    const width = this.scene.cameras.main.width;
    
    // Position with medal colors
    this.positionText = this.scene.add.text(width - 20, 18, '1st', {
      fontFamily: 'Georgia, serif',
      fontSize: '26px',
      color: '#ffd700',
      stroke: '#0d1b2a',
      strokeThickness: 4
    }).setOrigin(1, 0);
    
    this.positionLabel = this.scene.add.text(width - 20, 48, 'of 5', {
      fontFamily: 'Georgia, serif',
      fontSize: '12px',
      color: '#b0bec5',
      stroke: '#0d1b2a',
      strokeThickness: 2
    }).setOrigin(1, 0);
    
    this.container.add([this.positionText, this.positionLabel]);
  }
  
  createTimeDisplay() {
    const width = this.scene.cameras.main.width;
    
    this.timeText = this.scene.add.text(width / 2, 55, '⏱ 00:00', {
      fontFamily: 'Georgia, serif',
      fontSize: '13px',
      color: '#e0e0e0',
      stroke: '#0d1b2a',
      strokeThickness: 2
    }).setOrigin(0.5, 0);
    
    this.container.add(this.timeText);
  }
  
  update(data) {
    const {
      stage,
      stageName,
      progress,
      boostProgress,
      canBoost,
      position,
      totalRacers,
      elapsedTime
    } = data;
    
    // Stage
    this.stageText.setText(`✨ Stage ${stage}`);
    this.stageNameText.setText(stageName);
    
    // Progress bar with gradient
    const width = this.scene.cameras.main.width;
    const progressWidth = Math.min(progress, 1) * 156;
    
    this.progressFill.clear();
    if (progressWidth > 2) {
      // Gradient from cyan to gold as progress increases
      const progressColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 0, g: 255, b: 204 },
        { r: 255, g: 215, b: 0 },
        100,
        Math.min(progress * 100, 100)
      );
      const hexColor = Phaser.Display.Color.GetColor(progressColor.r, progressColor.g, progressColor.b);
      
      this.progressFill.fillStyle(hexColor, 0.9);
      this.progressFill.fillRoundedRect(width / 2 - 78, 17, progressWidth, 10, 5);
    }
    
    this.progressLabel.setText(`${Math.floor(progress * 100)}%`);
    
    // Boost meter
    const height = this.scene.cameras.main.height;
    const boostWidth = boostProgress * 46;
    
    this.boostMeterFill.clear();
    if (boostWidth > 2) {
      const boostColor = canBoost ? 0x00ffcc : 0x607d8b;
      this.boostMeterFill.fillStyle(boostColor, 0.9);
      this.boostMeterFill.fillRoundedRect(width - 113, height - 143, boostWidth, 4, 2);
    }
    
    // Position with color coding
    const positionSuffix = this.getPositionSuffix(position);
    this.positionText.setText(`${position}${positionSuffix}`);
    this.positionLabel.setText(`of ${totalRacers}`);
    
    // Medal colors
    if (position === 1) {
      this.positionText.setColor('#ffd700'); // Gold
    } else if (position === 2) {
      this.positionText.setColor('#c0c0c0'); // Silver
    } else if (position === 3) {
      this.positionText.setColor('#cd7f32'); // Bronze
    } else {
      this.positionText.setColor('#90a4ae');
    }
    
    // Time
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    this.timeText.setText(`⏱ ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  }
  
  getPositionSuffix(position) {
    if (position === 1) return 'st';
    if (position === 2) return 'nd';
    if (position === 3) return 'rd';
    return 'th';
  }
  
  showStageTransition(stageNumber, stageName) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Playful stage transition
    const overlay = this.scene.add.graphics();
    overlay.setScrollFactor(0);
    overlay.setDepth(950);
    overlay.fillStyle(0x0d1b2a, 0.85);
    overlay.fillRoundedRect(30, height / 2 - 50, width - 60, 100, 20);
    
    const stageTitle = this.scene.add.text(width / 2, height / 2 - 15, `✨ STAGE ${stageNumber} ✨`, {
      fontFamily: 'Georgia, serif',
      fontSize: '28px',
      color: '#00ffcc',
      stroke: '#0d1b2a',
      strokeThickness: 4
    }).setOrigin(0.5);
    stageTitle.setScrollFactor(0);
    stageTitle.setDepth(951);
    
    const nameText = this.scene.add.text(width / 2, height / 2 + 20, stageName, {
      fontFamily: 'Georgia, serif',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    nameText.setScrollFactor(0);
    nameText.setDepth(951);
    
    // Animate in
    this.scene.tweens.add({
      targets: [overlay, stageTitle, nameText],
      alpha: { from: 0, to: 1 },
      duration: 300
    });
    
    // Animate out
    this.scene.tweens.add({
      targets: [overlay, stageTitle, nameText],
      alpha: 0,
      delay: 1800,
      duration: 400,
      onComplete: () => {
        overlay.destroy();
        stageTitle.destroy();
        nameText.destroy();
      }
    });
  }
  
  showMessage(text, duration = 2000) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const message = this.scene.add.text(width / 2, height / 2, text, {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#0d1b2a',
      strokeThickness: 3
    }).setOrigin(0.5);
    message.setScrollFactor(0);
    message.setDepth(951);
    
    this.scene.tweens.add({
      targets: message,
      alpha: 0,
      y: height / 2 - 40,
      scale: 1.2,
      delay: duration - 400,
      duration: 400,
      onComplete: () => message.destroy()
    });
  }
  
  destroy() {
    this.container.destroy();
  }
}
