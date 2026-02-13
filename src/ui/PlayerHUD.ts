import Phaser from 'phaser';
import { Player } from '../types/game.types';

export class PlayerHUD extends Phaser.GameObjects.Container {
  private players: Player[];
  private currentPlayerIndicator: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene, players: Player[]) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.players = players;
    this.createHUD();
  }

  private createHUD(): void {
    // Position 4 characters above the board, 3 below
    const topPlayers = this.players.slice(0, 4);
    const bottomPlayers = this.players.slice(4, 7);

    // Top row (4 players) - centered around board
    const topStartX = 150;
    const topY = 200; // Raised to prevent overlap with board (board is at Y=330)
    const topSpacing = 140;

    topPlayers.forEach((player, index) => {
      const x = topStartX + index * topSpacing;
      this.createCharacterPortrait(player, x, topY);
    });

    // Bottom row (3 players) - centered around board
    const bottomStartX = 220;
    const bottomY = 420; // Below the board

    bottomPlayers.forEach((player, index) => {
      const x = bottomStartX + index * topSpacing;
      this.createCharacterPortrait(player, x, bottomY);
    });
  }

  private createCharacterPortrait(player: Player, x: number, y: number): void {
    const container = this.scene.add.container(x, y);
    container.setName(`player-hud-${player.id}`);

    // Character sprite (PNG from b-m-pixels-images) - very small scale
    const sprite = this.scene.add.image(0, 0, player.character.id);
    sprite.setScale(0.05); // Much smaller as requested
    container.add(sprite);

    // Player name below sprite
    const nameText = this.scene.add.text(0, 50, player.name, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    // Lives (stacked below name)
    const livesText = this.scene.add.text(0, 65, `Lives: ${player.lives}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '6px',
      color: player.lives > 1 ? '#99e550' : '#d95763',
      stroke: '#000000',
      strokeThickness: 2,
    });
    livesText.setOrigin(0.5);
    livesText.setName('lives-text');
    container.add(livesText);

    // Position (stacked below lives)
    const posText = this.scene.add.text(0, 77, `Pos: ${player.position}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '6px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    posText.setOrigin(0.5);
    posText.setName('pos-text');
    container.add(posText);

    this.add(container);
  }

  updatePlayer(player: Player): void {
    const container = this.getByName(`player-hud-${player.id}`) as Phaser.GameObjects.Container;
    if (!container) return;

    const livesText = container.getByName('lives-text') as Phaser.GameObjects.Text;
    if (livesText) {
      livesText.setText(`Lives: ${player.lives}`);
      livesText.setColor(player.lives > 1 ? '#99e550' : player.lives > 0 ? '#d95763' : '#666666');
    }

    const posText = container.getByName('pos-text') as Phaser.GameObjects.Text;
    if (posText) {
      posText.setText(`Pos: ${player.position}`);
    }

    // Grey out and add gravestone if eliminated
    if (player.isEliminated) {
      container.setAlpha(0.4);

      // Add gravestone if not already present
      if (!container.getByName('gravestone')) {
        const gravestone = this.scene.add.text(0, -20, 'RIP', {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '12px',
          color: '#666666',
          stroke: '#000000',
          strokeThickness: 3,
        });
        gravestone.setOrigin(0.5);
        gravestone.setName('gravestone');
        container.add(gravestone);
      }
    } else {
      // Remove gravestone if player is resurrected
      const gravestone = container.getByName('gravestone');
      if (gravestone) {
        gravestone.destroy();
      }
      container.setAlpha(1);
    }
  }

  highlightCurrentPlayer(playerId: string): void {
    // Remove previous highlight
    if (this.currentPlayerIndicator) {
      this.currentPlayerIndicator.destroy();
    }

    const container = this.getByName(`player-hud-${playerId}`) as Phaser.GameObjects.Container;
    if (!container) return;

    // Add purple pulsing square around character sprite
    // Sprite at 0.05 scale: 1024 * 0.05 = 51.2px, so use 52px square with some padding
    const squareSize = 56;
    this.currentPlayerIndicator = this.scene.add.graphics();
    this.currentPlayerIndicator.lineStyle(3, 0xbb9af7, 1); // Purple color
    this.currentPlayerIndicator.strokeRect(
      container.x - squareSize / 2,
      container.y - squareSize / 2,
      squareSize,
      squareSize
    );
    this.add(this.currentPlayerIndicator);

    // Pulse animation (same as before)
    this.scene.tweens.add({
      targets: this.currentPlayerIndicator,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }
}
