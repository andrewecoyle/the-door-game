import Phaser from 'phaser';
import { CHARACTERS, CharacterData } from '../config/characters.config';
import { GAME_CONSTANTS } from '../config/constants';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedCharacterId: string | null = null;
  private characterContainers: Map<string, Phaser.GameObjects.Container> = new Map();

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    const centerX = this.cameras.main.width / 2;

    // Title
    this.add
      .text(centerX, 50, 'SELECT YOUR CHARACTER', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '20px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Instructions
    this.add
      .text(centerX, 90, 'Click to select', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '10px',
        color: '#99e550',
      })
      .setOrigin(0.5);

    // Display characters in a grid
    this.displayCharacters();

    // Confirm button (initially hidden)
    this.createConfirmButton();
  }

  private displayCharacters(): void {
    const startX = 130;
    const startY = 210;
    const spacingX = 210;
    const spacingY = 210;
    const charsPerRow = 4;

    CHARACTERS.forEach((char, index) => {
      const row = Math.floor(index / charsPerRow);
      const col = index % charsPerRow;
      const x = startX + col * spacingX;
      const y = startY + row * spacingY;

      const container = this.createCharacterCard(char, x, y);
      this.characterContainers.set(char.id, container);
    });
  }

  private createCharacterCard(
    char: CharacterData,
    x: number,
    y: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Background card
    const cardW = 180;
    const cardH = 210;
    const halfW = cardW / 2;
    const halfH = cardH / 2;

    const cardBg = this.add.graphics();
    cardBg.fillStyle(GAME_CONSTANTS.COLORS.UI_DARK, 1);
    cardBg.fillRoundedRect(-halfW, -halfH, cardW, cardH, 8);
    cardBg.lineStyle(2, char.color, 1);
    cardBg.strokeRoundedRect(-halfW, -halfH, cardW, cardH, 8);
    container.add(cardBg);

    // Character sprite
    const sprite = this.add.image(0, -25, char.id);
    sprite.setScale(0.1);
    container.add(sprite);

    // Character name
    const nameText = this.add
      .text(0, 50, char.displayName, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '12px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    container.add(nameText);

    // Description
    const descText = this.add
      .text(0, 78, char.description || '', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#99e550',
        align: 'center',
        wordWrap: { width: 160 },
      })
      .setOrigin(0.5);
    container.add(descText);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(-halfW, -halfH, cardW, cardH);
    container.setSize(cardW, cardH);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      cardBg.clear();
      cardBg.fillStyle(GAME_CONSTANTS.COLORS.UI_DARK, 1);
      cardBg.fillRoundedRect(-halfW, -halfH, cardW, cardH, 8);
      cardBg.lineStyle(3, char.color, 1);
      cardBg.strokeRoundedRect(-halfW, -halfH, cardW, cardH, 8);
    });

    container.on('pointerout', () => {
      if (this.selectedCharacterId !== char.id) {
        cardBg.clear();
        cardBg.fillStyle(GAME_CONSTANTS.COLORS.UI_DARK, 1);
        cardBg.fillRoundedRect(-halfW, -halfH, cardW, cardH, 8);
        cardBg.lineStyle(2, char.color, 1);
        cardBg.strokeRoundedRect(-halfW, -halfH, cardW, cardH, 8);
      }
    });

    container.on('pointerdown', () => {
      this.selectCharacter(char.id);
    });

    return container;
  }

  private selectCharacter(characterId: string): void {
    // Clear previous selection
    if (this.selectedCharacterId) {
      const prevContainer = this.characterContainers.get(this.selectedCharacterId);
      if (prevContainer) {
        const prevChar = CHARACTERS.find((c) => c.id === this.selectedCharacterId);
        if (prevChar) {
          this.updateCardBorder(prevContainer, prevChar.color, 2);
        }
      }
    }

    // Set new selection
    this.selectedCharacterId = characterId;
    const container = this.characterContainers.get(characterId);
    const char = CHARACTERS.find((c) => c.id === characterId);

    if (container && char) {
      this.updateCardBorder(container, char.color, 4);
    }

    // Show confirm button
    const confirmBtn = this.children.getByName('confirmButton') as Phaser.GameObjects.Container;
    if (confirmBtn) {
      confirmBtn.setVisible(true);
    }
  }

  private updateCardBorder(
    container: Phaser.GameObjects.Container,
    color: number,
    lineWidth: number
  ): void {
    const cardW = 180;
    const cardH = 210;
    const halfW = cardW / 2;
    const halfH = cardH / 2;

    const cardBg = container.list[0] as Phaser.GameObjects.Graphics;
    cardBg.clear();
    cardBg.fillStyle(GAME_CONSTANTS.COLORS.UI_DARK, 1);
    cardBg.fillRoundedRect(-halfW, -halfH, cardW, cardH, 8);
    cardBg.lineStyle(lineWidth, color, 1);
    cardBg.strokeRoundedRect(-halfW, -halfH, cardW, cardH, 8);
  }

  private createConfirmButton(): void {
    const centerX = this.cameras.main.width / 2;
    const centerY = this.cameras.main.height - 70;

    const container = this.add.container(centerX, centerY);
    container.setName('confirmButton');
    container.setVisible(false);

    // Button background
    const btnBg = this.add.graphics();
    btnBg.fillStyle(GAME_CONSTANTS.COLORS.SUCCESS, 1);
    btnBg.fillRoundedRect(-120, -25, 240, 50, 10);
    container.add(btnBg);

    // Button text
    const btnText = this.add
      .text(0, 0, 'START GAME', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '14px',
        color: '#000000',
      })
      .setOrigin(0.5);
    container.add(btnText);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(-120, -25, 240, 50);
    container.setSize(240, 50);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(GAME_CONSTANTS.COLORS.UI_LIGHT, 1);
      btnBg.fillRoundedRect(-120, -25, 240, 50, 10);
    });

    container.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(GAME_CONSTANTS.COLORS.SUCCESS, 1);
      btnBg.fillRoundedRect(-120, -25, 240, 50, 10);
    });

    container.on('pointerdown', () => {
      if (this.selectedCharacterId) {
        console.log('Selected character:', this.selectedCharacterId);
        // TODO: Pass selected character to GameScene
        this.scene.start('GameScene', { selectedCharacter: this.selectedCharacterId });
      }
    });
  }
}
