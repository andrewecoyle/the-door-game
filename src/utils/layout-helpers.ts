export function isPortrait(): boolean {
  return window.innerWidth < window.innerHeight;
}

export function getCanvasDimensions(): { width: number; height: number } {
  return isPortrait()
    ? { width: 600, height: 1050 }
    : { width: 1050, height: 600 };
}
