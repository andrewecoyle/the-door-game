export const GAME_CONSTANTS = {
  // Board configuration
  BOARD_SQUARES: 20,
  STARTING_LIVES: 3,
  JAIL_SQUARE: 10,
  DOOR_SQUARE: 20,
  CARD_SQUARE_INTERVAL: 4, // Every 4th square is a Card square

  // Gameplay
  DECISION_TIME_SECONDS: 5,
  NUMBER_OF_COLUMNS: 8, // 4 on each side

  // Players
  TOTAL_PLAYERS: 7,

  // Colors (NES-inspired palette)
  COLORS: {
    PRIMARY: 0x5b6ee1,
    SECONDARY: 0x639bff,
    DANGER: 0xd95763,
    SUCCESS: 0x4fa83d,
    WARNING: 0xfbf236,
    TEXT: 0xffffff,
    BACKGROUND: 0x2d2d2d,
    UI_DARK: 0x222034,
    UI_LIGHT: 0x99e550,
  },
};
