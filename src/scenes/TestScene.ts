import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/constants';

export class TestScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TestScene' });
  }

  create(): void {
    // Add retro-styled text
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    this.add
      .text(centerX, centerY - 50, 'THE DOOR', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '32px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 20, 'Phaser 3 + TypeScript + Vite', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '12px',
        color: '#99e550',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY + 60, 'Phase 0: Setup Complete!', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '10px',
        color: '#5b6ee1',
      })
      .setOrigin(0.5);

    // Add a pulsing effect
    const pressStart = this.add
      .text(centerX, centerY + 120, 'Press SPACE to continue', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '10px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: pressStart,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Add keyboard input
    this.input.keyboard?.once('keydown-SPACE', () => {
      console.log('Space pressed! Ready for Phase 1...');
    });

    // Draw a simple pixel art border
    const graphics = this.add.graphics();
    graphics.lineStyle(4, GAME_CONSTANTS.COLORS.PRIMARY, 1);
    graphics.strokeRect(50, 50, this.cameras.main.width - 100, this.cameras.main.height - 100);
  }
}
