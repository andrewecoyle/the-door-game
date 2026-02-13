import Phaser from 'phaser';
import { BoardSquare } from '../types/game.types';
import { BoardCalculations } from '../utils/board-calculations';
import { GAME_CONSTANTS } from '../config/constants';

export class Board extends Phaser.GameObjects.Container {
  private squares: BoardSquare[] = [];
  private squareGraphics: Map<number, Phaser.GameObjects.Graphics> = new Map();

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.createBoard();
  }

  private createBoard(): void {
    this.squares = BoardCalculations.generateBoardSquares();

    this.squares.forEach((square) => {
      this.createSquare(square);
    });
  }

  private createSquare(square: BoardSquare): void {
    const graphics = this.scene.add.graphics();
    const size = 36; // Match SQUARE_SIZE in board-calculations.ts

    // Determine color based on square type
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

    // Draw square
    graphics.fillStyle(fillColor, 0.8);
    graphics.fillRect(square.x - size / 2, square.y - size / 2, size, size);
    graphics.lineStyle(2, strokeColor, 1);
    graphics.strokeRect(square.x - size / 2, square.y - size / 2, size, size);

    this.add(graphics);
    this.squareGraphics.set(square.index, graphics);

    // Add label
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
    return BoardCalculations.getSquarePosition(squareIndex);
  }

  highlightSquare(squareIndex: number, color: number = GAME_CONSTANTS.COLORS.WARNING): void {
    const graphics = this.squareGraphics.get(squareIndex);
    if (graphics) {
      const square = this.squares.find((s) => s.index === squareIndex);
      if (square) {
        const size = 36; // Match SQUARE_SIZE
        graphics.lineStyle(4, color, 1);
        graphics.strokeRect(square.x - size / 2, square.y - size / 2, size, size);
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
