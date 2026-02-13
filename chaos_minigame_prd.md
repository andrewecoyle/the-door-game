# THE DOOR — Chaos Mini-Game PRD

## Overview
When a player draws a **Chaos** card, a targeting mini-game begins between the drawing player and a chosen target. The mechanic is inspired by retro free-throw shooting games: a horizontal arrow sweeps left-right over a target, and the player must press a button to stop it at the right moment.

---

## 1. Chaos Card Flow

### Step 1 — Target Selection
- The drawing player selects a **living player** (cannot target themselves).
- Standard target selection UI (cycle left/right, hotkeys 1–9, confirm with Space).

### Step 2 — Role Choice
- The **target** (not the drawing player) chooses one of two roles:
  - **CAN** — "I'll stand with the can on my head; you throw."
    - Drawing player becomes the **Thrower** (active player in the mini-game).
    - Target becomes the **Defender** (passive; no input).
  - **BALL** — "Give me the ball; I'll throw."
    - Target becomes the **Thrower** (active player in the mini-game).
    - Drawing player becomes the **Defender** (passive; no input).

### Step 3 — Mini-Game
- See Section 2 (BALL perspective) and Section 3 (CAN perspective).

### Step 4 — Resolution
- See Section 4 (Outcomes).

---

## 2. BALL Perspective (Thrower is Human)

The human player is the **Thrower**. They see the target (Defender) on screen and must aim.

### Camera / Layout
- The Defender's character sprite is displayed at a distance from the Thrower.
- A **can** sits on top of the Defender's head (the target to hit).
- The Defender's visual size and the can's hit zone scale based on **distance** (see Section 5).

### Arrow Mechanic
- A **horizontal arrow indicator** sweeps left-right above the Defender's head, centered over the can.
- The sweep range extends beyond the can on both sides (so missing is possible).
- The player presses **Space** (or action button) to stop the arrow.

### Scaling by Distance
Both of these scale together based on distance (Section 5):

| Factor | Close (dist 1) | Far (dist 4) |
|--------|----------------|---------------|
| **Target sprite size** | Large | Small |
| **Arrow speed** | Slow | Fast |

- The can's hit zone shrinks proportionally with sprite size.
- Combined effect: at distance 1, the target is big and the arrow is slow (easy). At distance 4, the target is small and the arrow is fast (hard).

### Arrow Stop Resolution
When the player presses the action button, the arrow stops. The result is determined by where it stopped:

| Arrow Position | Result |
|----------------|--------|
| Over the **can** | **Hit Can** — Defender dies |
| Over the **Defender's body** | **Hit Body** — Thrower dies |
| Past the Defender entirely | **Miss** — Thrower dies |

---

## 3. CAN Perspective (Thrower is AI)

The human player chose CAN, meaning they are the **Defender**. The AI is the Thrower. The Defender has **no input** — they watch the result play out.

### Camera / Layout
- **First-person perspective** from the Defender's point of view — the camera is close, as if looking through the Defender's eyes.
- The AI Thrower's character sprite is visible at a distance (sized by distance, see Section 5).
- The arrow sweeps left-right above the Defender's head (visible at the top of screen, large, since camera is "on" the Defender).

### AI Throw Resolution
- The AI does **not** use the arrow mechanic. Instead, the outcome is determined by a **probability roll** based on distance:

| Distance | AI Hit Chance |
|----------|---------------|
| 1 (adjacent) | 55% |
| 2 | 43% |
| 3 | 32% |
| 4 (far) | 20% |

- Linear interpolation: `hitChance = 55 - (distance - 1) * 11.67` (rounded to nearest %).
- Formula simplified: `hitChance = Math.round(55 - (distance - 1) * (35 / 3))`

