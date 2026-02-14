import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { MenuScene } from '../scenes/MenuScene';
import { CharacterSelectScene } from '../scenes/CharacterSelectScene';
import { GameScene } from '../scenes/GameScene';
import { ChaosMinigameScene } from '../scenes/ChaosMinigameScene';
import { getCanvasDimensions } from '../utils/layout-helpers';

const { width, height } = getCanvasDimensions();

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width,
  height,
  parent: 'game-container',
  backgroundColor: '#2d2d2d',
  pixelArt: true, // Enable pixel-perfect rendering
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, CharacterSelectScene, GameScene, ChaosMinigameScene],
};
