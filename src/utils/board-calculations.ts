import { BoardSquare } from '../types/game.types';
import { GAME_CONSTANTS } from '../config/constants';

export class BoardCalculations {
  private static readonly SQUARE_SIZE = 36;
  private static readonly SQUARE_SPACING = 1;
  // Board area is now 800px (1050 total - 250 sidebar)
  // Calculate centered X position in the board area
  private static readonly START_X = Math.floor((800 - (36 + 1) * 21) / 2) + (36 / 2); // Centered in board area
  private static readonly START_Y = 330; // Vertically centered

  /**
   * Calculate screen position for a board square
   */
  static getSquarePosition(squareIndex: number): { x: number; y: number } {
    const totalWidth = this.SQUARE_SIZE + this.SQUARE_SPACING;

    // Special case: Jail is below square 10
    if (squareIndex === -1) {
      // Jail position - directly below square 10
      const square10Pos = this.getSquarePosition(GAME_CONSTANTS.JAIL_SQUARE);
      return {
        x: square10Pos.x,
        y: square10Pos.y + this.SQUARE_SIZE + 1, // Below square 10, butted against it
      };
    }

    return {
      x: this.START_X + squareIndex * totalWidth,
      y: this.START_Y,
    };
  }

  /**
   * Generate all board squares with their positions
   */
  static generateBoardSquares(): BoardSquare[] {
    const squares: BoardSquare[] = [];

    for (let i = 0; i <= GAME_CONSTANTS.BOARD_SQUARES; i++) {
      const pos = this.getSquarePosition(i);
      let type: BoardSquare['type'] = 'normal';

      if (i === 0) {
        type = 'normal'; // Start square
      } else if (i === GAME_CONSTANTS.DOOR_SQUARE) {
        type = 'door';
      } else if (i === GAME_CONSTANTS.JAIL_SQUARE) {
        type = 'normal'; // Square 10 is still normal, jail is separate
      } else if (i % GAME_CONSTANTS.CARD_SQUARE_INTERVAL === 0) {
        type = 'card';
      }

      squares.push({
        index: i,
        type,
        x: pos.x,
        y: pos.y,
      });
    }

    // Add Jail as a special square
    const jailPos = this.getSquarePosition(-1);
    squares.push({
      index: -1,
      type: 'jail',
      x: jailPos.x,
      y: jailPos.y,
    });

    return squares;
  }

  /**
   * Calculate column positions (beer can columns around board)
   */
  static getColumnPositions(): Array<{ x: number; y: number; side: 'left' | 'right' }> {
    const positions = [];
    const columnsPerSide = GAME_CONSTANTS.NUMBER_OF_COLUMNS / 2;
    const spacing = 150;

    // Left side columns
    for (let i = 0; i < columnsPerSide; i++) {
      positions.push({
        x: 50,
        y: 100 + i * spacing,
        side: 'left' as const,
      });
    }

    // Right side columns
    for (let i = 0; i < columnsPerSide; i++) {
      positions.push({
        x: 750,
        y: 100 + i * spacing,
        side: 'right' as const,
      });
    }

    return positions;
  }
}
