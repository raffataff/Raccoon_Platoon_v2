// js/unitSpriteFx.js
//
// Load-time sprite processing that makes units read clearly against busy, earthy terrain.
// All the expensive work happens once while assets load. Per frame a unit does one Map
// lookup and still issues a single drawImage for its body.
//
//  1. Outlines: every living-unit sprite gets a baked copy with a faction-coloured
//     silhouette outline. The sprite's alpha is stamped at small offsets around a disc
//     (a dilation), tinted with 'source-in', and the sprite is drawn back on top. The
//     copy is cropped to the visible pixels and kept as an ImageBitmap, so the unit
//     draws it in place of the raw PNG at no extra per-frame cost.
//     Player sprites use the selection variant (CONFIG.UNIT_VISUALS.SELECTION_OUTLINE)
//     instead of a faction colour, so the blue rim only appears on selected units.
//  2. Ground-shadow metrics: feet sit at different heights in different PNGs (padding,
//     pose, 128 vs 256 px art), so they are measured from each sprite's alpha channel.
//     Unit.renderGroundShadow() uses them to plant a soft ellipse under the feet of
//     every unit type without per-sprite tuning.
//
// Tuning lives in CONFIG.UNIT_VISUALS.OUTLINE (per faction: OUTLINE.ENEMY, OUTLINE.HOSTAGE),
// CONFIG.UNIT_VISUALS.SELECTION_OUTLINE and CONFIG.UNIT_VISUALS.GROUND_SHADOW.

class UnitSpriteFx {
    constructor() {
        // HTMLImageElement -> { outline, shadow }
        //   outline: { image, x, y, w, h } | null - baked copy; x/y/w/h are the crop rect in the
        //            source image's pixels (x/y can be negative: the outline extends past the PNG).
        //   shadow:  { cx, footY, width } | null - source pixels; cx/footY are relative to the image
        //            centre, because units draw their sprite centred on (x, y).
        this._entries = new Map();
        this._discCache = new Map();
        this._shadowTexture = null;
        this._analysisCanvas = null;
        this._analysisCtx = null;
        this._bakeCanvas = null;
        this._bakeCtx = null;
    }

    get(img) {
        return img ? this._entries.get(img) : undefined;
    }

    /**
     * Builds outline copies and shadow metrics for groups of sprites. Images that were
     * already processed are skipped, so calling this again after a re-preload is cheap.
     *
     * @param {Array<{images: Array<HTMLImageElement|null>, scale: number, faction: string}>} sets
     *   One entry per sprite set (e.g. the 8 directions of one unit type). `scale` is the
     *   set's sprite scale factor (keeps the outline the same thickness on screen for every
     *   unit type); `faction` is 'player' | 'enemy' | 'hostage'.
     */
    async build(sets) {
        if (typeof document === 'undefined' || !Array.isArray(sets)) return;
        const outlineCfg = (CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.OUTLINE) || {};
        const selectionCfg = (CONFIG.UNIT_VISUALS && CONFIG.UNIT_VISUALS.SELECTION_OUTLINE) || {};
        const pending = [];

        for (let s = 0; s < sets.length; s++) {
            const set = sets[s];
            const images = ((set && set.images) || [])
                .filter(img => img && img.naturalWidth > 0 && img.naturalHeight > 0 && !this._entries.has(img));
            if (images.length === 0) continue;

            const infos = images.map(img => this._analyze(img));

            // One shadow width per set (median of the per-direction leg widths) so the shadow
            // doesn't pulse when the unit turns. Its position stays per-direction so it follows
            // the feet, which really do move between direction sprites.
            const widths = infos.filter(info => info && info.bandWidth > 0)
                .map(info => info.bandWidth)
                .sort((a, b) => a - b);
            const setWidth = widths.length ? widths[Math.floor(widths.length / 2)] : 0;

            const scale = set.scale > 0 ? set.scale : 0.5;

            // Player sprites bake the selection outline (blue) instead of a faction colour, so
            // unselected player units carry no rim at all. Enemies and hostages use their own
            // per-faction colour and width.
            const useSelection = set.faction === 'player'
                && selectionCfg.ENABLED !== false
                && !!selectionCfg.COLOR;
            const factionCfg = this._factionOutline(set.faction, outlineCfg);
            const color = useSelection ? selectionCfg.COLOR : factionCfg.color;

            // The selection rim is independent of the faction-outline toggle, so it is baked
            // whenever it is enabled; the faction rim follows OUTLINE.ENABLED.
            const bakeEnabled = useSelection ? true : (outlineCfg.ENABLED !== false);

            const cfg = useSelection ? selectionCfg : { WIDTH: factionCfg.width, MAX_SOURCE_PX: outlineCfg.MAX_SOURCE_PX };
            const maxSourcePx = cfg.MAX_SOURCE_PX || 6;
            const thickness = Math.min(maxSourcePx, Math.max(0.75, (cfg.WIDTH || 1.25) / scale));

            images.forEach((img, i) => {
                const info = infos[i];
                const entry = {
                    outline: null,
                    shadow: (info && setWidth > 0) ? {
                        cx: info.footCx - img.naturalWidth / 2,
                        footY: info.footY - img.naturalHeight / 2,
                        width: setWidth
                    } : null
                };
                this._entries.set(img, entry);
                if (bakeEnabled && color) {
                    const promise = this._bakeOutline(img, info, thickness, color, entry);
                    if (promise) pending.push(promise);
                }
            });

            // Yield now and then so the loading screen keeps animating.
            if (s % 8 === 7) await new Promise(resolve => setTimeout(resolve, 0));
        }

        if (pending.length) await Promise.all(pending);
    }

