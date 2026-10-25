// js/cursorManager.js
// Player-customizable hardware cursors.
//
// Every cursor is drawn procedurally to an offscreen canvas whenever the settings
// change, encoded as a PNG data URL and published as a CSS custom property on
// <html>: --rp-cursor-pointer / -interact / -crosshair / -target / -grenade.
// style.css points the cursor classes at those variables, so switching cursors in
// game is only a class toggle and the OS draws the cursor itself: no per-frame cost
// and no input lag, even when the game's frame rate drops.
//
// Defaults, limits and presets: CONFIG.CURSORS. The player's choices are stored in
// the 'cursorSettings' preference (SaveManager) and edited on Options → Cursors.

class CursorManager {
    static PREF_KEY = 'cursorSettings';
    static KINDS = ['pointer', 'interact', 'crosshair', 'target', 'grenade'];
    static POINTER_STYLES = ['arrow', 'tactical', 'system'];
    static CROSSHAIR_STYLES = ['cross', 'circle', 'brackets', 'dot'];
    // OS cursor each kind falls back to when its image can't be used.
    static KEYWORDS = { pointer: 'default', interact: 'pointer', crosshair: 'crosshair', target: 'crosshair', grenade: 'cell' };

    constructor() {
        this.cfg = CONFIG.CURSORS;
        this.settings = this._sanitize(SaveManager.getPreference(CursorManager.PREF_KEY, {}));
        this.images = {};           // kind -> { url, width, height, hotX, hotY } in CSS px (null = OS cursor)
        this.listeners = [];
        this.dpr = 1;
        this.imageSetFn = CursorManager._detectImageSet();
        this._commitPending = false;
        this.apply();

        // A window dragged to a monitor with a different pixel density needs re-rendered cursors.
        window.addEventListener('resize', () => {
            if (this._renderScale() !== this.dpr) this.apply();
        });
    }

    // ---------------------------------------------------------------- settings API

    getSettings() {
        return { ...this.settings };
    }

    /** Merge partial settings, then re-render and save on the next frame (coalesces slider drags). */
    update(changes) {
        this.settings = this._sanitize({ ...this.settings, ...changes });
        this._scheduleCommit();
    }

    applyPreset(key) {
        const preset = this.cfg.PRESETS.find(p => p.key === key);
        if (!preset) return;
        this.settings = this._sanitize(preset.settings);
        this._scheduleCommit();
    }

    reset() {
        this.settings = this._sanitize({});
        this._scheduleCommit();
    }

    /** Key of the preset the current settings match exactly, or null when customized. */
    activePresetKey() {
        const current = JSON.stringify(this.settings);
        const match = this.cfg.PRESETS.find(p => JSON.stringify(this._sanitize(p.settings)) === current);
        return match ? match.key : null;
    }

    /** fn(cursorManager) runs after every re-render. */
    onChange(fn) {
        this.listeners.push(fn);
    }

    _scheduleCommit() {
        if (this._commitPending) return;
        this._commitPending = true;
        requestAnimationFrame(() => {
            this._commitPending = false;
            SaveManager.savePreference(CursorManager.PREF_KEY, this.settings);
            this.apply();
        });
    }

