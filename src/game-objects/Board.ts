import Phaser from 'phaser';
import { BoardSquare } from '../types/game.types';
import { BoardCalculations } from '../utils/board-calculations';
import { GAME_CONSTANTS } from '../config/constants';

export class Board extends Phaser.GameObjects.Container {
  private squares: BoardSquare[] = [];
  private squareGraphics: Map<number, Phaser.GameObjects.Graphics> = new Map();
  private portrait: boolean;

  constructor(scene: Phaser.Scene, portrait: boolean = false) {
    super(scene, 0, 0);
    this.portrait = portrait;
    scene.add.existing(this);

    this.createBoard();
  }

  private createBoard(): void {
    this.squares = this.portrait
      ? BoardCalculations.generateBoardSquaresPortrait()
      : BoardCalculations.generateBoardSquares();

    this.squares.forEach((square) => {
      this.createSquare(square);
    });
  }

  private createSquare(square: BoardSquare): void {
    if (this.portrait) {
      this.createClimbTile(square);
    } else {
      this.createClassicSquare(square);
    }
  }

  // ── Portrait: wide, short rounded tiles stacked as a vertical climb ──
  private createClimbTile(square: BoardSquare): void {
    const graphics = this.scene.add.graphics();
    const w = BoardCalculations.PORTRAIT_TILE_W;
    const h = BoardCalculations.PORTRAIT_TILE_H;
    const radius = 6;

    let fillColor: number = GAME_CONSTANTS.COLORS.UI_DARK;
    let strokeColor: number = GAME_CONSTANTS.COLORS.PRIMARY;
    let tileW = w;
    let tileH = h;

    if (square.index === 0) {
      // BEGIN
      fillColor = 0x2c2c44;
      strokeColor = GAME_CONSTANTS.COLORS.UI_LIGHT;
    } else if (square.type === 'card') {
      fillColor = GAME_CONSTANTS.COLORS.SECONDARY;
      strokeColor = GAME_CONSTANTS.COLORS.UI_LIGHT;
    } else if (square.type === 'door') {
      fillColor = GAME_CONSTANTS.COLORS.SUCCESS;
      strokeColor = 0x7bd56a;
    } else if (square.type === 'jail') {
      // Jail pill — smaller, attached beside square 10
      fillColor = GAME_CONSTANTS.COLORS.DANGER;
      strokeColor = 0xf08070;
      tileW = 60;
      tileH = 26;
    }

    if (square.type === 'door') {
      // Soft glow behind the door
      graphics.fillStyle(0x7bd56a, 0.18);
      graphics.fillRoundedRect(square.x - tileW / 2 - 5, square.y - tileH / 2 - 5, tileW + 10, tileH + 10, radius + 4);
    }

    graphics.fillStyle(fillColor, 0.9);
    graphics.fillRoundedRect(square.x - tileW / 2, square.y - tileH / 2, tileW, tileH, radius);
    graphics.lineStyle(2, strokeColor, 1);
    graphics.strokeRoundedRect(square.x - tileW / 2, square.y - tileH / 2, tileW, tileH, radius);

    this.add(graphics);
    this.squareGraphics.set(square.index, graphics);

    const label = this.createClimbLabel(square);
    this.add(label);
  }

