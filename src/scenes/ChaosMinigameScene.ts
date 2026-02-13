import Phaser from 'phaser';
import EventBus from '../events/EventBus';
import { CHAOS_CONFIG } from '../config/constants';
import { actionPrompt } from '../utils/input-helpers';

export interface ChaosMinigameData {
  throwerId: string;
  defenderId: string;
  throwerName: string;
  defenderName: string;
  throwerSpriteKey: string;
  defenderSpriteKey: string;
  distance: number;        // 1–4
  throwerIsHuman: boolean;
  perspective: 'ball' | 'can'; // BALL = human throws, CAN = human defends
}

export type ChaosOutcome = 'hit-can' | 'hit-body' | 'miss';

export interface ChaosResult {
  outcome: ChaosOutcome;
  loserId: string;
}

export class ChaosMinigameScene extends Phaser.Scene {
  private chaosData!: ChaosMinigameData;
  private arrowX: number = 0;
  private sweepTween!: Phaser.Tweens.Tween;
  private arrowGraphic!: Phaser.GameObjects.Graphics;
  private defenderCenterX: number = 0;
  private canCenterY: number = 0;
  private hasThrown: boolean = false;

  constructor() {
    super({ key: 'ChaosMinigameScene' });
  }

  init(data: ChaosMinigameData): void {
    this.chaosData = data;
    this.hasThrown = false;
  }

