import Phaser from 'phaser';

export interface TurnLogEntry {
  playerName: string;
  action: string;
  timestamp: number;
}

export class TurnLog extends Phaser.GameObjects.Container {
  private entries: TurnLogEntry[] = [];
  private maxEntries: number = 10;
  private entryHeight: number = 30;
  private logTexts: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    scene.add.existing(this);

    this.createLogBackground(width, height);
    this.createTitle(width);
  }

  private createLogBackground(width: number, height: number): void {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x1a1a2e, 0.9);
    bg.fillRoundedRect(0, 0, width, height, 8);
    bg.lineStyle(2, 0xbb9af7, 1);
    bg.strokeRoundedRect(0, 0, width, height, 8);
    this.add(bg);
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

  addEntry(playerName: string, action: string): void {
    const entry: TurnLogEntry = {
      playerName,
      action,
      timestamp: Date.now(),
    };

    this.entries.push(entry); // Add to end (newest at bottom)

    // Limit entries - keep last 10
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    this.refreshDisplay();
  }

  private refreshDisplay(): void {
    // Clear old text objects
    this.logTexts.forEach(text => text.destroy());
    this.logTexts = [];

    // Create new text objects
    this.entries.forEach((entry, index) => {
      const y = 40 + (index * this.entryHeight);

      // Player name (colored)
      const nameText = this.scene.add.text(10, y, `${entry.playerName}:`, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '6px',
        color: '#99e550',
        stroke: '#000000',
        strokeThickness: 1,
      });
      this.logTexts.push(nameText);
      this.add(nameText);

      // Action text (wrapped)
      const actionText = this.scene.add.text(10, y + 10, entry.action, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '5px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
        wordWrap: { width: 170 },
      });
      this.logTexts.push(actionText);
      this.add(actionText);

      // Fade older entries (reverse - older at top, newer at bottom)
      const entriesFromEnd = this.entries.length - 1 - index;
      const alpha = Math.max(0.3, 1 - (entriesFromEnd * 0.1));
      nameText.setAlpha(alpha);
      actionText.setAlpha(alpha);
    });
  }

  clear(): void {
    this.entries = [];
    this.refreshDisplay();
  }
}
