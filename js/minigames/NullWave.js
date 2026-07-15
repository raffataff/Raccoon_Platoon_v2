/**
 * NullWave ("Dead Air") — the second concrete mini-game.
 *
 * Fantasy: the turret broadcasts a targeting waveform. You inject an inverse
 * wave and tune it (frequency + phase) so the two cancel by destructive
 * interference — flattening the combined output to a dead flat line. But the
 * target signal keeps drifting, so you must actively hold the null. Silence
 * for long enough = signal dead = turret deactivated.
 *
 * Deactivation theme: the goal is literally to reduce a signal to zero and
 * keep it there. Win = flatline; fail = the signal (and the turret) is still
 * alive when the reboot clock runs out.
 *
 * Controls: Up/Down = frequency, Left/Right = phase (or drag the two sliders).
 *
 * Extends MiniGame. Balance from CONFIG.MINIGAMES.NULL_WAVE. Colours local.
 */
class NullWave extends MiniGame {
    getTitle() { return this.config.TITLE || 'DEAD AIR'; }
    getSubtitle() { return this.config.SUBTITLE || ''; }
    getInstructions() { return this.config.INSTRUCTIONS || ''; }

    init() {
        const c = this.config;
        const diff = this.difficulty;

        this.freqMin = c.FREQ_MIN || 1.5;
        this.freqMax = c.FREQ_MAX || 4.5;

        // Reboot clock.
        this.timeLimit = Math.max(c.TIME_LIMIT_MIN || 16,
            (c.TIME_LIMIT_BASE || 32) + (diff - 1) * (c.TIME_LIMIT_PER_DIFFICULTY || 0));
        this.timeLeft = this.timeLimit;

        // Null tolerance shrinks with difficulty.
        this.nullThreshold = Math.max(c.NULL_THRESHOLD_MIN || 0.08,
            (c.NULL_THRESHOLD_BASE || 0.22) + (diff - 1) * (c.NULL_THRESHOLD_PER_DIFFICULTY || 0));

        // Hold-to-win requirement grows with difficulty.
        this.lockRequired = (c.LOCK_REQUIRED_BASE || 2) + (diff - 1) * (c.LOCK_REQUIRED_PER_DIFFICULTY || 0);
        this.lockDrainMult = c.LOCK_DRAIN_MULT || 1.6;
        this.lockT = 0;

        // Target signal + drift.
        this.driftRate = (c.DRIFT_RATE_BASE || 0.35) + (diff - 1) * (c.DRIFT_RATE_PER_DIFFICULTY || 0);
        this.freqWander = (c.FREQ_WANDER_BASE || 0.25) + (diff - 1) * (c.FREQ_WANDER_PER_DIFFICULTY || 0);
        this.phaseWander = (c.PHASE_WANDER_BASE || 0.5) + (diff - 1) * (c.PHASE_WANDER_PER_DIFFICULTY || 0);
        this.freqAdjustRate = c.FREQ_ADJUST_RATE || 1.6;
        this.phaseAdjustRate = c.PHASE_ADJUST_RATE || 3.2;

        // Centre the drifting target somewhere in-range; seed its wander phases.
        this.fCenter = this.freqMin + (this.freqMax - this.freqMin) * (0.3 + this.rand() * 0.4);
        this.pCenter = this.rand() * Math.PI * 2;
        this._fSeed = this.rand() * Math.PI * 2;
        this._pSeed = this.rand() * Math.PI * 2;
        this._fSeed2 = this.rand() * Math.PI * 2;
        this._pSeed2 = this.rand() * Math.PI * 2;
        this.driftClock = 0;
        this.targetFreq = this.fCenter;
        this.targetPhase = this.pCenter;

        // Player inverse wave — start deliberately off so there's work to do.
        this.playerFreq = this.freqMin + (this.freqMax - this.freqMin) * (this.rand() < 0.5 ? 0.15 : 0.85);
        this.playerPhase = this.rand() * Math.PI * 2;

        // Held-key state (two axes).
        this.keys = { fUp: false, fDown: false, pL: false, pR: false };

        this.phase = 'PLAYING';    // 'PLAYING' | 'NULLED' | 'FAILED'
        this.winHold = 0;
        this._winHoldTime = 0.5;
        this.nulledNow = false;
        this.peak = 2;             // current combined peak (0..2)
        this.glowClock = 0;

        // --- Stabilizer (limited active counter-drift) ------------------
        this.stabCharges = Math.max(0, Math.min(c.STABILIZER_CHARGES_MAX || 4,
            Math.round((c.STABILIZER_CHARGES_BASE || 2) + (diff - 1) * (c.STABILIZER_CHARGES_PER_DIFFICULTY || 0))));
        this.stabDuration = c.STABILIZER_DURATION || 2.5;
        this.stabDriftMult = (typeof c.STABILIZER_DRIFT_MULT === 'number') ? c.STABILIZER_DRIFT_MULT : 0;
        this.stabT = 0;            // remaining active time
        this._stabKeyDown = false;

        this._dragSlider = null;   // 'freq' | 'phase' | null
        this._layout();
    }

