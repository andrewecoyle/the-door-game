# The Door - Development Progress

## ✅ Portrait "Climb" Layout — Direction D (June 2026)

Implemented the design handoff (`design_handoff_climb_layout`) for mobile:
- Board is a single vertical column of wide tiles — BEGIN at the bottom
  climbing to a glowing DOOR at the top; JAIL is a pill beside square 10.
- The seven characters flank the board on two rails (Kingston/Innis/Fara/
  Miles up the left, Gary Kent/Stacy/Paul down the right) as large cream
  avatar tiles framed to head + torso, with heart-pip lives, a pulsing
  purple border + "TURN" tag for the active player, and JAIL/RIP badges.
- Player tokens are small colored dots on the tiles (the human's is larger
  with a white ring).
- Turn log: a 3-entry strip above the controls that expands into a
  full-screen overlay (index ticks, tap scrim to close). Log names are
  colored per player; bad/warn actions tint red/yellow.
- Size audit across all screens: dialogs, chaos minigame, character select,
  and menu all render ~1.4–1.5× larger in portrait (44pt-class tap targets,
  9–18px type instead of 6–10px). Landscape is unchanged.

## ✅ Full Revamp Pass (June 2026)

**Bug fixes:**
- Chaos minigame POV was inverted in two cases — the human thrower could be
  reduced to watching an RNG roll. POV now derives from who is human:
  human throws → BALL (aiming) view; human defends vs AI → first-person CAN
  view; AI vs AI → spectator view.
- Chaos role choice now belongs to the TARGET (per PRD), not the drawer.
  Human targets get a dialog; AI targets choose by aim skill.
- Drawn cards were never discarded, so the deck silently ran dry during
  Lightning Round. Cards are now discarded and the deck reshuffles.
- Turn order tracked by player ID, so eliminations no longer skip turns.
- Target-select dialog overflowed with 6 targets (last player hidden under
  CANCEL); spacing is now dynamic.
- Character sprites shipped with opaque cream backgrounds; BootScene now
  strips them at load (edge flood fill) so sprites render cleanly.

**Chaos minigame:**
- Difficulty meter (4 color-coded pips: EASY/TRICKY/HARD/BRUTAL by distance).
- Ball throw is a real parabolic arc landing where the arrow stopped;
  hit-can knocks the can spinning off the defender's head; hit-body flashes
  the defender red; misses sail past (and the defender turns to watch).
- AI hit chance = PRD distance table × thrower aim-skill modifier.

**Audio (all synthesized, no asset files):**
- `src/audio/` — Web Audio chiptune engine. Dark minor-key music for menu,
  character select, in-game, chaos (tense ostinato) and a victory fanfare.
- SFX: button clicks, character select, dice ticks/landing, card draw and
  flip, arrow ticks, throw whoosh, can clang, body thud, miss, death
  arpeggio, resurrect, jail, lightning round.
- Mute toggle (♪ button in every scene, or press M); persists in localStorage.

**UI/UX:**
- Card draws fly in and flip to reveal the card name, with the drawer's name.
- Sprite facing system (left/right/center via `src/utils/facing.ts`); HUD
  portraits face the board, minigame actors face each other.
- Win screen: confetti, bouncing winner sprite, victory music.
- Menu: pixel-art door with glowing light, favicon, version text.
- HUD shows "In JAIL" status.

## Prototype Status: Phases 0-2 Complete ✅

### ✅ Phase 0: Project Setup (Complete)
**What was built:**
- Vite + TypeScript + Phaser 3 project structure
- ESLint configuration with TypeScript
- Retro pixelated rendering setup
- Press Start 2P font integration
- Game configuration with NES-inspired colors

**Files created:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - Strict TypeScript configuration  
- `vite.config.ts` - Build system setup
- `index.html` - Canvas and retro styling
- `src/main.ts` - Game initialization
- `src/config/game.config.ts` - Phaser configuration
- `src/config/constants.ts` - Game constants

---

### ✅ Phase 1: Menu & Character Select (Complete)
**What was built:**
- Full menu system with retro aesthetic
- Character selection screen with all 7 characters
- Loading screen with progress bar
- Scene transitions with smooth fades
- Interactive character cards with hover effects

**Files created:**
- `src/scenes/BootScene.ts` - Asset loading with progress bar
- `src/scenes/MenuScene.ts` - Main menu with animated title
- `src/scenes/CharacterSelectScene.ts` - Interactive character selection
- `src/config/characters.config.ts` - All 7 character definitions with AI strategies