### AI Animation
- Regardless of the actual probability result, the arrow animates sweeping for a brief moment, then **stops at a position consistent with the outcome**:
  - If **hit**: arrow stops over the can. A ball animation flies toward the camera (toward the Defender's first-person view). Screen flash / impact effect.
  - If **miss**: arrow stops off-target. Ball flies past. "MISS" text displayed.

---

## 4. Outcomes

There are only three possible outcomes (flinch mechanic is excluded):

| Outcome | Who Dies | Trigger |
|---------|----------|---------|
| **Hit Can** | Defender | Arrow stops over the can |
| **Hit Body** | Thrower | Arrow stops over the Defender's body (BALL perspective only) |
| **Miss** | Thrower | Arrow stops past the Defender entirely (BALL) or AI roll fails (CAN) |

### Death Resolution
```
loser.lives = 0
loser.dead = true
```

After resolution:
```
if (livingPlayers.length === 1) → that player wins
else → nextTurn()
```

---

## 5. Distance Calculation

Distance between two players is based on their **board positions** and accounts for the board's two-row layout.

### Board Layout Reference
```
Top row:    1  2  3  [4]  5  6  7  [8]  9  10  11  [12]  13  14  15  [16]  17  18  19  [20]
Bottom row: (players on the bottom row are visually below, across from corresponding top-row tiles)
```

Players on the **top row** are: positions displayed above the board.
Players on the **bottom row** are: positions displayed below the board.

### Distance Rules
1. **Same side of the board**: distance = number of player slots apart.
   - Miles (top, slot 1) → Fara (top, slot 2) = **distance 1**
   - Miles (top, slot 1) → Innis (top, slot 3) = **distance 2**

2. **Opposite sides of the board**: distance = horizontal slot difference + 1 (crossing penalty).
   - Miles (top, slot 1) → Gary Kent (bottom, slot 1) = **distance 2** (0 horizontal + 1 crossing + 1 base)
   - Miles (top, slot 1) → Stacy (bottom, slot 2) = **distance 3** (1 horizontal + 1 crossing + 1 base)
   - Miles (top, slot 1) → Paul (bottom, slot 3) = **distance 4** (2 horizontal + 1 crossing + 1 base)

3. **Distance is capped at 4** (maximum).

### Formula
```
sameRow = (playerA.row === playerB.row)
slotDiff = abs(playerA.slot - playerB.slot)

if (sameRow):
    distance = slotDiff
else:
    distance = slotDiff + 1 + 1   // +1 for crossing, +1 base (minimum cross-board distance is 2)

distance = clamp(distance, 1, 4)
```

> **Note**: "slot" refers to the player's display position among the row of player portraits (1-indexed), NOT the board tile number. Slot assignment is based on order of characters in that row.

---

## 6. Difficulty Tuning Reference

### Arrow Speed (pixels per second, approximate)
| Distance | Arrow Speed | Description |
|----------|-------------|-------------|
| 1 | 150 px/s | Slow, easy to time |
| 2 | 225 px/s | Moderate |
| 3 | 300 px/s | Fast |
| 4 | 375 px/s | Very fast, hard to time |

### Target Sprite Scale
| Distance | Scale | Visual |
|----------|-------|--------|
| 1 | 1.0x | Full size |
| 2 | 0.75x | Slightly smaller |
| 3 | 0.55x | Noticeably smaller |
| 4 | 0.4x | Small, challenging |

> These values are starting points and should be tuned through playtesting.

---

## 7. UI / Scene Requirements

### BALL Scene (Human is Thrower)
- Background: simplified game board or neutral backdrop.
- Defender sprite centered, scaled by distance.
- Can sprite on Defender's head.
- Arrow indicator sweeping horizontally above the can.
- Action prompt: "Press SPACE to throw!"
- Result animation: ball trajectory, hit/miss effect, death animation if applicable.

### CAN Scene (Human is Defender, First-Person)
- Background: first-person view — looking outward from Defender's position.
- AI Thrower sprite visible at distance (scaled by distance).
- Arrow sweeping at top of screen (large, close to camera).
- No action prompt (player is passive).
- AI pauses briefly, then arrow stops (pre-determined by probability).
- Result animation:
  - **Hit**: ball flies toward camera, impact flash, "KO" text.
  - **Miss**: ball flies past, "MISS" text, Thrower reacts.

### Shared UI Elements
- Player names and life counts visible.
- Distance indicator (optional, e.g., "Distance: 3").
- Brief intro text: "[Player] draws CHAOS!" → target selection → role choice → mini-game.

---

## 8. Audio Cues (Stretch Goal)
| Event | Sound |
|-------|-------|
| Arrow sweeping | Tick-tick-tick (metronome) |
| Space pressed | Thud / release |
| Hit can | Clang + crowd roar |
| Hit body | Dull impact + gasp |
| Miss | Whoosh + silence |
| Ball toward camera (CAN hit) | Whistle + impact |

---

## 9. Out of Scope (For Now)
- Flinch mechanic (removed for simplicity).
- Defender input during CAN perspective.
- Multiplayer networking (local play only).
- Custom aim patterns (vertical, arc, etc.).
