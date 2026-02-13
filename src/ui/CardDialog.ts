import Phaser from 'phaser';
import { Card, Player } from '../types/game.types';

export type CardDialogType = 'chooseCard' | 'selectTarget' | 'chaosShowdown' | 'message' | 'aiCardChoice';

export interface CardDialogConfig {
  type: CardDialogType;
  card?: Card;
  message: string;
  players?: Player[];
  onPlayerSelected?: (playerId: string) => void;
  onOptionSelected?: (option: 'A' | 'B') => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  isAI?: boolean; // For AI progress bar mode
  aiChoice?: 'A' | 'B'; // Which option AI will choose
  onPause?: () => void;
  onProceed?: () => void;
  optionADisabled?: boolean; // Whether option A is disabled
  optionBDisabled?: boolean; // Whether option B is disabled
  disabledReason?: string; // Reason why option is disabled
}

export class CardDialog extends Phaser.GameObjects.Container {
  private config: CardDialogConfig;
  private progressBar: Phaser.GameObjects.Graphics | null = null;
  private isPaused: boolean = false;
  private progressTimer: Phaser.Time.TimerEvent | null = null;
  private currentProgress: number = 0;

  constructor(scene: Phaser.Scene, config: CardDialogConfig) {
    super(scene, scene.cameras.main.width / 2, scene.cameras.main.height / 2);
    this.config = config;

    scene.add.existing(this);
    this.setDepth(1000); // Always on top

    this.createDialog();
  }

  private createDialog(): void {
    // Semi-transparent overlay
    const overlay = this.scene.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(
      -this.scene.cameras.main.width / 2,
      -this.scene.cameras.main.height / 2,
      this.scene.cameras.main.width,
      this.scene.cameras.main.height
    );
    this.add(overlay);

    // Dialog background
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRoundedRect(-250, -200, 500, 400, 16);
    bg.lineStyle(4, 0xbb9af7, 1);
    bg.strokeRoundedRect(-250, -200, 500, 400, 16);
    this.add(bg);

    // Render content based on type
    switch (this.config.type) {
      case 'chooseCard':
        this.createChooseCardDialog();
        break;
      case 'aiCardChoice':
        this.createAICardChoiceDialog();
        break;
      case 'selectTarget':
        this.createSelectTargetDialog();
        break;
      case 'chaosShowdown':
        this.createChaosShowdownDialog();
        break;
      case 'message':
        this.createMessageDialog();
        break;
    }
  }

