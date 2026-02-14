import Phaser from 'phaser';
import { CHARACTERS, CharacterData } from '../config/characters.config';
import { GAME_CONSTANTS } from '../config/constants';
import { actionPrompt } from '../utils/input-helpers';
import { isPortrait } from '../utils/layout-helpers';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedCharacterId: string | null = null;
  private characterContainers: Map<string, Phaser.GameObjects.Container> = new Map();
  private portrait: boolean = false;

  constructor() {
    super({ key: 'CharacterSelectScene' });
  }

  create(): void {
    this.portrait = isPortrait();
    const centerX = this.cameras.main.width / 2;

    // Title
    this.add
      .text(centerX, 30, 'SELECT YOUR CHARACTER', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: this.portrait ? '12px' : '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Instructions
    this.add
      .text(centerX, 58, actionPrompt('Tap to select', 'Click to select'), {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#99e550',
      })
      .setOrigin(0.5);

    // Display characters in a grid
    this.displayCharacters();

    // Confirm button (initially hidden)
    this.createConfirmButton();
  }

  private displayCharacters(): void {
    if (this.portrait) {
      this.displayPortraitGrid();
    } else {
      this.displayLandscapeGrid();
    }
  }

  private displayLandscapeGrid(): void {
    const startX = 80;
    const startY = 150;
    const spacingX = 150;
    const charsPerRow = 7;

    CHARACTERS.forEach((char, index) => {
      const col = index % charsPerRow;
      const x = startX + col * spacingX;
      const y = startY;

      const container = this.createCharacterCard(char, x, y, 130, 140);
      this.characterContainers.set(char.id, container);
    });
  }

  private displayPortraitGrid(): void {
    // 2 columns, 4 rows (last row has 1 centered card)
    const W = this.cameras.main.width;
    const cardW = 250;
    const cardH = 140;
    const spacingX = 280;
    const spacingY = 160;
    const startY = 140;

    CHARACTERS.forEach((char, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;

      let x: number;
      // Last card (index 6) should be centered
      if (index === CHARACTERS.length - 1 && CHARACTERS.length % 2 === 1) {
        x = W / 2;
      } else {
        x = W / 2 - spacingX / 2 + col * spacingX;
      }
      const y = startY + row * spacingY;

      const container = this.createCharacterCard(char, x, y, cardW, cardH);
      this.characterContainers.set(char.id, container);
    });
  }

  private createCharacterCard(
    char: CharacterData,
    x: number,
    y: number,
    cardW: number,
    cardH: number
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const halfW = cardW / 2;
    const halfH = cardH / 2;

    const cardBg = this.add.graphics();
    cardBg.fillStyle(GAME_CONSTANTS.COLORS.UI_DARK, 1);
    cardBg.fillRoundedRect(-halfW, -halfH, cardW, cardH, 8);
    cardBg.lineStyle(2, char.color, 1);
    cardBg.strokeRoundedRect(-halfW, -halfH, cardW, cardH, 8);
    container.add(cardBg);

    // Character sprite
    const spriteScale = this.portrait ? 0.09 : 0.07;
    const sprite = this.add.image(0, -20, char.id);
    sprite.setScale(spriteScale);
    container.add(sprite);

    // Character name
    const nameSize = this.portrait ? '10px' : '8px';
    const nameText = this.add
      .text(0, 35, char.displayName, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: nameSize,
        color: '#ffffff',
      })
      .setOrigin(0.5);
    container.add(nameText);

    // Description
    const descText = this.add
      .text(0, 52, char.description || '', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '6px',
        color: '#99e550',
        align: 'center',
        wordWrap: { width: cardW - 15 },
      })
      .setOrigin(0.5);
    container.add(descText);

    // Make interactive
    const hitArea = new Phaser.Geom.Rectangle(-halfW, -halfH, cardW, cardH);
    container.setSize(cardW, cardH);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // Store card dimensions on the container for border updates
    container.setData('cardW', cardW);
    container.setData('cardH', cardH);

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
    const cardW = container.getData('cardW') as number;
    const cardH = container.getData('cardH') as number;
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
    const centerY = this.portrait
      ? this.cameras.main.height - 60
      : this.cameras.main.height - 50;

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
        this.scene.start('GameScene', { selectedCharacter: this.selectedCharacterId });
      }
    });
  }
}
