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
import { isPortrait } from '../utils/layout-helpers';

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
  private portrait: boolean = false;

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
    this.portrait = isPortrait();

    // Initialize game systems
    this.playerManager = new PlayerManager(this.selectedCharacterId);
    this.turnManager = new TurnManager(this.playerManager);
    this.cardDeck = new CardDeck();
    this.cardSystem = new CardSystem(this.playerManager);

    // Create board
    this.board = new Board(this, this.portrait);

    // Create player HUD
    this.playerHUD = new PlayerHUD(this, this.playerManager.getPlayers(), this.portrait);

    // Create game pieces for all players
    this.createGamePieces();

    if (this.portrait) {
      this.createPortraitUI();
    } else {
      this.createLandscapeUI();
    }

    // Create info text (title + menu button)
    this.createInfoText();

    // Start first turn
    this.startTurn();

    // Return to menu (ESC key)
    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MenuScene');
    });
  }

  private createLandscapeUI(): void {
    const sidebarX = this.cameras.main.width - this.SIDEBAR_WIDTH - this.SIDEBAR_X_OFFSET;

    // Create die (in sidebar)
    this.die = new Die(this, sidebarX + this.SIDEBAR_WIDTH / 2, 80);
    this.die.setDepth(10);

    this.createSidebar(sidebarX);
  }

  private createPortraitUI(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Die — small, bottom-left
    this.die = new Die(this, 50, H - 50);
    this.die.setScale(0.67);
    this.die.setDepth(10);

    // Roll button — center-bottom
    const btnY = H - 50;
    const container = this.add.container(W / 2, btnY);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(GAME_CONSTANTS.COLORS.PRIMARY, 1);
    btnBg.fillRoundedRect(-120, -25, 240, 50, 8);
    container.add(btnBg);

    const text = this.add.text(0, 0, 'ROLL DIE', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '12px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    container.add(text);

    const hitArea = new Phaser.Geom.Rectangle(-120, -25, 240, 50);
    container.setSize(240, 50);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(GAME_CONSTANTS.COLORS.SECONDARY, 1);
      btnBg.fillRoundedRect(-120, -25, 240, 50, 8);
    });
    container.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(GAME_CONSTANTS.COLORS.PRIMARY, 1);
      btnBg.fillRoundedRect(-120, -25, 240, 50, 8);
    });
    container.on('pointerdown', () => {
      this.onRollDie();
    });

    this.rollButton = container;
    this.rollButton.setVisible(false);
    this.rollButton.setDepth(10);

    // Turn log — collapsible, between board and controls
    this.turnLog = new TurnLog(this, 10, 680, W - 20, 0, true);
    this.turnLog.setDepth(10);
  }

  private createGamePieces(): void {
    if (!this.board || !this.playerManager) return;

    const players = this.playerManager.getPlayers();
    const startPos = this.board.getSquarePosition(0);

    players.forEach((player, index) => {
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
    const radius = 16;

    for (let i = 0; i < numPieces; i++) {
      const angle = (i / numPieces) * Math.PI * 2 - Math.PI / 2;
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
    dieBorder.setDepth(10);

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
    this.rollButton.setDepth(10);

    // Turn log
    this.turnLog = new TurnLog(this, sidebarX + 10, 220, this.SIDEBAR_WIDTH - 20, this.cameras.main.height - 260);
  }


  private createInfoText(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    this.add
      .text(W / 2, this.portrait ? 15 : 20, 'THE DOOR', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: this.portrait ? '10px' : '8px',
        color: '#99e550',
      })
      .setOrigin(0.5)
      .setDepth(100);

    if (this.portrait) {
      // MENU button bottom-right
      const menuBtn = this.add.container(W - 50, H - 50);
      const menuBg = this.add.graphics();
      menuBg.fillStyle(0x333355, 0.8);
      menuBg.fillRoundedRect(-35, -20, 70, 40, 6);
      menuBtn.add(menuBg);
      const menuText = this.add.text(0, 0, 'MENU', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#ffffff',
      }).setOrigin(0.5);
      menuBtn.add(menuText);
      menuBtn.setSize(70, 40);
      menuBtn.setInteractive(new Phaser.Geom.Rectangle(-35, -20, 70, 40), Phaser.Geom.Rectangle.Contains);
      menuBtn.on('pointerdown', () => { this.scene.start('MenuScene'); });
      menuBtn.setDepth(100);
    } else if (isTouchDevice()) {
      const menuBtn = this.add.container(50, H - 25);
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
        .text(10, H - 20, 'ESC: Menu', {
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

      this.playerHUD.updatePlayer(currentPlayer);

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

    this.logAction(currentPlayer.name, `Rolled ${rollValue}`);

    // Calculate new position - if in jail, start from square 10
    let startPosition = currentPlayer.position;
    if (currentPlayer.inJail) {
      startPosition = 10;
      currentPlayer.inJail = false;
      this.logAction(currentPlayer.name, 'Released from jail');
    }

    // Move player
    await this.movePlayer(currentPlayer.id, startPosition + rollValue);

    // Check for game over FIRST
    const newPosition = currentPlayer.position;
    if (newPosition >= GAME_CONSTANTS.DOOR_SQUARE) {
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
      this.logAction(currentPlayer.name, `LIGHTNING ROUND — draws a card!`);
      await this.drawCard(currentPlayer.id);
    }

    // Record turn taken
    this.turnManager.recordTurnTaken(currentPlayer.id);

    // Check if Lightning Round just activated
    if (!isLightningRound && this.turnManager.isLightningRound()) {
      this.logAction('GAME', 'LIGHTNING ROUND ACTIVATED!');
      this.showLightningRoundIndicator();
    }

    // Check for game over
    if (this.turnManager.isGameOver()) {
      this.endGame();
      return;
    }

    // Next turn
    this.turnManager.nextTurn();
    this.isProcessingTurn = false;

    this.time.delayedCall(500, () => {
      this.startTurn();
    });
  }

  private async movePlayer(playerId: string, newPosition: number): Promise<void> {
    if (!this.playerManager || !this.board) return;

    const player = this.playerManager.getPlayer(playerId);
    const piece = this.gamePieces.get(playerId);
    if (!player || !piece) return;

    const cappedPosition = Math.min(newPosition, GAME_CONSTANTS.DOOR_SQUARE);

    this.playerManager.movePlayer(playerId, cappedPosition);

    const basePos = this.board.getSquarePosition(cappedPosition);
    const playersOnSquare = this.playerManager
      .getPlayers()
      .filter((p) => p.position === cappedPosition && !p.isEliminated);

    const stackIndex = playersOnSquare.findIndex((p) => p.id === playerId);
    const positions = this.calculatePiecePositions(playersOnSquare.length, basePos.x, basePos.y);

    await piece.moveToPosition(positions[stackIndex].x, positions[stackIndex].y);

    this.playerHUD?.updatePlayer(player);

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

      const overlay = this.add.graphics();
      overlay.fillStyle(0x000000, 0.8);
      overlay.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
      overlay.setDepth(1000);

      const gameOverSize = this.portrait ? '24px' : '32px';
      const winnerSize = this.portrait ? '16px' : '20px';

      this.add
        .text(centerX, centerY - 50, 'GAME OVER!', {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: gameOverSize,
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(1001);

      this.add
        .text(centerX, centerY + 20, `${winner.name} WINS!`, {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: winnerSize,
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
    this.lightningRoundText = this.add.text(
      this.cameras.main.width / 2,
      this.portrait ? 30 : 38,
      'LIGHTNING ROUND',
      {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#fbf236',
        stroke: '#000000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: this.lightningRoundText,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

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

    await this.playCardFlyInAnimation();

    const choice = await this.showCardChoice(player.id, card);
    if (!choice) return;

    await this.executeCardChoice(player.id, choice);
  }

  private async playCardFlyInAnimation(): Promise<void> {
    return new Promise<void>((resolve) => {
      const deckX = this.cameras.main.width / 2;
      const deckY = -50;

      const cardGraphics = this.add.graphics();
      cardGraphics.fillStyle(0x1a1a2e, 1);
      cardGraphics.fillRoundedRect(-30, -40, 60, 80, 8);
      cardGraphics.lineStyle(3, 0xbb9af7, 1);
      cardGraphics.strokeRoundedRect(-30, -40, 60, 80, 8);

      const questionMark = this.add.text(0, 0, '?', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '24px',
        color: '#bb9af7',
      });
      questionMark.setOrigin(0.5);

      const cardContainer = this.add.container(deckX, deckY);
      cardContainer.add([cardGraphics, questionMark]);
      cardContainer.setDepth(500);
      cardContainer.setAlpha(0);

      this.tweens.add({
        targets: cardContainer,
        y: this.cameras.main.height / 2,
        alpha: 1,
        duration: 600,
        ease: 'Back.easeOut',
        onComplete: () => {
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

    const deadPlayers = this.playerManager!.getAllPlayers().filter(p => p.isEliminated);
    const optionADisabled = card.optionA === 'resurrect' && deadPlayers.length === 0;
    const optionBDisabled = card.optionB === 'resurrect' && deadPlayers.length === 0;

    if (player.isAI) {
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

    if (card.type === 'judge-jury') {
      return player.character.aiStrategy === 'aggressive' ? card.optionB : card.optionA;
    } else if (card.type === 'summon-exile') {
      return player.character.aiStrategy === 'aggressive' ? card.optionB : card.optionA;
    } else if (card.type === 'resurrect-reap') {
      const deadPlayers = this.playerManager!.getAllPlayers().filter(p => p.isEliminated);
      if (deadPlayers.length > 0 && player.character.aiStrategy === 'balanced') {
        return card.optionA;
      }
      return card.optionB;
    } else if (card.type === 'chaos') {
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

    if (choice === 'can' || choice === 'ball') {
      await this.handleChaosCard(playerId, choice);
      return;
    }

    if (choice === 'resurrect') {
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

    let result = await this.cardSystem.executeCardEffect(playerId, choice);

    if (result.requiresUserInput && result.availableTargets) {
      const targetId = await this.selectTarget(player, result.message, result.availableTargets);

      if (!targetId) return;

      result = await this.cardSystem.executeCardEffect(playerId, choice, targetId);

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

    if (result.affectedPlayers) {
      for (const affectedId of result.affectedPlayers) {
        const affected = this.playerManager.getPlayer(affectedId);
        if (affected) {
          this.playerHUD?.updatePlayer(affected);

          const piece = this.gamePieces.get(affectedId);
          if (piece) {
            if (affected.isEliminated) {
              piece.hide();
              this.logAction(affected.name, 'ELIMINATED!');
            } else {
              piece.show();
            }
          }

          if (!affected.isEliminated && (choice === 'summon' || choice === 'exile' || choice === 'resurrect')) {
            await this.updatePiecePosition(affectedId);
          }
        }
      }
    }
  }

  private async selectTarget(player: Player, message: string, targets: Player[]): Promise<string | null> {
    if (player.isAI) {
      if (targets.length === 0) return null;

      if (player.character.aiStrategy === 'aggressive') {
        targets.sort((a, b) => b.lives - a.lives);
      } else {
        targets.sort((a, b) => Math.abs(a.position - player.position) - Math.abs(b.position - player.position));
      }

      return targets[0].id;
    }

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

    const targets = this.playerManager.getAllPlayers().filter(p => p.id !== playerId && !p.isEliminated);
    const targetId = await this.selectTarget(player, 'Select a player for Chaos showdown', targets);

    if (!targetId) return;

    const target = this.playerManager.getPlayer(targetId);
    if (!target) return;

    const isThrower = choice === 'can';
    const thrower = isThrower ? player : target;
    const defender = isThrower ? target : player;
    const distance = this.calculateChaosDistance(player, target);

    const perspective = choice === 'can' ? 'ball' : 'can';

    this.logAction(player.name, `CHAOS! ${thrower.name} throws at ${defender.name} (dist: ${distance})`);

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

    this.scene.resume();

    this.applyChaosResult(result);
  }

  private calculateChaosDistance(playerA: Player, playerB: Player): number {
    const sameRow = playerA.hudRow === playerB.hudRow;
    const slotDiff = Math.abs(playerA.hudSlot - playerB.hudSlot);

    let distance: number;
    if (sameRow) {
      distance = slotDiff;
    } else {
      distance = slotDiff + 2;
    }

    return Math.max(1, Math.min(4, distance));
  }

  private applyChaosResult(result: ChaosResult): void {
    if (!this.playerManager) return;

    const loser = this.playerManager.getPlayer(result.loserId);
    if (!loser) return;

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
