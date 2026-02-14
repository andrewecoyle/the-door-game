import Phaser from 'phaser';

export interface TurnLogEntry {
  playerName: string;
  action: string;
  timestamp: number;
}

export class TurnLog extends Phaser.GameObjects.Container {
  private entries: TurnLogEntry[] = [];
  private maxEntries: number = 10;
  private entryHeight: number = 34;
  private logTexts: Phaser.GameObjects.Text[] = [];
  private portrait: boolean;
  private collapsed: boolean = true;
  private toggleBtn: Phaser.GameObjects.Text | null = null;
  private bg: Phaser.GameObjects.Graphics | null = null;
  private logWidth: number;
  private logHeight: number;
  private readonly COLLAPSED_H = 40;
  private readonly EXPANDED_H = 180;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    portrait: boolean = false
  ) {
    super(scene, x, y);
    scene.add.existing(this);

    this.portrait = portrait;
    this.logWidth = width;
    this.logHeight = portrait ? this.COLLAPSED_H : height;

    this.createLogBackground(this.logWidth, this.logHeight);

    if (portrait) {
      this.createToggleButton();
    } else {
      this.createTitle(this.logWidth);
    }
  }

  private createLogBackground(width: number, height: number): void {
    if (this.bg) {
      this.bg.destroy();
    }
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(0x1a1a2e, 0.9);
    this.bg.fillRoundedRect(0, 0, width, height, 8);
    this.bg.lineStyle(2, 0xbb9af7, 1);
    this.bg.strokeRoundedRect(0, 0, width, height, 8);
    this.add(this.bg);
    this.sendToBack(this.bg);
  }

  private createTitle(width: number): void {
    const title = this.scene.add.text(width / 2, 15, 'TURN LOG', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#bb9af7',
      stroke: '#000000',
      strokeThickness: 2,
    });
    title.setOrigin(0.5, 0);
    this.add(title);
  }

  private createToggleButton(): void {
    this.toggleBtn = this.scene.add.text(this.logWidth - 30, 12, '[+]', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#bb9af7',
      stroke: '#000000',
      strokeThickness: 1,
    });
    this.toggleBtn.setOrigin(0.5);
    this.toggleBtn.setInteractive({ useHandCursor: true });
    this.toggleBtn.on('pointerdown', () => this.toggleCollapse());
    this.add(this.toggleBtn);
  }

  private toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    if (this.toggleBtn) {
      this.toggleBtn.setText(this.collapsed ? '[+]' : '[-]');
    }

    const newH = this.collapsed ? this.COLLAPSED_H : this.EXPANDED_H;
    this.logHeight = newH;
    this.createLogBackground(this.logWidth, newH);
    this.refreshDisplay();
  }

  addEntry(playerName: string, action: string): void {
    const entry: TurnLogEntry = {
      playerName,
      action,
      timestamp: Date.now(),
    };

    this.entries.push(entry);

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    this.refreshDisplay();
  }

  private refreshDisplay(): void {
    this.logTexts.forEach((text) => text.destroy());
    this.logTexts = [];

    if (this.portrait) {
      this.refreshPortrait();
    } else {
      this.refreshLandscape();
    }
  }

  private refreshPortrait(): void {
    if (this.entries.length === 0) return;

    if (this.collapsed) {
      // Show only the last entry as a single line
      const last = this.entries[this.entries.length - 1];
      const line = this.scene.add.text(
        10,
        12,
        `${last.playerName}: ${last.action}`,
        {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '6px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 1,
          wordWrap: { width: this.logWidth - 60 },
          maxLines: 1,
        }
      );
      line.setOrigin(0, 0.5);
      this.logTexts.push(line);
      this.add(line);
    } else {
      // Show last 5 entries
      const visible = this.entries.slice(-5);
      visible.forEach((entry, index) => {
        const y = 10 + index * 32;

        const nameText = this.scene.add.text(10, y, `${entry.playerName}:`, {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '7px',
          color: '#99e550',
          stroke: '#000000',
          strokeThickness: 1,
        });
        this.logTexts.push(nameText);
        this.add(nameText);

        const actionText = this.scene.add.text(10, y + 14, entry.action, {
          fontFamily: '"Press Start 2P", cursive',
          fontSize: '6px',
          color: '#ffffff',
          stroke: '#000000',
          strokeThickness: 1,
          wordWrap: { width: this.logWidth - 50 },
          maxLines: 1,
        });
        this.logTexts.push(actionText);
        this.add(actionText);
      });
    }
  }

  private refreshLandscape(): void {
    this.entries.forEach((entry, index) => {
      const y = 40 + index * this.entryHeight;

      const nameText = this.scene.add.text(10, y, `${entry.playerName}:`, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#99e550',
        stroke: '#000000',
        strokeThickness: 1,
      });
      this.logTexts.push(nameText);
      this.add(nameText);

      const actionText = this.scene.add.text(10, y + 12, entry.action, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '7px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
        wordWrap: { width: 170 },
      });
      this.logTexts.push(actionText);
      this.add(actionText);

      const entriesFromEnd = this.entries.length - 1 - index;
      const alpha = Math.max(0.3, 1 - entriesFromEnd * 0.1);
      nameText.setAlpha(alpha);
      actionText.setAlpha(alpha);
    });
  }

  clear(): void {
    this.entries = [];
    this.refreshDisplay();
  }
}
