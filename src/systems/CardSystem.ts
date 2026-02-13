import { CardChoice, Player } from '../types/game.types';
import { PlayerManager } from './PlayerManager';

export interface CardEffectResult {
  success: boolean;
  message: string;
  affectedPlayers?: string[]; // Player IDs
  requiresUserInput?: boolean;
  availableTargets?: Player[];
  requiresSecondaryChoice?: boolean; // For Jury selector picking victim
  secondaryChoicePlayerId?: string; // The selector in Jury case
}

export class CardSystem {
  constructor(private playerManager: PlayerManager) {}

  // Execute card effect based on choice
  async executeCardEffect(
    playerId: string,
    choice: CardChoice,
    targetPlayerId?: string,
    secondaryTargetId?: string // For Jury victim
  ): Promise<CardEffectResult> {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    switch (choice) {
      case 'judge':
        return this.executeJudge(playerId, targetPlayerId);

      case 'jury':
        return this.executeJury(playerId, targetPlayerId, secondaryTargetId);

      case 'summon':
        return this.executeSummon(playerId, targetPlayerId);

      case 'exile':
        return this.executeExile(playerId, targetPlayerId);

      case 'resurrect':
        return this.executeResurrect(playerId, targetPlayerId);

      case 'reap':
        return this.executeReap(playerId, targetPlayerId);

      case 'can':
      case 'ball':
        // Chaos mini-game handled in GameScene
        return {
          success: true,
          message: 'Chaos mini-game initiated',
          requiresUserInput: true,
        };

      default:
        return { success: false, message: 'Unknown card choice' };
    }
  }

  private executeJudge(playerId: string, targetPlayerId?: string): CardEffectResult {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (!targetPlayerId) {
      const availableTargets = this.getValidTargets(playerId, false);
      return {
        success: false,
        message: 'Select a player to lose 1 life',
        requiresUserInput: true,
        availableTargets,
      };
    }

    const target = this.playerManager.getPlayer(targetPlayerId);
    if (!target || target.isEliminated) {
      return { success: false, message: 'Invalid target' };
    }

    // Target loses 1 life
    target.lives -= 1;
    if (target.lives <= 0) {
      target.isEliminated = true;
      target.lives = 0;
      return {
        success: true,
        message: `${player.name} judged ${target.name}! ${target.name} lost their last life and is eliminated!`,
        affectedPlayers: [targetPlayerId],
      };
    }

    return {
      success: true,
      message: `${player.name} judged ${target.name}! ${target.name} lost 1 life (${target.lives} remaining).`,
      affectedPlayers: [targetPlayerId],
    };
  }

  private executeJury(
    playerId: string,
    selectorId?: string,
    victimId?: string
  ): CardEffectResult {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Step 1: Select the selector
    if (!selectorId) {
      const availableTargets = this.getValidTargets(playerId, false);
      return {
        success: false,
        message: 'Choose a selector (they will pick the victim)',
        requiresUserInput: true,
        availableTargets,
      };
    }

    const selector = this.playerManager.getPlayer(selectorId);
    if (!selector || selector.isEliminated) {
      return { success: false, message: 'Invalid selector' };
    }

    // Step 2: Selector chooses the victim
    if (!victimId) {
      const availableVictims = this.getValidTargets(selectorId, false);
      return {
        success: false,
        message: `${selector.name} must choose a victim (they will lose 2 lives)`,
        requiresUserInput: true,
        requiresSecondaryChoice: true,
        secondaryChoicePlayerId: selectorId,
        availableTargets: availableVictims,
      };
    }

    const victim = this.playerManager.getPlayer(victimId);
    if (!victim || victim.isEliminated) {
      return { success: false, message: 'Invalid victim' };
    }

    // Victim loses 2 lives
    victim.lives -= 2;
    if (victim.lives <= 0) {
      victim.isEliminated = true;
      victim.lives = 0;
      return {
        success: true,
        message: `${player.name} summoned the Jury! ${selector.name} chose ${victim.name} who lost their last life and is eliminated!`,
        affectedPlayers: [victimId],
      };
    }

    return {
      success: true,
      message: `${player.name} summoned the Jury! ${selector.name} chose ${victim.name} who lost 2 lives (${victim.lives} remaining).`,
      affectedPlayers: [victimId],
    };
  }

