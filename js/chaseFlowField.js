// js/chaseFlowField.js

// Step costs of the field: 5 orthogonal, 7 diagonal (7/5 = 1.4, close to the sqrt(2) A* uses).
// Both are below the 8-bucket ring of the queue, so a cell never lands in the bucket being processed.
const _CFF_ORTH_COST = 5;
const _CFF_DIAG_COST = 7;
const _CFF_UNREACHED = 0xFFFF;
const _CFF_MAX_DIST = 0xFFFE;
const _CFF_MAX_ROOTS = 250;

/**
 * Shared distance field toward the player's units for enemies chasing them from far away
 * (CONFIG.PATHFINDING.CHASE_FLOW_FIELD). One multi-source Dijkstra over the nav grid from every
 * living player-controlled unit (same 8-connected moves and corner rule as _astar), built a
 * slice per frame into a back buffer and swapped in when complete. Each cell also remembers
 * which unit it leads to.
 *
 * Unit.calculatePath asks pathFrom() first for enemies: when the destination is near the unit
 * the enemy's cell leads to, the path is a downhill walk over the field (a few hundred cell
 * reads instead of an A* search that hits PATHFINDING_MAX_EXPANSIONS). The walk stops short of
 * that unit, where the usual path-end repath runs a short A* the rest of the way. The field is
 * only kept up to date while enemies ask for it.
 *
 * Works on a copy of the nav grid with a blocked border one cell wide (`walls`), so neighbours
 * are plain index offsets with no bounds checks; field indices use that padded layout too.
 */
class ChaseFlowField {
    constructor(game) {
        this.game = game;
        this.grid = null;               // nav grid the buffers belong to (a new mission brings a new one)
        this.width = 0;                 // nav grid size in cells
        this.height = 0;
        this.stride = 0;                // padded row length (width + 2)
        this.walls = null;              // padded nav grid copy: 1 = blocked
        this.wallsVersion = -1;         // level.navGridVersion the copy was taken at
        this.offsets = new Int32Array(8);
        this.front = null;              // complete field: { dist, label, roots, navVersion }
        this.back = null;               // field being built
        this.building = false;
        this.buckets = null;            // Dial's bucket queue: 8 growable stacks of cell indices
        this.bucketLen = new Int32Array(8);
        this.curDist = 0;
        this.curPos = 0;
        this.lastDemand = -Infinity;    // performance.now() of the last request the field could serve
        this.lastBuildStart = -Infinity;
        this.units = null;              // living player-controlled units this frame
        this.stats = { served: 0, builds: 0, buildMs: 0 };
    }

    _reset(grid, level) {
        this.grid = grid;
        this.width = level.gridWidth;
        this.height = level.gridHeight;
        this.stride = this.width + 2;
        const n = this.stride * (this.height + 2);
        this.walls = new Uint8Array(n);
        this.wallsVersion = -1;
        // Same order as _PATH_DIR_X/_PATH_DIR_Y: 4 orthogonal, then 4 diagonal.
        for (let k = 0; k < 8; k++) this.offsets[k] = _PATH_DIR_Y[k] * this.stride + _PATH_DIR_X[k];
        const makeField = () => ({ dist: new Uint16Array(n), label: new Uint8Array(n), roots: [], navVersion: -1 });
        this.front = null;
        this.back = makeField();
        this._spare = makeField();
        if (!this.buckets) {
            this.buckets = [];
            for (let i = 0; i < 8; i++) this.buckets.push(new Int32Array(4096));
        }
        this.building = false;
        this.lastBuildStart = -Infinity;
    }

    _copyWalls(level) {
        const walls = this.walls, stride = this.stride, grid = this.grid;
        walls.fill(1);
        for (let y = 0; y < this.height; y++) walls.set(grid[y], (y + 1) * stride + 1);
        this.wallsVersion = level.navGridVersion;
    }

