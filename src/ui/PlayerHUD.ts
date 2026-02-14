import Phaser from 'phaser';
import { Player } from '../types/game.types';

export class PlayerHUD extends Phaser.GameObjects.Container {
  private players: Player[];
  private currentPlayerIndicator: Phaser.GameObjects.Graphics | null = null;
  private portrait: boolean;

  constructor(scene: Phaser.Scene, players: Player[], portrait: boolean = false) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.players = players;
    this.portrait = portrait;
    this.createHUD();
  }

  private createHUD(): void {
    if (this.portrait) {
      this.createPortraitHUD();
    } else {
      this.createLandscapeHUD();
    }
  }

  private createLandscapeHUD(): void {
    const topPlayers = this.players.slice(0, 4);
    const bottomPlayers = this.players.slice(4, 7);

    const topStartX = 150;
    const topY = 200;
    const topSpacing = 140;

    topPlayers.forEach((player, index) => {
      const x = topStartX + index * topSpacing;
      this.createCharacterPortrait(player, x, topY);
    });

    const bottomStartX = 220;
    const bottomY = 420;

    bottomPlayers.forEach((player, index) => {
      const x = bottomStartX + index * topSpacing;
      this.createCharacterPortrait(player, x, bottomY);
    });
  }

  private createPortraitHUD(): void {
    const W = this.scene.cameras.main.width;
    const spacing = W / 7;
    const y = 380;

    this.players.forEach((player, index) => {
      const x = spacing * index + spacing / 2;
      this.createCompactPortrait(player, x, y);
    });
  }

  private createCharacterPortrait(player: Player, x: number, y: number): void {
    const container = this.scene.add.container(x, y);
    container.setName(`player-hud-${player.id}`);

    const sprite = this.scene.add.image(0, 0, player.character.id);
    sprite.setScale(0.05);
    container.add(sprite);

    const nameText = this.scene.add.text(0, 50, player.name, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    const livesText = this.scene.add.text(0, 65, `Lives: ${player.lives}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: player.lives > 1 ? '#99e550' : '#d95763',
      stroke: '#000000',
      strokeThickness: 2,
    });
    livesText.setOrigin(0.5);
    livesText.setName('lives-text');
    container.add(livesText);

    const posText = this.scene.add.text(0, 80, `Pos: ${player.position}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    posText.setOrigin(0.5);
    posText.setName('pos-text');
    container.add(posText);

    this.add(container);
  }

  private createCompactPortrait(player: Player, x: number, y: number): void {
    const container = this.scene.add.container(x, y);
    container.setName(`player-hud-${player.id}`);

    const sprite = this.scene.add.image(0, 0, player.character.id);
    sprite.setScale(0.04);
    container.add(sprite);

    const nameText = this.scene.add.text(0, 30, player.character.displayName || player.name, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '6px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 1,
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    const livesText = this.scene.add.text(0, 42, `L:${player.lives}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '6px',
      color: player.lives > 1 ? '#99e550' : '#d95763',
      stroke: '#000000',
      strokeThickness: 1,
    });
    livesText.setOrigin(0.5);
    livesText.setName('lives-text');
    container.add(livesText);

    // No position text in portrait — saves space
    const posText = this.scene.add.text(0, 0, '').setVisible(false);
    posText.setName('pos-text');
    container.add(posText);

    this.add(container);
  }

  updatePlayer(player: Player): void {
    const container = this.getByName(`player-hud-${player.id}`) as Phaser.GameObjects.Container;
    if (!container) return;

    const livesText = container.getByName('lives-text') as Phaser.GameObjects.Text;
    if (livesText) {
      const label = this.portrait ? `L:${player.lives}` : `Lives: ${player.lives}`;
      livesText.setText(label);
      livesText.setColor(player.lives > 1 ? '#99e550' : player.lives > 0 ? '#d95763' : '#666666');
    }

    const posText = container.getByName('pos-text') as Phaser.GameObjects.Text;
    if (posText && posText.visible) {
      posText.setText(`Pos: ${player.position}`);
    }

    if (player.isEliminated) {
      container.setAlpha(0.4);

      if (!container.getByName('gravestone')) {
        const fontSize = this.portrait ? '8px' : '12px';
        const gravestone = this.scene.add.text(0, -20, 'RIP', {
          fontFamily: '"Press Start 2P", cursive',
          fontSize,
          color: '#666666',
          stroke: '#000000',
          strokeThickness: 3,
        });
        gravestone.setOrigin(0.5);
        gravestone.setName('gravestone');
        container.add(gravestone);
      }
    } else {
      const gravestone = container.getByName('gravestone');
      if (gravestone) {
        gravestone.destroy();
      }
      container.setAlpha(1);
    }
  }

  highlightCurrentPlayer(playerId: string): void {
    if (this.currentPlayerIndicator) {
      this.currentPlayerIndicator.destroy();
    }

    const container = this.getByName(`player-hud-${playerId}`) as Phaser.GameObjects.Container;
    if (!container) return;

    const squareSize = this.portrait ? 44 : 56;
    this.currentPlayerIndicator = this.scene.add.graphics();
    this.currentPlayerIndicator.lineStyle(3, 0xbb9af7, 1);
    this.currentPlayerIndicator.strokeRect(
      container.x - squareSize / 2,
      container.y - squareSize / 2,
      squareSize,
      squareSize
    );
    this.add(this.currentPlayerIndicator);

    this.scene.tweens.add({
      targets: this.currentPlayerIndicator,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }
}
