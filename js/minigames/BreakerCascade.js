/**
 * BreakerCascade ("Breaker Cascade") — the third concrete mini-game.
 *
 * A Lights-Out panel: each breaker is ON (live) or OFF (dead). Pressing a
 * breaker toggles it AND its orthogonal neighbours. Kill every breaker to
 * black out the panel = turret deactivated. Some breakers are UNSTABLE and
 * re-surge (fire a fresh press on themselves) if left off too long, so you
 * must finish the blackout before the reboot clock runs out.
 *
 * Deactivation theme: the literal goal is to switch everything off.
 *
 * Solvability: the board is built by applying random presses to an all-off
 * grid, so a solution always exists. The unstable re-surge is itself a full
 * press (toggle cell + neighbours), which keeps the board inside the solvable
 * coset — a single-cell flip would NOT, so we never do that.
 *
 * Controls: click a breaker, or move the cursor with Arrows/WASD and press
 * Space/Enter.
 *
 * Extends MiniGame. Balance from CONFIG.MINIGAMES.BREAKER_CASCADE. Colours local.
 */
class BreakerCascade extends MiniGame {
    getTitle() { return this.config.TITLE || 'BREAKER CASCADE'; }
    getSubtitle() { return this.config.SUBTITLE || ''; }
    getInstructions() { return this.config.INSTRUCTIONS || ''; }

    init() {
        const c = this.config;
        const diff = this.difficulty;

        this.N = this._clampInt((c.BASE_SIZE || 3) + Math.floor((diff - 1) * (c.SIZE_PER_DIFFICULTY || 0)),
            2, c.MAX_SIZE || 5);

        this.timeLimit = Math.max(c.TIME_LIMIT_MIN || 18,
            (c.TIME_LIMIT_BASE || 35) + (diff - 1) * (c.TIME_LIMIT_PER_DIFFICULTY || 0));
        this.timeLeft = this.timeLimit;

        this.relightInterval = Math.max(c.RELIGHT_INTERVAL_MIN || 2,
            (c.RELIGHT_INTERVAL_BASE || 4) + (diff - 1) * (c.RELIGHT_INTERVAL_PER_DIFFICULTY || 0));

        this.moves = 0;
        this.phase = 'PLAYING';    // 'PLAYING' | 'WON' | 'FAILED'
        this.winHold = 0;
        this._winHoldTime = 0.5;
        this.cursor = { x: 0, y: 0 };
        this.clock = 0;

        // Allocate grids.
        this.cells = [];       // true = ON (live)
        this.unstable = [];    // true = re-surges when left off
        this.relightT = [];    // countdown per unstable cell
        this.pulse = [];       // 0..1 press-animation per cell
        for (let y = 0; y < this.N; y++) {
            this.cells[y] = new Array(this.N).fill(false);
            this.unstable[y] = new Array(this.N).fill(false);
            this.relightT[y] = new Array(this.N).fill(0);
            this.pulse[y] = new Array(this.N).fill(0);
        }

        this._buildSolvableBoard();
        this._placeUnstable();
        this._layout();
    }

    _buildSolvableBoard() {
        const c = this.config;
        const scramble = Math.max(1, Math.round((c.SCRAMBLE_BASE || 3) + (this.difficulty - 1) * (c.SCRAMBLE_PER_DIFFICULTY || 0)));
        let guard = 0;
        do {
            // Reset to all-off, then apply random presses (keeps it solvable).
            for (let y = 0; y < this.N; y++) this.cells[y].fill(false);
            for (let i = 0; i < scramble; i++) {
                this._press(this.randInt(0, this.N - 1), this.randInt(0, this.N - 1), false, true);
            }
            guard++;
        } while (this._isAllOff() && guard < 20); // never start already-solved
    }

    _placeUnstable() {
        const c = this.config;
        const count = this._clampInt((c.UNSTABLE_BASE || 0) + (this.difficulty - 1) * (c.UNSTABLE_PER_DIFFICULTY || 0),
            0, Math.min(c.UNSTABLE_MAX || 3, this.N * this.N));
        let placed = 0, guard = 0;
        while (placed < count && guard < 200) {
            guard++;
            const x = this.randInt(0, this.N - 1);
            const y = this.randInt(0, this.N - 1);
            if (this.unstable[y][x]) continue;
            this.unstable[y][x] = true;
            this.relightT[y][x] = this.relightInterval;
            placed++;
        }
    }

