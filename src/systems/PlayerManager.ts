import { Player } from '../types/game.types';
import { CHARACTERS } from '../config/characters.config';
import { GAME_CONSTANTS } from '../config/constants';

export class PlayerManager {
  private players: Player[] = [];

  constructor(humanCharacterId: string) {
    this.initializePlayers(humanCharacterId);
  }

  private initializePlayers(humanCharacterId: string): void {
    CHARACTERS.forEach((char, index) => {
      const isHuman = char.id === humanCharacterId;

      const player: Player = {
        id: `player-${index}`,
        name: char.displayName,
        character: char,
        isAI: !isHuman,
        lives: GAME_CONSTANTS.STARTING_LIVES,
        position: 0,
        isEliminated: false,
        inJail: false,
        skippingTurn: false,
        color: char.color,
      };

      this.players.push(player);
    });
  }

  getPlayers(): Player[] {
    return this.players;
  }

  getPlayer(id: string): Player | undefined {
    return this.players.find((p) => p.id === id);
  }

  getHumanPlayer(): Player | undefined {
    return this.players.find((p) => !p.isAI);
  }

  getAlivePlayers(): Player[] {
    return this.players.filter((p) => !p.isEliminated);
  }

  getAllPlayers(): Player[] {
    return this.players;
  }

  loseLife(playerId: string, amount: number = 1): void {
    const player = this.getPlayer(playerId);
    if (player) {
      player.lives -= amount;
      if (player.lives <= 0) {
        player.lives = 0;
        player.isEliminated = true;
      }
    }
  }

  gainLife(playerId: string, amount: number = 1): void {
    const player = this.getPlayer(playerId);
    if (player && !player.isEliminated) {
      player.lives = Math.min(player.lives + amount, GAME_CONSTANTS.STARTING_LIVES);
    }
  }

  resurrectPlayer(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (player && player.isEliminated) {
      player.isEliminated = false;
      player.lives = 1;
    }
  }

  movePlayer(playerId: string, newPosition: number): void {
    const player = this.getPlayer(playerId);
    if (player) {
      player.position = Math.max(0, Math.min(newPosition, GAME_CONSTANTS.BOARD_SQUARES));
    }
  }

  sendToJail(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (player) {
      player.inJail = true;
      player.skippingTurn = true;
      this.loseLife(playerId, 1);
    }
  }

  releaseFromJail(playerId: string): void {
    const player = this.getPlayer(playerId);
    if (player) {
      player.inJail = false;
    }
  }
}
