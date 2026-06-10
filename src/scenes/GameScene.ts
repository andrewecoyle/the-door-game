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
import { Card, CardChoice, CardType, Player } from '../types/game.types';
import EventBus from '../events/EventBus';
import { ChaosResult } from './ChaosMinigameScene';
import { isTouchDevice, actionPrompt } from '../utils/input-helpers';
import { isPortrait } from '../utils/layout-helpers';
import { setFacing } from '../utils/facing';
import { createMuteButton } from '../ui/MuteButton';
import AudioEngine from '../audio/AudioEngine';

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
    AudioEngine.playMusic('game');

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
    this.die = new Die(this, 52, H - 50);
    this.die.setScale(0.75);
    this.die.setDepth(10);

    // Roll button — center-bottom, sized for thumbs
    const btnW = 290;
    const btnH = 68;
    const btnY = H - 50;
    const container = this.add.container(W / 2, btnY);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(GAME_CONSTANTS.COLORS.PRIMARY, 1);
    btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    container.add(btnBg);

    const text = this.add.text(0, 0, 'ROLL DIE', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '14px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    container.add(text);

    // Containers with setSize() get hit-test coords offset by displayOrigin,
    // so the hit rect must start at (0,0) to cover the visual button
    const hitArea = new Phaser.Geom.Rectangle(0, 0, btnW, btnH);
    container.setSize(btnW, btnH);
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    container.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(GAME_CONSTANTS.COLORS.SECONDARY, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    });
    container.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(GAME_CONSTANTS.COLORS.PRIMARY, 1);
      btnBg.fillRoundedRect(-btnW / 2, -btnH / 2, btnW, btnH, 8);
    });
    container.on('pointerdown', () => {
      AudioEngine.sfx('click');
      this.onRollDie();
    });

    this.rollButton = container;
    this.rollButton.setVisible(false);
    this.rollButton.setDepth(10);

    // Turn log strip — last 3 entries, expands into a full overlay
    this.turnLog = new TurnLog(this, 10, 856, W - 20, 0, true);
    this.turnLog.setDepth(10);
  }

  private createGamePieces(): void {
    if (!this.board || !this.playerManager) return;

    const players = this.playerManager.getPlayers();
    const startPos = this.board.getSquarePosition(0);

    players.forEach((player, index) => {
      const positions = this.calculatePiecePositions(players.length, startPos.x, startPos.y);
      const piece = new GamePiece(this, player, positions[index].x, positions[index].y);
      piece.setDepth(5);
      this.gamePieces.set(player.id, piece);
    });
  }

  // Tokens cluster in a small circle and simply crowd when sharing a square
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

    const hitArea = new Phaser.Geom.Rectangle(0, 0, 160, 60);
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
      AudioEngine.sfx('click');
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

    createMuteButton(this, this.portrait ? W - 32 : 30, this.portrait ? 28 : 30);

    this.add
      .text(W / 2, this.portrait ? 28 : 20, 'THE DOOR', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: this.portrait ? '16px' : '8px',
        color: '#99e550',
        stroke: '#000000',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(100);

    if (this.portrait) {
      // Title bar divider
      this.add.rectangle(W / 2, 56, W, 2, 0x1c1c2b).setDepth(100);
    }

    if (this.portrait) {
      // MENU button bottom-right, sized for thumbs
      const menuBtn = this.add.container(W - 54, H - 50);
      const menuBg = this.add.graphics();
      menuBg.fillStyle(0x333355, 0.8);
      menuBg.fillRoundedRect(-42, -28, 84, 56, 6);
      menuBtn.add(menuBg);
      const menuText = this.add.text(0, 0, 'MENU', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '9px',
        color: '#ffffff',
      }).setOrigin(0.5);
      menuBtn.add(menuText);
      menuBtn.setSize(84, 56);
      menuBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 84, 56), Phaser.Geom.Rectangle.Contains);
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
      menuBtn.setInteractive(new Phaser.Geom.Rectangle(0, 0, 80, 30), Phaser.Geom.Rectangle.Contains);
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
    if (!currentPlayer) {
      this.isProcessingTurn = false;
      return;
    }

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

    AudioEngine.sfx('move');
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
      AudioEngine.playMusic('victory');

      const W = this.cameras.main.width;
      const H = this.cameras.main.height;
      const centerX = W / 2;
      const centerY = H / 2;

      const overlay = this.add.graphics();
      overlay.fillStyle(0x000000, 0.8);
      overlay.fillRect(0, 0, W, H);
      overlay.setDepth(1000);

      // Pixel confetti rain
      const confettiColors = [0x5b6ee1, 0x99e550, 0xfbf236, 0xd95763, 0xbb9af7, 0xff9e64];
      for (let i = 0; i < 40; i++) {
        const piece = this.add.rectangle(
          Math.random() * W,
          -20 - Math.random() * H,
          6,
          6,
          confettiColors[i % confettiColors.length]
        );
        piece.setDepth(1000);
        this.tweens.add({
          targets: piece,
          y: H + 20,
          angle: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2500 + Math.random() * 2500,
          delay: Math.random() * 1500,
          repeat: -1,
          onRepeat: () => {
            piece.y = -20;
            piece.x = Math.random() * W;
          },
        });
      }

      // Winner's character takes a bow
      const winnerSprite = this.add.image(centerX, centerY - 130, winner.character.id);
      winnerSprite.setScale(this.portrait ? 0.11 : 0.13);
      winnerSprite.setDepth(1001);
      setFacing(winnerSprite, 'center');
      this.tweens.add({
        targets: winnerSprite,
        y: centerY - 145,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: 'Quad.easeOut',
      });

      const gameOverSize = this.portrait ? '24px' : '32px';
      const winnerSize = this.portrait ? '14px' : '20px';

      this.add
        .text(centerX, centerY - 40, 'GAME OVER!', {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: gameOverSize,
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(1001);

      const winText = this.add
        .text(centerX, centerY + 20, `${winner.name} WINS!`, {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: winnerSize,
          color: '#99e550',
        })
        .setOrigin(0.5)
        .setDepth(1001);

      this.tweens.add({
        targets: winText,
        scale: 1.1,
        duration: 400,
        yoyo: true,
        repeat: -1,
      });

      this.add
        .text(centerX, centerY + 80, actionPrompt('TAP TO CONTINUE', 'Press SPACE to return to menu'), {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '10px',
          color: '#ffffff',
        })
        .setOrigin(0.5)
        .setDepth(1001);

      // Small delay so an accidental tap from the last action doesn't skip it
      this.time.delayedCall(800, () => {
        this.input.keyboard?.once('keydown-SPACE', () => {
          this.scene.start('MenuScene');
        });

        this.input.once('pointerdown', () => {
          this.scene.start('MenuScene');
        });
      });
    }
  }


  // Helper methods
  private logAction(playerName: string, action: string): void {
    if (this.turnLog) {
      const player = this.playerManager?.getPlayers().find((p) => p.name === playerName);
      const color = player
        ? '#' + player.color.toString(16).padStart(6, '0')
        : '#fbf236'; // GAME / CHAOS events
      this.turnLog.addEntry(playerName, action, color);
    }
  }

  private showLightningRoundIndicator(): void {
    this.lightningRoundText = this.add.text(
      this.cameras.main.width / 2,
      this.portrait ? 48 : 38,
      '⚡ LIGHTNING ROUND',
      {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: this.portrait ? '9px' : '8px',
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

    AudioEngine.sfx('lightning');
    this.cameras.main.flash(400, 251, 242, 54);
  }

  private cardLabel(type: CardType): string {
    switch (type) {
      case 'judge-jury': return 'JUDGE OR JURY';
      case 'summon-exile': return 'SUMMON OR EXILE';
      case 'resurrect-reap': return 'RESURRECT OR REAP';
      case 'chaos': return 'CHAOS';
    }
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

    this.logAction(player.name, `Drew ${this.cardLabel(card.type)}`);
    await this.playCardFlyInAnimation(player, card);

    if (card.type === 'chaos') {
      // Per the rules, the drawer doesn't choose — they pick a target,
      // and the TARGET decides between CAN and BALL.
      await this.handleChaosCard(player.id);
    } else {
      const choice = await this.showCardChoice(player.id, card);
      if (choice) {
        await this.executeCardChoice(player.id, choice);
      }
    }

    // Return the card so the deck can reshuffle when it runs dry
    this.cardDeck.discardCard(card);
  }

  // Card flies in face-down, flips to reveal its type, then fades out
  private async playCardFlyInAnimation(player: Player, card: Card): Promise<void> {
    AudioEngine.sfx('cardDraw');

    return new Promise<void>((resolve) => {
      const W = this.cameras.main.width;
      const deckX = W / 2;
      const deckY = -60;

      const cardW = 150;
      const cardH = 100;
      const cardGraphics = this.add.graphics();
      cardGraphics.fillStyle(0x1a1a2e, 1);
      cardGraphics.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);
      cardGraphics.lineStyle(3, 0xbb9af7, 1);
      cardGraphics.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, 8);

      const faceText = this.add.text(0, -10, '?', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '24px',
        color: '#bb9af7',
        align: 'center',
        wordWrap: { width: cardW - 16 },
      });
      faceText.setOrigin(0.5);

      const drawnByText = this.add.text(0, 32, player.name, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '7px',
        color: '#ffffff',
      });
      drawnByText.setOrigin(0.5);

      const cardContainer = this.add.container(deckX, deckY);
      cardContainer.add([cardGraphics, faceText, drawnByText]);
      cardContainer.setDepth(500);
      cardContainer.setAlpha(0);

      this.tweens.add({
        targets: cardContainer,
        y: this.cameras.main.height / 2,
        alpha: 1,
        duration: 500,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Flip: squash horizontally, swap the face, expand back
          this.tweens.add({
            targets: cardContainer,
            scaleX: 0,
            duration: 150,
            ease: 'Quad.easeIn',
            onComplete: () => {
              AudioEngine.sfx('cardReveal');
              faceText.setText(this.cardLabel(card.type));
              faceText.setFontSize(card.type === 'chaos' ? 16 : 10);
              faceText.setColor(card.type === 'chaos' ? '#ff00ff' : '#ffcc00');
              this.tweens.add({
                targets: cardContainer,
                scaleX: 1,
                duration: 150,
                ease: 'Quad.easeOut',
                onComplete: () => {
                  this.tweens.add({
                    targets: cardContainer,
                    scale: 1.15,
                    alpha: 0,
                    duration: 300,
                    delay: 700,
                    ease: 'Power2',
                    onComplete: () => {
                      cardContainer.destroy();
                      resolve();
                    },
                  });
                },
              });
            },
          });
        },
      });
    });
  }

  // Transient center-screen announcement (non-blocking dialogs for AI actions)
  private showBanner(text: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const banner = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 40, text, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '12px',
        color: '#ffcc00',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
        wordWrap: { width: this.cameras.main.width - 80 },
      }).setOrigin(0.5).setDepth(900).setAlpha(0);

      this.tweens.add({
        targets: banner,
        alpha: 1,
        duration: 200,
        onComplete: () => {
          this.tweens.add({
            targets: banner,
            alpha: 0,
            duration: 300,
            delay: 1100,
            onComplete: () => {
              banner.destroy();
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
    }

    return card.optionA;
  }

  private async executeCardChoice(playerId: string, choice: CardChoice): Promise<void> {
    if (!this.cardSystem || !this.playerManager) return;

    const player = this.playerManager.getPlayer(playerId);
    if (!player) return;

    console.log(`${player.name} chose: ${choice}`);
    this.logAction(player.name, `Chose ${choice.toUpperCase()}`);

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
              AudioEngine.sfx('death');
              this.logAction(affected.name, 'ELIMINATED!');
            } else {
              piece.show();
            }
          }

          if (!affected.isEliminated) {
            if (choice === 'exile') AudioEngine.sfx('jail');
            if (choice === 'resurrect') AudioEngine.sfx('resurrect');
            if (choice === 'summon' || choice === 'exile' || choice === 'resurrect') {
              await this.updatePiecePosition(affectedId);
            }
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

  private async handleChaosCard(playerId: string): Promise<void> {
    if (!this.playerManager) return;

    const player = this.playerManager.getPlayer(playerId);
    if (!player) return;

    const targets = this.playerManager.getAllPlayers().filter(p => p.id !== playerId && !p.isEliminated);
    const targetId = await this.selectTarget(player, `${player.name} drew CHAOS! Choose a target`, targets);

    if (!targetId) return;

    const target = this.playerManager.getPlayer(targetId);
    if (!target) return;

    // The TARGET chooses their role: wear the can, or take the ball
    const role = await this.chaosRoleChoice(player, target);
    if (!role) return;

    const thrower = role === 'can' ? player : target;
    const defender = role === 'can' ? target : player;
    const distance = this.calculateChaosDistance(player, target);

    // POV: if the human throws, they aim (BALL view). If the human defends
    // against an AI thrower, first-person CAN view. AI vs AI: spectate the throw.
    const perspective: 'ball' | 'can' = !thrower.isAI ? 'ball' : !defender.isAI ? 'can' : 'ball';

    this.logAction(target.name, `Chose the ${role === 'can' ? 'CAN' : 'BALL'}!`);
    this.logAction('CHAOS', `${thrower.name} throws at ${defender.name} (dist: ${distance})`);

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
        throwerAimSkill: thrower.character.aimSkill ?? 0.5,
        perspective,
      });
    });

    this.scene.resume();
    AudioEngine.playMusic('game');

    this.applyChaosResult(result);
  }

  private async chaosRoleChoice(drawer: Player, target: Player): Promise<'can' | 'ball' | null> {
    const roleCard: Card = {
      type: 'chaos',
      optionA: 'can',
      optionB: 'ball',
      descriptionA: `Wear the can. ${drawer.name} throws at you.`,
      descriptionB: `Take the ball and throw at ${drawer.name}.`,
    };

    if (target.isAI) {
      // Confident throwers take the ball; everyone else risks the can
      const role = (target.character.aimSkill ?? 0.5) > 0.6 ? 'ball' : 'can';
      await this.showBanner(`${target.name} chooses the ${role.toUpperCase()}!`);
      return role;
    }

    return new Promise((resolve) => {
      new CardDialog(this, {
        type: 'chooseCard',
        card: roleCard,
        title: 'CHAOS!',
        message: `${drawer.name} targeted you!\nChoose your fate:`,
        onOptionSelected: (option: 'A' | 'B') => {
          resolve(option === 'A' ? 'can' : 'ball');
        },
      });
    });
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

    AudioEngine.sfx('death');
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
