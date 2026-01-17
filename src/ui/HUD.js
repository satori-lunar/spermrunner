// HUD - Clean, minimal heads-up display (positioned outside tunnel)
import { GAME_CONFIG, STAGE_CONFIG } from '../config/GameConfig.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(850); // Below vignette
    
    this.createStageDisplay();
    this.createProgressBar();
    this.createBoostMeter();
    this.createPositionDisplay();
  }
  
  createStageDisplay() {
    // Minimal stage indicator (top-left corner, small)
    this.stageText = this.scene.add.text(12, 8, 'Stage 1', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#4fc3f7',
      stroke: '#050a15',
      strokeThickness: 2
    });
    
    this.stageNameText = this.scene.add.text(12, 24, 'Gentle Stream', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#78909c',
      stroke: '#050a15',
      strokeThickness: 1
    });
    
    this.container.add([this.stageText, this.stageNameText]);
  }
  
  createProgressBar() {
    const width = this.scene.cameras.main.width;
    
    // Thin progress bar at very top
    this.progressBg = this.scene.add.graphics();
    this.progressBg.fillStyle(0x1a2a3a, 0.6);
    this.progressBg.fillRect(0, 0, width, 4);
    
    this.progressFill = this.scene.add.graphics();
    
    this.container.add([this.progressBg, this.progressFill]);
  }
  
  createBoostMeter() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Small boost indicator near button
    this.boostMeterBg = this.scene.add.graphics();
    this.boostMeterBg.fillStyle(0x1a2a3a, 0.5);
    this.boostMeterBg.fillRoundedRect(width - 95, height - 135, 40, 5, 2);
    
    this.boostMeterFill = this.scene.add.graphics();
    
    this.container.add([this.boostMeterBg, this.boostMeterFill]);
  }
  
  createPositionDisplay() {
    const width = this.scene.cameras.main.width;
    
    // Position indicator (top-right, subtle)
    this.positionText = this.scene.add.text(width - 12, 10, '1st', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffd54f',
      stroke: '#050a15',
      strokeThickness: 2
    }).setOrigin(1, 0);
    
    this.positionLabel = this.scene.add.text(width - 12, 28, '/5', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '10px',
      color: '#607d8b',
      stroke: '#050a15',
      strokeThickness: 1
    }).setOrigin(1, 0);
    
    this.container.add([this.positionText, this.positionLabel]);
  }
  
  update(data) {
    const {
      stage,
      stageName,
      progress,
      boostProgress,
      canBoost,
      position,
      totalRacers
    } = data;
    
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Stage
    this.stageText.setText(`Stage ${stage}`);
    this.stageNameText.setText(stageName);
    
    // Progress bar (top edge)
    const progressWidth = Math.min(progress, 1) * width;
    
    this.progressFill.clear();
    if (progressWidth > 0) {
      // Gradient color based on progress
      const progressColor = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 79, g: 195, b: 247 },  // Cyan
        { r: 255, g: 213, b: 79 },  // Gold
        100,
        Math.min(progress * 100, 100)
      );
      const hexColor = Phaser.Display.Color.GetColor(progressColor.r, progressColor.g, progressColor.b);
      
      this.progressFill.fillStyle(hexColor, 0.8);
      this.progressFill.fillRect(0, 0, progressWidth, 4);
    }
    
    // Boost meter
    const boostWidth = boostProgress * 36;
    
    this.boostMeterFill.clear();
    if (boostWidth > 0) {
      const boostColor = canBoost ? 0x00e676 : 0x455a64;
      this.boostMeterFill.fillStyle(boostColor, 0.8);
      this.boostMeterFill.fillRoundedRect(width - 93, height - 133, boostWidth, 3, 1);
    }
    
    // Position
    const suffix = this.getPositionSuffix(position);
    this.positionText.setText(`${position}${suffix}`);
    this.positionLabel.setText(`/${totalRacers}`);
    
    // Medal colors
    if (position === 1) {
      this.positionText.setColor('#ffd54f');
    } else if (position === 2) {
      this.positionText.setColor('#b0bec5');
    } else if (position === 3) {
      this.positionText.setColor('#ffab91');
    } else {
      this.positionText.setColor('#78909c');
    }
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
    
    // Subtle stage transition
    const overlay = this.scene.add.graphics();
    overlay.setScrollFactor(0);
    overlay.setDepth(900);
    overlay.fillStyle(0x050a15, 0.7);
    overlay.fillRoundedRect(width / 2 - 90, height / 2 - 35, 180, 70, 12);
    
    const stageTitle = this.scene.add.text(width / 2, height / 2 - 10, `Stage ${stageNumber}`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      color: '#4fc3f7'
    }).setOrigin(0.5);
    stageTitle.setScrollFactor(0);
    stageTitle.setDepth(901);
    
    const nameText = this.scene.add.text(width / 2, height / 2 + 15, stageName, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#90a4ae'
    }).setOrigin(0.5);
    nameText.setScrollFactor(0);
    nameText.setDepth(901);
    
    this.scene.tweens.add({
      targets: [overlay, stageTitle, nameText],
      alpha: { from: 0, to: 1 },
      duration: 250
    });
    
    this.scene.tweens.add({
      targets: [overlay, stageTitle, nameText],
      alpha: 0,
      delay: 1500,
      duration: 350,
      onComplete: () => {
        overlay.destroy();
        stageTitle.destroy();
        nameText.destroy();
      }
    });
  }
  
  showMessage(text, duration = 1500) {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    const message = this.scene.add.text(width / 2, height * 0.4, text, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#050a15',
      strokeThickness: 2
    }).setOrigin(0.5);
    message.setScrollFactor(0);
    message.setDepth(901);
    
    this.scene.tweens.add({
      targets: message,
      alpha: 0,
      y: height * 0.35,
      delay: duration - 300,
      duration: 300,
      onComplete: () => message.destroy()
    });
  }
  
  destroy() {
    this.container.destroy();
  }
}
