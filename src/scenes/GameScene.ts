import Phaser from 'phaser';
import { Board } from '../game-objects/Board';
import { GamePiece } from '../game-objects/GamePiece';
import { Die } from '../game-objects/Die';
import { CardDeck } from '../game-objects/CardDeck';
import { PlayerManager } from '../systems/PlayerManager';
import { TurnManager } from '../systems/TurnManager';
import { CardSystem } from '../systems/CardSystem';
import { PlayerHUD } from '../ui/PlayerHUD';
import { CardDialog } from '../ui/CardDialog';
import { TurnLog } from '../ui/TurnLog';
import { GAME_CONSTANTS } from '../config/constants';
import { Card, CardChoice, Player } from '../types/game.types';
import EventBus from '../events/EventBus';
import { ChaosResult } from './ChaosMinigameScene';
import { isTouchDevice, actionPrompt } from '../utils/input-helpers';

interface GameSceneData {
  selectedCharacter: string;
}

export class GameScene extends Phaser.Scene {
  private selectedCharacterId: string = '';
  private board: Board | null = null;
  private die: Die | null = null;
  private cardDeck: CardDeck | null = null;
  private playerManager: PlayerManager | null = null;
  private turnManager: TurnManager | null = null;
  private cardSystem: CardSystem | null = null;
  private playerHUD: PlayerHUD | null = null;
  private turnLog: TurnLog | null = null;
  private gamePieces: Map<string, GamePiece> = new Map();
  private rollButton: Phaser.GameObjects.Container | null = null;
  private isProcessingTurn: boolean = false;
  private lightningRoundText: Phaser.GameObjects.Text | null = null;

