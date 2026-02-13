# THE DOOR — Card & Lightning Round Rules (PRD Specification)

## Overview
This document defines all card behaviors and the Lightning Round logic for **The Door** game in a fully implementable, deterministic, engineering-ready format. It is written to support direct translation into code or LLM‑driven generation.

---

# 1. Card Types & Logic
When a player lands on a card tile **or** Lightning Round is active, they draw a card and must make a choice. All card effects resolve immediately.

---

## 1.1 Judge or Jury
### Options
- **Judge**
- **Jury**

### Judge (Option A)
- Player selects **one living target** (not themselves).
- Effect: target loses **1 life**.
- If the target reaches 0 lives → they die.

### Jury (Option B)
Two-step process:
1. Player chooses a **selector** (a living player who is not themselves).
2. Selector chooses a **victim** (any living player except themselves).
3. Effect: victim loses **2 lives**.
4. If victim reaches 0 lives → they die.

### Additional Notes
- Player may not choose themselves as the selector.
- Selector may not choose themselves as the victim.
- Drawing player cannot override selector’s choice.

---

## 1.2 Summon or Exile
### Options
- **Summon**
- **Exile**

### Summon (Option A)
- Player selects a **living target**.
- Effect:
  - Move target to the player’s current board position.
  - No life loss.
  - No skipped turn.

### Exile (Option B)
- Player selects a **living target**.
- Effect:
  - Target loses **1 life**.
  - Target is moved to **Jail** (tile 10).
  - `target.skip = 1` (they skip their next turn).
  - `target.jailed = true`.

---

## 1.3 Resurrect or Reap
### Options
- **Resurrect** (only available if at least one player is dead)
- **Reap**

### Resurrect (Option A)
- Player selects **one dead target**.
- Effect:
  - `target.dead = false`
  - `target.lives = 1`
  - `target.pos = 0` (start position)
  - Reset jail & skip flags

### Reap (Option B)
- Player selects **one living target**.
- Effect:
  - `target.lives = 0`
  - `target.dead = true`

---

## 1.4 Chaos (Navy Rules)
### Step 1 — Drawing player selects a **living target**.
Cannot target themselves.

### Step 2 — Target chooses:
- **CAN** (they stand with can on head; drawing player throws)
- **BALL** (they become the thrower; drawing player becomes the defender)

### Step 3 — Throw Mini‑Game Resolution
Outcome determined by aim position and flinch logic.

#### Outcomes
| Outcome | Result |
|--------|--------|
| **Hit Can** | Defender dies |
| **Miss Can** | Thrower dies |
| **Hit Body** | Thrower dies |
| **Defender Flinches** | Defender dies |

**Death is immediate.**
State update:
```
target.lives = 0
target.dead = true
```

---

# 2. Lightning Round Rules
Lightning Round activates globally when all living players have taken a minimum number of turns.

### Trigger Condition
```
If min(player.turnsTaken among all living players) >= 4:
    Lightning Round = ON
```

### Lightning Round Behavior
- **Every turn automatically produces a card draw**, even if player does not land on a card tile.
- Lightning Round **never disables** once active.

---

# 3. Targeting Rules (Global)
- Players cannot target themselves unless the card explicitly allows it (none do).
- Only living players can be targeted, except:
  - Resurrect specifically targets dead players.
- Jailed players **can** be targeted.
- Selection must support both:
  - Cycling (left/right)
  - Hotkeys (1–9)
  - Confirmation (Space)

---

# 4. End‑of‑Turn Flow
After any card effect (including Chaos mini‑game):
```
Check for deaths.
If only one player alive → that player wins.
Else → nextTurn()
```

---

# 5. Implementation Notes
- Card UI must always allow switching between the two choices for each card.
- Choices must be explicit and separate: e.g., the player selects “Summon” then selects a target.
- The system must not auto‑choose unless AI is acting.
- Lightning Round overrides tile‑based card triggers.

---

If you'd like, I can also generate:
- A fully validated JSON schema of these rules
- A state-machine diagram
- An event flow diagram
- A complete rewrite of your in-game card engine following this PRD