    /**
     * Soft black ellipse used for ground shadows (opacity is applied at draw time).
     * Drawn non-uniformly scaled, so one round gradient serves every unit.
     */
    getShadowTexture() {
        if (this._shadowTexture || typeof document === 'undefined') return this._shadowTexture;
        const size = 128;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const half = size / 2;
        const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.85)');
        grad.addColorStop(0.75, 'rgba(0, 0, 0, 0.4)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);
        this._shadowTexture = canvas;
        return canvas;
    }

    /**
     * Resolves a faction's outline colour and width from CONFIG.UNIT_VISUALS.OUTLINE.
     * Each faction has its own block (OUTLINE.ENEMY, OUTLINE.HOSTAGE), so colour and size can
     * be tuned independently. Missing blocks fall back to no rim.
     */
    _factionOutline(faction, cfg) {
        const block = (faction === 'enemy' ? cfg.ENEMY : faction === 'hostage' ? cfg.HOSTAGE : null);
        if (!block) return { color: null, width: 1.25 };
        return {
            color: block.COLOR || null,
            width: block.WIDTH !== undefined ? block.WIDTH : 1.25
        };
    }

    /**
     * Reads the sprite's alpha once and returns:
     *  - minX/minY/maxX/maxY: bounds of all visible pixels (used to crop the outline copy)
     *  - footY: bottom edge of the feet (lowest row with a meaningful run of solid pixels, so
     *           a stray tail tip or anti-aliasing speck doesn't count)
     *  - footCx / bandWidth: centroid and 10th-90th percentile spread of the solid pixels in
     *           the bottom 15% of the body (legs/feet); percentiles ignore thin tails and barrels
     * All in source pixels. Returns null if the pixels can't be read (e.g. a tainted canvas
     * under file://); callers then fall back to the full frame and a size-based shadow.
     */
    _analyze(img) {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        if (!this._analysisCanvas) {
            this._analysisCanvas = document.createElement('canvas');
            this._analysisCanvas.width = Math.max(256, w);
            this._analysisCanvas.height = Math.max(256, h);
            this._analysisCtx = this._analysisCanvas.getContext('2d', { willReadFrequently: true });
        } else if (this._analysisCanvas.width < w || this._analysisCanvas.height < h) {
            this._analysisCanvas.width = Math.max(this._analysisCanvas.width, w);
            this._analysisCanvas.height = Math.max(this._analysisCanvas.height, h);
        }
        const ctx = this._analysisCtx;
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0);

        let data;
        try {
            data = ctx.getImageData(0, 0, w, h).data;
        } catch (e) {
            return null;
        }

        const SOLID = 128;
        const rowSolid = new Uint32Array(h);
        let minX = w, minY = h, maxX = -1, maxY = -1;
        let topSolid = -1;
        for (let y = 0; y < h; y++) {
            let i = y * w * 4 + 3;
            let solid = 0;
            for (let x = 0; x < w; x++, i += 4) {
                const a = data[i];
                if (a === 0) continue;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                maxY = y;
                if (a >= SOLID) solid++;
            }
            rowSolid[y] = solid;
            if (solid > 0 && topSolid < 0) topSolid = y;
        }
        if (maxX < 0) return null; // fully transparent frame

        const info = { minX, minY, maxX, maxY, footY: 0, footCx: 0, bandWidth: 0 };
        if (topSolid < 0) return info;

        const minRun = Math.max(2, Math.round(w * 0.03));
        let footRow = -1;
        for (let y = h - 1; y >= topSolid; y--) {
            if (rowSolid[y] >= minRun) { footRow = y; break; }
        }
        if (footRow < 0) return info;

