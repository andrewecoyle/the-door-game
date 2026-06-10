import Phaser from 'phaser';
import { Player } from '../types/game.types';
import { Facing, setFacing } from '../utils/facing';
import { BoardCalculations } from '../utils/board-calculations';

const PURPLE = 0xbb9af7;
const AVATAR_BORDER = 0x3a3a52;
const HEART_ON = 0xd95763;
const HEART_OFF = 0x4a3a48;

export class PlayerHUD extends Phaser.GameObjects.Container {
  private players: Player[];
  private currentPlayerIndicator: Phaser.GameObjects.Graphics | null = null;
  private portrait: boolean;
  private readonly AVATAR_SIZE = 120;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  constructor(scene: Phaser.Scene, players: Player[], portrait: boolean = false) {
    super(scene, 0, 0);
    scene.add.existing(this);

    this.players = players;
    this.portrait = portrait;
    this.createHUD();
  }

  private createHUD(): void {
    if (this.portrait) {
      this.createPortraitHUD();
    } else {
      this.createLandscapeHUD();
    }
  }

  private createLandscapeHUD(): void {
    const topPlayers = this.players.slice(0, 4);
    const bottomPlayers = this.players.slice(4, 7);

    const topStartX = 150;
    const topY = 200;
    const topSpacing = 140;

    // Portraits on the left half face right (toward the board's center) and
    // vice versa, so the cast appears gathered around the board.
    topPlayers.forEach((player, index) => {
      const x = topStartX + index * topSpacing;
      this.createCharacterPortrait(player, x, topY, index < 2 ? 'right' : 'left');
    });

    const bottomStartX = 220;
    const bottomY = 420;

    bottomPlayers.forEach((player, index) => {
      const x = bottomStartX + index * topSpacing;
      this.createCharacterPortrait(player, x, bottomY, index < 2 ? 'right' : 'left');
    });
  }

  // ── Portrait: two vertical rails flanking the climb board ──
  // Left rail (top→bottom): Kingston, Innis, Fara, Miles.
  // Right rail (top→bottom): Gary Kent, Stacy, Paul.
  private createPortraitHUD(): void {
    const boardTop = BoardCalculations.PORTRAIT_TOP_TILE_Y;
    const boardBottom = boardTop + 20 * BoardCalculations.PORTRAIT_STEP;
    const span = boardBottom - boardTop;

    const leftRail = [this.players[3], this.players[2], this.players[1], this.players[0]];
    const rightRail = [this.players[4], this.players[5], this.players[6]];

    leftRail.forEach((player, i) => {
      const cy = boardTop + (span * (i + 0.5)) / leftRail.length;
      this.createRailCell(player, 105, cy, 'right');
    });

    rightRail.forEach((player, i) => {
      const cy = boardTop + (span * (i + 0.5)) / rightRail.length;
      this.createRailCell(player, 495, cy, 'left');
    });
  }

  private createRailCell(player: Player, x: number, cy: number, facing: Facing): void {
    const container = this.scene.add.container(x, cy);
    container.setName(`player-hud-${player.id}`);

    const size = this.AVATAR_SIZE;
    const half = size / 2;
    const avatarCY = -20; // avatar center within the cell

    // Subtle dark backing so the frame reads as a tile, sprites stay transparent
    const tileBg = this.scene.add.graphics();
    tileBg.fillStyle(0x26263a, 0.55);
    tileBg.fillRoundedRect(-half, avatarCY - half, size, size, 10);
    container.add(tileBg);

    // Sprite zoomed to head + torso, clipped to the tile.
    // (The mask shape is defined in world coordinates; the cell never moves.)
    const sprite = this.scene.add.image(0, avatarCY + 38, player.character.id);
    sprite.setDisplaySize(size * 2, size * 2);
    sprite.setName('portrait-sprite');
    setFacing(sprite, facing);
    container.add(sprite);

    const maskShape = this.scene.make.graphics({}, false);
    maskShape.fillStyle(0xffffff, 1);
    maskShape.fillRoundedRect(x - half, cy + avatarCY - half, size, size, 10);
    sprite.setMask(maskShape.createGeometryMask());

    // Border (redrawn purple + glow when active)
    const border = this.scene.add.graphics();
    border.setName('avatar-border');
    this.drawAvatarBorder(border, avatarCY, false);
    container.add(border);

    // "TURN" pill — top-right corner, shown for the active player
    const turnPill = this.scene.add.container(half - 10, avatarCY - half + 2);
    turnPill.setName('turn-pill');
    const pillBg = this.scene.add.graphics();
    pillBg.fillStyle(PURPLE, 1);
    pillBg.fillRoundedRect(-24, -9, 48, 18, 5);
    turnPill.add(pillBg);
    const pillText = this.scene.add.text(0, 0, 'TURN', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '7px',
      color: '#1a1a2e',
    }).setOrigin(0.5);
    turnPill.add(pillText);
    turnPill.setVisible(false);
    container.add(turnPill);