  create(): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);

    // Dark background
    this.add.rectangle(W / 2, H / 2, W, H, 0x0a0a1a).setDepth(0);

    if (this.chaosData.perspective === 'ball') {
      this.createBallPerspective(W, H);
    } else {
      this.createCanPerspective(W, H);
    }
  }

  // ─── BALL PERSPECTIVE (Human is Thrower) ───────────────────────────
  private createBallPerspective(W: number, H: number): void {
    const distance = this.chaosData.distance;
    const scale = CHAOS_CONFIG.SCALE[distance];
    const speed = CHAOS_CONFIG.SPEED[distance];

    this.defenderCenterX = W / 2;
    const defenderY = H * 0.55;

    // Title
    this.add.text(W / 2, 30, 'CHAOS — THROW!', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '14px',
      color: '#ff00ff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);

    // Distance indicator
    this.add.text(W / 2, 55, `Distance: ${distance}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(5);

    // Player labels
    this.add.text(W / 2, H - 70, `${this.chaosData.throwerName} → ${this.chaosData.defenderName}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(5);

    // Ground line
    const groundY = defenderY + 60 * scale + 10;
    this.add.rectangle(W / 2, groundY, W * 0.6, 2, 0x444444).setDepth(1);

    // Defender sprite (scaled by distance)
    const defenderSprite = this.add.image(this.defenderCenterX, defenderY, this.chaosData.defenderSpriteKey);
    defenderSprite.setScale(0.08 * scale);
    defenderSprite.setDepth(2);

    // Can on defender's head
    const spriteHalfH = (defenderSprite.displayHeight) / 2;
    this.canCenterY = defenderY - spriteHalfH - 12 * scale;
    const canWidth = 16 * scale;
    const canHeight = 20 * scale;

    const canGraphics = this.add.graphics();
    canGraphics.fillStyle(0xc0c0c0, 1);
    canGraphics.fillRect(
      this.defenderCenterX - canWidth / 2,
      this.canCenterY - canHeight / 2,
      canWidth,
      canHeight
    );
    canGraphics.lineStyle(1, 0xffffff, 0.6);
    canGraphics.strokeRect(
      this.defenderCenterX - canWidth / 2,
      this.canCenterY - canHeight / 2,
      canWidth,
      canHeight
    );
    canGraphics.setDepth(3);

    // Arrow indicator
    const arrowY = this.canCenterY - 30 * scale - 10;
    this.arrowGraphic = this.add.graphics();
    this.arrowGraphic.setDepth(10);

    const sweepHalf = CHAOS_CONFIG.SWEEP_HALF_WIDTH;
    this.arrowX = this.defenderCenterX - sweepHalf;

    // Arrow sweep tween
    const tweenDuration = ((sweepHalf * 2) / speed) * 1000;
    this.sweepTween = this.tweens.add({
      targets: this,
      arrowX: this.defenderCenterX + sweepHalf,
      duration: tweenDuration,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        this.drawArrow(this.arrowX, arrowY);
      },
    });

    if (this.chaosData.throwerIsHuman) {
      // Human thrower — press Space to aim
      const promptText = this.add.text(W / 2, H - 40, actionPrompt('TAP TO THROW!', 'PRESS SPACE TO THROW!'), {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '10px',
        color: '#ffcc00',
      }).setOrigin(0.5).setDepth(20);

      this.tweens.add({
        targets: promptText,
        alpha: 0.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });

      this.input.keyboard?.once('keydown-SPACE', () => this.onPlayerThrow());
      this.input.once('pointerdown', () => this.onPlayerThrow());
    } else {
      // AI thrower — auto-throw after suspenseful delay
      this.add.text(W / 2, H - 40, `${this.chaosData.throwerName} is aiming...`, {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
        color: '#888888',
      }).setOrigin(0.5).setDepth(20);

      this.scheduleAIBallThrow(arrowY);
    }
  }

  private scheduleAIBallThrow(arrowY: number): void {
    const distance = this.chaosData.distance;
    const hitChance = CHAOS_CONFIG.AI_HIT_CHANCE[distance];
    const roll = Math.random() * 100;
    const outcome: ChaosOutcome = roll < hitChance ? 'hit-can' : (roll < hitChance + 20 ? 'hit-body' : 'miss');

    const suspenseTime = 1200 + Math.random() * 800;

    this.time.delayedCall(suspenseTime, () => {
      this.sweepTween?.stop();

      // Determine where the arrow should stop based on outcome
      const scale = CHAOS_CONFIG.SCALE[distance];
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
        onUpdate: () => {
          this.drawArrow(this.arrowX, arrowY);
        },
        onComplete: () => {
          this.time.delayedCall(400, () => {
            this.playResultAnimation(outcome);
          });
        },
      });
    });
  }

  // ─── CAN PERSPECTIVE (Human is Defender, First-Person) ─────────────
  private createCanPerspective(W: number, H: number): void {
    const distance = this.chaosData.distance;
    const scale = CHAOS_CONFIG.SCALE[distance];

    this.defenderCenterX = W / 2;

    // Title
    this.add.text(W / 2, 30, 'CHAOS — DEFEND!', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '14px',
      color: '#ff00ff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(5);

    // Distance indicator
    this.add.text(W / 2, 55, `Distance: ${distance}`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(5);

    // First-person viewpoint text
    this.add.text(W / 2, H - 70, `${this.chaosData.throwerName} is throwing at you...`, {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(5);

    // Thrower sprite (far away, scaled by distance)
    const throwerY = H * 0.5;
    const throwerSprite = this.add.image(W / 2, throwerY, this.chaosData.throwerSpriteKey);
    throwerSprite.setScale(0.06 * scale);
    throwerSprite.setDepth(2);

    // Ground line
    const groundY = throwerY + throwerSprite.displayHeight / 2 + 5;
    this.add.rectangle(W / 2, groundY, W * 0.6, 2, 0x444444).setDepth(1);

    // Arrow sweeping at top of screen (large, close to camera — defender's POV)
    const arrowY = 90;
    this.arrowGraphic = this.add.graphics();
    this.arrowGraphic.setDepth(10);

    // Can outline at top of screen (first-person — it's on YOUR head)
    const canWidth = 40;
    const canHeight = 50;
    const canOutline = this.add.graphics();
    canOutline.lineStyle(2, 0xc0c0c0, 0.5);
    canOutline.strokeRect(W / 2 - canWidth / 2, arrowY - canHeight / 2 + 30, canWidth, canHeight);
    canOutline.setDepth(9);

    this.add.text(W / 2, arrowY + 65, '▲ CAN', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '8px',
      color: '#c0c0c0',
    }).setOrigin(0.5).setDepth(9);

    const sweepHalf = CHAOS_CONFIG.SWEEP_HALF_WIDTH;
    this.arrowX = this.defenderCenterX - sweepHalf;

    const speed = CHAOS_CONFIG.SPEED[distance];
    const tweenDuration = ((sweepHalf * 2) / speed) * 1000;

    this.sweepTween = this.tweens.add({
      targets: this,
      arrowX: this.defenderCenterX + sweepHalf,
      duration: tweenDuration,
      ease: 'Linear',
      yoyo: true,
      repeat: -1,
      onUpdate: () => {
        this.drawArrow(this.arrowX, arrowY);
      },
    });

    // "Watching..." text (no input for defender)
    this.add.text(W / 2, H - 40, 'Watching...', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '10px',
      color: '#888888',
    }).setOrigin(0.5).setDepth(20);

    // Schedule AI throw after brief suspense
    this.scheduleAIThrow(arrowY, throwerSprite);
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

    const outcome = this.classifyArrowPosition(this.arrowX);
    this.playResultAnimation(outcome);
  }

  // ─── AI THROW (CAN perspective) ────────────────────────────────────
  private scheduleAIThrow(arrowY: number, throwerSprite: Phaser.GameObjects.Image): void {
    const distance = this.chaosData.distance;
    const hitChance = CHAOS_CONFIG.AI_HIT_CHANCE[distance];
    const roll = Math.random() * 100;
    const outcome: ChaosOutcome = roll < hitChance ? 'hit-can' : 'miss';

    // Let the arrow sweep for a suspenseful moment
    const suspenseTime = 1200 + Math.random() * 800;

    this.time.delayedCall(suspenseTime, () => {
      this.sweepTween.stop();

      // Determine where the arrow should stop based on outcome
      let targetX: number;
      if (outcome === 'hit-can') {
        // Stop right on center (can)
        targetX = this.defenderCenterX + (Math.random() * 6 - 3); // slight variance
      } else {
        // Stop clearly off-target
        const offset = 60 + Math.random() * 50;
        targetX = this.defenderCenterX + (Math.random() > 0.5 ? offset : -offset);
      }

      this.tweens.add({
        targets: this,
        arrowX: targetX,
        duration: 300,
        ease: 'Quad.easeOut',
        onUpdate: () => {
          this.drawArrow(this.arrowX, arrowY);
        },
        onComplete: () => {
          // Brief pause, then resolve
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
    const scale = CHAOS_CONFIG.SCALE[distance];
    const canHalfWidth = (CHAOS_CONFIG.CAN_HIT_ZONE_BASE * scale) / 2;
    const bodyHalfWidth = (CHAOS_CONFIG.BODY_HIT_ZONE_BASE * scale) / 2;
    const dx = Math.abs(arrowX - this.defenderCenterX);

    if (dx <= canHalfWidth) return 'hit-can';
    if (dx <= bodyHalfWidth) return 'hit-body';
    return 'miss';
  }

  // ─── RESULT ANIMATION (BALL perspective) ───────────────────────────
  private playResultAnimation(outcome: ChaosOutcome): void {
    const loserId = outcome === 'hit-can' ? this.chaosData.defenderId : this.chaosData.throwerId;

    if (outcome === 'hit-can') {
      // Ball flies toward the can
      this.animateBallThrow(this.defenderCenterX, this.canCenterY, () => {
        this.cameras.main.flash(200, 255, 50, 50);
        this.cameras.main.shake(300, 0.02);
        this.showOutcomeText('HIT!', '#ff4444', `${this.chaosData.defenderName} is eliminated!`, () => {
          this.exitScene({ outcome, loserId });
        });
      });
    } else if (outcome === 'hit-body') {
      this.animateBallThrow(this.defenderCenterX, this.canCenterY + 40, () => {
        this.cameras.main.flash(200, 255, 140, 0);
        this.cameras.main.shake(200, 0.015);
        this.showOutcomeText('HIT BODY!', '#ff8800', `${this.chaosData.throwerName} is eliminated!`, () => {
          this.exitScene({ outcome, loserId });
        });
      });
    } else {
      // Miss — ball flies past
      const missX = this.arrowX > this.defenderCenterX
        ? this.defenderCenterX + 200
        : this.defenderCenterX - 200;
      this.animateBallThrow(missX, this.canCenterY - 20, () => {
        this.showOutcomeText('MISS!', '#888888', `${this.chaosData.throwerName} is eliminated!`, () => {
          this.exitScene({ outcome, loserId });
        });
      });
    }
  }

  // ─── RESULT ANIMATION (CAN perspective) ────────────────────────────
  private playCanResultAnimation(outcome: ChaosOutcome, throwerSprite: Phaser.GameObjects.Image): void {
    const loserId = outcome === 'hit-can' ? this.chaosData.defenderId : this.chaosData.throwerId;

    if (outcome === 'hit-can') {
      // Ball flies toward camera (first-person hit)
      this.animateBallTowardCamera(throwerSprite.x, throwerSprite.y, () => {
        this.cameras.main.flash(300, 255, 50, 50);
        this.cameras.main.shake(400, 0.03);
        this.showOutcomeText('KO!', '#ff0000', `${this.chaosData.defenderName} is eliminated!`, () => {
          this.exitScene({ outcome, loserId });
        });
      });
    } else {
      // Ball flies past
      this.animateBallPast(throwerSprite.x, throwerSprite.y, () => {
        this.showOutcomeText('MISS!', '#99e550', `${this.chaosData.throwerName} missed!`, () => {
          this.exitScene({ outcome, loserId });
        });
      });
    }
  }

  // ─── BALL ANIMATIONS ───────────────────────────────────────────────
  private animateBallThrow(targetX: number, targetY: number, onComplete: () => void): void {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;

    // Ball starts from bottom center (thrower's position)
    const ball = this.add.circle(W / 2, H - 100, 5, 0xff6600);
    ball.setDepth(50);

    this.tweens.add({
      targets: ball,
      x: targetX,
      y: targetY,
      scaleX: 0.6,
      scaleY: 0.6,
      duration: 500,
      ease: 'Quad.easeIn',
      onComplete: () => {
        ball.destroy();
        onComplete();
      },
    });
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
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    // Animate main text in
    this.tweens.add({
      targets: main,
      alpha: 1,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 300,
      ease: 'Back.easeOut',
    });

    // Sub text fades in slightly after
    this.tweens.add({
      targets: sub,
      alpha: 1,
      duration: 300,
      delay: 200,
    });

    // After showing, add continue button
    this.time.delayedCall(1200, () => {
      const continueText = this.add.text(W / 2, H / 2 + 80, actionPrompt('TAP TO CONTINUE', 'PRESS SPACE TO CONTINUE'), {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '8px',
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

  shutdown(): void {
    this.sweepTween?.stop();
    this.arrowGraphic?.destroy();
  }
}