    _layout() {
        const pad = 40;
        this.scopeX = pad;
        this.scopeY = 74;
        this.scopeW = this.width - pad * 2;
        this.scopeH = Math.round(this.height * 0.46);
        this.yMid = this.scopeY + this.scopeH / 2;
        this.vScale = this.scopeH * 0.22;   // amplitude 1 -> 0.22*H; combined max 2 -> 0.44*H

        const labelW = 92;
        const sx = pad + labelW;
        const sw = this.width - pad * 2 - labelW;
        const sy0 = this.scopeY + this.scopeH + 42;
        this.freqSlider = { x: sx, y: sy0, w: sw, h: 8, label: 'FREQUENCY' };
        this.phaseSlider = { x: sx, y: sy0 + 44, w: sw, h: 8, label: 'PHASE' };
    }

    // ---------------------------------------------------------------------
    // Input
    // ---------------------------------------------------------------------
    handleKeyDown(key) {
        if (this.phase !== 'PLAYING') return;
        if (key === ' ' || key === 'Spacebar' || key === 'Enter') {
            if (!this._stabKeyDown) { this._stabKeyDown = true; this._activateStabilizer(); }
            return;
        }
        switch (key) {
            case 'ArrowUp': case 'w': case 'W': this.keys.fUp = true; break;
            case 'ArrowDown': case 's': case 'S': this.keys.fDown = true; break;
            case 'ArrowLeft': case 'a': case 'A': this.keys.pL = true; break;
            case 'ArrowRight': case 'd': case 'D': this.keys.pR = true; break;
        }
    }

    handleKeyUp(key) {
        if (key === ' ' || key === 'Spacebar' || key === 'Enter') { this._stabKeyDown = false; return; }
        switch (key) {
            case 'ArrowUp': case 'w': case 'W': this.keys.fUp = false; break;
            case 'ArrowDown': case 's': case 'S': this.keys.fDown = false; break;
            case 'ArrowLeft': case 'a': case 'A': this.keys.pL = false; break;
            case 'ArrowRight': case 'd': case 'D': this.keys.pR = false; break;
        }
    }

    // Freeze (or heavily slow) the target signal's drift for a few seconds.
    // Consumes one charge; ignored if already active or out of charges.
    _activateStabilizer() {
        if (this.stabCharges <= 0 || this.stabT > 0) return;
        this.stabCharges--;
        // Tradeoff: activating bleeds a little reboot time.
        const cost = this.config.STABILIZER_TIME_COST || 0;
        if (cost > 0) {
            this.timeLeft = Math.max(0, this.timeLeft - cost);
            if (this.timeLeft <= 0) { this.timeLeft = 0; this.phase = 'FAILED'; this.fail(); return; }
        }
        this.stabT = this.stabDuration;
    }

    handlePointerDown(x, y) {
        if (this.phase !== 'PLAYING') return;
        if (this._hitSlider(this.freqSlider, x, y)) { this._dragSlider = 'freq'; this._applySlider(x); }
        else if (this._hitSlider(this.phaseSlider, x, y)) { this._dragSlider = 'phase'; this._applySlider(x); }
    }

    handlePointerMove(x, y) {
        if (this._dragSlider) this._applySlider(x);
    }

    handlePointerUp() { this._dragSlider = null; }