  // Layout constants
  private readonly SIDEBAR_WIDTH = 220;
  private readonly SIDEBAR_X_OFFSET = 20;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: GameSceneData): void {
    this.selectedCharacterId = data.selectedCharacter;
  }

  create(): void {
    // Initialize game systems
    this.playerManager = new PlayerManager(this.selectedCharacterId);
    this.turnManager = new TurnManager(this.playerManager);
    this.cardDeck = new CardDeck();
    this.cardSystem = new CardSystem(this.playerManager);

    // Create board
    this.board = new Board(this);

    // Calculate sidebar position
    const sidebarX = this.cameras.main.width - this.SIDEBAR_WIDTH - this.SIDEBAR_X_OFFSET;

    // Create die (in sidebar) - set depth to appear above sidebar background
    this.die = new Die(this, sidebarX + this.SIDEBAR_WIDTH / 2, 80);
    this.die.setDepth(10);

    // Create player HUD
    this.playerHUD = new PlayerHUD(this, this.playerManager.getPlayers());

    // Create game pieces for all players
    this.createGamePieces();

    // Create UI
    this.createSidebar(sidebarX);
    this.createInfoText();

    // Start first turn
    this.startTurn();

    // Return to menu (ESC key)
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  private createGamePieces(): void {
    if (!this.board || !this.playerManager) return;

    const players = this.playerManager.getPlayers();
    const startPos = this.board.getSquarePosition(0);

    players.forEach((player, index) => {
      // Distribute pieces around center of square
      const positions = this.calculatePiecePositions(players.length, startPos.x, startPos.y);
      const piece = new GamePiece(this, player, positions[index].x, positions[index].y);
      this.gamePieces.set(player.id, piece);
    });
  }

  private calculatePiecePositions(
    numPieces: number,
    centerX: number,
    centerY: number
  ): Array<{ x: number; y: number }> {
    if (numPieces === 1) {
      return [{ x: centerX, y: centerY }];
    }

    const positions: Array<{ x: number; y: number }> = [];
    const radius = 16; // Increased from 12 to prevent overlap with 7 pieces

    // Arrange in a circle pattern around the center, starting at top (12 o'clock)
    for (let i = 0; i < numPieces; i++) {
      const angle = (i / numPieces) * Math.PI * 2 - Math.PI / 2; // Start at top
      positions.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
      });
    }

    return positions;
  }

  private createSidebar(sidebarX: number): void {
    const sidebarY = 20;
    const centerX = sidebarX + this.SIDEBAR_WIDTH / 2;

    // Sidebar background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.85);
    bg.fillRoundedRect(sidebarX, sidebarY, this.SIDEBAR_WIDTH, this.cameras.main.height - 40, 12);
    bg.lineStyle(3, 0xbb9af7, 1);
    bg.strokeRoundedRect(sidebarX, sidebarY, this.SIDEBAR_WIDTH, this.cameras.main.height - 40, 12);

    // Die container (decorative border)
    const dieY = 80;
    const dieBorder = this.add.graphics();
    dieBorder.lineStyle(3, GAME_CONSTANTS.COLORS.PRIMARY, 1);
    dieBorder.strokeRect(centerX - 60, dieY - 35, 120, 90);
    dieBorder.setDepth(10); // Same depth as die

    // Corner decorations
    const cornerSize = 6;
    dieBorder.fillStyle(GAME_CONSTANTS.COLORS.SUCCESS, 1);
    dieBorder.fillRect(centerX - 60, dieY - 35, cornerSize, cornerSize);
    dieBorder.fillRect(centerX + 60 - cornerSize, dieY - 35, cornerSize, cornerSize);
    dieBorder.fillRect(centerX - 60, dieY + 55 - cornerSize, cornerSize, cornerSize);
    dieBorder.fillRect(centerX + 60 - cornerSize, dieY + 55 - cornerSize, cornerSize, cornerSize);

    // Roll button
    const buttonY = 160;
    const container = this.add.container(centerX, buttonY);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(GAME_CONSTANTS.COLORS.PRIMARY, 1);
    btnBg.fillRoundedRect(-70, -20, 140, 40, 8);
    container.add(btnBg);

    const text = this.add.text(0, 0, 'ROLL DIE', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    container.add(text);

    const hitArea = new Phaser.Geom.Rectangle(-80, -30, 160, 60);
    container.setSize(160, 60);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(GAME_CONSTANTS.COLORS.SECONDARY, 1);
      btnBg.fillRoundedRect(-70, -20, 140, 40, 8);
    });

    container.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(GAME_CONSTANTS.COLORS.PRIMARY, 1);
      btnBg.fillRoundedRect(-70, -20, 140, 40, 8);
    });

    container.on('pointerdown', () => {
      this.onRollDie();
    });

    this.rollButton = container;
    this.rollButton.setVisible(false);
    this.rollButton.setDepth(10); // Above sidebar background

    // Turn log
    this.turnLog = new TurnLog(this, sidebarX + 10, 220, this.SIDEBAR_WIDTH - 20, this.cameras.main.height - 260);
  }


  private createInfoText(): void {
    this.add
      .text(this.cameras.main.width / 2, 20, 'THE DOOR - PHASE 2 PROTOTYPE', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#99e550',
      })
      .setOrigin(0.5)
      .setDepth(100);

    if (isTouchDevice()) {
      // Touch menu button
      const menuBtn = this.add.container(50, this.cameras.main.height - 25);
      const menuBg = this.add.graphics();
      menuBg.fillStyle(0x333355, 0.8);
      menuBg.fillRoundedRect(-40, -15, 80, 30, 6);
      menuBtn.add(menuBg);
      const menuText = this.add.text(0, 0, 'MENU', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#ffffff',
      }).setOrigin(0.5);
      menuBtn.add(menuText);
      menuBtn.setSize(80, 30);
      menuBtn.setInteractive(new Phaser.Geom.Rectangle(-40, -15, 80, 30), Phaser.Geom.Rectangle.Contains);
      menuBtn.on('pointerdown', () => { this.scene.start('MenuScene'); });
      menuBtn.setDepth(100);
    } else {
      this.add
        .text(10, this.cameras.main.height - 20, 'ESC: Menu', {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '8px',
          color: '#ffffff',
        })
        .setDepth(100);
    }
  }

  private startTurn(): void {
    if (!this.turnManager || !this.playerHUD) return;

    const currentPlayer = this.turnManager.getCurrentPlayer();
    if (!currentPlayer) return;

    // Check if player should skip this turn
    if (currentPlayer.skippingTurn) {
      currentPlayer.skippingTurn = false;
      this.logAction(currentPlayer.name, 'Turn skipped (in jail)');

      // Update HUD to reflect they're no longer skipping
      this.playerHUD.updatePlayer(currentPlayer);

      // Move to next turn immediately
      this.turnManager.nextTurn();
      this.time.delayedCall(500, () => {
        this.startTurn();
      });
      return;
    }

    // Highlight current player
    this.playerHUD.highlightCurrentPlayer(currentPlayer.id);

    // If AI player, auto-take turn after delay
    if (currentPlayer.isAI) {
      this.time.delayedCall(1000, () => {
        this.onRollDie();
      });
    } else {
      // Show roll button for human player
      this.rollButton?.setVisible(true);
    }
  }

  private async onRollDie(): Promise<void> {
    if (this.isProcessingTurn || !this.die || !this.turnManager || !this.board) return;

    this.isProcessingTurn = true;
    this.rollButton?.setVisible(false);

    const currentPlayer = this.turnManager.getCurrentPlayer();
    if (!currentPlayer) return;

    // Roll die
    const rollValue = await this.die.roll();
    console.log(`${currentPlayer.name} rolled ${rollValue}`);

    // Log the roll
    this.logAction(currentPlayer.name, `Rolled ${rollValue}`);

    // Calculate new position - if in jail, start from square 10
    let startPosition = currentPlayer.position;
    if (currentPlayer.inJail) {
      startPosition = 10; // Exit jail, start from square 10
      currentPlayer.inJail = false;
      this.logAction(currentPlayer.name, 'Released from jail');
    }

    // Move player
    await this.movePlayer(currentPlayer.id, startPosition + rollValue);

    // Check for game over FIRST (before checking for card squares)
    const newPosition = currentPlayer.position;
    if (newPosition >= GAME_CONSTANTS.DOOR_SQUARE) {
      // Player reached the Door - they win!
      this.endGame();
      return;
    }

    // Determine if this player draws a card
    const landedOnCardSquare = newPosition % GAME_CONSTANTS.CARD_SQUARE_INTERVAL === 0 && newPosition > 0;
    const isLightningRound = this.turnManager.isLightningRound();

    if (landedOnCardSquare) {
      console.log(`${currentPlayer.name} landed on a CARD square!`);
      this.logAction(currentPlayer.name, `Landed on CARD square!`);
      await this.drawCard(currentPlayer.id);
    } else if (isLightningRound) {
      // Lightning Round: every turn draws a card regardless of tile
      this.logAction(currentPlayer.name, `LIGHTNING ROUND — draws a card!`);
      await this.drawCard(currentPlayer.id);
    }

    // Record turn taken (after card effects, for Lightning Round tracking)
    this.turnManager.recordTurnTaken(currentPlayer.id);

    // Check if Lightning Round just activated
    if (!isLightningRound && this.turnManager.isLightningRound()) {
      this.logAction('GAME', 'LIGHTNING ROUND ACTIVATED!');
      this.showLightningRoundIndicator();
    }

    // Check for game over (in case someone was eliminated during card effects)
    if (this.turnManager.isGameOver()) {
      this.endGame();
      return;
    }

    // Next turn
    this.turnManager.nextTurn();
    this.isProcessingTurn = false;

    // Wait a bit before starting next turn
    this.time.delayedCall(500, () => {
      this.startTurn();
    });
  }

  private async movePlayer(playerId: string, newPosition: number): Promise<void> {
    if (!this.playerManager || !this.board) return;

    const player = this.playerManager.getPlayer(playerId);
    const piece = this.gamePieces.get(playerId);
    if (!player || !piece) return;

    // Cap position at the Door (square 20) - can't go past it
    const cappedPosition = Math.min(newPosition, GAME_CONSTANTS.DOOR_SQUARE);

    // Update player position
    this.playerManager.movePlayer(playerId, cappedPosition);

    // Calculate target position distributed around square center
    const basePos = this.board.getSquarePosition(cappedPosition);
    const playersOnSquare = this.playerManager
      .getPlayers()
      .filter((p) => p.position === cappedPosition && !p.isEliminated);

    const stackIndex = playersOnSquare.findIndex((p) => p.id === playerId);
    const positions = this.calculatePiecePositions(playersOnSquare.length, basePos.x, basePos.y);

    // Animate piece movement to distributed position
    await piece.moveToPosition(positions[stackIndex].x, positions[stackIndex].y);

    // Update HUD
    this.playerHUD?.updatePlayer(player);

    // Log if player reached the Door
    if (cappedPosition >= GAME_CONSTANTS.DOOR_SQUARE) {
      this.logAction(player.name, 'Reached the DOOR!');
    }
  }

  private endGame(): void {
    if (!this.turnManager) return;

    const winner = this.turnManager.getWinner();
    if (winner) {
      const centerX = this.cameras.main.width / 2;
      const centerY = this.cameras.main.height / 2;

      // Overlay
      const overlay = this.add.graphics();
      overlay.fillStyle(0x000000, 0.8);
      overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
      overlay.setDepth(1000);

      // Winner text
      this.add
        .text(centerX, centerY - 50, 'GAME OVER!', {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '32px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(1001);

      this.add
        .text(centerX, centerY + 20, `${winner.name} WINS!`, {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '20px',
          color: '#99e550',
        })
        .setOrigin(0.5)
        .setDepth(1001);

      this.add
        .text(centerX, centerY + 80, actionPrompt('TAP TO CONTINUE', 'Press SPACE to return to menu'), {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '10px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(1001);

      this.input.keyboard?.once('keydown-SPACE', () => {
        this.scene.start('MenuScene');
      });

      this.input.once('pointerdown', () => {
        this.scene.start('MenuScene');
      });
    }
  }


  // Helper methods
  private logAction(playerName: string, action: string): void {
    if (this.turnLog) {
      this.turnLog.addEntry(playerName, action);
    }
  }

  private showLightningRoundIndicator(): void {
    // Persistent on-screen indicator
    this.lightningRoundText = this.add.text(
      this.cameras.main.width / 2,
      38,
      'LIGHTNING ROUND',
      {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#fbf236',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(100);

    // Pulsing effect
    this.tweens.add({
      targets: this.lightningRoundText,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Brief flash to announce it
    this.cameras.main.flash(400, 251, 242, 54);
  }

  // Card system methods
  private async drawCard(playerId: string): Promise<void> {
    if (!this.cardDeck || !this.cardSystem || !this.playerManager) return;

    const player = this.playerManager.getPlayer(playerId);
    if (!player) return;

    const card = this.cardDeck.drawCard();
    if (!card) {
      console.log('No cards left in deck');
      return;
    }

    // Show card fly-in animation
    await this.playCardFlyInAnimation();

    // Show card and let player choose
    const choice = await this.showCardChoice(player.id, card);
    if (!choice) return;

    // Execute the chosen effect
    await this.executeCardChoice(player.id, choice);
  }

  private async playCardFlyInAnimation(): Promise<void> {
    return new Promise<void>((resolve) => {
      // Calculate deck position (top center of screen)
      const deckX = this.cameras.main.width / 2;
      const deckY = -50; // Off screen top

      // Create card sprite
      const cardGraphics = this.add.graphics();
      cardGraphics.fillStyle(0x1a1a2e, 1);
      cardGraphics.fillRoundedRect(-30, -40, 60, 80, 8);
      cardGraphics.lineStyle(3, 0xbb9af7, 1);
      cardGraphics.strokeRoundedRect(-30, -40, 60, 80, 8);

      // Add question mark
      const questionMark = this.add.text(0, 0, '?', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '24px',
        color: '#bb9af7',
      });
      questionMark.setOrigin(0.5);

      // Container for card
      const cardContainer = this.add.container(deckX, deckY);
      cardContainer.add([cardGraphics, questionMark]);
      cardContainer.setDepth(500);
      cardContainer.setAlpha(0);

      // Fly in animation
      this.tweens.add({
        targets: cardContainer,
        y: this.cameras.main.height / 2,
        alpha: 1,
        duration: 600,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Flash effect
          this.tweens.add({
            targets: cardContainer,
            scale: 1.2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
              cardContainer.destroy();
              resolve();
            },
          });
        },
      });
    });
  }

  private async showCardChoice(playerId: string, card: Card): Promise<CardChoice | null> {
    const player = this.playerManager!.getPlayer(playerId);
    if (!player) return null;

    // Check if options are available
    const deadPlayers = this.playerManager!.getAllPlayers().filter(p => p.isEliminated);
    const optionADisabled = card.optionA === 'resurrect' && deadPlayers.length === 0;
    const optionBDisabled = card.optionB === 'resurrect' && deadPlayers.length === 0;

    if (player.isAI) {
      // AI makes choice - show dialog with progress bar
      const aiChoice = this.aiChooseCardOption(player.id, card);
      const aiChoiceOption: 'A' | 'B' = aiChoice === card.optionA ? 'A' : 'B';

      return new Promise<CardChoice | null>((resolve) => {
        new CardDialog(this, {
          type: 'aiCardChoice',
          card: card,
          message: `${player.name} is choosing...`,
          aiChoice: aiChoiceOption,
          onProceed: () => {
            resolve(aiChoice);
          },
          optionADisabled,
          optionBDisabled,
        });
      });
    }

    // Human player chooses
    return new Promise<CardChoice | null>((resolve) => {
      new CardDialog(this, {
        type: 'chooseCard',
        card: card,
        message: 'Choose one option:',
        onOptionSelected: (option: 'A' | 'B') => {
          resolve(option === 'A' ? card.optionA : card.optionB);
        },
        optionADisabled,
        optionBDisabled,
      });
    });
  }

  private aiChooseCardOption(playerId: string, card: Card): CardChoice {
    const player = this.playerManager!.getPlayer(playerId);
    if (!player) return card.optionA;

    // AI decision logic based on card type and strategy
    if (card.type === 'judge-jury') {
      // Aggressive: use Jury (more damage), Cautious: use Judge (safer)
      return player.character.aiStrategy === 'aggressive' ? card.optionB : card.optionA;
    } else if (card.type === 'summon-exile') {
      // Aggressive: use Exile (damage + jail), Cautious: use Summon (reposition)
      return player.character.aiStrategy === 'aggressive' ? card.optionB : card.optionA;
    } else if (card.type === 'resurrect-reap') {
      // Check if any dead players
      const deadPlayers = this.playerManager!.getAllPlayers().filter(p => p.isEliminated);
      if (deadPlayers.length > 0 && player.character.aiStrategy === 'balanced') {
        return card.optionA; // Resurrect
      }
      return card.optionB; // Reap (instant kill)
    } else if (card.type === 'chaos') {
      // Use aimSkill to decide - high aim = be thrower (CAN), low aim = make them throw (BALL)
      return (player.character.aimSkill || 0.5) > 0.6 ? card.optionA : card.optionB;
    }

    return card.optionA;
  }

  private async executeCardChoice(playerId: string, choice: CardChoice): Promise<void> {
    if (!this.cardSystem || !this.playerManager) return;

    const player = this.playerManager.getPlayer(playerId);
    if (!player) return;

    console.log(`${player.name} chose: ${choice}`);
    this.logAction(player.name, `Chose ${choice.toUpperCase()}`);

    // Handle special cases
    if (choice === 'can' || choice === 'ball') {
      await this.handleChaosCard(playerId, choice);
      return;
    }

    if (choice === 'resurrect') {
      // Check if there are dead players
      const deadPlayers = this.playerManager.getAllPlayers().filter(p => p.isEliminated);
      if (deadPlayers.length === 0) {
        new CardDialog(this, {
          type: 'message',
          message: 'No dead players to resurrect!',
          onConfirm: () => {},
        });
        return;
      }
    }

    // Get initial result (may need target selection)
    let result = await this.cardSystem.executeCardEffect(playerId, choice);

    // If requires target selection
    if (result.requiresUserInput && result.availableTargets) {
      const targetId = await this.selectTarget(player, result.message, result.availableTargets);
      
      if (!targetId) return; // Canceled

      // Execute with target
      result = await this.cardSystem.executeCardEffect(playerId, choice, targetId);

      // Jury requires secondary choice (selector picks victim)
      if (result.requiresSecondaryChoice && result.secondaryChoicePlayerId && result.availableTargets) {
        const secondaryPlayer = this.playerManager.getPlayer(result.secondaryChoicePlayerId);
        if (secondaryPlayer) {
          const victimId = await this.selectTarget(secondaryPlayer, result.message, result.availableTargets);
          if (victimId) {
            result = await this.cardSystem.executeCardEffect(playerId, choice, result.secondaryChoicePlayerId, victimId);
          }
        }
      }
    }

    // Show result message and log it
    if (result.success && result.message) {
      this.logAction(player.name, result.message);

      await new Promise<void>((resolve) => {
        new CardDialog(this, {
          type: 'message',
          message: result.message,
          onConfirm: () => resolve(),
        });
      });
    }

    // Update affected players
    if (result.affectedPlayers) {
      for (const affectedId of result.affectedPlayers) {
        const affected = this.playerManager.getPlayer(affectedId);
        if (affected) {
          this.playerHUD?.updatePlayer(affected);

          // Hide or show piece based on elimination status
          const piece = this.gamePieces.get(affectedId);
          if (piece) {
            if (affected.isEliminated) {
              piece.hide();
              this.logAction(affected.name, 'ELIMINATED!');
            } else {
              piece.show();
            }
          }

          // Update piece position if moved (and not eliminated)
          if (!affected.isEliminated && (choice === 'summon' || choice === 'exile' || choice === 'resurrect')) {
            await this.updatePiecePosition(affectedId);
          }
        }
      }
    }
  }

  private async selectTarget(player: Player, message: string, targets: Player[]): Promise<string | null> {
    if (player.isAI) {
      // AI auto-selects target
      if (targets.length === 0) return null;
      
      // Simple AI: target player with most lives (aggressive) or closest (positional)
      if (player.character.aiStrategy === 'aggressive') {
        targets.sort((a, b) => b.lives - a.lives);
      } else {
        targets.sort((a, b) => Math.abs(a.position - player.position) - Math.abs(b.position - player.position));
      }
      
      return targets[0].id;
    }

    // Human selects target
    return new Promise<string | null>((resolve) => {
      new CardDialog(this, {
        type: 'selectTarget',
        message,
        players: targets,
        onPlayerSelected: (id) => resolve(id),
        onCancel: () => resolve(null),
      });
    });
  }

  private async handleChaosCard(playerId: string, choice: CardChoice): Promise<void> {
    if (!this.playerManager) return;

    const player = this.playerManager.getPlayer(playerId);
    if (!player) return;

    // Select target
    const targets = this.playerManager.getAllPlayers().filter(p => p.id !== playerId && !p.isEliminated);
    const targetId = await this.selectTarget(player, 'Select a player for Chaos showdown', targets);

    if (!targetId) return;

    const target = this.playerManager.getPlayer(targetId);
    if (!target) return;

    // Determine roles based on choice
    // CAN = "I'll stand with the can" → drawing player throws, target defends
    // BALL = "Give me the ball" → target throws, drawing player defends
    const isThrower = choice === 'can';
    const thrower = isThrower ? player : target;
    const defender = isThrower ? target : player;
    const distance = this.calculateChaosDistance(player, target);

    // Perspective always follows the card drawer:
    // chose CAN → drawer throws → BALL perspective (they aim)
    // chose BALL → drawer defends → CAN perspective (they watch)
    const perspective = choice === 'can' ? 'ball' : 'can';

    this.logAction(player.name, `CHAOS! ${thrower.name} throws at ${defender.name} (dist: ${distance})`);

    // Always launch the mini-game scene (even AI-vs-AI) for drama
    const result = await new Promise<ChaosResult>((resolve) => {
      EventBus.once('chaos-result', (data: ChaosResult) => {
        resolve(data);
      });
      this.scene.pause();
      this.scene.launch('ChaosMinigameScene', {
        throwerId: thrower.id,
        defenderId: defender.id,
        throwerName: thrower.name,
        defenderName: defender.name,
        throwerSpriteKey: thrower.character.id,
        defenderSpriteKey: defender.character.id,
        distance,
        throwerIsHuman: !thrower.isAI,
        perspective,
      });
    });

    // Resume GameScene
    this.scene.resume();

    // Apply result
    this.applyChaosResult(result);
  }

  private calculateChaosDistance(playerA: Player, playerB: Player): number {
    const sameRow = playerA.hudRow === playerB.hudRow;
    const slotDiff = Math.abs(playerA.hudSlot - playerB.hudSlot);

    let distance: number;
    if (sameRow) {
      distance = slotDiff;
    } else {
      // Cross-board: slot diff + 1 (crossing penalty) + 1 (base)
      distance = slotDiff + 2;
    }

    return Math.max(1, Math.min(4, distance));
  }

  private applyChaosResult(result: ChaosResult): void {
    if (!this.playerManager) return;

    const loser = this.playerManager.getPlayer(result.loserId);
    if (!loser) return;

    // Use PlayerManager API to drain all lives (respects future hooks)
    this.playerManager.loseLife(result.loserId, loser.lives);
    this.playerHUD?.updatePlayer(loser);

    const piece = this.gamePieces.get(loser.id);
    if (piece) {
      piece.hide();
    }

    this.logAction(loser.name, `ELIMINATED by Chaos! (${result.outcome})`);
  }

  private async updatePiecePosition(playerId: string): Promise<void> {
    if (!this.playerManager || !this.board) return;

    const player = this.playerManager.getPlayer(playerId);
    const piece = this.gamePieces.get(playerId);
    if (!player || !piece) return;

    const basePos = this.board.getSquarePosition(player.position);
    const playersOnSquare = this.playerManager
      .getPlayers()
      .filter((p) => p.position === player.position && !p.isEliminated);

    const stackIndex = playersOnSquare.findIndex((p) => p.id === playerId);
    const positions = this.calculatePiecePositions(playersOnSquare.length, basePos.x, basePos.y);

    await piece.moveToPosition(positions[stackIndex].x, positions[stackIndex].y);
  }
}
