import Phaser from 'phaser';
import AudioEngine from '../audio/AudioEngine';

export interface TurnLogEntry {
  playerName: string;
  action: string;
  color: string; // name color (player color, or yellow for GAME events)
}

const PANEL_BG = 0x1a1a2e;
const PURPLE = 0xbb9af7;

// Action text color by content (mirrors the design's bad/warn modifiers)
function actionColor(action: string): string {
  if (/ELIMINATED|Lost|JAIL|Jail|eliminated/i.test(action)) return '#f08070';
  if (/LIGHTNING/i.test(action)) return '#fbf236';
  return '#ddffee';
}

export class TurnLog extends Phaser.GameObjects.Container {
  private entries: TurnLogEntry[] = [];
  private maxEntries: number;
  private logTexts: Phaser.GameObjects.Text[] = [];
  private portrait: boolean;
  private bg: Phaser.GameObjects.Graphics | null = null;
  private toggleBtn: Phaser.GameObjects.Text | null = null;
  private logWidth: number;
  private logHeight: number;

  // Portrait strip geometry
  private readonly STRIP_H = 96;
  private readonly STRIP_ROWS = 3;

  // Full-log overlay (portrait)
  private overlay: Phaser.GameObjects.Container | null = null;
  private overlayTexts: Phaser.GameObjects.Text[] = [];

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
    this.logHeight = portrait ? this.STRIP_H : height;
    this.maxEntries = portrait ? 30 : 10;

    this.createLogBackground(this.logWidth, this.logHeight);
    this.createTitle();