        const bandTop = Math.max(topSolid, footRow - Math.max(1, Math.round((footRow - topSolid) * 0.15)));
        const colSolid = new Uint32Array(w);
        let total = 0;
        let sumX = 0;
        for (let y = bandTop; y <= footRow; y++) {
            let i = y * w * 4 + 3;
            for (let x = 0; x < w; x++, i += 4) {
                if (data[i] >= SOLID) { colSolid[x]++; total++; sumX += x; }
            }
        }
        if (total === 0) return info;

        const lo = total * 0.1;
        const hi = total * 0.9;
        let acc = 0, p10 = -1, p90 = -1;
        for (let x = 0; x < w; x++) {
            acc += colSolid[x];
            if (p10 < 0 && acc > lo) p10 = x;
            if (acc >= hi) { p90 = x; break; }
        }
        if (p10 < 0) p10 = 0;
        if (p90 < p10) p90 = p10;

        info.footY = footRow + 1;
        info.footCx = sumX / total + 0.5;
        info.bandWidth = p90 - p10 + 1;
        return info;
    }

    /**
     * Bakes the outlined copy of `img` and stores it on `entry.outline` (asynchronously when
     * createImageBitmap is available). Returns a promise to await, or null if done inline.
     */
    _bakeOutline(img, info, thickness, color, entry) {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        // Crop to the visible pixels plus room for the outline: much less memory than full frames.
        const minX = info ? info.minX : 0;
        const minY = info ? info.minY : 0;
        const maxX = info ? info.maxX : w - 1;
        const maxY = info ? info.maxY : h - 1;
        const pad = Math.ceil(thickness) + 1;
        const x0 = minX - pad;
        const y0 = minY - pad;
        const bw = maxX - minX + 1 + pad * 2;
        const bh = maxY - minY + 1 + pad * 2;

        const ctx = this._getBakeContext(bw, bh);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.clearRect(0, 0, bw, bh);

        // Silhouette dilation: stamp the sprite around a disc of radius `thickness`.
        const ox = -x0;
        const oy = -y0;
        const offsets = this._discOffsets(thickness);
        for (let i = 0; i < offsets.length; i += 2) {
            ctx.drawImage(img, ox + offsets[i], oy + offsets[i + 1]);
        }
        // Tint the dilated silhouette, then put the untouched sprite back on top.
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, bw, bh);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(img, ox, oy);

        if (typeof createImageBitmap === 'function') {
            // createImageBitmap snapshots the canvas synchronously, so the bake canvas can be
            // reused for the next sprite straight away.
            return createImageBitmap(this._bakeCanvas, 0, 0, bw, bh)
                .then(bitmap => { entry.outline = { image: bitmap, x: x0, y: y0, w: bw, h: bh }; })
                .catch(() => { /* keep drawing the plain sprite */ });
        }
        const copy = document.createElement('canvas');
        copy.width = bw;
        copy.height = bh;
        copy.getContext('2d').drawImage(this._bakeCanvas, 0, 0, bw, bh, 0, 0, bw, bh);
        entry.outline = { image: copy, x: x0, y: y0, w: bw, h: bh };
        return null;
    }

    _getBakeContext(w, h) {
        if (!this._bakeCanvas) {
            this._bakeCanvas = document.createElement('canvas');
            this._bakeCanvas.width = Math.max(320, w);
            this._bakeCanvas.height = Math.max(320, h);
            this._bakeCtx = this._bakeCanvas.getContext('2d');
        } else if (this._bakeCanvas.width < w || this._bakeCanvas.height < h) {
            // Resizing keeps the same context object (its state is reset, which is fine).
            this._bakeCanvas.width = Math.max(this._bakeCanvas.width, w);
            this._bakeCanvas.height = Math.max(this._bakeCanvas.height, h);
        }
        return this._bakeCtx;
    }

    /**
     * Stamp offsets covering a disc of radius r: concentric rings at most 1 source px apart,
     * each sampled at most ~1 px apart along its circumference. Filling the disc (not just its
     * rim) keeps thin details like gun barrels from getting a detached "ghost" outline.
     * Returns a flat [dx0, dy0, dx1, dy1, ...] array.
     */
    _discOffsets(r) {
        const key = Math.round(r * 4) / 4;
        let offsets = this._discCache.get(key);
        if (offsets) return offsets;
        offsets = [];
        const rings = Math.max(1, Math.ceil(key));
        for (let k = 1; k <= rings; k++) {
            const ringR = key * k / rings;
            const steps = Math.max(8, Math.ceil(2 * Math.PI * ringR));
            for (let i = 0; i < steps; i++) {
                const angle = (i / steps) * Math.PI * 2;
                offsets.push(Math.cos(angle) * ringR, Math.sin(angle) * ringR);
            }
        }
        this._discCache.set(key, offsets);
        return offsets;
    }
}
