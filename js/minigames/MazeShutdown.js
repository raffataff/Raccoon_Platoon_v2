/**
 * MazeShutdown ("Circuit Breach") — the first concrete mini-game.
 *
 * Fantasy: you are a *shutdown pulse* injected into the anti-air turret's
 * circuitry. Thread it through the maze of traces to the reactor core before
 * the turret finishes REBOOTING, while avoiding roaming live current.
 *   - Reach the core  -> reactor drains to grey -> success (turret shuts down).
 *   - Reboot hits zero -> turret comes back online -> fail.
 *   - Touch live current -> power surge -> knocked back to the input, time lost.
 *
 * Deactivation theme: everything trends toward OFF. The win animation *drains*
 * the core; failure *re-energises* it. Difficulty scales grid size, reboot
 * time, and hazard count via CONFIG.MINIGAMES.MAZE_SHUTDOWN.
 *
 * Extends MiniGame. Balance values come from this.config (no magic numbers).
 * Colours are pure cosmetics and kept local.
 */
class MazeShutdown extends MiniGame {
    getTitle() { return this.config.TITLE || 'CIRCUIT BREACH'; }
    getSubtitle() { return this.config.SUBTITLE || ''; }
    getInstructions() { return this.config.INSTRUCTIONS || ''; }

    init() {
        const c = this.config;
        const diff = this.difficulty;

        // --- Grid dimensions scale with difficulty -----------------------
        const cols = this._clampInt(
            (c.BASE_COLS || 8) + Math.floor((diff - 1) * (c.COLS_PER_DIFFICULTY || 1)),
            3, c.MAX_COLS || 15);
        const rows = this._clampInt(
            (c.BASE_ROWS || 8) + Math.floor((diff - 1) * (c.ROWS_PER_DIFFICULTY || 1)),
            3, c.MAX_ROWS || 15);
        this.cols = cols;
        this.rows = rows;

        // --- Reboot clock -----------------------------------------------
        this.timeLimit = Math.max(
            c.TIME_LIMIT_MIN || 15,
            (c.TIME_LIMIT_BASE || 30) + (diff - 1) * (c.TIME_LIMIT_PER_DIFFICULTY || 0));
        this.timeLeft = this.timeLimit;

        // --- Layout / geometry ------------------------------------------
        const margin = 46;
        const availW = this.width - margin * 2;
        const availH = this.height - margin * 2;
        this.cellSize = Math.floor(Math.min(availW / cols, availH / rows));
        this.offsetX = Math.floor((this.width - this.cellSize * cols) / 2);
        this.offsetY = Math.floor((this.height - this.cellSize * rows) / 2);
        this.moveSpeed = this.cellSize / 0.075; // px/sec pulse travel

        // --- Build the maze (seeded recursive backtracker) --------------
        this._buildMaze(cols, rows);

        // Start = bottom-left "input", core = top-right "reactor".
        this.startCell = { x: 0, y: rows - 1 };
        this.coreCell = { x: cols - 1, y: 0 };

        // --- Player pulse -----------------------------------------------
        this.player = {
            cx: this.startCell.x, cy: this.startCell.y,
            px: this._cellCenterX(this.startCell.x),
            py: this._cellCenterY(this.startCell.y),
            tx: this._cellCenterX(this.startCell.x),
            ty: this._cellCenterY(this.startCell.y),
            moving: false,
        };
        this.heldDirs = [];        // stack of currently-held directions
        this.moveCooldown = 0;
        this.trail = [];           // short pulse trail (capped)
        this._trailMax = 9;

        // --- Live-current hazards ---------------------------------------
        this.sparks = [];
        this._spawnSparks();

        this.invulnT = 0;          // brief i-frames after a surge
        this.flashT = 0;           // red surge flash
        this.phase = 'PLAYING';    // 'PLAYING' | 'DRAINING' | 'OFFLINE' | 'FAILED'
        this.drainT = 0;
        this._drainTime = 0.7;
        this.pulseClock = 0;       // cosmetic core pulsing

        // --- Repel pulse (limited active ability) -----------------------
        this.charges = this._clampInt(
            (c.PULSE_CHARGES_BASE || 2) + (diff - 1) * (c.PULSE_CHARGES_PER_DIFFICULTY || 0),
            0, c.PULSE_CHARGES_MAX || 5);
        this.pulseFx = [];         // expanding shockwave rings
        this._pulseKeyDown = false;
    }

