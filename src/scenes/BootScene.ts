import Phaser from 'phaser';
import { CHARACTERS } from '../config/characters.config';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222034, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 30, 320, 50);

    const loadingText = this.add
      .text(width / 2, height / 2 - 50, 'Loading...', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '16px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const percentText = this.add
      .text(width / 2, height / 2, '0%', {
        fontFamily: '"Press Start 2P", cursive',
        fontSize: '14px',
        color: '#99e550',
      })
      .setOrigin(0.5);

    // Update loading bar
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x5b6ee1, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 20, 300 * value, 30);
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // Load character sprites
    CHARACTERS.forEach((char) => {
      this.load.image(char.id, char.spritePath);
    });
  }

  create(): void {
    // The character art ships with an opaque cream background baked in —
    // strip it (flood fill from the edges) so sprites render cleanly.
    CHARACTERS.forEach((char) => {
      this.makeBackgroundTransparent(char.id);
    });

    this.scene.start('MenuScene');
  }

  private makeBackgroundTransparent(key: string): void {
    const texture = this.textures.get(key);
    if (!texture || texture.key === '__MISSING') return;

    const source = texture.getSourceImage() as HTMLImageElement;
    const w = source.width;
    const h = source.height;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(source, 0, 0);

    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    // Background color sampled from the top-left corner
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];
    const tolerance = 28;
    const matchesBg = (i: number): boolean =>
      Math.abs(data[i] - bgR) <= tolerance &&
      Math.abs(data[i + 1] - bgG) <= tolerance &&
      Math.abs(data[i + 2] - bgB) <= tolerance;

    // BFS flood fill from all border pixels so interior colors are untouched
    const visited = new Uint8Array(w * h);
    const queue: number[] = [];
    for (let x = 0; x < w; x++) {
      queue.push(x, (h - 1) * w + x);
    }
    for (let y = 0; y < h; y++) {
      queue.push(y * w, y * w + (w - 1));
    }

    while (queue.length > 0) {
      const p = queue.pop()!;
      if (visited[p]) continue;
      visited[p] = 1;
      if (!matchesBg(p * 4)) continue;

      data[p * 4 + 3] = 0; // transparent

      const x = p % w;
      const y = (p / w) | 0;
      if (x > 0) queue.push(p - 1);
      if (x < w - 1) queue.push(p + 1);
      if (y > 0) queue.push(p - w);
      if (y < h - 1) queue.push(p + w);
    }

    ctx.putImageData(imageData, 0, 0);
    this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }
}