    // Once per running frame, before enemies move. Rebuilds the field while enemies are using it.
    update() {
        const cfg = CONFIG.PATHFINDING.CHASE_FLOW_FIELD;
        const level = this.game.level;
        const grid = level && level.navGrid;
        if (!cfg || !cfg.ENABLED || !grid) return;
        if (grid !== this.grid || level.gridWidth !== this.width || level.gridHeight !== this.height) this._reset(grid, level);
        this.units = this.game.getLivingPlayerControlledUnits();

        const now = performance.now();
        if (now - this.lastDemand > cfg.IDLE_SECONDS * 1000) return;
        const t0 = performance.now();
        if (!this.building) {
            if (now - this.lastBuildStart < cfg.MIN_REBUILD_INTERVAL * 1000 || !this._needsRebuild(cfg, level)) return;
            this._startBuild(level);
            this.lastBuildStart = now;
        }
        const done = this._continueBuild(t0 + cfg.BUILD_BUDGET_MS);
        const spent = performance.now() - t0;
        this.stats.buildMs += spent;
        // Shares the frame's enemy path budget with the A* searches served after it.
        this.game.pathfindingMsThisFrame += spent;
        if (done) {
            const finished = this.back;
            this.back = this.front || this._spare;
            this.front = finished;
            this.building = false;
            this.stats.builds++;
        }
    }

    _needsRebuild(cfg, level) {
        const f = this.front;
        if (!f || f.navVersion !== level.navGridVersion) return true;
        const units = this.units;
        if (Math.min(units.length, _CFF_MAX_ROOTS) !== f.roots.length) return true;
        const moveCells = cfg.REBUILD_MOVE_CELLS;
        const cell = level.gridCellSize;
        for (let i = 0; i < f.roots.length; i++) {
            const r = f.roots[i];
            if (r.unit !== units[i]) return true;
            if (Math.abs(Math.floor(r.unit.x / cell) - r.x) > moveCells || Math.abs(Math.floor(r.unit.y / cell) - r.y) > moveCells) return true;
        }
        return false;
    }

    _startBuild(level) {
        if (this.wallsVersion !== level.navGridVersion) this._copyWalls(level);
        const f = this.back;
        f.dist.fill(_CFF_UNREACHED);
        f.roots.length = 0;
        f.navVersion = level.navGridVersion;
        this.bucketLen.fill(0);
        this.curDist = 0;
        this.curPos = 0;
        const walls = this.walls, stride = this.stride, w = this.width, h = this.height, cell = level.gridCellSize;
        const units = this.units;
        for (let i = 0; i < units.length && i < _CFF_MAX_ROOTS; i++) {
            const u = units[i];
            let gx = Math.max(0, Math.min(w - 1, Math.floor(u.x / cell)));
            let gy = Math.max(0, Math.min(h - 1, Math.floor(u.y / cell)));
            // A unit standing on a blocked cell (pushed into an obstacle's margin) roots at the nearest walkable one.
            if (walls[(gy + 1) * stride + gx + 1] === 1) {
                let found = false;
                for (let r = 1; r <= 3 && !found; r++) {
                    for (let dy = -r; dy <= r && !found; dy++) {
                        for (let dx = -r; dx <= r; dx++) {
                            const nx = gx + dx, ny = gy + dy;
                            if (nx >= 0 && nx < w && ny >= 0 && ny < h && walls[(ny + 1) * stride + nx + 1] === 0) { gx = nx; gy = ny; found = true; break; }
                        }
                    }
                }
            }
            f.roots.push({ unit: u, x: gx, y: gy });
            const idx = (gy + 1) * stride + gx + 1;
            if (walls[idx] === 0 && f.dist[idx] !== 0) {
                f.dist[idx] = 0;
                f.label[idx] = i;
                this._push(0, idx);
            }
        }
        this.building = true;
    }

    _push(bucket, idx) {
        let arr = this.buckets[bucket];
        const len = this.bucketLen[bucket];
        if (len >= arr.length) {
            const grown = new Int32Array(arr.length * 2);
            grown.set(arr);
            arr = this.buckets[bucket] = grown;
        }
        arr[len] = idx;
        this.bucketLen[bucket] = len + 1;
    }

