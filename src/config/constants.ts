// Chaos mini-game distance-based scaling
export const CHAOS_CONFIG = {
  // Sprite scale by distance (index = distance 1–4)
  SCALE: [1.0, 1.0, 0.75, 0.55, 0.4] as const,
  // Arrow speed in px/s by distance
  SPEED: [150, 150, 225, 300, 375] as const,
  // AI hit chance % by distance
  AI_HIT_CHANCE: [55, 55, 43, 32, 20] as const,
  // Arrow sweep half-width in pixels
  SWEEP_HALF_WIDTH: 120,
  // Hit zone base width at distance 1 (pixels)
  CAN_HIT_ZONE_BASE: 50,
  // Body hit zone base width at distance 1 (pixels)
  BODY_HIT_ZONE_BASE: 80,
} as const;

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