    // ---------------------------------------------------------------------
    // Maze generation
    // ---------------------------------------------------------------------
    _buildMaze(cols, rows) {
        // cell.walls = [top, right, bottom, left] (true = wall present)
        const cells = new Array(rows);
        for (let y = 0; y < rows; y++) {
            cells[y] = new Array(cols);
            for (let x = 0; x < cols; x++) {
                cells[y][x] = { walls: [true, true, true, true], visited: false };
            }
        }
        // Iterative backtracker from bottom-left (matches start cell).
        const stack = [{ x: 0, y: rows - 1 }];
        cells[rows - 1][0].visited = true;
        const dirs = [
            { dx: 0, dy: -1, w: 0, o: 2 }, // up
            { dx: 1, dy: 0, w: 1, o: 3 },  // right
            { dx: 0, dy: 1, w: 2, o: 0 },  // down
            { dx: -1, dy: 0, w: 3, o: 1 }, // left
        ];
        while (stack.length) {
            const cur = stack[stack.length - 1];
            // gather unvisited neighbours
            const options = [];
            for (let i = 0; i < 4; i++) {
                const nx = cur.x + dirs[i].dx;
                const ny = cur.y + dirs[i].dy;
                if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
                if (cells[ny][nx].visited) continue;
                options.push(i);
            }
            if (options.length === 0) { stack.pop(); continue; }
            const d = dirs[options[this.randInt(0, options.length - 1)]];
            const nx = cur.x + d.dx;
            const ny = cur.y + d.dy;
            cells[cur.y][cur.x].walls[d.w] = false;   // carve from current
            cells[ny][nx].walls[d.o] = false;         // carve into neighbour
            cells[ny][nx].visited = true;
            stack.push({ x: nx, y: ny });
        }
        this.cells = cells;
    }

    _spawnSparks() {
        const c = this.config;
        const count = this._clampInt(
            Math.round((c.SPARKS_BASE || 0) + (this.difficulty - 1) * (c.SPARKS_PER_DIFFICULTY || 0)),
            0, c.SPARKS_MAX || 6);
        const minDist = c.SPARK_MIN_START_DIST || 3;
        const stepInterval = c.SPARK_STEP_INTERVAL || 0.3;
        let attempts = 0;
        while (this.sparks.length < count && attempts < 400) {
            attempts++;
            const x = this.randInt(0, this.cols - 1);
            const y = this.randInt(0, this.rows - 1);
            const dStart = Math.abs(x - this.startCell.x) + Math.abs(y - this.startCell.y);
            const dCore = Math.abs(x - this.coreCell.x) + Math.abs(y - this.coreCell.y);
            if (dStart < minDist || dCore < 1) continue;
            this.sparks.push({
                cx: x, cy: y,
                px: this._cellCenterX(x), py: this._cellCenterY(y),
                tx: this._cellCenterX(x), ty: this._cellCenterY(y),
                lastDir: -1,
                timer: stepInterval * this.rand(), // desync
                interval: stepInterval,
                fleeT: 0,               // >0 while repelled: flees the player
            });
        }
    }

    // ---------------------------------------------------------------------
    // Input
    // ---------------------------------------------------------------------
    handleKeyDown(key, evt) {
        if (this.phase !== 'PLAYING') return;
        if (key === ' ' || key === 'Spacebar' || key === 'Enter') {
            if (!this._pulseKeyDown) { this._pulseKeyDown = true; this._firePulse(); }
            return;
        }
        const dir = this._dirFromKey(key);
        if (dir === -1) return;
        if (this.heldDirs.indexOf(dir) === -1) this.heldDirs.push(dir);
        // Immediate response on fresh press.
        this.moveCooldown = 0;
    }

