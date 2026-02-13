import Phaser from 'phaser';
import { gameConfig } from './config/game.config';

// Initialize the game when DOM is ready
window.addEventListener('load', () => {
  const game = new Phaser.Game(gameConfig);

  // Store game instance globally for debugging (optional)
  (window as any).game = game;

  console.log('The Door - Game initialized!');
  console.log('Phaser version:', Phaser.VERSION);
});
