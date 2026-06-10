import Phaser from 'phaser';
import EventBus from '../events/EventBus';
import { CHAOS_CONFIG } from '../config/constants';
import { actionPrompt } from '../utils/input-helpers';
import { setFacing } from '../utils/facing';
import AudioEngine from '../audio/AudioEngine';

export interface ChaosMinigameData {
  throwerId: string;
  defenderId: string;
  throwerName: string;
  defenderName: string;
  throwerSpriteKey: string;
  defenderSpriteKey: string;
  distance: number;        // 1–4
  throwerIsHuman: boolean;
  throwerAimSkill: number; // 0–1, modifies AI hit chance
  perspective: 'ball' | 'can'; // BALL = thrower's POV, CAN = defender's first-person POV
}

export type ChaosOutcome = 'hit-can' | 'hit-body' | 'miss';

export interface ChaosResult {
  outcome: ChaosOutcome;
  loserId: string;
}

const DIFFICULTY_LABELS = ['', 'EASY', 'TRICKY', 'HARD', 'BRUTAL'] as const;
const DIFFICULTY_COLORS = [0, 0x4fa83d, 0xfbf236, 0xff9e64, 0xd95763] as const;

export class ChaosMinigameScene extends Phaser.Scene {
  private chaosData!: ChaosMinigameData;
  private arrowX: number = 0;
  private arrowY: number = 0;
  private sweepTween: Phaser.Tweens.Tween | null = null;
  private arrowGraphic!: Phaser.GameObjects.Graphics;
  private defenderCenterX: number = 0;
  private defenderY: number = 0;
  private canCenterY: number = 0;
  private hasThrown: boolean = false;
  private defenderSprite: Phaser.GameObjects.Image | null = null;
  private canContainer: Phaser.GameObjects.Container | null = null;
  private promptText: Phaser.GameObjects.Text | null = null;
  // Visual multiplier: portrait canvas is wide enough for bigger actors/zones
  private vm: number = 1;

  constructor() {
    super({ key: 'ChaosMinigameScene' });
  }

  init(data: ChaosMinigameData): void {
    this.chaosData = data;
    this.hasThrown = false;
    this.defenderSprite = null;
    this.canContainer = null;
    this.sweepTween = null;
    this.promptText = null;
  }

  create(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    this.vm = H > W ? 1.5 : 1;

    this.cameras.main.fadeIn(300, 0, 0, 0);
    AudioEngine.playMusic('chaos');

    // Dark backdrop with a faint vignette floor
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1a).setDepth(0);