    _sanitize(raw) {
        const defaults = this.cfg.DEFAULTS;
        const src = (raw && typeof raw === 'object') ? raw : {};
        const out = { ...defaults };
        for (const key of Object.keys(defaults)) {
            const v = src[key];
            if (v === undefined) continue;
            const def = defaults[key];
            if (typeof def === 'number') {
                const n = Number(v);
                if (!Number.isFinite(n)) continue;
                const lim = this.cfg.LIMITS[key];
                out[key] = lim ? Math.min(lim[1], Math.max(lim[0], n)) : n;
            } else if (typeof def === 'boolean') {
                out[key] = !!v;
            } else if (key === 'pointerStyle') {
                if (CursorManager.POINTER_STYLES.includes(v)) out[key] = v;
            } else if (key === 'crosshairStyle') {
                if (CursorManager.CROSSHAIR_STYLES.includes(v)) out[key] = v;
            } else if (typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v)) {
                out[key] = v.toLowerCase();
            }
        }
        return out;
    }

    // ---------------------------------------------------------------- publishing

    /** Re-render every cursor and publish it as a CSS variable on <html>. */
    apply() {
        this.dpr = this._renderScale();
        const rootStyle = document.documentElement.style;
        for (const kind of CursorManager.KINDS) {
            const shape = this._shape(kind, this.settings);
            if (!shape) {
                this.images[kind] = null;
                rootStyle.setProperty(`--rp-cursor-${kind}`, CursorManager.KEYWORDS[kind]);
                continue;
            }
            const full = this._rasterize(shape, this.settings, this.cfg.MAX_IMAGE_SIZE);
            const entries = [this._cssEntry(full)];
            if (Math.max(full.width, full.height) > this.cfg.EDGE_SAFE_SIZE) {
                // Thinner outline and no halo so the shape keeps as much of the small box as possible.
                const edgeSettings = { ...this.settings, outlineWidth: Math.min(this.settings.outlineWidth, 1.5), shadow: false };
                entries.push(this._cssEntry(this._rasterize(shape, edgeSettings, this.cfg.EDGE_SAFE_SIZE)));
            }
            entries.push(CursorManager.KEYWORDS[kind]);
            this.images[kind] = full;
            rootStyle.setProperty(`--rp-cursor-${kind}`, entries.join(', '));
        }
        for (const fn of this.listeners) fn(this);
    }

    _cssEntry(img) {
        const url = `url("${img.url}")`;
        const image = this.imageSetFn ? `${this.imageSetFn}(${url} ${this.dpr}x)` : url;
        return `${image} ${img.hotX} ${img.hotY}`;
    }

    /** Pixel density to draw at. Without image-set() support the browser assumes 1x images. */
    _renderScale() {
        if (!this.imageSetFn) return 1;
        return Math.min(3, Math.max(1, Math.round((window.devicePixelRatio || 1) * 100) / 100));
    }

    static _detectImageSet() {
        if (!window.CSS || !CSS.supports) return null;
        for (const fn of ['image-set', '-webkit-image-set']) {
            if (CSS.supports('cursor', `${fn}(url("x.png") 2x) 1 1, auto`)) return fn;
        }
        return null;
    }

    // ---------------------------------------------------------------- shapes
    // A shape is a list of primitives in CSS px with the hotspot at (0, 0):
    //   { type: 'poly', pts, closed?, fill?, lw? } · { type: 'arc', x, y, r, fill?, lw?, dash? }
    //   { type: 'rrect', x, y, w, h, r, rot?, fill: true }   (x, y = centre)
    // Filled primitives get the outline as a stroke; stroked ones get a wider stroke underneath.
    // `details` are drawn last, over the fill, in their own colour ('outline' = outline colour).

    _shape(kind, s) {
        switch (kind) {
            case 'pointer':
                if (s.pointerStyle === 'system') return null;
                return { color: s.pointerColor, ...(s.pointerStyle === 'tactical' ? this._tacticalArrow(s.pointerSize) : this._arrow(s.pointerSize)) };
            case 'interact':
                if (s.pointerStyle === 'system') return null;
                return { color: s.pointerColor, ...this._hand(s.pointerSize) };
            case 'crosshair':
                return { color: s.crosshairColor, prims: this._reticle(s.crosshairStyle, s.crosshairSize) };
            case 'target':
                return { color: s.targetColor, prims: this._reticle(s.crosshairStyle, s.crosshairSize).concat(this._lockMarks(s.crosshairStyle, s.crosshairSize)) };
            case 'grenade':
                return { color: s.grenadeColor, prims: this._grenadeReticle(s.crosshairSize) };
        }
        return null;
    }

    _arrow(size) {
        const k = size / 18.4;
        const pts = [[0, 0], [0, 16.2], [3.9, 12.6], [6.5, 18.4], [9.2, 17.2], [6.7, 11.6], [11.6, 11.6]];
        return { prims: [{ type: 'poly', fill: true, pts: pts.map(([x, y]) => [x * k, y * k]) }] };
    }

    /** Notched arrowhead with the lower half shaded, for a bevelled look. */
    _tacticalArrow(size) {
        const k = size / 16;
        const scale = (pts) => pts.map(([x, y]) => [x * k, y * k]);
        return {
            prims: [{ type: 'poly', fill: true, pts: scale([[0, 0], [16, 6], [8, 8], [6, 16]]) }],
            details: [{ type: 'poly', fill: true, color: 'rgba(0, 0, 0, 0.28)', pts: scale([[0, 0], [8, 8], [6, 16]]) }],
        };
    }

    _hand(size) {
        const u = size / 18.2;
        const tipX = 5.8;   // index fingertip = hotspot
        // Rounded rect given by top-left corner in hand units.
        const rr = (x, y, w, h, r, rot = 0) => ({ type: 'rrect', fill: true, x: (x + w / 2 - tipX) * u, y: (y + h / 2) * u, w: w * u, h: h * u, r: r * u, rot });
        const prims = [
            rr(4.2, 0, 3.2, 11.5, 1.6),          // index
            rr(7.4, 6.2, 3.0, 7.5, 1.5),         // middle
            rr(10.4, 7.2, 2.8, 6.5, 1.4),        // ring
            rr(13.2, 8.6, 2.5, 5.4, 1.25),       // pinky
            rr(4.2, 10, 11.5, 8.2, 2.6),         // palm
            rr(1.8, 9.4, 2.8, 6.4, 1.4, -0.75),  // thumb
        ];
        const lw = Math.max(1, u * 0.45);
        const crease = (x, y1, y2) => ({ type: 'poly', closed: false, lw, color: 'outline', pts: [[(x - tipX) * u, y1 * u], [(x - tipX) * u, y2 * u]] });
        return { prims, details: [crease(7.4, 8.2, 11.4), crease(10.4, 9.0, 11.8), crease(13.2, 10.4, 12.2)] };
    }

    _reticle(style, size) {
        const lw = Math.max(2, Math.round(size * 0.06));
        const reach = size / 2 - lw / 2;     // keeps the strokes inside the size box
        const prims = [];
        const line = (x1, y1, x2, y2) => ({ type: 'poly', closed: false, lw, pts: [[x1, y1], [x2, y2]] });
        const arms = (from, to) => prims.push(line(0, -from, 0, -to), line(0, from, 0, to), line(-from, 0, -to, 0), line(from, 0, to, 0));
        const dot = (r) => ({ type: 'arc', fill: true, x: 0, y: 0, r });
        switch (style) {
            case 'circle':
                prims.push({ type: 'arc', x: 0, y: 0, r: size * 0.32, lw });
                arms(size * 0.18, reach);
                prims.push(dot(lw * 0.75));
                break;
            case 'brackets': {
                const arm = size * 0.22;
                for (const sx of [-1, 1]) {
                    for (const sy of [-1, 1]) {
                        prims.push({ type: 'poly', closed: false, lw, pts: [[sx * reach, sy * (reach - arm)], [sx * reach, sy * reach], [sx * (reach - arm), sy * reach]] });
                    }
                }
                prims.push(dot(lw * 0.9));
                break;
            }
            case 'dot':
                prims.push({ type: 'arc', x: 0, y: 0, r: size * 0.3, lw }, dot(Math.max(1.5, lw * 0.9)));
                break;
            default: // 'cross'
                arms(Math.max(3, size * 0.16), reach);
                prims.push(dot(Math.max(1.5, lw * 0.75)));
        }
        return prims;
    }

    /** Four inward-pointing triangles marking a target lock. They sit on the diagonals,
     *  except for the bracket style whose corners already occupy them. */
    _lockMarks(style, size) {
        const onAxes = style === 'brackets';
        const tip = size * (onAxes ? 0.56 : 0.46);
        const len = size * 0.14, half = size * 0.08;
        const marks = [];
        for (let i = 0; i < 4; i++) {
            const a = (onAxes ? 0 : Math.PI / 4) + i * Math.PI / 2;
            const cx = Math.cos(a), cy = Math.sin(a);
            marks.push({
                type: 'poly', fill: true, pts: [
                    [cx * tip, cy * tip],
                    [cx * (tip + len) - cy * half, cy * (tip + len) + cx * half],
                    [cx * (tip + len) + cy * half, cy * (tip + len) - cx * half],
                ],
            });
        }
        return marks;
    }

    /** Dashed blast ring with a small centre cross — deliberately different from the gun reticles. */
    _grenadeReticle(size) {
        const lw = Math.max(2, Math.round(size * 0.06));
        const r = size / 2 - lw / 2;
        const segment = (2 * Math.PI * r) / 12;
        const tick = size * 0.12;
        return [
            { type: 'arc', x: 0, y: 0, r, lw, dash: [Math.max(1, segment * 0.62 - lw), segment * 0.38 + lw] },
            { type: 'poly', closed: false, lw, pts: [[-tick, 0], [tick, 0]] },
            { type: 'poly', closed: false, lw, pts: [[0, -tick], [0, tick]] },
        ];
    }

    // ---------------------------------------------------------------- rasterizing

    /**
     * Draw a shape into a PNG. The image is padded for the outline and shadow, scaled
     * down if it would exceed maxSize (CSS px), and drawn at this.dpr for crisp HiDPI.
     * Returns { url, width, height, hotX, hotY } in CSS px.
     */
    _rasterize(shape, s, maxSize) {
        const outline = s.outlineWidth;
        const blur = s.shadow ? this.cfg.SHADOW_BLUR : 0;
        const pad = Math.ceil(outline + blur * 1.5) + 1;
        const b = CursorManager._bounds(shape.prims);
        const span = Math.max(b.maxX - b.minX, b.maxY - b.minY);
        const scale = Math.min(1, (maxSize - 2 * pad - 2) / span);
        const ox = Math.ceil(pad - b.minX * scale);
        const oy = Math.ceil(pad - b.minY * scale);
        const width = Math.ceil(ox + b.maxX * scale + pad);
        const height = Math.ceil(oy + b.maxY * scale + pad);

        const dpr = this.dpr;
        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(width * dpr);
        canvas.height = Math.ceil(height * dpr);
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, ox * dpr, oy * dpr);
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const outlineStroke = (2 * outline) / scale;   // outline stays in CSS px whatever the shape scale

        if (outline > 0 || blur > 0) {
            ctx.save();
            ctx.fillStyle = ctx.strokeStyle = outline > 0 ? s.outlineColor : shape.color;
            if (blur > 0) {
                ctx.shadowColor = this.cfg.SHADOW_COLOR;
                ctx.shadowBlur = blur * dpr;     // shadowBlur ignores the transform
            }
            for (const p of shape.prims) CursorManager._drawPrim(ctx, p, outlineStroke);
            ctx.restore();
        }

        ctx.fillStyle = ctx.strokeStyle = shape.color;
        for (const p of shape.prims) CursorManager._drawPrim(ctx, p, 0);

        if (shape.details) {
            const detailColor = outline > 0 ? s.outlineColor : 'rgba(0, 0, 0, 0.45)';
            for (const p of shape.details) {
                ctx.fillStyle = ctx.strokeStyle = p.color === 'outline' ? detailColor : p.color;
                CursorManager._drawPrim(ctx, p, 0);
            }
        }

        return { url: canvas.toDataURL('image/png'), width, height, hotX: ox, hotY: oy };
    }

    static _drawPrim(ctx, p, extraStroke) {
        ctx.beginPath();
        if (p.type === 'poly') {
            p.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
            if (p.closed !== false) ctx.closePath();
        } else if (p.type === 'arc') {
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        } else if (p.type === 'rrect') {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot || 0);
            if (ctx.roundRect) ctx.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, p.r);
            else ctx.rect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        }
        ctx.setLineDash(p.dash || []);
        if (p.fill) {
            ctx.fill();
            if (extraStroke > 0) {
                ctx.lineWidth = extraStroke;
                ctx.stroke();
            }
        } else {
            ctx.lineWidth = p.lw + extraStroke;
            ctx.stroke();
        }
    }

    static _bounds(prims) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const add = (x, y, m) => {
            minX = Math.min(minX, x - m); maxX = Math.max(maxX, x + m);
            minY = Math.min(minY, y - m); maxY = Math.max(maxY, y + m);
        };
        for (const p of prims) {
            const m = p.fill ? 0 : p.lw / 2;
            if (p.type === 'poly') {
                for (const [x, y] of p.pts) add(x, y, m);
            } else if (p.type === 'arc') {
                add(p.x, p.y, p.r + m);
            } else if (p.type === 'rrect') {
                const c = Math.cos(p.rot || 0), s = Math.sin(p.rot || 0);
                for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
                    const lx = dx * p.w / 2, ly = dy * p.h / 2;
                    add(p.x + lx * c - ly * s, p.y + lx * s + ly * c, 0);
                }
            }
        }
        return { minX, minY, maxX, maxY };
    }
}
