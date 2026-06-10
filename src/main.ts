import Phaser from 'phaser';
import { gameConfig } from './config/game.config';
import AudioEngine from './audio/AudioEngine';

// Initialize the game when DOM is ready
window.addEventListener('load', () => {
  const game = new Phaser.Game(gameConfig);

  // Web Audio requires a user gesture before sound can play
  const unlockAudio = () => AudioEngine.unlock();
  window.addEventListener('pointerdown', unlockAudio);
  window.addEventListener('keydown', unlockAudio);

  // Store game instance globally for debugging (optional)
  (window as any).game = game;

  console.log('The Door - Game initialized!');
  console.log('Phaser version:', Phaser.VERSION);

  // Reload on orientation change to re-init with correct canvas dimensions
  window.addEventListener('orientationchange', () => {
    setTimeout(() => window.location.reload(), 100);
  });
});