    _hitSlider(s, x, y) {
        return x >= s.x - 14 && x <= s.x + s.w + 14 && y >= s.y - 18 && y <= s.y + 18;
    }

    _applySlider(x) {
        const s = this._dragSlider === 'freq' ? this.freqSlider : this.phaseSlider;
        const t = Math.max(0, Math.min(1, (x - s.x) / s.w));
        if (this._dragSlider === 'freq') this.playerFreq = this.freqMin + t * (this.freqMax - this.freqMin);
        else this.playerPhase = t * Math.PI * 2;
    }

    // ---------------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------------
    update(dt) {
        this.elapsed += dt;
        this.glowClock += dt;

        if (this.phase === 'NULLED') {
            this.winHold += dt;
            if (this.winHold >= this._winHoldTime) this.succeed();
            return;
        }
        if (this.phase !== 'PLAYING') return;

        // Reboot clock.
        this.timeLeft -= dt;
        if (this.timeLeft <= 0) { this.timeLeft = 0; this.phase = 'FAILED'; this.fail(); return; }

        // Stabilizer: while active, the target drift is frozen/slowed.
        if (this.stabT > 0) this.stabT = Math.max(0, this.stabT - dt);
        const driftMult = this.stabT > 0 ? this.stabDriftMult : 1;

        // Drift the target signal (smooth bounded wander from two sines).
        this.driftClock += dt * this.driftRate * driftMult;
        this.targetFreq = this.fCenter
            + this.freqWander * (0.7 * Math.sin(this.driftClock + this._fSeed)
                + 0.3 * Math.sin(this.driftClock * 1.7 + this._fSeed2));
        this.targetFreq = Math.max(this.freqMin, Math.min(this.freqMax, this.targetFreq));
        this.targetPhase = this.pCenter
            + this.phaseWander * (0.7 * Math.sin(this.driftClock * 0.9 + this._pSeed)
                + 0.3 * Math.sin(this.driftClock * 2.1 + this._pSeed2));

        // Apply held-key adjustments.
        if (this.keys.fUp) this.playerFreq += this.freqAdjustRate * dt;
        if (this.keys.fDown) this.playerFreq -= this.freqAdjustRate * dt;
        this.playerFreq = Math.max(this.freqMin, Math.min(this.freqMax, this.playerFreq));
        if (this.keys.pR) this.playerPhase += this.phaseAdjustRate * dt;
        if (this.keys.pL) this.playerPhase -= this.phaseAdjustRate * dt;
        this.playerPhase = ((this.playerPhase % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

        // Measure the combined peak (destructive-interference metric).
        this.peak = this._combinedPeak();
        const flatFrac = this.peak / 2;             // full-scale is 2A (A = 1)
        this.nulledNow = flatFrac <= this.nullThreshold;

        // Lock meter fills while flat, drains (faster) while not.
        if (this.nulledNow) this.lockT += dt;
        else this.lockT = Math.max(0, this.lockT - dt * this.lockDrainMult);

        if (this.lockT >= this.lockRequired) {
            this.lockT = this.lockRequired;
            this.phase = 'NULLED';
            this.winHold = 0;
        }
    }

    // Peak |target + inverse| sampled across the scope window (tNorm 0..1).
    _combinedPeak() {
        const SAMPLES = 96;
        const twoPi = Math.PI * 2;
        let peak = 0;
        for (let i = 0; i < SAMPLES; i++) {
            const t = i / (SAMPLES - 1);
            const a = Math.sin(twoPi * this.targetFreq * t + this.targetPhase);
            const b = Math.sin(twoPi * this.playerFreq * t + this.playerPhase);
            const v = Math.abs(a + b);
            if (v > peak) peak = v;
        }
        return peak;
    }

    // ---------------------------------------------------------------------
    // Footer hooks
    // ---------------------------------------------------------------------
    getProgress() {
        if (this.phase === 'NULLED') return 1;
        return this.timeLimit > 0 ? this.timeLeft / this.timeLimit : 0;
    }

    getStatusText() {
        if (this.phase === 'NULLED') return 'SIGNAL NULLED';
        if (this.phase === 'FAILED') return 'TURRET REBOOTED';
        return 'REBOOT IN ' + this.timeLeft.toFixed(1) + 's';
    }

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------
    render(ctx) {
        const C = NullWave.COLORS;
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        this._renderScope(ctx);
        this._renderSlider(ctx, this.freqSlider, (this.playerFreq - this.freqMin) / (this.freqMax - this.freqMin), (this.targetFreq - this.freqMin) / (this.freqMax - this.freqMin));
        this._renderSlider(ctx, this.phaseSlider, this.playerPhase / (Math.PI * 2), null);
        this._renderLockMeter(ctx);
        this._renderStabilizer(ctx);

        if (this.phase === 'NULLED') this._renderBanner(ctx, 'SIGNAL NULLED', C.good);
        else if (this.phase === 'FAILED') this._renderBanner(ctx, 'TURRET REBOOTED', C.danger);
    }

    _renderStabilizer(ctx) {
        const C = NullWave.COLORS;
        // Active glow around the scope.
        if (this.stabT > 0) {
            ctx.strokeStyle = C.good;
            ctx.lineWidth = 2;
            ctx.shadowColor = C.good;
            ctx.shadowBlur = 14;
            ctx.strokeRect(this.scopeX + 1, this.scopeY + 1, this.scopeW - 2, this.scopeH - 2);
            ctx.shadowBlur = 0;
            ctx.fillStyle = C.good;
            ctx.font = "bold 12px 'Consolas', monospace";
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText('STABILIZED ' + this.stabT.toFixed(1) + 's', this.scopeX + this.scopeW - 8, this.scopeY + 12);
        }
        // Charge pips (bottom-left).
        const total = Math.max(0, Math.min(this.config.STABILIZER_CHARGES_MAX || 4,
            Math.round((this.config.STABILIZER_CHARGES_BASE || 2) + (this.difficulty - 1) * (this.config.STABILIZER_CHARGES_PER_DIFFICULTY || 0))));
        const x = this.scopeX, y = this.height - 18;
        ctx.fillStyle = C.label;
        ctx.font = "bold 12px 'Consolas', monospace";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('STABILIZER', x, y);
        const px0 = x + 88, r = 6, gap = 17;
        for (let i = 0; i < total; i++) {
            const cx = px0 + i * gap;
            ctx.beginPath();
            ctx.arc(cx, y, r, 0, Math.PI * 2);
            if (i < this.stabCharges) {
                ctx.fillStyle = C.good;
                ctx.shadowColor = C.good;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                ctx.strokeStyle = 'rgba(67,224,176,0.4)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
        if (this.stabCharges > 0 && this.stabT <= 0) {
            const cost = this.config.STABILIZER_TIME_COST || 0;
            ctx.fillStyle = 'rgba(159,179,187,0.7)';
            ctx.font = "10px 'Consolas', monospace";
            ctx.fillText(cost > 0 ? '[Space] -' + cost + 's' : '[Space]', px0 + total * gap + 4, y);
        }
    }

    _renderScope(ctx) {
        const C = NullWave.COLORS;
        const x0 = this.scopeX, y0 = this.scopeY, w = this.scopeW, h = this.scopeH;

        // Scope frame.
        ctx.fillStyle = C.scopeBg;
        ctx.fillRect(x0, y0, w, h);
        ctx.strokeStyle = C.scopeEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1);

        // Grid.
        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 1; i < 8; i++) { const gx = x0 + (w * i) / 8; ctx.moveTo(gx, y0); ctx.lineTo(gx, y0 + h); }
        for (let i = 1; i < 4; i++) { const gy = y0 + (h * i) / 4; ctx.moveTo(x0, gy); ctx.lineTo(x0 + w, gy); }
        ctx.stroke();

        // Null band (target zone around zero).
        const band = this.nullThreshold * 2 * this.vScale; // peak fraction -> pixels
        ctx.fillStyle = C.nullBand;
        ctx.fillRect(x0, this.yMid - band, w, band * 2);

        // Zero line.
        ctx.strokeStyle = C.zero;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x0, this.yMid); ctx.lineTo(x0 + w, this.yMid); ctx.stroke();

        // Waves.
        this._renderWave(ctx, (t) => Math.sin(2 * Math.PI * this.targetFreq * t + this.targetPhase), C.target, 1.5, 0.55);
        this._renderWave(ctx, (t) => Math.sin(2 * Math.PI * this.playerFreq * t + this.playerPhase), C.inverse, 1.5, 0.55);

        // Combined output (the one that must go flat).
        const outColor = this.nulledNow ? C.good : C.output;
        ctx.shadowColor = outColor;
        ctx.shadowBlur = this.nulledNow ? 12 : 6;
        this._renderWave(ctx, (t) =>
            Math.sin(2 * Math.PI * this.targetFreq * t + this.targetPhase)
            + Math.sin(2 * Math.PI * this.playerFreq * t + this.playerPhase),
            outColor, 2.4, 1);
        ctx.shadowBlur = 0;

        // Legend.
        ctx.font = "11px 'Consolas', monospace";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = C.target; ctx.fillText('■ target', x0 + 8, y0 + 12);
        ctx.fillStyle = C.inverse; ctx.fillText('■ inverse', x0 + 74, y0 + 12);
        ctx.fillStyle = this.nulledNow ? C.good : C.output; ctx.fillText('■ output', x0 + 150, y0 + 12);
    }

    _renderWave(ctx, fn, color, lineWidth, alpha) {
        const x0 = this.scopeX, w = this.scopeW;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        const step = 2;
        for (let px = 0; px <= w; px += step) {
            const t = px / w;
            const v = fn(t);
            const y = this.yMid - v * this.vScale;
            if (px === 0) ctx.moveTo(x0 + px, y); else ctx.lineTo(x0 + px, y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    _renderSlider(ctx, s, playerT, targetT) {
        const C = NullWave.COLORS;
        // Label.
        ctx.fillStyle = C.label;
        ctx.font = "12px 'Consolas', monospace";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.label, this.scopeX, s.y + s.h / 2);

        // Track.
        ctx.fillStyle = C.track;
        ctx.fillRect(s.x, s.y, s.w, s.h);
        ctx.strokeStyle = C.scopeEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);

        // Optional target ghost marker (shows where the drifting target is).
        if (targetT !== null && targetT !== undefined) {
            const tx = s.x + Math.max(0, Math.min(1, targetT)) * s.w;
            ctx.fillStyle = C.target;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(tx, s.y - 8); ctx.lineTo(tx - 5, s.y - 15); ctx.lineTo(tx + 5, s.y - 15);
            ctx.closePath(); ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Player handle.
        const hx = s.x + Math.max(0, Math.min(1, playerT)) * s.w;
        ctx.fillStyle = C.inverse;
        ctx.shadowColor = C.inverse;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(hx, s.y + s.h / 2, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    _renderLockMeter(ctx) {
        const C = NullWave.COLORS;
        const frac = this.lockRequired > 0 ? this.lockT / this.lockRequired : 0;
        const w = this.scopeW;
        const x0 = this.scopeX;
        const y = this.phaseSlider.y + 40;
        ctx.fillStyle = C.label;
        ctx.font = "12px 'Consolas', monospace";
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('NULL LOCK', x0, y + 5);
        const bx = x0 + 92, bw = w - 92, bh = 10;
        ctx.fillStyle = C.track;
        ctx.fillRect(bx, y, bw, bh);
        ctx.fillStyle = this.nulledNow ? C.good : C.lockIdle;
        ctx.fillRect(bx, y, bw * Math.max(0, Math.min(1, frac)), bh);
        ctx.strokeStyle = C.scopeEdge;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 0.5, y + 0.5, bw - 1, bh - 1);
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

    destroy() { this.keys = null; }
}

NullWave.CONFIG_KEY = 'NULL_WAVE';
NullWave.COLORS = {
    bg: '#0a141c',
    scopeBg: '#08121a',
    scopeEdge: 'rgba(60,200,210,0.28)',
    grid: 'rgba(60,200,210,0.08)',
    zero: 'rgba(120,210,220,0.35)',
    nullBand: 'rgba(67,224,176,0.10)',
    target: '#ff6a4a',
    inverse: '#4fd8ff',
    output: '#e9d38a',
    good: '#43e0b0',
    danger: '#c94f4f',
    label: '#8fb4bd',
    track: 'rgba(255,255,255,0.08)',
    lockIdle: '#3a6b74',
};

if (typeof window !== 'undefined') window.NullWave = NullWave;