  private createChooseCardDialog(): void {
    if (!this.config.card) return;

    const card = this.config.card;

    // Title
    const title = this.scene.add.text(0, -160, 'CARD DRAWN!', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '14px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    this.add(title);

    // Card type
    const cardTypeText = this.scene.add.text(0, -120, card.type.toUpperCase(), {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    cardTypeText.setOrigin(0.5);
    this.add(cardTypeText);

    // Message
    const message = this.scene.add.text(0, -80, this.config.message, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '7px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 450 },
    });
    message.setOrigin(0.5);
    this.add(message);

    // Option A button (left)
    this.createOptionButton(
      -120,
      20,
      `${card.optionA.toUpperCase()}`,
      card.descriptionA,
      () => {
        if (this.config.onOptionSelected) this.config.onOptionSelected('A');
        this.destroy();
      },
      0x5b6ee1,
      this.config.optionADisabled
    );

    // Option B button (right)
    this.createOptionButton(
      120,
      20,
      `${card.optionB.toUpperCase()}`,
      card.descriptionB,
      () => {
        if (this.config.onOptionSelected) this.config.onOptionSelected('B');
        this.destroy();
      },
      0xd95763,
      this.config.optionBDisabled
    );
  }

  private createAICardChoiceDialog(): void {
    if (!this.config.card || !this.config.aiChoice) return;

    const card = this.config.card;
    const aiChoice = this.config.aiChoice;

    // Title
    const title = this.scene.add.text(0, -160, 'AI CARD DRAWN!', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '14px',
      color: '#ff9e64',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    this.add(title);

    // Card type
    const cardTypeText = this.scene.add.text(0, -120, card.type.toUpperCase(), {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    cardTypeText.setOrigin(0.5);
    this.add(cardTypeText);

    // Message
    const message = this.scene.add.text(0, -80, this.config.message, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '7px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 450 },
    });
    message.setOrigin(0.5);
    this.add(message);

    // Option A button (left) - non-interactive
    const optionAColor = aiChoice === 'A' ? 0x5b6ee1 : 0x444444;
    this.createStaticOptionButton(
      -120,
      20,
      `${card.optionA.toUpperCase()}`,
      card.descriptionA,
      optionAColor,
      aiChoice === 'A'
    );

    // Option B button (right) - non-interactive
    const optionBColor = aiChoice === 'B' ? 0xd95763 : 0x444444;
    this.createStaticOptionButton(
      120,
      20,
      `${card.optionB.toUpperCase()}`,
      card.descriptionB,
      optionBColor,
      aiChoice === 'B'
    );

    // Progress bar at bottom
    this.createProgressBar();

    // Control buttons (bottom right)
    this.createControlButtons();

    // Start the progress timer
    this.startProgressTimer();
  }

  private createStaticOptionButton(
    x: number,
    y: number,
    title: string,
    description: string,
    color: number,
    isSelected: boolean
  ): void {
    const container = this.scene.add.container(x, y);
    const optW = 200;
    const optH = 160;
    const optHalfW = optW / 2;
    const optHalfH = optH / 2;

    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-optHalfW, -optHalfH, optW, optH, 12);
    bg.lineStyle(isSelected ? 4 : 2, isSelected ? 0xffff00 : 0x666666, 1);
    bg.strokeRoundedRect(-optHalfW, -optHalfH, optW, optH, 12);
    container.add(bg);

    const titleText = this.scene.add.text(0, -45, title, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    titleText.setOrigin(0.5);
    container.add(titleText);

    const descText = this.scene.add.text(0, 10, description, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '7px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 180 },
    });
    descText.setOrigin(0.5);
    container.add(descText);

    // Add blinking effect to selected option (starts at 3s)
    if (isSelected) {
      container.setName('selected-option');
    }

    this.add(container);
  }

  private createProgressBar(): void {
    const barWidth = 460;
    const barHeight = 20;
    const barY = 150;

    // Background bar
    const bgBar = this.scene.add.graphics();
    bgBar.fillStyle(0x333333, 1);
    bgBar.fillRoundedRect(-barWidth / 2, barY, barWidth, barHeight, 4);
    this.add(bgBar);

    // Progress bar (will be animated)
    this.progressBar = this.scene.add.graphics();
    this.add(this.progressBar);
  }

  private createControlButtons(): void {
    // Pause button
    const pauseBtn = this.createSmallButton(160, 180, '⏸', () => {
      this.togglePause();
    }, 0xbb9af7);
    pauseBtn.setName('pause-btn');

    // Proceed button
    this.createSmallButton(210, 180, '→', () => {
      if (this.config.onProceed) {
        this.config.onProceed();
      }
      this.cleanup();
      this.destroy();
    }, 0x99e550);
  }

  private createSmallButton(
    x: number,
    y: number,
    label: string,
    onClick: () => void,
    color: number
  ): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-25, -20, 50, 40, 8);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(-25, -20, 50, 40, 8);
    container.add(bg);

    const text = this.scene.add.text(0, 0, label, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '14px',
      color: '#ffffff',
    });
    text.setOrigin(0.5);
    container.add(text);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-25, -20, 50, 40),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 0.8);
      bg.fillRoundedRect(-25, -20, 50, 40, 8);
      bg.lineStyle(3, 0xffff00, 1);
      bg.strokeRoundedRect(-25, -20, 50, 40, 8);
    });

    container.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-25, -20, 50, 40, 8);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRoundedRect(-25, -20, 50, 40, 8);
    });

    container.on('pointerdown', onClick);

    this.add(container);
    return container;
  }

  private startProgressTimer(): void {
    const totalDuration = 8000; // 8 seconds
    const blinkTime = 3000; // Blink at 3 seconds

    this.progressTimer = this.scene.time.addEvent({
      delay: 50,
      callback: () => {
        if (!this.isPaused) {
          this.currentProgress += 50;

          // Update progress bar
          this.updateProgressBar(this.currentProgress / totalDuration);

          // Start blinking at 3 seconds
          if (this.currentProgress >= blinkTime && this.currentProgress < blinkTime + 100) {
            this.startSelectedOptionBlink();
          }

          // Auto-proceed at 8 seconds
          if (this.currentProgress >= totalDuration) {
            if (this.config.onProceed) {
              this.config.onProceed();
            }
            this.cleanup();
            this.destroy();
          }
        }
      },
      loop: true,
    });
  }

  private updateProgressBar(progress: number): void {
    if (!this.progressBar) return;

    const barWidth = 460;
    const barHeight = 20;
    const barY = 150;

    this.progressBar.clear();
    this.progressBar.fillStyle(0x99e550, 1);
    this.progressBar.fillRoundedRect(
      -barWidth / 2,
      barY,
      barWidth * progress,
      barHeight,
      4
    );
  }

  private startSelectedOptionBlink(): void {
    const selected = this.getByName('selected-option') as Phaser.GameObjects.Container;
    if (selected) {
      this.scene.tweens.add({
        targets: selected,
        alpha: 0.3,
        duration: 300,
        yoyo: true,
        repeat: 3,
      });
    }
  }

  private togglePause(): void {
    this.isPaused = !this.isPaused;

    const pauseBtn = this.getByName('pause-btn') as Phaser.GameObjects.Container;
    if (pauseBtn) {
      const text = pauseBtn.getAt(1) as Phaser.GameObjects.Text;
      text.setText(this.isPaused ? '▶' : '⏸');
    }

    if (this.config.onPause) {
      this.config.onPause();
    }
  }

  private cleanup(): void {
    if (this.progressTimer) {
      this.progressTimer.destroy();
      this.progressTimer = null;
    }
  }

  destroy(fromScene?: boolean): void {
    this.cleanup();
    super.destroy(fromScene);
  }

  private createMessageDialog(): void {
    // Title based on message
    const title = this.scene.add.text(0, -80, this.config.message, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: 450 },
    });
    title.setOrigin(0.5);
    this.add(title);

    // OK button
    this.createButton(0, 80, 'OK', () => {
      if (this.config.onConfirm) this.config.onConfirm();
      this.destroy();
    });
  }

  private createSelectTargetDialog(): void {
    // Title
    const title = this.scene.add.text(0, -160, 'SELECT TARGET', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '12px',
      color: '#ff5555',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    this.add(title);

    // Message
    const message = this.scene.add.text(0, -120, this.config.message, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 450 },
    });
    message.setOrigin(0.5);
    this.add(message);

    // Player selection buttons
    if (this.config.players) {
      const startY = -60;
      const spacing = 45;

      this.config.players.forEach((player, index) => {
        const y = startY + index * spacing;
        this.createPlayerButton(0, y, player, () => {
          if (this.config.onPlayerSelected) {
            this.config.onPlayerSelected(player.id);
          }
          this.destroy();
        });
      });
    }

    // Cancel button
    this.createButton(0, 160, 'CANCEL', () => {
      if (this.config.onCancel) this.config.onCancel();
      this.destroy();
    }, 0x888888);
  }

  private createOptionButton(
    x: number,
    y: number,
    title: string,
    description: string,
    onClick: () => void,
    color: number,
    isDisabled: boolean = false
  ): void {
    const container = this.scene.add.container(x, y);

    // Button background (larger for card-style)
    const optW = 200;
    const optH = 160;
    const optHalfW = optW / 2;
    const optHalfH = optH / 2;

    const bg = this.scene.add.graphics();
    const finalColor = isDisabled ? 0x444444 : color;
    const finalAlpha = isDisabled ? 0.5 : 1;

    bg.fillStyle(finalColor, finalAlpha);
    bg.fillRoundedRect(-optHalfW, -optHalfH, optW, optH, 12);
    bg.lineStyle(isDisabled ? 2 : 3, isDisabled ? 0x666666 : 0xffffff, 1);
    bg.strokeRoundedRect(-optHalfW, -optHalfH, optW, optH, 12);
    container.add(bg);

    // Title
    const titleText = this.scene.add.text(0, -45, title, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: isDisabled ? '#666666' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    });
    titleText.setOrigin(0.5);
    container.add(titleText);

    // Description
    const descText = this.scene.add.text(0, 10, description, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '7px',
      color: isDisabled ? '#666666' : '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 180 },
    });
    descText.setOrigin(0.5);
    container.add(descText);

    // Add "DISABLED" overlay if disabled
    if (isDisabled) {
      const disabledText = this.scene.add.text(0, 65, 'UNAVAILABLE', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '6px',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 2,
        align: 'center',
      });
      disabledText.setOrigin(0.5);
      container.add(disabledText);
    }

    // Only make interactive if not disabled
    if (!isDisabled) {
      container.setInteractive(
        new Phaser.Geom.Rectangle(-optHalfW, -optHalfH, optW, optH),
        Phaser.Geom.Rectangle.Contains
      );

      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(color, 0.8);
        bg.fillRoundedRect(-optHalfW, -optHalfH, optW, optH, 12);
        bg.lineStyle(4, 0xffff00, 1);
        bg.strokeRoundedRect(-optHalfW, -optHalfH, optW, optH, 12);
        container.setScale(1.05);
      });

      container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(color, 1);
        bg.fillRoundedRect(-optHalfW, -optHalfH, optW, optH, 12);
        bg.lineStyle(3, 0xffffff, 1);
        bg.strokeRoundedRect(-optHalfW, -optHalfH, optW, optH, 12);
        container.setScale(1.0);
      });

      container.on('pointerdown', onClick);
    }

    this.add(container);
  }

  private createChaosShowdownDialog(): void {
    // Title with animation
    const title = this.scene.add.text(0, -160, 'CHAOS SHOWDOWN!', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '14px',
      color: '#ff00ff',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    this.add(title);

    // Pulsing animation
    this.scene.tweens.add({
      targets: title,
      scale: 1.2,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    // Message
    const message = this.scene.add.text(0, -80, this.config.message, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
      wordWrap: { width: 450 },
    });
    message.setOrigin(0.5);
    this.add(message);

    // This will be populated by GameScene with die roll results
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    color: number = 0xbb9af7
  ): void {
    const button = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-80, -20, 160, 40, 8);
    bg.lineStyle(2, 0xffffff, 1);
    bg.strokeRoundedRect(-80, -20, 160, 40, 8);
    button.add(bg);

    const btnText = this.scene.add.text(0, 0, text, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffffff',
    });
    btnText.setOrigin(0.5);
    button.add(btnText);

    button.setInteractive(
      new Phaser.Geom.Rectangle(-80, -20, 160, 40),
      Phaser.Geom.Rectangle.Contains
    );

    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(color, 0.8);
      bg.fillRoundedRect(-80, -20, 160, 40, 8);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRoundedRect(-80, -20, 160, 40, 8);
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(-80, -20, 160, 40, 8);
      bg.lineStyle(2, 0xffffff, 1);
      bg.strokeRoundedRect(-80, -20, 160, 40, 8);
    });

    button.on('pointerdown', onClick);

    this.add(button);
  }

  private createPlayerButton(
    x: number,
    y: number,
    player: Player,
    onClick: () => void
  ): void {
    const button = this.scene.add.container(x, y);

    const bg = this.scene.add.graphics();
    bg.fillStyle(0x444444, 1);
    bg.fillRoundedRect(-210, -19, 420, 38, 8);
    bg.lineStyle(2, player.color, 1);
    bg.strokeRoundedRect(-210, -19, 420, 38, 8);
    button.add(bg);

    const btnText = this.scene.add.text(0, 0, `${player.name} - Lives: ${player.lives}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
    });
    btnText.setOrigin(0.5);
    button.add(btnText);

    button.setInteractive(
      new Phaser.Geom.Rectangle(-210, -19, 420, 38),
      Phaser.Geom.Rectangle.Contains
    );

    button.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(player.color, 0.3);
      bg.fillRoundedRect(-210, -19, 420, 38, 8);
      bg.lineStyle(3, player.color, 1);
      bg.strokeRoundedRect(-210, -19, 420, 38, 8);
    });

    button.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x444444, 1);
      bg.fillRoundedRect(-210, -19, 420, 38, 8);
      bg.lineStyle(2, player.color, 1);
      bg.strokeRoundedRect(-210, -19, 420, 38, 8);
    });

    button.on('pointerdown', onClick);

    this.add(button);
  }

  addDieRollResult(playerName: string, rollValue: number, y: number): void {
    const resultText = this.scene.add.text(0, y, `${playerName}: ${rollValue}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffcc00',
      stroke: '#000000',
      strokeThickness: 3,
    });
    resultText.setOrigin(0.5);
    this.add(resultText);
  }

  addContinueButton(onClick: () => void): void {
    this.createButton(0, 160, 'CONTINUE', onClick, 0x99e550);
  }
}
