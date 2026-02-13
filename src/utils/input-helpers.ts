export function isTouchDevice(): boolean {
  return 'ontouchend' in document.documentElement || navigator.maxTouchPoints > 0;
}

export function actionPrompt(touchText: string, keyboardText: string): string {
  return isTouchDevice() ? touchText : keyboardText;
}