    handleKeyUp(key) {
        if (key === ' ' || key === 'Spacebar' || key === 'Enter') { this._pulseKeyDown = false; return; }
        const dir = this._dirFromKey(key);
        if (dir === -1) return;
        const i = this.heldDirs.indexOf(dir);
        if (i !== -1) this.heldDirs.splice(i, 1);
    }

    // Emit a repel shockwave from the pulse: sparks within radius are driven
    // back and flee the player for a while. Consumes one charge.
    _firePulse() {
        if (this.charges <= 0) return;
        this.charges--;
        // Tradeoff: firing bleeds a little reboot time.
        const cost = this.config.PULSE_TIME_COST || 0;
        if (cost > 0) {
            this.timeLeft = Math.max(0, this.timeLeft - cost);
            if (this.timeLeft <= 0) { this.timeLeft = 0; this.phase = 'FAILED'; this.fail(); return; }
        }
        const p = this.player;
        const radius = (this.config.PULSE_RADIUS_CELLS || 2.6) * this.cellSize;
        this.pulseFx.push({ x: p.px, y: p.py, t: 0, dur: this.config.PULSE_FX_TIME || 0.38, maxR: radius });
        const r2 = radius * radius;
        for (let i = 0; i < this.sparks.length; i++) {
            const s = this.sparks[i];
            const dx = s.px - p.px, dy = s.py - p.py;
            if (dx * dx + dy * dy <= r2) this._repelSpark(s);
        }
    }

    // Drive a spark away from the player along open corridors, then flee.
    _repelSpark(s) {
        const pushCells = this.config.PULSE_PUSH_CELLS || 3;
        for (let step = 0; step < pushCells; step++) {
            const dir = this._fleeDir(s);
            if (dir === -1) break;
            if (dir === 0) s.cy -= 1; else if (dir === 1) s.cx += 1;
            else if (dir === 2) s.cy += 1; else if (dir === 3) s.cx -= 1;
            s.lastDir = dir;
        }
        s.px = s.tx = this._cellCenterX(s.cx);
        s.py = s.ty = this._cellCenterY(s.cy);
        s.fleeT = this.config.PULSE_FLEE_TIME || 2.2;
        s.timer = s.interval * 0.5;
    }

    // Open neighbour that maximises distance from the player (for fleeing).
    _fleeDir(s) {
        const cell = this.cells[s.cy][s.cx];
        const p = this.player;
        let best = -1, bestD = -Infinity;
        for (let d = 0; d < 4; d++) {
            if (cell.walls[d]) continue;
            let nx = s.cx, ny = s.cy;
            if (d === 0) ny -= 1; else if (d === 1) nx += 1;
            else if (d === 2) ny += 1; else if (d === 3) nx -= 1;
            const dist = Math.abs(nx - p.cx) + Math.abs(ny - p.cy);
            if (dist > bestD) { bestD = dist; best = d; }
        }
        return best;
    }

    // Pointer support: tap an orthogonally-adjacent cell to step toward it.
    handlePointerDown(x, y) {
        if (this.phase !== 'PLAYING') return;
        const gx = Math.floor((x - this.offsetX) / this.cellSize);
        const gy = Math.floor((y - this.offsetY) / this.cellSize);
        const dx = gx - this.player.cx;
        const dy = gy - this.player.cy;
        if (Math.abs(dx) + Math.abs(dy) !== 1) return;
        let dir = -1;
        if (dx === 1) dir = 1; else if (dx === -1) dir = 3;
        else if (dy === 1) dir = 2; else if (dy === -1) dir = 0;
        if (dir !== -1) { this.moveCooldown = 0; this._tryStep(dir); }
    }

    _dirFromKey(key) {
        switch (key) {
            case 'ArrowUp': case 'w': case 'W': return 0;
            case 'ArrowRight': case 'd': case 'D': return 1;
            case 'ArrowDown': case 's': case 'S': return 2;
            case 'ArrowLeft': case 'a': case 'A': return 3;
            default: return -1;
        }
    }

