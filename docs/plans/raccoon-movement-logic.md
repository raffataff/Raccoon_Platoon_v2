# Raccoon Unit Movement Logic — Step-by-Step Documentation

> **Scope:** This doc covers the exact chain of events from the player right-clicking on the map to a raccoon unit arriving at its destination, including pathfinding, collision avoidance, sprite facing, and animation state transitions.
>
> **Key Files:** `js/input.js`, `js/game.js`, `js/unit.js`, `js/raccoon.js`, `js/utils.js`

---

## Table of Contents
1. [Phase 1: Input Detection & Command Initiation](#phase-1-input-detection--command-initiation)
2. [Phase 2: Formation & Target Assignment](#phase-2-formation--target-assignment)
3. [Phase 3: Pathfinding (A* + Smoothing)](#phase-3-pathfinding-a--smoothing)
4. [Phase 4: Movement Execution Per Frame](#phase-4-movement-execution-per-frame)
5. [Phase 5: Facing Angles & Sprite Direction](#phase-5-facing-angles--sprite-direction)
6. [Phase 6: Rendering the Sprite](#phase-6-rendering-the-sprite)
7. [Special Systems](#special-systems)

---

## Phase 1: Input Detection & Command Initiation

### 1.1 Right-Click Captured (`js/input.js`)

The `InputHandler` class attaches a `contextmenu` listener to the canvas.

```js
this.canvas.addEventListener('contextmenu', (event) => { ... })
```

**What it does:**
- Prevents the browser's default right-click menu (`event.preventDefault()`).
- Only acts if `game.gameState === 'RUNNING'` (or mission-ending states for menu suppression).
- Converts **screen pixel coordinates** → **world coordinates** using camera zoom and camera position:

```js
const worldX = game.cameraX + (screenX - canvasWidth / 2) / zoom + canvasWidth / (2 * zoom);
const worldY = game.cameraY + (screenY - canvasHeight / 2) / zoom + canvasHeight / (2 * zoom);
```

- Calls `game.handleRightClickCommand(worldX, worldY)`.

**Preconditions checked:**
- If any selected raccoon is currently aiming a grenade, right-click cancels the aim (not a move command).
- Ends any active left-mouse-button hold-fire action.
- Ends any active Ctrl-drag selection box.

---

## Phase 2: Formation & Target Assignment

### 2.1 `Game.handleRightClickCommand(worldX, worldY)` (`js/game.js`)

```js
if (selectedUnits.length > 0) {
    const formationPoints = calculateFormationPoints(worldX, worldY, selectedUnits, currentFormationType);
    selectedUnits.forEach((unit, index) => {
        const targetPoint = formationPoints[index] || { x: worldX, y: worldY };
        unit.setMoveTarget(targetPoint.x, targetPoint.y);
    });
}
```

**What it does:**
1. Calculates formation offsets for the entire selection.
2. Calls `unit.setMoveTarget(x, y)` on every alive player-controlled unit.

### 2.2 Formation Calculation (`Game.calculateFormationPoints`)

**Formation types:** `HORIZONTAL`, `VERTICAL`, `SQUARE`, `DIAMOND`

| Formation | Layout Logic |
|-----------|-------------|
| `HORIZONTAL` | Units placed side-by-side on a line centered on click. |
| `VERTICAL` | Units placed in a column centered on click. |
| `SQUARE` | 2-column grid; last row centers if odd count. |
| `DIAMOND` | Hardcoded row patterns per unit count (e.g. 4 units = `[1,2,1]`). |

**Spacing formula:**
```js
const spacing = (CONFIG.RACCOON_SIZE * 2) * formationSpacingMultiplier;
// Default multiplier = 3.5 (set in Game constructor)
```

This means raccoons are spaced **7× their radius apart** by default, preventing immediate overlap.

---

## Phase 3: Pathfinding (A* + Smoothing)

### 3.1 `Unit.setMoveTarget(worldX, worldY)` (`js/unit.js`)

This is the **entry point for all unit movement** (player and AI).

**Step-by-step logic:**

1. **Clear combat states:**
   ```js
   this.isPlayerDirectFiring = false;
   this.autoTarget = null;
   ```
   If the unit was holding position, that flag is cleared (for raccoons, not hostages).

2. **Clamp target to world bounds:**
   ```js
   clampedWorldX = max(size/2, min(worldX, WORLD_WIDTH - size/2))
   ```

3. **Resolve start cell:**
   - Converts unit position to grid coordinates.
   - If the unit is standing inside a blocked grid cell (and not phasing), searches a **2-cell radius** for the nearest walkable cell to use as the path start.
   - If no walkable start is found, the move command **fails** (`return false`).

4. **Resolve target cell:**
   - Converts clamped world target to grid coordinates.
   - If the target grid cell is blocked (and not phasing), it ray-marches **from target back toward the start** in whole-grid steps, looking for the first walkable cell.
   - If none is found, move command fails.

5. **Store final target:**
   ```js
   this.worldTargetX = finalWorldTargetX;
   this.worldTargetY = finalWorldTargetY;
   ```

6. **Calculate path:**
   ```js
   this.calculatePath(conceptualStartGrid, this.isPhasing)
   ```

### 3.2 `Unit.calculatePath()` — A* Grid Search

**Algorithm:** Standard A* with a `MinHeap` open list and `Set` closed list.

**Neighbor directions (8-way):**
```js
{ x: 0, y: -1, cost: 1 },      // N
{ x: 0, y: 1,  cost: 1 },      // S
{ x: -1, y: 0, cost: 1 },      // W
{ x: 1,  y: 0, cost: 1 },      // E
{ x: -1, y: -1, cost: SQRT2 }, // NW
{ x: 1,  y: -1, cost: SQRT2 }, // NE
{ x: -1, y: 1,  cost: SQRT2 }, // SW
{ x: 1,  y: 1,  cost: SQRT2 }  // SE
```

**Heuristic:** Euclidean distance (`Math.hypot(dx, dy)`).

**Blocked cell behavior:**
- If `navGrid[y][x] === 1` → blocked (unless `isPhasing === true`).
- **Corner-cutting prevention:** Diagonal moves are rejected if both adjacent cardinal cells are blocked.

**Output:** Array of grid coordinates from start → goal, reversed so index 0 is the start.

### 3.3 `smoothPath(rawPath, unitSize, level)` (`js/utils.js`)

**Purpose:** Converts the A* grid path into **world-coordinate waypoints** and removes unnecessary zig-zags.

**How it works:**
1. Starts with the first node as the "anchor".
2. From the anchor, checks every subsequent node (back-to-front) to find the **furthest node visible**.
3. **Visibility is NOT a single line.** It performs a **3-line corridor check** to ensure the unit's entire body fits:
   - Center line
   - Left shoulder offset by `pathingRadius`
   - Right shoulder offset by `pathingRadius`

```js
const pathingRadius = (unitSize / 2) + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 0);
```

4. If all three lines have line-of-sight, that node becomes the new anchor and the search repeats.
5. If no shortcut is found, it steps to the next node and tries again.

**Result:** `this.currentPath` is now an array of world-coordinate objects `{x, y}`.

---

## Phase 4: Movement Execution Per Frame

### 4.1 `Unit.update(deltaTime)` — The Frame Tick

Every frame, `Game.gameLoop()` calls `unit.update(deltaTime)`. Raccoon overrides `update()` but calls `super.update(deltaTime)` unless it is aiming a grenade.

**In `Unit.update()`:**
1. `_updateVelocity(deltaTime)` — samples position change every 0.1s to compute `currentVelocity`.
2. Phasing timer decrement (if active).
3. `_handleMovement(deltaTime)` — the core movement logic.
4. Combat handling (`_handlePlayerCombat` or `_handleEnemyCombat`).
5. **Visual state resolution** (idle / walk / fire) — see Phase 5.

### 4.2 `Unit._handleMovement(deltaTime)` — The Heavy Lifter

This is where the unit **actually moves** along its path.

#### 4.2.1 Early Exits

```js
if (isHoldingPosition && !isPhasing) {
    isMoving = false; currentPath = []; return;
}
if (!isAlive() || !isMoving) return;
if (path is empty or index out of bounds) {
    isMoving = false; return;
}
```

#### 4.2.2 Phasing Movement (Special Case)

If `isPhasing === true`:
- The unit **ignores obstacles and collision entirely**.
- Moves straight toward `currentPath[currentPathNodeIndex]` (or final target if no path).
- Slides at normal speed with simple ratio-based stepping.
- Clamped to world bounds.

#### 4.2.3 Normal Movement

**A. Get next waypoint:**
```js
const nextNode = currentPath[currentPathNodeIndex];
```

**B. Compute desired delta:**
```js
const dx = nextNode.x - this.x;
const dy = nextNode.y - this.y;
const dist = Math.hypot(dx, dy);
const moveSpeed = this.speed * deltaTime;
const moveRatio = Math.min(1, moveSpeed / dist);
let desiredDeltaX = dx * moveRatio;
let desiredDeltaY = dy * moveRatio;
```

**C. Unit Separation (anti-stack):**

Queries nearby units via the **spatial grid** (or falls back to team array if no grid).

```js
const SEPARATION_CHECK_RADIUS = this.size * 1.5;
const MIN_SEPARATION_DISTANCE_FACTOR = 0.95;
const SEPARATION_FORCE_FACTOR = 0.9;
```

For every overlapping friendly unit:
- Computes a push vector away from the neighbor.
- Scales push strength by how deep the overlap is.
- Averages all pushes and adds them to the desired delta.
- **Caps total movement** to 1.5× the original desired magnitude, or 1.2× max speed.

**D. Obstacle Collision Resolution:**

1. Tests the **combined move** (X + Y) against all `blocksMovement` obstacles.
2. If collision:
   - Tests **X-only** move. If clear → move only X.
   - Tests **Y-only** move. If clear → move only Y.
   - If both are clear, picks the axis **closest to the angle toward the node**.
   - If neither is clear → unit is **fully blocked**.

Collision shapes supported:
- Rectangle (AABB and rotated OBB)
- Circle
- Ellipse

**E. Node Arrival:**

```js
const arrivalTolerance = Math.max(moveSpeed * 0.3, this.size * 0.3);
```

If the unit is within `arrivalTolerance` of the next node:
- Snaps to the node position.
- Increments `currentPathNodeIndex`.
- If that was the **last node**:
  - If within `arrivalTolerance * 1.5` of the **final target** → `isMoving = false`.
  - Otherwise → calls `setMoveTarget(worldTargetX, worldTargetY)` to repath to the final destination.

**F. Full Block (Stuck) Handling:**

If the unit tried to move but made **zero progress** and a collision occurred:

1. **Nudge backward + sideways** to free the unit:
   ```js
   stepBackAngle = angleToNode + PI;
   sideNudgeAngle = angleToNode +/- PI/2;  // alternates left/right each time
   ```
2. Checks if the nudged spot is obstacle-free.
3. If the nudge spot is valid, moves the unit there.
4. **"Wait and See" + Throttled Repath:**
   - If the unit is **close to its final target** (`< size * 3`), it does **NOT** repath. It simply waits.
   - Otherwise, if `repathCooldown <= 0`, it recalculates the path from its current position.
   - Sets a **random cooldown** (`0.5s + Math.random() * 1.0s`) to prevent synchronized swarm repathing.

**G. World Bounds Clamp:**
```js
this.x = clamp(this.x, size/2, WORLD_WIDTH - size/2);
this.y = clamp(this.y, size/2, WORLD_HEIGHT - size/2);
```

**H. Store movement for animation:**
```js
this.lastDeltaX = this.x - originalX;
this.lastDeltaY = this.y - originalY;
```

---

## Phase 5: Facing Angles & Sprite Direction

### 5.1 Angle Properties on Every Unit

| Property | Meaning |
|----------|---------|
| `this.facingAngle` | The direction the unit's **body** is facing. |
| `this.gunAimAngle` | The direction the unit is **aiming its weapon**. |

Both are stored as **radians** in standard mathematical orientation:
- `0` = East (right)
- `PI/2` = South (down)
- `PI` = West (left)
- `-PI/2` (or `3*PI/2`) = North (up)

### 5.2 How `facingAngle` is Updated (`Unit.update()`)

After `_handleMovement()`, the visual state is resolved:

```js
if (isFiringThisFrame) {
    this.currentVisualState = 'fire';
    this.facingAngle = this.gunAimAngle;
} else if (hasTarget && isOrderedToFire) {
    this.currentVisualState = 'idle';
    this.facingAngle = this.gunAimAngle; // Face target even if not firing
} else if (isActuallyMovingForBobbing) {
    this.currentVisualState = 'walk';
    this.facingAngle = Math.atan2(this.lastDeltaY, this.lastDeltaX);
} else {
    this.currentVisualState = 'idle';
}
```

**Summary:**
- **When moving:** Body faces the **movement direction** (`atan2(lastDeltaY, lastDeltaX)`).
- **When targeting/aiming:** Body faces the **aim direction**.
- **When firing:** Body faces the **aim direction** (and triggers `_executeFire`).

### 5.3 `updateVisualDirection(angleToUse)` — 8-Way Sprite Mapping

Converts any radian angle into one of **8 cardinal/intercardinal directions**:

```js
const slice = Math.PI / 4;      // 45° per sector
const offset = Math.PI / 8;     // 22.5° half-offset to center sectors
```

| Angle Range (normalized 0–2π) | Direction String |
|------------------------------|------------------|
| `[337.5°, 22.5°)` | `'e'` |
| `[22.5°, 67.5°)` | `'se'` |
| `[67.5°, 112.5°)` | `'s'` |
| `[112.5°, 157.5°)` | `'sw'` |
| `[157.5°, 202.5°)` | `'w'` |
| `[202.5°, 247.5°)` | `'nw'` |
| `[247.5°, 292.5°)` | `'n'` |
| `[292.5°, 337.5°)` | `'ne'` |

**Direction change tracking:**
```js
if (newDirection !== this.currentVisualDirection) {
    this.previousVisualDirection = this.currentVisualDirection;
    this.currentVisualDirection = newDirection;
}
```

This preserves the previous direction, which is useful for sprite transition logic (though the current renderer does not tween between them).

---

## Phase 6: Rendering the Sprite

### 6.1 `Unit.render(ctx)` (`js/unit.js`)

**Bobbing offset (walking only):**
```js
if (isActuallyMoving && bobbingEnabled) {
    yOffset = Math.sin(this.bobbingCounter) * bobbingAmplitude;
    // bobbingCounter is incremented by: deltaTime * speed * speedFactor
}
```

### 6.2 Sprite Key Construction

```js
let actionFolder = this.currentVisualState; // 'idle', 'walk', or 'fire'
let spriteKey = `${this.spriteBaseName}_${actionFolder}_${this.currentVisualDirection}`;
```

**Example keys:**
- `raccoon_walk_n`
- `raccoon_sergeant_idle_se`
- `possum_grunt_fire_w`

**Fallback chain:**
1. Try `{base}_{action}_{direction}` (e.g. `raccoon_walk_n`).
2. If missing, try `{base}_idle_{direction}` (e.g. `raccoon_idle_n`).
3. If still missing, use `{base}_idle_s` as ultimate fallback.

**Preloading (from `Game.preloadUnitAssets()`):**
All 8 directions for `idle` are preloaded per rank:
```js
actions: { idle: ['n', 'ne', 'e', 'se', 's', 'sw', 'w', 'nw'] }
```

**Note:** The preloader only loads `idle` variants. The renderer falls back to `idle` if a `walk` or `fire` sprite is missing.

### 6.3 Sprite Transform

```js
ctx.translate(this.x, this.y + yOffset);
// ... draw sprite centered:
ctx.drawImage(sprite, -spriteWidth/2, -spriteHeight/2, spriteWidth, spriteHeight);
```

- Sprite is **centered on the unit's position**.
- Y-offset applies the bobbing effect.
- If phasing, `globalAlpha = 0.5`.

### 6.4 Dead Sprite Rendering

When `!isAlive()`:
- Picks a random dead sprite file from the unit's configured dead sprite list.
- Applies a small random rotation (`±0.25 rad`).
- Offset downward so the sprite lies on the ground:
  ```js
  drawOffsetY = -spriteHeight * 0.8 + (this.size / 2);
  ```

---

## Special Systems

### Phasing (`forcePhaseOut`)

- Triggered by the `U` key (`forcePhaseOut(1.0)` on all player units).
- While phasing:
  - Unit ignores all obstacles.
  - Unit ignores all collision (including unit separation).
  - Pathfinding still runs, but blocked cells are treated as walkable.
  - Sprite is drawn at 50% opacity.
- When phasing ends:
  - If still far from target → repaths normally.
  - If near target → stops.

### Holding Position (`H` key / hostage logic)

- Sets `isHoldingPosition = true`.
- In `_handleMovement()`, this is an immediate exit:
  ```js
  isMoving = false; currentPath = []; lastDeltaX = 0; lastDeltaY = 0;
  ```

### Grenade Aiming Movement Override (`Raccoon._handleAimingMovement`)

When `isAimingGrenade === true`:
- `super.update(deltaTime)` is **skipped**.
- The raccoon **does not move** unless `grenadeMoveToTargetPos` is set (auto-move to throw range).
- `facingAngle` and `gunAimAngle` are locked to the **mouse cursor**:
  ```js
  this.facingAngle = Math.atan2(mousePos.worldY - this.y, mousePos.worldX - this.x);
  ```

### Collision Shapes Used in Pathing

| Shape | Function |
|-------|----------|
| Circle | `circleOverlap` |
| Axis-aligned rectangle | `rectCircleOverlap` |
| Rotated rectangle | `obbCircleOverlap` |
| Ellipse | `circleEllipseOverlap` |

The unit's collision body is always a **circle** with radius `size/2 + 1.2` (with a small buffer for collision checks).

---

## Quick Reference: Movement Data Flow

```
Player Right-Click
    ↓
InputHandler.contextmenu  →  screen→world coords
    ↓
Game.handleRightClickCommand(worldX, worldY)
    ↓
Game.calculateFormationPoints  →  [ {x,y}, {x,y}, ... ]
    ↓
Unit.setMoveTarget(x, y)  (per unit)
    ↓
Unit.calculatePath()
    ├─ findPath()         [A* on grid]
    └─ smoothPath()       [3-line corridor LOS]
    ↓
this.currentPath = [ {x,y}, {x,y}, ... ]
this.isMoving = true
    ↓
(Every frame)
Unit.update(deltaTime)
    ↓
Unit._handleMovement(deltaTime)
    ├─ Compute desired delta toward next node
    ├─ Apply separation forces from nearby units
    ├─ Resolve obstacle collisions (X/Y split)
    ├─ Arrival check → next node / repath / stop
    └─ Clamp to world bounds
    ↓
Unit.update() (visual state)
    ├─ If moving → currentVisualState = 'walk', facingAngle = movement angle
    ├─ If targeting → currentVisualState = 'idle', facingAngle = aim angle
    └─ Call updateVisualDirection(facingAngle)
    ↓
Unit.render(ctx)
    ├─ Compute bobbing Y-offset
    ├─ Build sprite key:  {base}_{state}_{direction}
    └─ ctx.drawImage(...)
```

---

## Constants & Config Values

| Config Key | Typical Value | Purpose |
|------------|---------------|---------|
| `CONFIG.RACCOON_SPEED` | ~120 | World units per second. |
| `CONFIG.RACCOON_SIZE` | ~28 | Diameter of unit circle. |
| `CONFIG.INPUT_DRAG_THRESHOLD` | 5 px | Minimum drag distance for selection box. |
| `CONFIG.UNIT_PATHING_RADIUS_BUFFER` | ~0–4 | Extra clearance for path smoothing shoulder checks. |
| `CONFIG.UNIT_VISUALS.UNIT_BOBBING_AMPLITUDE` | ~2–4 px | How high the sprite bobs while walking. |
| `CONFIG.UNIT_VISUALS.UNIT_BOBBING_SPEED_FACTOR` | ~0.02 | Scales bobbing frequency by movement speed. |
| `CONFIG.UNIT_VISUALS.UNIT_PHASING_OPACITY` | 0.5 | Alpha while phasing. |
| `CONFIG.INITIAL_FORMATION_SPACING` | 3.5 | Multiplier for formation spacing. |

---

*Document generated from codebase analysis of `input.js`, `game.js`, `unit.js`, `raccoon.js`, and `utils.js`.*