  private executeSummon(playerId: string, targetPlayerId?: string): CardEffectResult {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (!targetPlayerId) {
      const availableTargets = this.getValidTargets(playerId, false);
      return {
        success: false,
        message: 'Select a player to summon to your position',
        requiresUserInput: true,
        availableTargets,
      };
    }

    const target = this.playerManager.getPlayer(targetPlayerId);
    if (!target || target.isEliminated) {
      return { success: false, message: 'Invalid target' };
    }

    // Move target to player's position
    const oldPosition = target.position;
    target.position = player.position;

    return {
      success: true,
      message: `${player.name} summoned ${target.name} from square ${oldPosition} to ${player.position}!`,
      affectedPlayers: [targetPlayerId],
    };
  }

  private executeExile(playerId: string, targetPlayerId?: string): CardEffectResult {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (!targetPlayerId) {
      const availableTargets = this.getValidTargets(playerId, false);
      return {
        success: false,
        message: 'Select a player to exile to Jail',
        requiresUserInput: true,
        availableTargets,
      };
    }

    const target = this.playerManager.getPlayer(targetPlayerId);
    if (!target || target.isEliminated) {
      return { success: false, message: 'Invalid target' };
    }

    // Exile effects: -1 life, move to jail, skip next turn
    target.lives -= 1;
    target.position = -1; // Jail square (index -1, below square 10)
    target.inJail = true;
    target.skippingTurn = true;

    if (target.lives <= 0) {
      target.isEliminated = true;
      target.lives = 0;
      return {
        success: true,
        message: `${player.name} exiled ${target.name} to Jail! ${target.name} lost their last life and is eliminated!`,
        affectedPlayers: [targetPlayerId],
      };
    }

    return {
      success: true,
      message: `${player.name} exiled ${target.name} to Jail! Lost 1 life (${target.lives} remaining) and will skip next turn.`,
      affectedPlayers: [targetPlayerId],
    };
  }

  private executeResurrect(playerId: string, targetPlayerId?: string): CardEffectResult {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // Get dead players
    const deadPlayers = this.playerManager
      .getAllPlayers()
      .filter((p) => p.isEliminated && p.id !== playerId);

    if (deadPlayers.length === 0) {
      return { success: false, message: 'No dead players to resurrect' };
    }

    if (!targetPlayerId) {
      return {
        success: false,
        message: 'Select a dead player to resurrect',
        requiresUserInput: true,
        availableTargets: deadPlayers,
      };
    }

    const target = this.playerManager.getPlayer(targetPlayerId);
    if (!target || !target.isEliminated) {
      return { success: false, message: 'Target is not dead' };
    }

    // Resurrect: revive at start with 1 life
    target.isEliminated = false;
    target.lives = 1;
    target.position = 0;
    target.inJail = false;
    target.skippingTurn = false;

    return {
      success: true,
      message: `${player.name} resurrected ${target.name}! They return with 1 life at the start.`,
      affectedPlayers: [targetPlayerId],
    };
  }

  private executeReap(playerId: string, targetPlayerId?: string): CardEffectResult {
    const player = this.playerManager.getPlayer(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    if (!targetPlayerId) {
      const availableTargets = this.getValidTargets(playerId, false);
      return {
        success: false,
        message: 'Select a player to reap (instant death)',
        requiresUserInput: true,
        availableTargets,
      };
    }

    const target = this.playerManager.getPlayer(targetPlayerId);
    if (!target || target.isEliminated) {
      return { success: false, message: 'Invalid target' };
    }

    // Instant death
    target.lives = 0;
    target.isEliminated = true;

    return {
      success: true,
      message: `${player.name} reaped ${target.name}! ${target.name} is instantly eliminated!`,
      affectedPlayers: [targetPlayerId],
    };
  }

  private getValidTargets(excludePlayerId: string, includeDead: boolean = false): Player[] {
    const allPlayers = this.playerManager.getAllPlayers();
    return allPlayers.filter((p) => {
      if (p.id === excludePlayerId) return false;
      if (includeDead) return true;
      return !p.isEliminated;
    });
  }
}
