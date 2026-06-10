import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/constants';
import { actionPrompt } from '../utils/input-helpers';
import { isPortrait } from '../utils/layout-helpers';
import { createMuteButton } from '../ui/MuteButton';
import AudioEngine from '../audio/AudioEngine';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height / 2;

    AudioEngine.playMusic('menu');

    // Title
    const title = this.add
      .text(centerX, centerY - 150, 'THE DOOR', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: isPortrait() ? '32px' : '48px',
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

    // Pixel-art door between subtitle and start prompt
    const portrait = isPortrait();
    this.drawPixelDoor(centerX, portrait ? centerY + 20 : centerY - 15, portrait ? 1.6 : 1);

    // Add pulsing "Press Start" text
    const startText = this.add
      .text(centerX, centerY + (portrait ? 140 : 70), actionPrompt('TAP TO START', 'PRESS SPACE TO START'), {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: portrait ? '16px' : '14px',
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

    this.add
      .text(centerX, this.cameras.main.height - 40, 'v1.0', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#5b6ee1',
      })
      .setOrigin(0.5);

    createMuteButton(this, this.cameras.main.width - 60, 60);

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

  // A chunky pixel door with a sliver of light underneath
  private drawPixelDoor(cx: number, cy: number, scale: number = 1): void {
    const g = this.add.graphics();
    const w = 48 * scale;
    const h = 76 * scale;
    const x = cx - w / 2;
    const y = cy - h / 2;

    // Frame
    g.fillStyle(0x222034, 1);
    g.fillRect(x - 6 * scale, y - 6 * scale, w + 12 * scale, h + 6 * scale);
    // Door slab
    g.fillStyle(0x5a3a22, 1);
    g.fillRect(x, y, w, h);
    // Panels
    g.fillStyle(0x6e4a2c, 1);
    g.fillRect(x + 7 * scale, y + 8 * scale, w - 14 * scale, 24 * scale);
    g.fillRect(x + 7 * scale, y + 40 * scale, w - 14 * scale, 28 * scale);
    // Knob
    g.fillStyle(0xfbf236, 1);
    g.fillRect(x + w - 12 * scale, y + h / 2 - 2 * scale, 5 * scale, 5 * scale);
    // Light leaking from under the door
    const light = this.add.graphics();
    light.fillStyle(0x99e550, 0.7);
    light.fillRect(x - 2, y + h, w + 4, 3 * scale);
    this.tweens.add({
      targets: light,
      alpha: 0.25,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