    // JAIL badge — bottom edge of the avatar
    const jailBadge = this.scene.add.container(0, avatarCY + half);
    jailBadge.setName('jail-badge');
    const jailBg = this.scene.add.graphics();
    jailBg.fillStyle(HEART_ON, 1);
    jailBg.fillRoundedRect(-26, -10, 52, 20, 5);
    jailBg.lineStyle(1, 0xf08070, 1);
    jailBg.strokeRoundedRect(-26, -10, 52, 20, 5);
    jailBadge.add(jailBg);
    const jailText = this.scene.add.text(0, 0, 'JAIL', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '7px',
      color: '#ffffff',
    }).setOrigin(0.5);
    jailBadge.add(jailText);
    jailBadge.setVisible(false);
    container.add(jailBadge);

    // Name
    const nameText = this.scene.add.text(0, avatarCY + half + 24, player.name, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    nameText.setOrigin(0.5);
    nameText.setName('name-text');
    container.add(nameText);

    // Heart pips
    const hearts = this.scene.add.graphics();
    hearts.setName('hearts');
    this.drawHearts(hearts, player.lives, avatarCY + half + 44);
    container.add(hearts);

    // Invisible holders so updatePlayer's landscape lookups don't break
    const livesText = this.scene.add.text(0, 0, '').setVisible(false);
    livesText.setName('lives-text');
    container.add(livesText);
    const posText = this.scene.add.text(0, 0, '').setVisible(false);
    posText.setName('pos-text');
    container.add(posText);

    container.setData('avatar-cy', avatarCY);
    container.setData('hearts-y', avatarCY + half + 44);
    this.add(container);
  }

  private drawAvatarBorder(g: Phaser.GameObjects.Graphics, avatarCY: number, active: boolean): void {
    const size = this.AVATAR_SIZE;
    const half = size / 2;
    g.clear();
    if (active) {
      // Glow ring
      g.lineStyle(8, PURPLE, 0.25);
      g.strokeRoundedRect(-half - 4, avatarCY - half - 4, size + 8, size + 8, 12);
      g.lineStyle(3, PURPLE, 1);
    } else {
      g.lineStyle(3, AVATAR_BORDER, 1);
    }
    g.strokeRoundedRect(-half, avatarCY - half, size, size, 10);
  }

  // Pixel heart pips: filled for remaining lives, dim sockets for the rest
  private drawHearts(g: Phaser.GameObjects.Graphics, lives: number, y: number): void {
    const pip = 14;
    const gap = 6;
    const max = 3;
    const totalW = max * pip + (max - 1) * gap;
    g.clear();
    for (let i = 0; i < max; i++) {
      const x0 = -totalW / 2 + i * (pip + gap);
      g.fillStyle(i < lives ? HEART_ON : HEART_OFF, 1);
      // Heart: polygon(50% 100%, 0 38%, 16% 0, 50% 24%, 84% 0, 100% 38%)
      g.fillPoints([
        new Phaser.Geom.Point(x0 + pip * 0.5, y + pip),
        new Phaser.Geom.Point(x0, y + pip * 0.38),
        new Phaser.Geom.Point(x0 + pip * 0.16, y),
        new Phaser.Geom.Point(x0 + pip * 0.5, y + pip * 0.24),
        new Phaser.Geom.Point(x0 + pip * 0.84, y),
        new Phaser.Geom.Point(x0 + pip, y + pip * 0.38),
      ], true, true);
    }
  }

  private createCharacterPortrait(player: Player, x: number, y: number, facing: Facing = 'center'): void {
    const container = this.scene.add.container(x, y);
    container.setName(`player-hud-${player.id}`);

    const sprite = this.scene.add.image(0, 0, player.character.id);
    sprite.setScale(0.05);
    sprite.setName('portrait-sprite');
    setFacing(sprite, facing);
    container.add(sprite);

    const nameText = this.scene.add.text(0, 50, player.name, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    nameText.setOrigin(0.5);
    nameText.setName('name-text');
    container.add(nameText);

    const livesText = this.scene.add.text(0, 65, `Lives: ${player.lives}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: player.lives > 1 ? '#99e550' : '#d95763',
      stroke: '#000000',
      strokeThickness: 2,
    });
    livesText.setOrigin(0.5);
    livesText.setName('lives-text');
    container.add(livesText);

    const posText = this.scene.add.text(0, 80, `Pos: ${player.position}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    posText.setOrigin(0.5);
    posText.setName('pos-text');
    container.add(posText);

    this.add(container);
  }

  updatePlayer(player: Player): void {
    const container = this.getByName(`player-hud-${player.id}`) as Phaser.GameObjects.Container;
    if (!container) return;

    if (this.portrait) {
      const hearts = container.getByName('hearts') as Phaser.GameObjects.Graphics;
      if (hearts) {
        this.drawHearts(hearts, player.lives, container.getData('hearts-y') as number);
      }
      const jailBadge = container.getByName('jail-badge') as Phaser.GameObjects.Container;
      if (jailBadge) {
        jailBadge.setVisible(player.inJail && !player.isEliminated);
      }
    } else {
      const livesText = container.getByName('lives-text') as Phaser.GameObjects.Text;
      if (livesText) {
        livesText.setText(`Lives: ${player.lives}`);
        livesText.setColor(player.lives > 1 ? '#99e550' : player.lives > 0 ? '#d95763' : '#666666');
      }

      const posText = container.getByName('pos-text') as Phaser.GameObjects.Text;
      if (posText && posText.visible) {
        posText.setText(player.inJail ? 'In JAIL' : `Pos: ${player.position}`);
        posText.setColor(player.inJail ? '#d95763' : '#ffffff');
      }
    }

    if (player.isEliminated) {
      container.setAlpha(0.4);

      if (!container.getByName('gravestone')) {
        const fontSize = this.portrait ? '14px' : '12px';
        const gravestoneY = this.portrait ? (container.getData('avatar-cy') as number) : -20;
        const gravestone = this.scene.add.text(0, gravestoneY, 'RIP', {
          fontFamily: '"Press Start 2P", cursive',
          fontSize,
          color: '#aaaaaa',
          stroke: '#000000',
          strokeThickness: 4,
        });
        gravestone.setOrigin(0.5);
        gravestone.setName('gravestone');
        container.add(gravestone);
      }
    } else {
      const gravestone = container.getByName('gravestone');
      if (gravestone) {
        gravestone.destroy();
      }
      container.setAlpha(1);
    }
  }

  highlightCurrentPlayer(playerId: string): void {
    if (this.portrait) {
      this.highlightRailPlayer(playerId);
      return;
    }

    if (this.currentPlayerIndicator) {
      this.currentPlayerIndicator.destroy();
    }

    const container = this.getByName(`player-hud-${playerId}`) as Phaser.GameObjects.Container;
    if (!container) return;

    const squareSize = 56;
    this.currentPlayerIndicator = this.scene.add.graphics();
    this.currentPlayerIndicator.lineStyle(3, PURPLE, 1);
    this.currentPlayerIndicator.strokeRect(
      container.x - squareSize / 2,
      container.y - squareSize / 2,
      squareSize,
      squareSize
    );
    this.add(this.currentPlayerIndicator);

    this.scene.tweens.add({
      targets: this.currentPlayerIndicator,
      alpha: 0.3,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
  }

  private highlightRailPlayer(playerId: string): void {
    this.pulseTween?.stop();
    this.pulseTween = null;

    for (const player of this.players) {
      const container = this.getByName(`player-hud-${player.id}`) as Phaser.GameObjects.Container;
      if (!container) continue;

      const border = container.getByName('avatar-border') as Phaser.GameObjects.Graphics;
      const turnPill = container.getByName('turn-pill') as Phaser.GameObjects.Container;
      const nameText = container.getByName('name-text') as Phaser.GameObjects.Text;
      const avatarCY = container.getData('avatar-cy') as number;
      const active = player.id === playerId;

      if (border) {
        border.setAlpha(1);
        this.drawAvatarBorder(border, avatarCY, active);
        if (active) {
          this.pulseTween = this.scene.tweens.add({
            targets: border,
            alpha: 0.35,
            duration: 500,
            yoyo: true,
            repeat: -1,
          });
        }
      }
      turnPill?.setVisible(active);
      nameText?.setColor(active ? '#bb9af7' : '#ffffff');
    }
  }
}