    // ---------------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------------
    update(dt) {
        this.elapsed += dt;
        this.pulseClock += dt;
        if (this.flashT > 0) this.flashT = Math.max(0, this.flashT - dt);
        if (this.invulnT > 0) this.invulnT = Math.max(0, this.invulnT - dt);

        if (this.phase === 'DRAINING') {
            this.drainT += dt;
            if (this.drainT >= this._drainTime) { this.phase = 'OFFLINE'; this.succeed(); }
            return;
        }
        if (this.phase !== 'PLAYING') return;

        // Reboot clock.
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.phase = 'FAILED'; this.fail(); return; }

        // Player movement.
        this._updatePlayer(dt);

        // Hazards.
        this._updateSparks(dt);

        // Collisions with live current.
        if (this.invulnT <= 0) this._checkSurge();

        // Reached the core?
        if (this.player.cx === this.coreCell.x && this.player.cy === this.coreCell.y
            && this._arrived()) {
            this.phase = 'DRAINING';
            this.drainT = 0;
            this.heldDirs.length = 0;
        }
    }

    _updatePlayer(dt) {
        const p = this.player;
        // Animate toward target cell centre.
        if (p.moving) {
            const dx = p.tx - p.px, dy = p.ty - p.py;
            const dist = Math.hypot(dx, dy);
            const step = this.moveSpeed * dt;
            if (dist <= step || dist < 0.5) {
                p.px = p.tx; p.py = p.ty; p.moving = false;
            } else {
                p.px += (dx / dist) * step;
                p.py += (dy / dist) * step;
            }
        }
        // Trail (capped ring).
        this.trail.push(p.px, p.py);
        if (this.trail.length > this._trailMax * 2) this.trail.splice(0, this.trail.length - this._trailMax * 2);

        // Step to next cell when arrived and a direction is held.
        if (this.moveCooldown > 0) this.moveCooldown -= dt;
        if (!p.moving && this.heldDirs.length > 0 && this.moveCooldown <= 0) {
            const dir = this.heldDirs[this.heldDirs.length - 1];
            this._tryStep(dir);
        }
    }

    _tryStep(dir) {
        const p = this.player;
        if (p.moving) return;
        const cell = this.cells[p.cy][p.cx];
        if (cell.walls[dir]) return; // wall blocks
        if (dir === 0) p.cy -= 1;
        else if (dir === 1) p.cx += 1;
        else if (dir === 2) p.cy += 1;
        else if (dir === 3) p.cx -= 1;
        p.tx = this._cellCenterX(p.cx);
        p.ty = this._cellCenterY(p.cy);
        p.moving = true;
        this.moveCooldown = this.config.MOVE_COOLDOWN || 0.085;
    }

    _updateSparks(dt) {
        for (let i = 0; i < this.sparks.length; i++) {
            const s = this.sparks[i];
            if (s.fleeT > 0) s.fleeT = Math.max(0, s.fleeT - dt);
            // Animate toward target.
            const dx = s.tx - s.px, dy = s.ty - s.py;
            const dist = Math.hypot(dx, dy);
            const step = (this.cellSize / s.interval) * dt;
            if (dist <= step || dist < 0.5) { s.px = s.tx; s.py = s.ty; }
            else { s.px += (dx / dist) * step; s.py += (dy / dist) * step; }

            s.timer -= dt;
            if (s.timer <= 0) {
                s.timer += s.interval;
                this._advanceSpark(s);
            }
        }
        // Age the shockwave rings.
        for (let i = this.pulseFx.length - 1; i >= 0; i--) {
            this.pulseFx[i].t += dt;
            if (this.pulseFx[i].t >= this.pulseFx[i].dur) this.pulseFx.splice(i, 1);
        }
    }

    _advanceSpark(s) {
        // While repelled, always take the corridor that leads away from the player.
        if (s.fleeT > 0) {
            const dir = this._fleeDir(s);
            if (dir === -1) return;
            if (dir === 0) s.cy -= 1; else if (dir === 1) s.cx += 1;
            else if (dir === 2) s.cy += 1; else if (dir === 3) s.cx -= 1;
            s.lastDir = dir;
            s.tx = this._cellCenterX(s.cx);
            s.ty = this._cellCenterY(s.cy);
            return;
        }
        const cell = this.cells[s.cy][s.cx];
        // Open neighbours (walls absent), preferring not to reverse.
        const opts = [];
        for (let d = 0; d < 4; d++) {
            if (cell.walls[d]) continue;
            opts.push(d);
        }
        if (opts.length === 0) return;
        let choice;
        const nonReverse = opts.filter(d => d !== ((s.lastDir + 2) % 4));
        if (nonReverse.length > 0) choice = nonReverse[this.randInt(0, nonReverse.length - 1)];
        else choice = opts[this.randInt(0, opts.length - 1)];
        if (choice === 0) s.cy -= 1;
        else if (choice === 1) s.cx += 1;
        else if (choice === 2) s.cy += 1;
        else if (choice === 3) s.cx -= 1;
        s.lastDir = choice;
        s.tx = this._cellCenterX(s.cx);
        s.ty = this._cellCenterY(s.cy);
    }

    _checkSurge() {
        const p = this.player;
        const hitR = this.cellSize * 0.45;
        for (let i = 0; i < this.sparks.length; i++) {
            const s = this.sparks[i];
            if (Math.abs(s.px - p.px) < hitR && Math.abs(s.py - p.py) < hitR) {
                this._surge();
                return;
            }
        }
    }

    _surge() {
        // Power surge: knock the pulse back to the input, burn reboot time.
        const penalty = this.config.SURGE_TIME_PENALTY || 3;
        this.timeLeft = Math.max(0, this.timeLeft - penalty);
        const p = this.player;
        p.cx = this.startCell.x; p.cy = this.startCell.y;
        p.px = p.tx = this._cellCenterX(p.cx);
        p.py = p.ty = this._cellCenterY(p.cy);
        p.moving = false;
        this.heldDirs.length = 0;
        this.trail.length = 0;
        this.invulnT = 0.7;
        this.flashT = 0.35;
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.phase = 'FAILED'; this.fail(); }
    }

    // ---------------------------------------------------------------------
    // Footer hooks
    // ---------------------------------------------------------------------
    getProgress() {
        if (this.phase === 'OFFLINE' || this.phase === 'DRAINING') return 1;
        return this.timeLimit > 0 ? this.timeLeft / this.timeLimit : 0;
    }

    getStatusText() {
        if (this.phase === 'OFFLINE' || this.phase === 'DRAINING') return 'REACTOR OFFLINE';
        if (this.phase === 'FAILED') return 'TURRET REBOOTED';
        return 'REBOOT IN ' + this.timeLeft.toFixed(1) + 's';
    }

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------
    render(ctx) {
        const C = MazeShutdown.COLORS;
        const cs = this.cellSize;

        // Backdrop.
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, this.width, this.height);
        this._renderBoardDots(ctx);

        // Maze walls as glowing circuit traces.
        const drainMix = this.phase === 'DRAINING' ? (this.drainT / this._drainTime)
            : (this.phase === 'OFFLINE' ? 1 : 0);
        ctx.lineWidth = Math.max(2, cs * 0.12);
        ctx.lineCap = 'round';
        ctx.strokeStyle = C.trace;
        ctx.shadowColor = C.traceGlow;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const w = this.cells[y][x].walls;
                const x0 = this.offsetX + x * cs;
                const y0 = this.offsetY + y * cs;
                if (w[0]) { ctx.moveTo(x0, y0); ctx.lineTo(x0 + cs, y0); }
                if (w[3]) { ctx.moveTo(x0, y0); ctx.lineTo(x0, y0 + cs); }
                if (x === this.cols - 1 && w[1]) { ctx.moveTo(x0 + cs, y0); ctx.lineTo(x0 + cs, y0 + cs); }
                if (y === this.rows - 1 && w[2]) { ctx.moveTo(x0, y0 + cs); ctx.lineTo(x0 + cs, y0 + cs); }
            }
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Start node ("input").
        this._renderNode(ctx, this.startCell, C.input, 0.30, 'IN');

        // Reactor core.
        this._renderCore(ctx, drainMix);

        // Sparks (live current).
        for (let i = 0; i < this.sparks.length; i++) this._renderSpark(ctx, this.sparks[i]);

        // Repel shockwave rings.
        for (let i = 0; i < this.pulseFx.length; i++) this._renderPulseRing(ctx, this.pulseFx[i]);

        // Player pulse + trail.
        if (this.phase !== 'FAILED') this._renderPulse(ctx);

        // Charges indicator.
        this._renderCharges(ctx);

        // Surge flash.
        if (this.flashT > 0) {
            ctx.fillStyle = 'rgba(255,70,60,' + (this.flashT * 0.6).toFixed(3) + ')';
            ctx.fillRect(0, 0, this.width, this.height);
        }

        // End banners.
        if (this.phase === 'OFFLINE') this._renderBanner(ctx, 'REACTOR OFFLINE', C.input);
        else if (this.phase === 'FAILED') this._renderBanner(ctx, 'TURRET REBOOTED', C.danger);
    }

    _renderBoardDots(ctx) {
        const C = MazeShutdown.COLORS;
        ctx.fillStyle = C.dot;
        const step = 26;
        for (let y = step; y < this.height; y += step) {
            for (let x = step; x < this.width; x += step) {
                ctx.fillRect(x, y, 1.5, 1.5);
            }
        }
    }

    _renderNode(ctx, cell, color, radiusFrac, label) {
        const x = this._cellCenterX(cell.x);
        const y = this._cellCenterY(cell.y);
        const r = this.cellSize * radiusFrac;
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (label) {
            ctx.fillStyle = '#04121a';
            ctx.font = 'bold ' + Math.floor(this.cellSize * 0.28) + "px 'Consolas', monospace";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, x, y + 1);
        }
    }

    _renderCore(ctx, drainMix) {
        const C = MazeShutdown.COLORS;
        const x = this._cellCenterX(this.coreCell.x);
        const y = this._cellCenterY(this.coreCell.y);
        const pulse = 1 + Math.sin(this.pulseClock * 6) * 0.08 * (1 - drainMix);
        const r = this.cellSize * 0.36 * pulse;
        // Colour drains from hot-red toward grey as the pulse shuts it down.
        const hot = [255, 74, 60];
        const off = [90, 96, 104];
        const col = 'rgb(' + Math.round(hot[0] + (off[0] - hot[0]) * drainMix) + ','
            + Math.round(hot[1] + (off[1] - hot[1]) * drainMix) + ','
            + Math.round(hot[2] + (off[2] - hot[2]) * drainMix) + ')';
        // Outer ring.
        ctx.strokeStyle = col;
        ctx.lineWidth = Math.max(2, this.cellSize * 0.09);
        ctx.shadowColor = col;
        ctx.shadowBlur = 16 * (1 - drainMix) + 4;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        // Core fill.
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.85 - drainMix * 0.55;
        ctx.beginPath();
        ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
        // Label.
        ctx.fillStyle = drainMix > 0.5 ? '#c8d0d8' : '#fff';
        ctx.font = 'bold ' + Math.floor(this.cellSize * 0.24) + "px 'Consolas', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(drainMix > 0.5 ? 'OFF' : 'CORE', x, y + 1);
    }

    _renderSpark(ctx, s) {
        const C = MazeShutdown.COLORS;
        const r = this.cellSize * 0.22;
        const flick = 0.7 + this.rand() * 0.3;
        ctx.fillStyle = C.danger;
        ctx.shadowColor = C.danger;
        ctx.shadowBlur = 14 * flick;
        ctx.beginPath();
        ctx.arc(s.px, s.py, r, 0, Math.PI * 2);
        ctx.fill();
        // crackle cross
        ctx.strokeStyle = '#fff3b0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.px - r, s.py); ctx.lineTo(s.px + r, s.py);
        ctx.moveTo(s.px, s.py - r); ctx.lineTo(s.px, s.py + r);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    _renderPulse(ctx) {
        const C = MazeShutdown.COLORS;
        const p = this.player;
        // Trail.
        const n = this.trail.length / 2;
        for (let i = 0; i < n; i++) {
            const a = (i + 1) / n;
            const r = this.cellSize * 0.10 * a;
            ctx.globalAlpha = a * 0.5;
            ctx.fillStyle = C.pulse;
            ctx.beginPath();
            ctx.arc(this.trail[i * 2], this.trail[i * 2 + 1], r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        // Head.
        const blink = this.invulnT > 0 ? (Math.floor(this.invulnT * 20) % 2 === 0 ? 0.35 : 1) : 1;
        ctx.globalAlpha = blink;
        ctx.fillStyle = C.pulse;
        ctx.shadowColor = C.pulseGlow;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(p.px, p.py, this.cellSize * 0.20, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    _renderPulseRing(ctx, fx) {
        const k = Math.max(0, Math.min(1, fx.t / fx.dur));
        const r = fx.maxR * k;
        ctx.globalAlpha = (1 - k) * 0.8;
        ctx.strokeStyle = MazeShutdown.COLORS.pulse;
        ctx.lineWidth = Math.max(2, this.cellSize * 0.10) * (1 - k * 0.5);
        ctx.shadowColor = MazeShutdown.COLORS.pulseGlow;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }

    _renderCharges(ctx) {
        const C = MazeShutdown.COLORS;
        const total = this._clampInt(
            (this.config.PULSE_CHARGES_BASE || 2) + (this.difficulty - 1) * (this.config.PULSE_CHARGES_PER_DIFFICULTY || 0),
            0, this.config.PULSE_CHARGES_MAX || 5);
        const x = 14, y = this.height - 20;
        ctx.font = "bold 12px 'Consolas', monospace";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = C.pulse;
        ctx.fillText('PULSE', x, y);
        const px0 = x + 48, r = 6, gap = 17;
        for (let i = 0; i < total; i++) {
            const cx = px0 + i * gap;
            ctx.beginPath();
            ctx.arc(cx, y, r, 0, Math.PI * 2);
            if (i < this.charges) {
                ctx.fillStyle = C.pulse;
                ctx.shadowColor = C.pulseGlow;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.strokeStyle = 'rgba(79,216,255,0.4)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
        if (this.charges > 0) {
            const cost = this.config.PULSE_TIME_COST || 0;
            ctx.fillStyle = 'rgba(159,179,187,0.7)';
            ctx.font = "10px 'Consolas', monospace";
            ctx.fillText(cost > 0 ? '[Space] -' + cost + 's' : '[Space]', px0 + total * gap + 4, y);
        }
    }

    _renderBanner(ctx, text, color) {
        ctx.fillStyle = 'rgba(6,12,18,0.72)';
        const h = 64;
        ctx.fillRect(0, this.height / 2 - h / 2, this.width, h);
        ctx.fillStyle = color;
        ctx.font = "bold 30px 'Consolas', monospace";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillText(text, this.width / 2, this.height / 2);
        ctx.shadowBlur = 0;
    }

    // ---------------------------------------------------------------------
    // Small helpers
    // ---------------------------------------------------------------------
    _arrived() { return !this.player.moving; }
    _cellCenterX(cx) { return this.offsetX + cx * this.cellSize + this.cellSize / 2; }
    _cellCenterY(cy) { return this.offsetY + cy * this.cellSize + this.cellSize / 2; }
    _clampInt(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }

    destroy() {
        this.cells = null;
        this.sparks = null;
        this.trail = null;
    }
}

MazeShutdown.CONFIG_KEY = 'MAZE_SHUTDOWN';
MazeShutdown.COLORS = {
    bg: '#0a141c',
    dot: 'rgba(90,180,200,0.10)',
    trace: '#1f6f7a',
    traceGlow: 'rgba(60,220,220,0.5)',
    input: '#43e0b0',
    pulse: '#4fd8ff',
    pulseGlow: 'rgba(79,216,255,0.8)',
    danger: '#ffb020',
};

if (typeof window !== 'undefined') window.MazeShutdown = MazeShutdown;