    if (portrait) {
      this.createToggleButton();
    }
  }

  private createLogBackground(width: number, height: number): void {
    if (this.bg) {
      this.bg.destroy();
    }
    this.bg = this.scene.add.graphics();
    this.bg.fillStyle(PANEL_BG, 0.92);
    this.bg.fillRoundedRect(0, 0, width, height, 8);
    this.bg.lineStyle(2, PURPLE, 1);
    this.bg.strokeRoundedRect(0, 0, width, height, 8);
    this.add(this.bg);
    this.sendToBack(this.bg);
  }

  private createTitle(): void {
    const fontSize = this.portrait ? '10px' : '8px';
    const title = this.scene.add.text(this.portrait ? 12 : this.logWidth / 2, this.portrait ? 16 : 15, 'TURN LOG', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize,
      color: '#bb9af7',
      stroke: '#000000',
      strokeThickness: 2,
    });
    title.setOrigin(this.portrait ? 0 : 0.5, this.portrait ? 0.5 : 0);
    this.add(title);
  }

  private createToggleButton(): void {
    this.toggleBtn = this.scene.add.text(this.logWidth - 24, 16, '[+]', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '11px',
      color: '#bb9af7',
      stroke: '#000000',
      strokeThickness: 1,
    });
    this.toggleBtn.setOrigin(0.5);
    // Generous hit area for thumbs
    this.toggleBtn.setInteractive(
      new Phaser.Geom.Rectangle(-18, -18, this.toggleBtn.width + 36, this.toggleBtn.height + 36),
      Phaser.Geom.Rectangle.Contains
    );
    this.toggleBtn.on('pointerdown', () => {
      AudioEngine.sfx('click');
      this.openOverlay();
    });
    this.add(this.toggleBtn);
  }

  addEntry(playerName: string, action: string, color: string = '#99e550'): void {
    this.entries.push({ playerName, action, color });

    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(-this.maxEntries);
    }

    this.refreshDisplay();
  }

  private refreshDisplay(): void {
    this.logTexts.forEach((text) => text.destroy());
    this.logTexts = [];

    if (this.portrait) {
      this.refreshPortraitStrip();
    } else {
      this.refreshLandscape();
    }
  }

  // Portrait collapsed strip: the last 3 entries, one line each
  private refreshPortraitStrip(): void {
    const visible = this.entries.slice(-this.STRIP_ROWS);
    visible.forEach((entry, index) => {
      const y = 36 + index * 19;

      const nameText = this.scene.add.text(12, y, `${entry.playerName}:`, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '9px',
        color: entry.color,
        stroke: '#000000',
        strokeThickness: 1,
      });
      this.logTexts.push(nameText);
      this.add(nameText);

      const actionText = this.scene.add.text(20 + nameText.width, y, entry.action, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '9px',
        color: actionColor(entry.action),
        stroke: '#000000',
        strokeThickness: 1,
        wordWrap: { width: this.logWidth - nameText.width - 40 },
        maxLines: 1,
      });
      this.logTexts.push(actionText);
      this.add(actionText);
    });
  }

  // Portrait expanded: full log floating over the board + players
  private openOverlay(): void {
    if (this.overlay) return;

    const cam = this.scene.cameras.main;
    const W = cam.width;
    const H = cam.height;
    const top = 64;            // just under the title bar
    const bottom = H - 105;    // just above the controls

    const overlay = this.scene.add.container(0, 0);
    overlay.setDepth(950);

    // Scrim — tapping it closes the overlay
    const scrim = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x080810, 0.86);
    scrim.setInteractive();
    scrim.on('pointerdown', () => this.closeOverlay());
    overlay.add(scrim);

    // Panel
    const panelX = 14;
    const panelY = top;
    const panelW = W - 28;
    const panelH = bottom - top;
    const panel = this.scene.add.graphics();
    panel.fillStyle(PANEL_BG, 0.97);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 8);
    panel.lineStyle(2, PURPLE, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 8);
    overlay.add(panel);

    const title = this.scene.add.text(panelX + 12, panelY + 20, 'TURN LOG — FULL', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '11px',
      color: '#bb9af7',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);
    overlay.add(title);

    const closeBtn = this.scene.add.text(panelX + panelW - 22, panelY + 20, '[-]', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '12px',
      color: '#bb9af7',
    }).setOrigin(0.5);
    closeBtn.setInteractive(
      new Phaser.Geom.Rectangle(-18, -18, closeBtn.width + 36, closeBtn.height + 36),
      Phaser.Geom.Rectangle.Contains
    );
    closeBtn.on('pointerdown', () => {
      AudioEngine.sfx('click');
      this.closeOverlay();
    });
    overlay.add(closeBtn);

    // Entries with a 2-digit index tick
    const rowH = 26;
    const maxRows = Math.floor((panelH - 56) / rowH);
    const shown = this.entries.slice(-maxRows);
    const startIndex = this.entries.length - shown.length;

    shown.forEach((entry, i) => {
      const y = panelY + 46 + i * rowH;

      const tick = this.scene.add.text(panelX + 12, y, String(startIndex + i + 1).padStart(2, '0'), {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#5b5b75',
      });
      overlay.add(tick);
      this.overlayTexts.push(tick);

      const nameText = this.scene.add.text(panelX + 40, y, `${entry.playerName}:`, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '10px',
        color: entry.color,
        stroke: '#000000',
        strokeThickness: 1,
      });
      overlay.add(nameText);
      this.overlayTexts.push(nameText);

      const actionText = this.scene.add.text(panelX + 48 + nameText.width, y, entry.action, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '10px',
        color: actionColor(entry.action),
        stroke: '#000000',
        strokeThickness: 1,
        wordWrap: { width: panelW - nameText.width - 70 },
        maxLines: 1,
      });
      overlay.add(actionText);
      this.overlayTexts.push(actionText);
    });

    overlay.setAlpha(0);
    this.scene.tweens.add({ targets: overlay, alpha: 1, duration: 150 });

    this.overlay = overlay;
    if (this.toggleBtn) this.toggleBtn.setText('[-]');
  }

  private closeOverlay(): void {
    if (!this.overlay) return;
    const overlay = this.overlay;
    this.overlay = null;
    this.overlayTexts = [];
    this.scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration: 120,
      onComplete: () => overlay.destroy(),
    });
    if (this.toggleBtn) this.toggleBtn.setText('[+]');
  }

  // Entries stack by their real (wrapped) heights and never overflow the
  // panel: newest entries win, older ones drop off the top.
  private refreshLandscape(): void {
    const topPad = 36;
    const bottomPad = 12;
    const gap = 9;
    const available = this.logHeight - topPad - bottomPad;

    // Build newest-first until we run out of room
    const built: Array<{ name: Phaser.GameObjects.Text; action: Phaser.GameObjects.Text; h: number }> = [];
    let used = 0;
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const entry = this.entries[i];

      const nameText = this.scene.add.text(10, 0, `${entry.playerName}:`, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: entry.color,
        stroke: '#000000',
        strokeThickness: 1,
      });

      const actionText = this.scene.add.text(10, 0, entry.action, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '7px',
        color: actionColor(entry.action),
        stroke: '#000000',
        strokeThickness: 1,
        wordWrap: { width: this.logWidth - 24 },
      });

      const h = 12 + actionText.height + gap;
      if (used + h > available && built.length > 0) {
        nameText.destroy();
        actionText.destroy();
        break;
      }
      used += h;
      built.push({ name: nameText, action: actionText, h });
      if (used >= available) break;
    }

    // Lay out oldest → newest from the top
    built.reverse();
    let y = topPad;
    built.forEach((row, index) => {
      row.name.setY(y);
      row.action.setY(y + 12);
      y += row.h;

      const entriesFromEnd = built.length - 1 - index;
      const alpha = Math.max(0.35, 1 - entriesFromEnd * 0.1);
      row.name.setAlpha(alpha);
      row.action.setAlpha(alpha);

      this.logTexts.push(row.name, row.action);
      this.add(row.name);
      this.add(row.action);
    });
  }

  clear(): void {
    this.entries = [];
    this.refreshDisplay();
  }
}