    // Expands cells in order of distance until done (true) or past the deadline (false; resumes next call).
    _continueBuild(deadline) {
        const f = this.back, dist = f.dist, label = f.label;
        const walls = this.walls, off = this.offsets, stride = this.stride;
        const bucketLen = this.bucketLen;
        let processed = 0;
        for (;;) {
            const b = this.curDist & 7;
            const arr = this.buckets[b];
            const len = bucketLen[b];
            const d = this.curDist;
            const dOrth = d + _CFF_ORTH_COST, dDiag = d + _CFF_DIAG_COST;
            while (this.curPos < len) {
                const idx = arr[this.curPos++];
                if (dist[idx] !== d) continue; // reached more cheaply after it was queued
                const lab = label[idx];
                if (dOrth <= _CFF_MAX_DIST) {
                    for (let k = 0; k < 4; k++) {
                        const n = idx + off[k];
                        if (walls[n] === 0 && dOrth < dist[n]) {
                            dist[n] = dOrth; label[n] = lab; this._push(dOrth & 7, n);
                        }
                    }
                }
                if (dDiag <= _CFF_MAX_DIST) {
                    for (let k = 4; k < 8; k++) {
                        const n = idx + off[k];
                        // Diagonal: don't squeeze between two blocked corners (as in _astar).
                        if (walls[n] === 0 && dDiag < dist[n] &&
                            !(walls[idx + _PATH_DIR_X[k]] === 1 && walls[idx + _PATH_DIR_Y[k] * stride] === 1)) {
                            dist[n] = dDiag; label[n] = lab; this._push(dDiag & 7, n);
                        }
                    }
                }
                if ((++processed & 1023) === 0 && performance.now() > deadline) return false;
            }
            bucketLen[b] = 0;
            this.curPos = 0;
            let pending = 0;
            for (let i = 0; i < 8; i++) pending += bucketLen[i];
            if (pending === 0) return true;
            this.curDist++;
        }
    }

    /**
     * Grid path (same shape as findPath's) from startGrid toward the player unit the field leads to,
     * or null when the field shouldn't serve this request: destination not near that unit, the
     * enemy already close (A* is cheap), field not built yet, or the cell is unreachable.
     */
    pathFrom(startGrid, endGrid) {
        const cfg = CONFIG.PATHFINDING.CHASE_FLOW_FIELD;
        const units = this.units;
        if (!cfg || !cfg.ENABLED || !units || units.length === 0 || this.grid !== this.game.level.navGrid) return null;
        const minCells = cfg.MIN_CHASE_CELLS;
        if (Math.max(Math.abs(startGrid.x - endGrid.x), Math.abs(startGrid.y - endGrid.y)) < minCells) return null;

        // Only chases count as demand: the destination has to be close to one of the player's units.
        const cell = this.game.level.gridCellSize, radius = cfg.TARGET_RADIUS_CELLS;
        let nearUnit = false;
        for (let i = 0; i < units.length; i++) {
            const u = units[i];
            if (Math.abs(Math.floor(u.x / cell) - endGrid.x) <= radius && Math.abs(Math.floor(u.y / cell) - endGrid.y) <= radius) { nearUnit = true; break; }
        }
        if (!nearUnit) return null;
        this.lastDemand = performance.now();

        const f = this.front;
        if (!f || f.navVersion !== this.game.level.navGridVersion) return null;
        const walls = this.walls, off = this.offsets, stride = this.stride, dist = f.dist;
        let idx = (startGrid.y + 1) * stride + startGrid.x + 1;
        let d = dist[idx];
        if (d === _CFF_UNREACHED || d < minCells * _CFF_ORTH_COST) return null;
        const root = f.roots[f.label[idx]];
        if (!root || !root.unit.isAlive() ||
            Math.abs(root.x - endGrid.x) > radius || Math.abs(root.y - endGrid.y) > radius) return null;

        const stopDist = cfg.STOP_CELLS * _CFF_ORTH_COST;
        const maxLen = cfg.MAX_WALK_CELLS;
        const path = [{ x: startGrid.x, y: startGrid.y }];
        while (d > stopDist && path.length < maxLen) {
            let best = -1, bestD = d;
            for (let k = 0; k < 8; k++) {
                const n = idx + off[k];
                if (walls[n] === 1 || dist[n] >= bestD) continue;
                if (k >= 4 && walls[idx + _PATH_DIR_X[k]] === 1 && walls[idx + _PATH_DIR_Y[k] * stride] === 1) continue;
                best = n; bestD = dist[n];
            }
            if (best < 0) break;
            idx = best; d = bestD;
            const px = idx % stride;
            path.push({ x: px - 1, y: (idx - px) / stride - 1 });
        }
        if (path.length < 2) return null;
        this.stats.served++;
        return path;
    }
}
