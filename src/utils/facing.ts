import Phaser from 'phaser';

export type Facing = 'left' | 'right' | 'center';

// The character art is drawn facing the viewer with a natural lean.
// 'left'/'right' mirror the art and add a subtle lean so all three
// orientations read differently; 'center' restores the original pose.
export function setFacing(sprite: Phaser.GameObjects.Image, facing: Facing): void {
  sprite.setFlipX(facing === 'left');
  sprite.setAngle(facing === 'left' ? -3 : facing === 'right' ? 3 : 0);
}