    _layout() {
        const gridPx = Math.min(this.width, this.height) - 130;
        this.cellSize = Math.floor(gridPx / this.N);
        const gridW = this.cellSize * this.N;
        this.offsetX = Math.floor((this.width - gridW) / 2);
        this.offsetY = Math.floor((this.height - gridW) / 2) - 4;
        this.pad = Math.max(3, Math.floor(this.cellSize * 0.08));
    }

    // ---------------------------------------------------------------------
    // Board ops
    // ---------------------------------------------------------------------
    // Toggle (x,y) and its orthogonal neighbours. `silent` skips animation
    // and move-count (used for scramble). `isPlayer` counts a move.
    _press(x, y, isPlayer, silent) {
        this._toggle(x, y, silent);
        this._toggle(x - 1, y, silent);
        this._toggle(x + 1, y, silent);
        this._toggle(x, y - 1, silent);
        this._toggle(x, y + 1, silent);
        if (isPlayer) this.moves++;
    }

    _toggle(x, y, silent) {
        if (x < 0 || y < 0 || x >= this.N || y >= this.N) return;
        this.cells[y][x] = !this.cells[y][x];
        if (!silent) this.pulse[y][x] = 1;
    }

    _isAllOff() {
        for (let y = 0; y < this.N; y++)
            for (let x = 0; x < this.N; x++)
                if (this.cells[y][x]) return false;
        return true;
    }

    // ---------------------------------------------------------------------
    // Input
    // ---------------------------------------------------------------------
    handlePointerDown(x, y) {
        if (this.phase !== 'PLAYING') return;
        const gx = Math.floor((x - this.offsetX) / this.cellSize);
        const gy = Math.floor((y - this.offsetY) / this.cellSize);
        if (gx < 0 || gy < 0 || gx >= this.N || gy >= this.N) return;
        this.cursor.x = gx; this.cursor.y = gy;
        this._press(gx, gy, true, false);
    }

    handleKeyDown(key) {
        if (this.phase !== 'PLAYING') return;
        switch (key) {
            case 'ArrowUp': case 'w': case 'W': this.cursor.y = Math.max(0, this.cursor.y - 1); break;
            case 'ArrowDown': case 's': case 'S': this.cursor.y = Math.min(this.N - 1, this.cursor.y + 1); break;
            case 'ArrowLeft': case 'a': case 'A': this.cursor.x = Math.max(0, this.cursor.x - 1); break;
            case 'ArrowRight': case 'd': case 'D': this.cursor.x = Math.min(this.N - 1, this.cursor.x + 1); break;
            case ' ': case 'Spacebar': case 'Enter':
                this._press(this.cursor.x, this.cursor.y, true, false); break;
        }
    }

    // ---------------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------------
    update(dt) {
        this.elapsed += dt;
        this.clock += dt;

        // Decay press animations.
        for (let y = 0; y < this.N; y++)
            for (let x = 0; x < this.N; x++)
                if (this.pulse[y][x] > 0) this.pulse[y][x] = Math.max(0, this.pulse[y][x] - dt * 3);

        if (this.phase === 'WON') {
            this.winHold += dt;
            if (this.winHold >= this._winHoldTime) this.succeed();
            return;
        }
        if (this.phase !== 'PLAYING') return;

        // Reboot clock.
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.phase = 'FAILED'; this.fail(); return; }

        // Win check BEFORE re-surge, so a completed blackout always wins.
        if (this._isAllOff()) { this.phase = 'WON'; this.winHold = 0; return; }

