// HUD - Heads Up Display for game info
import { GAME_CONFIG, STAGE_CONFIG } from '../config/GameConfig.js';

export class HUD {
  constructor(scene) {
    this.scene = scene;
    
    // Container for all HUD elements (fixed to camera)
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(900);
    
    // Create HUD elements
    this.createStageDisplay();
    this.createProgressBar();
    this.createBoostMeter();
    this.createPositionDisplay();
    this.createTimeDisplay();
  }
  
  createStageDisplay() {
    // Stage name and number
    this.stageText = this.scene.add.text(20, 20, 'Stage 1', {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#00ff88',
      stroke: '#000',
      strokeThickness: 3
    });
    
    this.stageNameText = this.scene.add.text(20, 44, 'The Beginning', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#88ffbb',
      stroke: '#000',
      strokeThickness: 2
    });
    
    this.container.add([this.stageText, this.stageNameText]);
  }
  
  createProgressBar() {
    const width = this.scene.cameras.main.width;
    
    // Progress bar background
    this.progressBg = this.scene.add.graphics();
    this.progressBg.fillStyle(0x333333, 0.7);
    this.progressBg.fillRoundedRect(width / 2 - 100, 15, 200, 16, 8);
    
    // Progress bar fill
    this.progressFill = this.scene.add.graphics();
    
    // Progress label
    this.progressLabel = this.scene.add.text(width / 2, 38, '0%', {
      fontFamily: '"Courier New", monospace',
      fontSize: '12px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5, 0);
    
    this.container.add([this.progressBg, this.progressFill, this.progressLabel]);
  }
  
  createBoostMeter() {
    const width = this.scene.cameras.main.width;
    const height = this.scene.cameras.main.height;
    
    // Boost meter (near boost button area)
    this.boostMeterBg = this.scene.add.graphics();
    this.boostMeterBg.fillStyle(0x333333, 0.5);
    this.boostMeterBg.fillRoundedRect(width - 130, height - 160, 60, 10, 5);
    
    this.boostMeterFill = this.scene.add.graphics();
    
    this.boostLabel = this.scene.add.text(width - 100, height - 175, 'BOOST', {
      fontFamily: '"Courier New", monospace',
      fontSize: '11px',
      color: '#00ff88',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5, 0);
    
    this.container.add([this.boostMeterBg, this.boostMeterFill, this.boostLabel]);
  }
  
  createPositionDisplay() {
    const width = this.scene.cameras.main.width;
    
    // Position in race
    this.positionText = this.scene.add.text(width - 20, 20, '1st', {
      fontFamily: '"Courier New", monospace',
      fontSize: '28px',
      color: '#ffff00',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(1, 0);
    
    this.positionLabel = this.scene.add.text(width - 20, 52, 'of 5', {
      fontFamily: '"Courier New", monospace',
      fontSize: '14px',
      color: '#aaaaaa',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(1, 0);
    
    this.container.add([this.positionText, this.positionLabel]);
  }
  
  createTimeDisplay() {
    const width = this.scene.cameras.main.width;
    
    // Timer
    this.timeText = this.scene.add.text(width / 2, 60, '00:00', {
      fontFamily: '"Courier New", monospace',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000',
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
      elapsedTime,
      stageProgress
    } = data;
    
    // Update stage display
    this.stageText.setText(`Stage ${stage}`);
    this.stageNameText.setText(stageName);
    
    // Update progress bar
    const width = this.scene.cameras.main.width;
    const progressWidth = Math.min(progress, 1) * 196;
    
    this.progressFill.clear();
    if (progressWidth > 0) {
      // Gradient effect based on stage
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 0, g: 255, b: 136 },
        { r: 255, g: 136, b: 0 },
        100,
        Math.min(progress * 100, 100)
      );
      const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
      
      this.progressFill.fillStyle(hexColor, 1);
      this.progressFill.fillRoundedRect(width / 2 - 98, 17, progressWidth, 12, 6);
    }
    
    this.progressLabel.setText(`${Math.floor(progress * 100)}%`);
    
    // Update boost meter
    const height = this.scene.cameras.main.height;
    const boostWidth = boostProgress * 56;
    
    this.boostMeterFill.clear();
    if (boostWidth > 0) {
      const boostColor = canBoost ? 0x00ff88 : 0x888888;
      this.boostMeterFill.fillStyle(boostColor, 0.8);
      this.boostMeterFill.fillRoundedRect(width - 128, height - 158, boostWidth, 6, 3);
    }
    
    // Update position
    const positionSuffix = this.getPositionSuffix(position);
    this.positionText.setText(`${position}${positionSuffix}`);
    this.positionLabel.setText(`of ${totalRacers}`);
    
    // Color code position
    if (position === 1) {
      this.positionText.setColor('#00ff00');
    } else if (position <= 3) {
      this.positionText.setColor('#ffff00');
    } else {
      this.positionText.setColor('#ff4444');
    }
    
    // Update time
    const minutes = Math.floor(elapsedTime / 60000);
    const seconds = Math.floor((elapsedTime % 60000) / 1000);
    this.timeText.setText(
      `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    );
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
    
    // Stage transition overlay
    const overlay = this.scene.add.graphics();
    overlay.setScrollFactor(0);
    overlay.setDepth(950);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, height / 2 - 60, width, 120);
    
    const stageTitle = this.scene.add.text(width / 2, height / 2 - 20, `STAGE ${stageNumber}`, {
      fontFamily: '"Courier New", monospace',
      fontSize: '36px',
      color: '#00ff88',
      stroke: '#000',
      strokeThickness: 4
    }).setOrigin(0.5);
    stageTitle.setScrollFactor(0);
    stageTitle.setDepth(951);
    
    const nameText = this.scene.add.text(width / 2, height / 2 + 25, stageName, {
      fontFamily: '"Courier New", monospace',
      fontSize: '20px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2
    }).setOrigin(0.5);
    nameText.setScrollFactor(0);
    nameText.setDepth(951);
    
    // Animate out
    this.scene.tweens.add({
      targets: [overlay, stageTitle, nameText],
      alpha: 0,
      delay: 1500,
      duration: 500,
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
      fontFamily: '"Courier New", monospace',
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 3
    }).setOrigin(0.5);
    message.setScrollFactor(0);
    message.setDepth(951);
    
    this.scene.tweens.add({
      targets: message,
      alpha: 0,
      y: height / 2 - 50,
      delay: duration - 500,
      duration: 500,
      onComplete: () => message.destroy()
    });
  }
  
  destroy() {
    this.container.destroy();
  }
}
