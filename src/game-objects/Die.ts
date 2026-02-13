import Phaser from 'phaser';
import { GAME_CONSTANTS } from '../config/constants';

export class Die extends Phaser.GameObjects.Container {
  private dieGraphic: Phaser.GameObjects.Graphics;
  private valueText: Phaser.GameObjects.Text;
  private currentValue: number = 1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);

    this.dieGraphic = scene.add.graphics();
    this.add(this.dieGraphic);

    this.valueText = scene.add.text(0, 0, '1', {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '24px',
      color: '#000000',
    });
    this.valueText.setOrigin(0.5);
    this.add(this.valueText);

    this.drawDie();
  }

  private drawDie(): void {
    this.dieGraphic.clear();
    this.dieGraphic.fillStyle(0xffffff, 1);
    this.dieGraphic.fillRect(-30, -30, 60, 60);
    this.dieGraphic.lineStyle(3, GAME_CONSTANTS.COLORS.UI_DARK, 1);
    this.dieGraphic.strokeRect(-30, -30, 60, 60);
  }

  async roll(): Promise<number> {
    // Random value 1-6
    const finalValue = Phaser.Math.Between(1, 6);

    // Animate rolling
    return new Promise((resolve) => {
      let rollCount = 0;
      this.scene.time.addEvent({
        delay: 100,
        repeat: 15,
        callback: () => {
          const tempValue = Phaser.Math.Between(1, 6);
          this.setValue(tempValue);
          rollCount++;

          if (rollCount >= 15) {
            this.setValue(finalValue);
            resolve(finalValue);
          }
        },
      });

      // Add rotation animation
      this.scene.tweens.add({
        targets: this,
        angle: 360,
        duration: 1600,
        ease: 'Cubic.easeOut',
      });
    });
  }

  private setValue(value: number): void {
    this.currentValue = value;
    this.valueText.setText(value.toString());
  }

  getValue(): number {
    return this.currentValue;
  }
}
