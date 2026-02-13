import Phaser from 'phaser';
import { CHARACTERS } from '../config/characters.config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222034, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

    const loadingText = this.add
      .text(width / 2, height / 2 - 50, 'Loading...', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const percentText = this.add
      .text(width / 2, height / 2, '0%', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '14px',
        color: '#99e550',
      })
      .setOrigin(0.5);

    // Update loading bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x5b6ee1, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load character sprites
    CHARACTERS.forEach((char) => {
      this.load.image(char.id, char.spritePath);
    });

    // TODO: Load other assets (board tiles, cards, sounds) in future phases
  }

  create(): void {
    // Move to menu scene after assets loaded
    this.scene.start('MenuScene');
  }
}
