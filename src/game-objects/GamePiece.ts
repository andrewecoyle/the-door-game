import Phaser from 'phaser';
import { Player } from '../types/game.types';

export class GamePiece extends Phaser.GameObjects.Container {
  private player: Player;
  private pieceGraphic: Phaser.GameObjects.Graphics;
  private initialText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, player: Player, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    this.player = player;

    // Create piece visual
    this.pieceGraphic = scene.add.graphics();
    this.drawPiece();
    this.add(this.pieceGraphic);

    // Add player initial in the circle (with null safety)
    const initial = (this.player.name?.charAt(0) ?? '?').toUpperCase();
    this.initialText = scene.add.text(0, 0, initial, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
    });
    this.initialText.setOrigin(0.5);
    this.add(this.initialText);
  }

  private drawPiece(): void {
    this.pieceGraphic.clear();

    // Draw smaller circular piece with player color
    this.pieceGraphic.fillStyle(this.player.color, 1);
    this.pieceGraphic.fillCircle(0, 0, 10);
    this.pieceGraphic.lineStyle(2, 0xffffff, 1);
    this.pieceGraphic.strokeCircle(0, 0, 10);
  }

  async moveToPosition(targetX: number, targetY: number): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this,
        x: targetX,
        y: targetY,
        duration: 500,
        ease: 'Power2',
        onComplete: () => resolve(),
      });
    });
  }

  getPlayer(): Player {
    return this.player;
  }

  updateLives(lives: number): void {
    this.player.lives = lives;
  }

  hide(): void {
    this.setVisible(false);
  }

  show(): void {
    this.setVisible(true);
  }
}
