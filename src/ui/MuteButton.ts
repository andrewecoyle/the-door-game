import Phaser from 'phaser';
import AudioEngine from '../audio/AudioEngine';

// Small speaker toggle, usable in any scene. Also binds the M key.
export function createMuteButton(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  container.setDepth(200);

  const bg = scene.add.graphics();
  bg.fillStyle(0x333355, 0.8);
  bg.fillRoundedRect(-20, -20, 40, 40, 6);
  container.add(bg);

  const label = scene.add.text(0, 0, AudioEngine.isMuted() ? '♪/' : '♪', {
    fontFamily: '"Press Start 2P", cursive',
    fontSize: '12px',
    color: AudioEngine.isMuted() ? '#666666' : '#99e550',
  }).setOrigin(0.5);
  container.add(label);

  const refresh = () => {
    label.setText(AudioEngine.isMuted() ? '♪/' : '♪');
    label.setColor(AudioEngine.isMuted() ? '#666666' : '#99e550');
  };

  // Hit area larger than the visual for comfortable thumb taps.
  // (With setSize, container hit-test coords are display-origin offset: rect starts at 0,0.)
  container.setSize(56, 56);
  container.setInteractive(new Phaser.Geom.Rectangle(0, 0, 56, 56), Phaser.Geom.Rectangle.Contains);
  container.on('pointerdown', () => {
    AudioEngine.toggleMute();
    refresh();
  });

  scene.input.keyboard?.on('keydown-M', () => {
    AudioEngine.toggleMute();
    refresh();
  });

  return container;
}