**Features:**
- All 7 character sprites from `b-m-pixels-images/` folder integrated
- Character descriptions based on manuscript
- Color-coded character cards
- Smooth animations and hover effects
- "START GAME" button after selection

---

### ✅ Phase 2: Board & Movement (Complete)
**What was built:**
- Full 20-square board with special squares
- Jail position (off square 10)
- Door at square 20
- 8 decorative columns (beer cans)
- Animated die rolling
- Game pieces for all 7 players
- Turn management system
- Player life tracking
- Win condition detection

**Files created:**
- `src/types/game.types.ts` - TypeScript interfaces
- `src/utils/board-calculations.ts` - Position calculations
- `src/game-objects/Board.ts` - Board rendering
- `src/game-objects/GamePiece.ts` - Player pieces with animations
- `src/game-objects/Die.ts` - Die with roll animation
- `src/systems/PlayerManager.ts` - Player state management
- `src/systems/TurnManager.ts` - Turn order and game flow
- `src/ui/PlayerHUD.ts` - Lives and position display
- `src/scenes/GameScene.ts` - Full game loop implementation

**Features:**
- 20 squares in straight path
- Every 4th square marked as "Card" (blue)
- Square 10 with Jail off to the side (red)
- Square 20 as Door/win square (green)
- Animated die rolling (1-6, spinning animation)
- 7 game pieces with player colors and initials
- Smooth piece movement along board
- Turn-based gameplay (human + 6 AI)
- Player HUD showing all 7 players' status
- Current player highlighted
- Win detection (reach Door OR last standing)
- Game over screen with winner

**Gameplay:**
- Human player clicks "ROLL DIE" button
- AI players auto-roll after 1-second delay
- Pieces animate smoothly to new positions
- Console logs when landing on Card squares
- Game ends when someone reaches square 20
- ESC to return to menu anytime

---

## What's Playable Right Now

You can:
1. Start the game and see the retro menu
2. Select your character from 7 options
3. Watch the board load with all squares, jail, and door
4. Roll the die and move your piece
5. See AI opponents take turns automatically
6. Race to square 20 (the Door)
7. See the winner screen when game ends

**To test:**
```bash
npm run dev
```

Game opens at http://localhost:3000

---

## Next: Phase 3 - Card System

**What needs to be built:**
- Card deck system (shuffle, draw, discard)
- 6 card types:
  1. Judge or Jury
  2. Summon or Exile  
  3. Resurrect or Reap
  4. Chaos (William Tell mini-game)
- Card choice UI dialogs
- Target player selection UI
- 5-second decision timer
- Card effect execution
- Basic AI card decision-making

**When Phase 3 is complete:**
- Full card mechanics working
- Players can draw and use cards
- Life loss/gain from cards
- Jail mechanic (Exile card)
- Player resurrection (Resurrect card)
- Complete prototype ready for playtesting

---

## Technical Stats

**Total files created:** 25+
**Lines of code:** ~2,500+
**Build time:** ~3 seconds
**Bundle size:** 1.5MB (Phaser 3 included)
**TypeScript errors:** 0 ✅
**Phases complete:** 2/3 (prototype)
**Est. time to Phase 3:** 1-2 sessions

---

## Architecture Highlights

**Clean separation of concerns:**
- `scenes/` - Game states and UI
- `game-objects/` - Reusable visual entities
- `systems/` - Game logic (pure functions/classes)
- `ui/` - UI components
- `types/` - TypeScript definitions
- `config/` - Game configuration

**Async/await for animations:**
- Die rolling returns Promise
- Piece movement returns Promise  
- Smooth turn flow with proper sequencing

**Type-safe:**
- Full TypeScript with strict mode
- Interfaces for all game entities
- No `any` types used

---

## Character Data (from manuscript)

**AI Strategies assigned:**
- Miles: Balanced (protagonist, strategic)
- Fara: Cautious (builds alliances, excellent aim 0.9)
- Innis: Aggressive (eagle-eye 0.95)
- Kingston: Cautious (methodical, aim 0.7)
- Gary Kent: Aggressive (reactive, aim 0.5)
- Stacy: Balanced (unpredictable, poor aim 0.3)
- Paul: Random (chaotic, aim 0.4 - first eliminated in manuscript)

Aim skills ready for Phase 4 Chaos card implementation.

---

**Phase 2 Complete!** The game is now playable as a basic board game with dice rolling and movement. Ready to add card mechanics in Phase 3.