    if (this.chaosData.perspective === 'ball') {
      this.createBallPerspective(W, H);
    } else {
      this.createCanPerspective(W, H);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.sweepTween?.stop();
    });
  }

  // ─── SHARED UI ──────────────────────────────────────────────────────
  private createHeader(W: number, title: string): void {
    const portrait = this.vm > 1;
    this.add.text(W / 2, portrait ? 40 : 30, title, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: portrait ? '18px' : '14px',
      color: '#ff00ff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);

    this.createDifficultyMeter(W / 2, portrait ? 82 : 62);
  }

  // Difficulty meter — 4 pips filled by distance, color-coded
  private createDifficultyMeter(cx: number, y: number): void {
    const distance = this.chaosData.distance;
    const portrait = this.vm > 1;
    const font = portrait ? '10px' : '8px';

    this.add.text(cx - (portrait ? 80 : 60), y, 'DIFFICULTY', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: font,
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(5);

    const pipW = portrait ? 24 : 18;
    const pipH = portrait ? 13 : 10;
    const gap = portrait ? 5 : 4;
    const startX = cx + (portrait ? 0 : 8);
    const g = this.add.graphics().setDepth(5);
    for (let i = 1; i <= 4; i++) {
      const x = startX + (i - 1) * (pipW + gap);
      if (i <= distance) {
        g.fillStyle(DIFFICULTY_COLORS[distance], 1);
        g.fillRect(x, y - pipH / 2, pipW, pipH);
      }
      g.lineStyle(1, 0x888888, 1);
      g.strokeRect(x, y - pipH / 2, pipW, pipH);
    }

    const labelColor = '#' + DIFFICULTY_COLORS[distance].toString(16).padStart(6, '0');
    this.add.text(startX + 4 * (pipW + gap) + 10, y, DIFFICULTY_LABELS[distance], {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: font,
      color: labelColor,
    }).setOrigin(0, 0.5).setDepth(5);
  }

  // Pixel-art tin can in a container so it can be knocked off later
  private createCan(x: number, y: number, scale: number): Phaser.GameObjects.Container {
    const canW = 16 * scale;
    const canH = 20 * scale;
    const container = this.add.container(x, y);
    const g = this.add.graphics();
    // Body
    g.fillStyle(0xc0c0c0, 1);
    g.fillRect(-canW / 2, -canH / 2, canW, canH);
    // Ridges
    g.fillStyle(0x9a9a9a, 1);
    g.fillRect(-canW / 2, -canH / 2 + canH * 0.15, canW, Math.max(1, canH * 0.08));
    g.fillRect(-canW / 2, canH / 2 - canH * 0.23, canW, Math.max(1, canH * 0.08));
    // Highlight
    g.fillStyle(0xe8e8e8, 1);
    g.fillRect(-canW / 2 + canW * 0.15, -canH / 2 + canH * 0.1, Math.max(1, canW * 0.18), canH * 0.8);
    // Outline
    g.lineStyle(1, 0xffffff, 0.6);
    g.strokeRect(-canW / 2, -canH / 2, canW, canH);
    container.add(g);
    container.setDepth(3);
    return container;
  }

  // ─── BALL PERSPECTIVE (Thrower's POV) ───────────────────────────────
  private createBallPerspective(W: number, H: number): void {
    const distance = this.chaosData.distance;
    const scale = CHAOS_CONFIG.SCALE[distance] * this.vm;
    const speed = CHAOS_CONFIG.SPEED[distance];
    const portrait = this.vm > 1;

    this.defenderCenterX = W / 2;
    // In portrait the canvas is tall — keep the action in the upper-middle
    this.defenderY = portrait ? H * 0.42 : H * 0.55;

    this.createHeader(W, 'CHAOS — THROW!');

    // Matchup label
    this.add.text(W / 2, H - (portrait ? 105 : 70), `${this.chaosData.throwerName} → ${this.chaosData.defenderName}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: portrait ? '11px' : '8px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(5);

    // Defender sprite (scaled by distance), facing the thrower (camera)
    this.defenderSprite = this.add.image(this.defenderCenterX, this.defenderY, this.chaosData.defenderSpriteKey);
    this.defenderSprite.setScale(0.08 * scale);
    this.defenderSprite.setDepth(2);
    setFacing(this.defenderSprite, 'center');

    // Ground line
    const groundY = this.defenderY + this.defenderSprite.displayHeight / 2 + 10;
    this.add.rectangle(W / 2, groundY, W * 0.6, 2, 0x444444).setDepth(1);

    // Can on defender's head
    const spriteHalfH = this.defenderSprite.displayHeight / 2;
    this.canCenterY = this.defenderY - spriteHalfH - 12 * scale;
    this.canContainer = this.createCan(this.defenderCenterX, this.canCenterY, scale);

    // Arrow indicator sweeping above the can
    this.arrowY = this.canCenterY - 30 * scale - 10;
    this.arrowGraphic = this.add.graphics();
    this.arrowGraphic.setDepth(10);
    this.startArrowSweep(speed);

    if (this.chaosData.throwerIsHuman) {
      this.promptText = this.add.text(W / 2, H - (portrait ? 60 : 40), actionPrompt('TAP TO THROW!', 'PRESS SPACE TO THROW!'), {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: portrait ? '14px' : '10px',
        color: '#ffcc00',
      }).setOrigin(0.5).setDepth(20);

      this.tweens.add({
        targets: this.promptText,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });

      this.input.keyboard?.once('keydown-SPACE', () => this.onPlayerThrow());
      this.input.once('pointerdown', () => this.onPlayerThrow());
    } else {
      // AI throws while everyone watches
      this.add.text(W / 2, H - (this.vm > 1 ? 60 : 40), `${this.chaosData.throwerName} is aiming...`, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: this.vm > 1 ? '11px' : '8px',
        color: '#888888',
      }).setOrigin(0.5).setDepth(20);

      this.scheduleAIBallThrow();
    }
  }

  private startArrowSweep(speed: number): void {
    const sweepHalf = this.vm > 1 ? 150 : CHAOS_CONFIG.SWEEP_HALF_WIDTH;
    this.arrowX = this.defenderCenterX - sweepHalf;
    const tweenDuration = ((sweepHalf * 2) / speed) * 1000;

    this.sweepTween = this.tweens.add({
      targets: this,
      arrowX: this.defenderCenterX + sweepHalf,
      duration: tweenDuration,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
      onUpdate: () => this.drawArrow(this.arrowX, this.arrowY),
      onYoyo: () => AudioEngine.sfx('arrowTick'),
      onRepeat: () => AudioEngine.sfx('arrowTick'),
    });
  }

  // AI hit chance: PRD distance table, nudged by the thrower's aim skill
  private rollAIHitChance(): number {
    const base = CHAOS_CONFIG.AI_HIT_CHANCE[this.chaosData.distance];
    const aimFactor = 0.7 + this.chaosData.throwerAimSkill * 0.6; // 0.7x–1.3x
    return Math.min(90, Math.round(base * aimFactor));
  }

  private scheduleAIBallThrow(): void {
    const distance = this.chaosData.distance;
    const hitChance = this.rollAIHitChance();
    const roll = Math.random() * 100;
    const outcome: ChaosOutcome = roll < hitChance ? 'hit-can' : (roll < hitChance + 20 ? 'hit-body' : 'miss');

    const suspenseTime = 1200 + Math.random() * 800;

    this.time.delayedCall(suspenseTime, () => {
      this.sweepTween?.stop();

      // Stop the arrow at a position consistent with the outcome
      const scale = CHAOS_CONFIG.SCALE[distance] * this.vm;
      const canHalfWidth = (CHAOS_CONFIG.CAN_HIT_ZONE_BASE * scale) / 2;
      const bodyHalfWidth = (CHAOS_CONFIG.BODY_HIT_ZONE_BASE * scale) / 2;
      let targetX: number;
      if (outcome === 'hit-can') {
        targetX = this.defenderCenterX + (Math.random() * canHalfWidth * 0.6 - canHalfWidth * 0.3);
      } else if (outcome === 'hit-body') {
        const bodyOffset = canHalfWidth + (bodyHalfWidth - canHalfWidth) * 0.5;
        targetX = this.defenderCenterX + (Math.random() > 0.5 ? bodyOffset : -bodyOffset);
      } else {
        const missOffset = bodyHalfWidth + 30 + Math.random() * 40;
        targetX = this.defenderCenterX + (Math.random() > 0.5 ? missOffset : -missOffset);
      }

      this.tweens.add({
        targets: this,
        arrowX: targetX,
        duration: 250,
        ease: 'Quad.easeOut',
        onUpdate: () => this.drawArrow(this.arrowX, this.arrowY),
        onComplete: () => {
          this.time.delayedCall(400, () => this.playResultAnimation(outcome));
        },
      });
    });
  }

  // ─── CAN PERSPECTIVE (Human defends, first-person) ──────────────────
  private createCanPerspective(W: number, H: number): void {
    const distance = this.chaosData.distance;
    const scale = CHAOS_CONFIG.SCALE[distance] * this.vm;
    const portrait = this.vm > 1;

    this.defenderCenterX = W / 2;

    this.createHeader(W, 'CHAOS — DEFEND!');

    this.add.text(W / 2, H - (portrait ? 105 : 70), `${this.chaosData.throwerName} is throwing at you...`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: portrait ? '11px' : '8px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(5);

    // Thrower sprite at distance, facing you
    const throwerY = portrait ? H * 0.45 : H * 0.5;
    const throwerSprite = this.add.image(W / 2, throwerY, this.chaosData.throwerSpriteKey);
    throwerSprite.setScale(0.06 * scale);
    throwerSprite.setDepth(2);
    setFacing(throwerSprite, 'center');

    // Ground line
    const groundY = throwerY + throwerSprite.displayHeight / 2 + 5;
    this.add.rectangle(W / 2, groundY, W * 0.6, 2, 0x444444).setDepth(1);

    // Arrow sweeping at top of screen (large — it's over YOUR head)
    this.arrowY = portrait ? 140 : 110;
    this.arrowGraphic = this.add.graphics();
    this.arrowGraphic.setDepth(10);

    // Can outline at top of screen (first-person — it's on YOUR head)
    const canWidth = 40 * this.vm;
    const canHeight = 50 * this.vm;
    const canOutline = this.add.graphics();
    canOutline.lineStyle(2, 0xc0c0c0, 0.5);
    canOutline.strokeRect(W / 2 - canWidth / 2, this.arrowY - canHeight / 2 + 30 * this.vm, canWidth, canHeight);
    canOutline.setDepth(9);

    this.add.text(W / 2, this.arrowY + 85 * this.vm, '▲ YOUR CAN', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: portrait ? '10px' : '8px',
      color: '#c0c0c0',
    }).setOrigin(0.5).setDepth(9);

    this.startArrowSweep(CHAOS_CONFIG.SPEED[distance]);

    this.add.text(W / 2, H - (portrait ? 60 : 40), 'Hold still...', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: portrait ? '13px' : '10px',
      color: '#888888',
    }).setOrigin(0.5).setDepth(20);

    this.scheduleAIThrow(throwerSprite);
  }

  // ─── ARROW DRAWING ─────────────────────────────────────────────────
  private drawArrow(x: number, y: number): void {
    this.arrowGraphic.clear();
    // Down-pointing triangle
    this.arrowGraphic.fillStyle(0xff4444, 1);
    this.arrowGraphic.fillTriangle(
      x - 8, y - 12,
      x + 8, y - 12,
      x, y
    );
    // Vertical line above
    this.arrowGraphic.lineStyle(2, 0xff4444, 1);
    this.arrowGraphic.lineBetween(x, y - 12, x, y - 24);
  }

  // ─── PLAYER THROW (BALL perspective) ───────────────────────────────
  private onPlayerThrow(): void {
    if (this.hasThrown) return;
    this.hasThrown = true;
    this.sweepTween?.pause();
    this.promptText?.setVisible(false);

    const outcome = this.classifyArrowPosition(this.arrowX);
    this.playResultAnimation(outcome);
  }

  // ─── AI THROW (CAN perspective) ────────────────────────────────────
  private scheduleAIThrow(throwerSprite: Phaser.GameObjects.Image): void {
    const hitChance = this.rollAIHitChance();
    const roll = Math.random() * 100;
    const outcome: ChaosOutcome = roll < hitChance ? 'hit-can' : 'miss';

    const suspenseTime = 1200 + Math.random() * 800;

    this.time.delayedCall(suspenseTime, () => {
      this.sweepTween?.stop();

      let targetX: number;
      if (outcome === 'hit-can') {
        targetX = this.defenderCenterX + (Math.random() * 6 - 3);
      } else {
        const offset = 60 + Math.random() * 50;
        targetX = this.defenderCenterX + (Math.random() > 0.5 ? offset : -offset);
      }

      this.tweens.add({
        targets: this,
        arrowX: targetX,
        duration: 300,
        ease: 'Quad.easeOut',
        onUpdate: () => this.drawArrow(this.arrowX, this.arrowY),
        onComplete: () => {
          this.time.delayedCall(400, () => {
            this.playCanResultAnimation(outcome, throwerSprite);
          });
        },
      });
    });
  }

  // ─── CLASSIFY ARROW POSITION (BALL perspective) ────────────────────
  private classifyArrowPosition(arrowX: number): ChaosOutcome {
    const distance = this.chaosData.distance;
    const scale = CHAOS_CONFIG.SCALE[distance] * this.vm;
    const canHalfWidth = (CHAOS_CONFIG.CAN_HIT_ZONE_BASE * scale) / 2;
    const bodyHalfWidth = (CHAOS_CONFIG.BODY_HIT_ZONE_BASE * scale) / 2;
    const dx = Math.abs(arrowX - this.defenderCenterX);

    if (dx <= canHalfWidth) return 'hit-can';
    if (dx <= bodyHalfWidth) return 'hit-body';
    return 'miss';
  }

  // ─── RESULT ANIMATION (BALL perspective) ───────────────────────────
  // The ball flies in an arc from the thrower's hands (bottom center) to
  // wherever the arrow stopped — then the outcome plays out.
  private playResultAnimation(outcome: ChaosOutcome): void {
    const loserId = outcome === 'hit-can' ? this.chaosData.defenderId : this.chaosData.throwerId;
    const landX = this.arrowX;

    AudioEngine.sfx('throw');

    if (outcome === 'hit-can') {
      this.animateBallArc(landX, this.canCenterY, () => {
        AudioEngine.sfx('clang');
        this.knockCanOff(landX);
        this.cameras.main.flash(200, 255, 50, 50);
        this.cameras.main.shake(300, 0.02);
        this.showOutcomeText('HIT!', '#ff4444', `${this.chaosData.defenderName} is eliminated!`, () => {
          this.exitScene({ outcome, loserId });
        });
      });
    } else if (outcome === 'hit-body') {
      this.animateBallArc(landX, this.defenderY, () => {
        AudioEngine.sfx('bodyHit');
        this.flashDefender();
        this.cameras.main.flash(200, 255, 140, 0);
        this.cameras.main.shake(200, 0.015);
        this.showOutcomeText('HIT BODY!', '#ff8800', `${this.chaosData.throwerName} is eliminated!`, () => {
          this.exitScene({ outcome, loserId });
        });
      });
    } else {
      // Miss — ball sails past the defender and offscreen
      const ballPassedLeft = landX < this.defenderCenterX;
      this.animateBallArc(landX, this.canCenterY - 10, () => {
        AudioEngine.sfx('miss');
        // Defender watches the ball go by
        if (this.defenderSprite) {
          setFacing(this.defenderSprite, ballPassedLeft ? 'left' : 'right');
        }
        this.showOutcomeText('MISS!', '#888888', `${this.chaosData.throwerName} is eliminated!`, () => {
          this.exitScene({ outcome, loserId });
        });
      }, true);
    }
  }

  // Parabolic arc throw. continuePast: keep flying offscreen after the apex point.
  private animateBallArc(
    targetX: number,
    targetY: number,
    onArrive: () => void,
    continuePast: boolean = false
  ): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    const startX = W / 2;
    const startY = H - 90;
    const arcHeight = Math.max(60, (startY - targetY) * 0.35);

    const ball = this.add.circle(startX, startY, 6, 0xff6600);
    ball.setStrokeStyle(1, 0xffffff, 0.8);
    ball.setDepth(50);

    const progress = { t: 0 };
    this.tweens.add({
      targets: progress,
      t: 1,
      duration: 550,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        const t = progress.t;
        ball.x = Phaser.Math.Linear(startX, targetX, t);
        ball.y = Phaser.Math.Linear(startY, targetY, t) - arcHeight * 4 * t * (1 - t);
        const s = Phaser.Math.Linear(1, 0.45, t); // shrinks with distance
        ball.setScale(s);
      },
      onComplete: () => {
        if (continuePast) {
          // Keep sailing past the defender, shrinking into the distance
          const dirX = targetX >= W / 2 ? 1 : -1;
          this.tweens.add({
            targets: ball,
            x: targetX + dirX * 160,
            y: targetY - 40,
            scale: 0.15,
            alpha: 0,
            duration: 450,
            ease: 'Quad.easeOut',
            onComplete: () => ball.destroy(),
          });
          onArrive();
        } else {
          ball.destroy();
          onArrive();
        }
      },
    });
  }

  // The can flips off the defender's head, spinning, and falls to the ground
  private knockCanOff(impactX: number): void {
    if (!this.canContainer) return;
    const can = this.canContainer;
    const dir = impactX <= can.x ? 1 : -1; // can flies away from impact side

    const groundY = this.defenderY + (this.defenderSprite?.displayHeight ?? 60) / 2 + 6;

    this.tweens.add({
      targets: can,
      x: can.x + dir * (40 + Math.random() * 30),
      angle: dir * (540 + Math.random() * 180),
      duration: 700,
      ease: 'Linear',
    });
    // Up then down with a gravity feel
    this.tweens.add({
      targets: can,
      y: can.y - 50,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: can,
          y: groundY,
          duration: 450,
          ease: 'Bounce.easeOut',
        });
      },
    });
  }

  private flashDefender(): void {
    if (!this.defenderSprite) return;
    const sprite = this.defenderSprite;
    sprite.setTintFill(0xff4444);
    this.time.delayedCall(120, () => sprite.clearTint());
    this.time.delayedCall(240, () => sprite.setTintFill(0xff4444));
    this.time.delayedCall(360, () => sprite.clearTint());
  }

  // ─── RESULT ANIMATION (CAN perspective) ────────────────────────────
  private playCanResultAnimation(outcome: ChaosOutcome, throwerSprite: Phaser.GameObjects.Image): void {
    const loserId = outcome === 'hit-can' ? this.chaosData.defenderId : this.chaosData.throwerId;

    AudioEngine.sfx('throw');

    if (outcome === 'hit-can') {
      // Ball flies toward camera (first-person hit)
      this.animateBallTowardCamera(throwerSprite.x, throwerSprite.y, () => {
        AudioEngine.sfx('clang');
        this.cameras.main.flash(300, 255, 50, 50);
        this.cameras.main.shake(400, 0.03);
        this.showOutcomeText('KO!', '#ff0000', `${this.chaosData.defenderName} is eliminated!`, () => {
          this.exitScene({ outcome, loserId });
        });
      });
    } else {
      // Ball flies past your head
      this.animateBallPast(throwerSprite.x, throwerSprite.y, () => {
        AudioEngine.sfx('miss');
        this.showOutcomeText('MISS!', '#99e550', `${this.chaosData.throwerName} missed — and is eliminated!`, () => {
          this.exitScene({ outcome, loserId });
        });
      });
    }
  }

  private animateBallTowardCamera(fromX: number, fromY: number, onComplete: () => void): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    const ball = this.add.circle(fromX, fromY, 4, 0xff6600);
    ball.setDepth(50);

    this.tweens.add({
      targets: ball,
      x: W / 2,
      y: H + 50,
      scaleX: 10,
      scaleY: 10,
      duration: 700,
      ease: 'Quad.easeIn',
      onComplete: () => {
        ball.destroy();
        onComplete();
      },
    });
  }

  private animateBallPast(fromX: number, fromY: number, onComplete: () => void): void {
    const W = this.cameras.main.width;
    const ball = this.add.circle(fromX, fromY, 4, 0xff6600);
    ball.setDepth(50);

    this.tweens.add({
      targets: ball,
      x: W + 80,
      y: fromY + 30,
      scaleX: 4,
      scaleY: 4,
      duration: 500,
      ease: 'Quad.easeOut',
      onComplete: () => {
        ball.destroy();
        onComplete();
      },
    });
  }

  // ─── OUTCOME TEXT ──────────────────────────────────────────────────
  private showOutcomeText(
    mainText: string,
    mainColor: string,
    subText: string,
    onComplete: () => void
  ): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    const main = this.add.text(W / 2, H / 2 - 20, mainText, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '40px',
      color: mainColor,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    const sub = this.add.text(W / 2, H / 2 + 30, subText, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: this.vm > 1 ? '13px' : '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      wordWrap: { width: W - 60 },
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    this.tweens.add({
      targets: main,
      alpha: 1,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: sub,
      alpha: 1,
      duration: 300,
      delay: 200,
    });

    this.time.delayedCall(1200, () => {
      const continueText = this.add.text(W / 2, H / 2 + 80, actionPrompt('TAP TO CONTINUE', 'PRESS SPACE TO CONTINUE'), {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: this.vm > 1 ? '11px' : '8px',
        color: '#ffcc00',
      }).setOrigin(0.5).setDepth(100);

      this.tweens.add({
        targets: continueText,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });

      this.input.keyboard?.once('keydown-SPACE', () => onComplete());
      this.input.once('pointerdown', () => onComplete());
    });
  }

  // ─── EXIT ──────────────────────────────────────────────────────────
  private exitScene(result: ChaosResult): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      EventBus.emit('chaos-result', result);
      this.scene.stop();
    });
  }
}