        // Unstable breakers re-surge while switched off.
        for (let y = 0; y < this.N; y++) {
            for (let x = 0; x < this.N; x++) {
                if (!this.unstable[y][x]) continue;
                if (this.cells[y][x]) { this.relightT[y][x] = this.relightInterval; continue; }
                this.relightT[y][x] -= dt;
                if (this.relightT[y][x] <= 0) {
                    this._press(x, y, false, false); // full press keeps board solvable
                    this.relightT[y][x] = this.relightInterval;
                }
            }
        }
    }

    // ---------------------------------------------------------------------
    // Footer hooks
    // ---------------------------------------------------------------------
    getProgress() {
        if (this.phase === 'WON') return 1;
        return this.timeLimit > 0 ? this.timeLeft / this.timeLimit : 0;
    }

    getStatusText() {
        if (this.phase === 'WON') return 'PANEL DARK';
        if (this.phase === 'FAILED') return 'TURRET REBOOTED';
        const live = this._countLive();
        return 'REBOOT IN ' + this.timeLeft.toFixed(1) + 's  ·  ' + live + ' LIVE';
    }

    _countLive() {
        let n = 0;
        for (let y = 0; y < this.N; y++) for (let x = 0; x < this.N; x++) if (this.cells[y][x]) n++;
        return n;
    }

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------
    render(ctx) {
        const C = BreakerCascade.COLORS;
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        // Panel backing.
        const gw = this.cellSize * this.N;
        ctx.fillStyle = C.panel;
        this._roundRect(ctx, this.offsetX - 8, this.offsetY - 8, gw + 16, gw + 16, 8);
        ctx.fill();
        ctx.strokeStyle = C.panelEdge;
        ctx.lineWidth = 1;
        ctx.stroke();

        for (let y = 0; y < this.N; y++)
            for (let x = 0; x < this.N; x++)
                this._renderCell(ctx, x, y);

        // Keyboard cursor.
        if (this.phase === 'PLAYING') {
            const cx = this.offsetX + this.cursor.x * this.cellSize;
            const cy = this.offsetY + this.cursor.y * this.cellSize;
            ctx.strokeStyle = C.cursor;
            ctx.lineWidth = 2;
            ctx.shadowColor = C.cursor;
            ctx.shadowBlur = 8;
            this._roundRect(ctx, cx + this.pad - 2, cy + this.pad - 2, this.cellSize - this.pad * 2 + 4, this.cellSize - this.pad * 2 + 4, 5);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        if (this.phase === 'WON') this._renderBanner(ctx, 'PANEL DARK', C.dead);
        else if (this.phase === 'FAILED') this._renderBanner(ctx, 'TURRET REBOOTED', C.danger);
    }

    _renderCell(ctx, x, y) {
        const C = BreakerCascade.COLORS;
        const on = this.cells[y][x];
        const px = this.offsetX + x * this.cellSize + this.pad;
        const py = this.offsetY + y * this.cellSize + this.pad;
        const sz = this.cellSize - this.pad * 2;
        const pulse = this.pulse[y][x];

        // Body.
        if (on) {
            ctx.fillStyle = C.liveFill;
            ctx.shadowColor = C.liveGlow;
            ctx.shadowBlur = 12 + pulse * 10;
        } else {
            ctx.fillStyle = C.deadFill;
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
        }
        this._roundRect(ctx, px, py, sz, sz, 5);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Edge.
        ctx.strokeStyle = on ? C.liveEdge : C.deadEdge;
        ctx.lineWidth = 1.5;
        this._roundRect(ctx, px, py, sz, sz, 5);
        ctx.stroke();

        // Filament / power glyph.
        const cx = px + sz / 2, cy = py + sz / 2;
        ctx.strokeStyle = on ? C.liveGlyph : C.deadGlyph;
        ctx.lineWidth = Math.max(2, sz * 0.06);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy - sz * 0.22);
        ctx.lineTo(cx, cy + sz * 0.06);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(cx, cy + sz * 0.02, sz * 0.20, Math.PI * 0.15, Math.PI * 0.85, false);
        ctx.stroke();

        // Press flash overlay.
        if (pulse > 0) {
            ctx.globalAlpha = pulse * 0.5;
            ctx.fillStyle = '#ffffff';
            this._roundRect(ctx, px, py, sz, sz, 5);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Unstable marker.
        if (this.unstable[y][x]) {
            const warn = 0.55 + 0.45 * Math.sin(this.clock * 6);
            ctx.fillStyle = 'rgba(255,176,32,' + warn.toFixed(3) + ')';
            const r = Math.max(3, sz * 0.09);
            ctx.beginPath();
            ctx.arc(px + sz - r - 3, py + r + 3, r, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    _roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
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

    _clampInt(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }

    destroy() {
        this.cells = this.unstable = this.relightT = this.pulse = null;
    }
}

BreakerCascade.CONFIG_KEY = 'BREAKER_CASCADE';
BreakerCascade.COLORS = {
    bg: '#0a141c',
    panel: '#0e1a24',
    panelEdge: 'rgba(60,200,210,0.22)',
    liveFill: '#5a2320',
    liveEdge: '#ff6a4a',
    liveGlow: 'rgba(255,106,74,0.7)',
    liveGlyph: '#ffd0a0',
    deadFill: '#0c1720',
    deadEdge: 'rgba(67,224,176,0.35)',
    deadGlyph: 'rgba(120,150,150,0.5)',
    dead: '#43e0b0',
    danger: '#c94f4f',
    cursor: '#4fd8ff',
};

if (typeof window !== 'undefined') window.BreakerCascade = BreakerCascade;
