import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/constants';
import { actionPrompt } from '../utils/input-helpers';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    // Title
    const title = this.add
      .text(centerX, centerY - 150, 'THE DOOR', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Subtitle
    this.add
      .text(centerX, centerY - 80, 'A Retro Board Game', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '12px',
        color: '#99e550',
      })
      .setOrigin(0.5);

    // Add pulsing "Press Start" text
    const startText = this.add
      .text(centerX, centerY + 50, actionPrompt('TAP TO START', 'PRESS SPACE TO START'), {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Add version/phase info
    this.add
      .text(centerX, this.cameras.main.height - 40, 'Phase 1: Prototype', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#5b6ee1',
      })
      .setOrigin(0.5);

    // Decorative border
    const graphics = this.add.graphics();
    graphics.lineStyle(4, GAME_CONSTANTS.COLORS.PRIMARY, 1);
    graphics.strokeRect(30, 30, this.cameras.main.width - 60, this.cameras.main.height - 60);

    // Add some pixel art decorations (corners)
    this.addCornerDecoration(50, 50, GAME_CONSTANTS.COLORS.UI_LIGHT);
    this.addCornerDecoration(this.cameras.main.width - 50, 50, GAME_CONSTANTS.COLORS.UI_LIGHT);
    this.addCornerDecoration(50, this.cameras.main.height - 50, GAME_CONSTANTS.COLORS.UI_LIGHT);
    this.addCornerDecoration(
      this.cameras.main.width - 50,
      this.cameras.main.height - 50,
      GAME_CONSTANTS.COLORS.UI_LIGHT
    );

    // Input handling
    this.input.keyboard?.once('keydown-SPACE', () => {
      this.scene.start('CharacterSelectScene');
    });

    this.input.once('pointerdown', () => {
      this.scene.start('CharacterSelectScene');
    });

    // Add title animation
    this.tweens.add({
      targets: title,
      y: centerY - 160,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private addCornerDecoration(x: number, y: number, color: number): void {
    const size = 8;
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRect(x - size / 2, y - size / 2, size, size);
  }
}