  private createClimbLabel(square: BoardSquare): Phaser.GameObjects.Text {
    let labelText: string;
    let fontSize: string;
    let color = '#ffffff';

    if (square.index === 0) {
      labelText = 'BEGIN';
      fontSize = '9px';
      color = '#99e550';
    } else if (square.type === 'card') {
      labelText = 'CARD';
      fontSize = '9px';
    } else if (square.type === 'door') {
      labelText = 'DOOR';
      fontSize = '11px';
    } else if (square.type === 'jail') {
      labelText = 'JAIL';
      fontSize = '8px';
    } else {
      labelText = square.index.toString();
      fontSize = '12px';
    }

    const text = this.scene.add.text(square.x, square.y, labelText, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize,
      color,
      stroke: '#000000',
      strokeThickness: 2,
    });
    text.setOrigin(0.5);
    return text;
  }

  // ── Landscape: original 36×36 squares in a row ──
  private createClassicSquare(square: BoardSquare): void {
    const graphics = this.scene.add.graphics();
    const size = 36; // Match SQUARE_SIZE in board-calculations.ts

    let fillColor = GAME_CONSTANTS.COLORS.UI_DARK;
    let strokeColor = GAME_CONSTANTS.COLORS.PRIMARY;

    switch (square.type) {
      case 'card':
        fillColor = GAME_CONSTANTS.COLORS.SECONDARY;
        strokeColor = GAME_CONSTANTS.COLORS.UI_LIGHT;
        break;
      case 'jail':
        fillColor = GAME_CONSTANTS.COLORS.DANGER;
        strokeColor = GAME_CONSTANTS.COLORS.DANGER;
        break;
      case 'door':
        fillColor = GAME_CONSTANTS.COLORS.SUCCESS;
        strokeColor = GAME_CONSTANTS.COLORS.SUCCESS;
        break;
    }

    graphics.fillStyle(fillColor, 0.8);
    graphics.fillRect(square.x - size / 2, square.y - size / 2, size, size);
    graphics.lineStyle(2, strokeColor, 1);
    graphics.strokeRect(square.x - size / 2, square.y - size / 2, size, size);

    this.add(graphics);
    this.squareGraphics.set(square.index, graphics);

    const label = this.createSquareLabel(square);
    if (label) {
      this.add(label);
    }
  }

  private createSquareLabel(square: BoardSquare): Phaser.GameObjects.Text | null {
    let labelText = '';

    switch (square.type) {
      case 'card':
        labelText = 'CARD';
        break;
      case 'jail':
        labelText = 'JAIL';
        break;
      case 'door':
        labelText = 'DOOR';
        break;
      default:
        // Special case for square 0
        labelText = square.index === 0 ? 'BEGIN' : square.index.toString();
    }

    const fontSize = square.type === 'normal' ? (square.index === 0 ? '8px' : '10px') : '8px';
    const yOffset = square.type === 'jail' ? 0 : square.type === 'normal' ? 0 : -25;

    const text = this.scene.add.text(square.x, square.y + yOffset, labelText, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize,
      color: '#ffffff',
    });
    text.setOrigin(0.5);

    return text;
  }

  getSquarePosition(squareIndex: number): { x: number; y: number } {
    const square = this.squares.find((s) => s.index === squareIndex);
    if (square) {
      return { x: square.x, y: square.y };
    }
    return this.portrait
      ? BoardCalculations.getSquarePositionPortrait(squareIndex)
      : BoardCalculations.getSquarePosition(squareIndex);
  }

  highlightSquare(squareIndex: number, color: number = GAME_CONSTANTS.COLORS.WARNING): void {
    const graphics = this.squareGraphics.get(squareIndex);
    if (graphics) {
      const square = this.squares.find((s) => s.index === squareIndex);
      if (square) {
        if (this.portrait) {
          graphics.lineStyle(3, color, 1);
          graphics.strokeRoundedRect(
            square.x - BoardCalculations.PORTRAIT_TILE_W / 2,
            square.y - BoardCalculations.PORTRAIT_TILE_H / 2,
            BoardCalculations.PORTRAIT_TILE_W,
            BoardCalculations.PORTRAIT_TILE_H,
            6
          );
        } else {
          const size = 36;
          graphics.lineStyle(4, color, 1);
          graphics.strokeRect(square.x - size / 2, square.y - size / 2, size, size);
        }
      }
    }
  }

  clearHighlight(squareIndex: number): void {
    const square = this.squares.find((s) => s.index === squareIndex);
    if (square) {
      const graphics = this.squareGraphics.get(squareIndex);
      if (graphics) {
        graphics.clear();
        this.createSquare(square);
      }
    }
  }
}
