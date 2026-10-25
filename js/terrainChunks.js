// js/terrainChunks.js
//
// Mission ground terrain (mud + grass tiles), drawn at the screen's real resolution.
//
// The terrain used to be painted once into a single world-sized canvas at 1 px per world
// unit, which the camera then stretched by zoom x devicePixelRatio (2.3x on a 200%-scaled
// 4K screen): tiles were shrunk into that canvas and blown back up on screen, and a
// late-phase map needed a ~530 MB canvas.
//
// Now Game.buildTerrain() runs the same placement pass (same RNG sequence, same order) but
// records each tile (image, centre, size, rotation, flip) here instead of painting it.
// render() replays those placements into small chunk canvases sized in DEVICE pixels, built
// on demand around the camera and recycled least-recently-used. A chunk replays every
// placement that touches it in the original global order, so overlaps across chunk seams
// come out exactly as they would on one big canvas.
//
// Chunks sit on the device pixel grid, so whenever the camera rests on a whole device pixel
// each one blits 1:1 with no resampling. While the camera glides sub-pixel they are resampled,
// and their antialiased edges would let the background show through as hairline seams; each
// chunk therefore carries a GUTTER_PX border of its neighbours' content and is drawn that much
// larger, so chunks overlap with identical pixels. Memory scales with the screen, not the map.
//
// Tuning lives in CONFIG.TERRAIN_CHUNKS.

class TerrainChunkCache {
    constructor() {
        // --- Recorded placements ---
        this._images = [];                 // image index -> HTMLImageElement
        this._imageIndex = new Map();      // HTMLImageElement -> image index
        this._data = new Float32Array(0);  // STRIDE floats per placement: cx, cy, size, rotation, flip
        this._imgIdx = new Uint16Array(0);
        this._count = 0;
        this._maxReach = 0;                // largest centre-to-corner distance of any placement
        this._worldW = 0;
        this._worldH = 0;
        this._fillColor = null;            // solid base colour under the tiles (biomes without mud sprites)
        this._ready = false;

        // --- Spatial index: placements bucketed by centre (CSR layout) ---
        this._bucketCols = 0;
        this._bucketRows = 0;
        this._bucketStart = null;          // Uint32Array(buckets + 1): start offset of each bucket
        this._bucketItems = null;          // Uint32Array(count): placement indices, ascending per bucket
        this._scratch = new Uint32Array(2048);

        // --- Chunk cache ---
        this._chunks = new Map();          // key -> { canvas, lastFrame }; Map order = LRU order
        this._freeCanvases = [];
        this._scaleX = 0;
        this._scaleY = 0;
        this._chunkPx = 0;
        this._frame = 0;
    }

    get isReady() {
        return this._ready;
    }

    /** Starts a new recording for a world of the given size; drops the previous terrain. */
    begin(worldWidth, worldHeight) {
        this._releaseAllChunks();
        this._images = [];
        this._imageIndex = new Map();
        this._data = new Float32Array(TerrainChunkCache.INITIAL_CAPACITY * TerrainChunkCache.STRIDE);
        this._imgIdx = new Uint16Array(TerrainChunkCache.INITIAL_CAPACITY);
        this._count = 0;
        this._maxReach = 0;
        this._worldW = worldWidth;
        this._worldH = worldHeight;
        this._fillColor = null;
        this._ready = false;
    }

    /**
     * Records one tile: drawn centred on (cx, cy) at size x size world px, rotated by
     * `rotation` radians, then mirrored horizontally when flip is -1.
     */
    add(img, cx, cy, size, rotation, flip) {
        let idx = this._imageIndex.get(img);
        if (idx === undefined) {
            idx = this._images.length;
            this._images.push(img);
            this._imageIndex.set(img, idx);
        }
        if (this._count === this._imgIdx.length) this._grow();
        const o = this._count * TerrainChunkCache.STRIDE;
        this._data[o] = cx;
        this._data[o + 1] = cy;
        this._data[o + 2] = size;
        this._data[o + 3] = rotation;
        this._data[o + 4] = flip;
        this._imgIdx[this._count] = idx;
        this._count++;
        const reach = rotation !== 0 ? size * 0.5 * Math.SQRT2 : size * 0.5;
        if (reach > this._maxReach) this._maxReach = reach;
    }

    /** Ends the recording and builds the spatial index. fillColor: solid colour painted under the tiles, or null. */
    finish(fillColor) {
        const n = this._count;
        const S = TerrainChunkCache.STRIDE;
        // Trim the growth slack.
        this._data = this._data.slice(0, n * S);
        this._imgIdx = this._imgIdx.slice(0, n);
        this._fillColor = fillColor || null;

        const bs = TerrainChunkCache.BUCKET_SIZE;
        const cols = Math.max(1, Math.ceil(this._worldW / bs));
        const rows = Math.max(1, Math.ceil(this._worldH / bs));
        const bucketCount = cols * rows;
        const start = new Uint32Array(bucketCount + 1);
        const bucketOf = new Uint32Array(n);
        for (let i = 0; i < n; i++) {
            const bx = Math.min(cols - 1, Math.max(0, Math.floor(this._data[i * S] / bs)));
            const by = Math.min(rows - 1, Math.max(0, Math.floor(this._data[i * S + 1] / bs)));
            const b = by * cols + bx;
            bucketOf[i] = b;
            start[b + 1]++;
        }
        for (let b = 0; b < bucketCount; b++) start[b + 1] += start[b];
        const fill = start.slice(0, bucketCount);
        const items = new Uint32Array(n);
        for (let i = 0; i < n; i++) items[fill[bucketOf[i]]++] = i;

        this._bucketCols = cols;
        this._bucketRows = rows;
        this._bucketStart = start;
        this._bucketItems = items;
        this._ready = true;
    }

    /**
     * Draws the terrain visible in the world rect (viewX, viewY, viewW, viewH). `ctx` must
     * already carry the world transform; scaleX/scaleY are device pixels per world unit
     * (camera zoom x backing-store scale). Returns false when there is no terrain to draw.
     */
    render(ctx, viewX, viewY, viewW, viewH, scaleX, scaleY) {
        if (!this._ready) return false;
        const cfg = CONFIG.TERRAIN_CHUNKS || {};
        const chunkPx = Math.max(64, Math.round(cfg.CHUNK_DEVICE_PX || 512));
        if (scaleX !== this._scaleX || scaleY !== this._scaleY || chunkPx !== this._chunkPx) {
            // Zoom, Render Scale or monitor DPI changed: every chunk is at the wrong resolution.
            this._releaseAllChunks();
            this._scaleX = scaleX;
            this._scaleY = scaleY;
            this._chunkPx = chunkPx;
        }

        const cw = chunkPx / scaleX;
        const ch = chunkPx / scaleY;
        const gx = TerrainChunkCache.GUTTER_PX / scaleX;
        const gy = TerrainChunkCache.GUTTER_PX / scaleY;
        const cols = Math.ceil(this._worldW / cw);
        const rows = Math.ceil(this._worldH / ch);
        const c0 = Math.max(0, Math.floor(viewX / cw));
        const r0 = Math.max(0, Math.floor(viewY / ch));
        const c1 = Math.min(cols - 1, Math.floor((viewX + viewW) / cw));
        const r1 = Math.min(rows - 1, Math.floor((viewY + viewH) / ch));
        if (c1 < c0 || r1 < r0) return true;

        const frame = ++this._frame;
        for (let r = r0; r <= r1; r++) {
            for (let c = c0; c <= c1; c++) {
                const key = r * cols + c;
                let chunk = this._chunks.get(key);
                if (chunk) {
                    this._chunks.delete(key); // re-insert = most recently used
                } else {
                    chunk = { canvas: this._buildChunk(c, r, cw, ch), lastFrame: 0 };
                }
                chunk.lastFrame = frame;
                this._chunks.set(key, chunk);
                ctx.drawImage(chunk.canvas, c * cw - gx, r * ch - gy, cw + 2 * gx, ch + 2 * gy);
            }
        }

        // Pre-build the ring just outside the view, a few chunks per frame, so panning
        // rarely has to build a chunk in the frame it scrolls into view.
        let budget = cfg.PREFETCH_PER_FRAME !== undefined ? cfg.PREFETCH_PER_FRAME : 2;
        let ringCount = 0;
        const pr0 = Math.max(0, r0 - 1), pr1 = Math.min(rows - 1, r1 + 1);
        const pc0 = Math.max(0, c0 - 1), pc1 = Math.min(cols - 1, c1 + 1);
        for (let r = pr0; r <= pr1; r++) {
            for (let c = pc0; c <= pc1; c++) {
                if (r >= r0 && r <= r1 && c >= c0 && c <= c1) continue;
                ringCount++;
                const key = r * cols + c;
                const chunk = this._chunks.get(key);
                if (chunk) {
                    chunk.lastFrame = frame;
                } else if (budget > 0) {
                    budget--;
                    this._chunks.set(key, { canvas: this._buildChunk(c, r, cw, ch), lastFrame: frame });
                }
            }
        }

        // Keep the view + ring, plus a few recently seen chunks for when the camera turns back.
        const visibleCount = (r1 - r0 + 1) * (c1 - c0 + 1);
        const extra = cfg.CACHE_EXTRA_CHUNKS !== undefined ? cfg.CACHE_EXTRA_CHUNKS : 16;
        const cap = visibleCount + ringCount + extra;
        if (this._chunks.size > cap) {
            for (const [key, chunk] of this._chunks) {
                if (this._chunks.size <= cap) break;
                if (chunk.lastFrame === frame) continue;
                this._chunks.delete(key);
                this._recycleCanvas(chunk.canvas);
            }
        }
        return true;
    }

    // Replays every placement touching chunk (c, r), plus its gutter, into a
    // (chunkPx + 2 * GUTTER_PX)-square canvas.
    _buildChunk(c, r, cw, ch) {
        const g = TerrainChunkCache.GUTTER_PX;
        const px = this._chunkPx + 2 * g;
        const canvas = this._freeCanvases.pop() || document.createElement('canvas');
        if (canvas.width !== px) canvas.width = px;
        if (canvas.height !== px) canvas.height = px;
        const ctx = canvas.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.imageSmoothingEnabled = true;
        // Tiles are downscaled into the chunk (e.g. ~290 px grass art -> ~118 device px);
        // 'high' filters that properly instead of point-sampling a few source texels.
        ctx.imageSmoothingQuality = (CONFIG.TERRAIN_CHUNKS && CONFIG.TERRAIN_CHUNKS.SMOOTHING_QUALITY) || 'high';
        ctx.clearRect(0, 0, px, px);

        const sx = this._scaleX;
        const sy = this._scaleY;
        // World position of the canvas's top-left corner (the gutter included). Neighbouring
        // chunks are offset by exactly chunkPx device px, so their overlap rasterizes identically.
        const ox = c * cw - g / sx;
        const oy = r * ch - g / sy;

        // Clip to the world rect, as the old world-sized canvas did.
        const clipL = Math.max(0, -ox * sx);
        const clipT = Math.max(0, -oy * sy);
        const clipR = Math.min(px, (this._worldW - ox) * sx);
        const clipB = Math.min(px, (this._worldH - oy) * sy);
        const clipped = clipL > 0 || clipT > 0 || clipR < px || clipB < px;
        if (clipped) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(clipL, clipT, clipR - clipL, clipB - clipT);
            ctx.clip();
        }
        if (this._fillColor) {
            ctx.fillStyle = this._fillColor;
            ctx.fillRect(0, 0, px, px);
        }

        const x1 = ox + px / sx;
        const y1 = oy + px / sy;
        const n = this._collect(ox, oy, x1, y1);
        const items = this._scratch;
        const data = this._data;
        const imgIdx = this._imgIdx;
        const images = this._images;
        const S = TerrainChunkCache.STRIDE;
        for (let k = 0; k < n; k++) {
            const i = items[k];
            const o = i * S;
            const cx = data[o];
            const cy = data[o + 1];
            const size = data[o + 2];
            const rot = data[o + 3];
            const flip = data[o + 4];
            const half = size * 0.5;
            const reach = rot !== 0 ? half * Math.SQRT2 : half;
            if (cx + reach <= ox || cx - reach >= x1 || cy + reach <= oy || cy - reach >= y1) continue;
            const cos = rot !== 0 ? Math.cos(rot) : 1;
            const sin = rot !== 0 ? Math.sin(rot) : 0;
            // = scale(sx, sy) . translate(-ox, -oy) . translate(cx, cy) . rotate(rot) . scale(flip, 1)
            ctx.setTransform(sx * cos * flip, sy * sin * flip, -sx * sin, sy * cos, sx * (cx - ox), sy * (cy - oy));
            ctx.drawImage(images[imgIdx[i]], -half, -half, size, size);
        }

        if (clipped) ctx.restore();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        return canvas;
    }

    // Fills this._scratch with the indices of placements whose centre bucket lies within
    // reach of the world rect, in ascending (= original draw) order. Returns the count.
    _collect(x0, y0, x1, y1) {
        const bs = TerrainChunkCache.BUCKET_SIZE;
        const pad = this._maxReach;
        const cols = this._bucketCols;
        const rows = this._bucketRows;
        const bc0 = Math.min(cols - 1, Math.max(0, Math.floor((x0 - pad) / bs)));
        const bc1 = Math.min(cols - 1, Math.max(0, Math.floor((x1 + pad) / bs)));
        const br0 = Math.min(rows - 1, Math.max(0, Math.floor((y0 - pad) / bs)));
        const br1 = Math.min(rows - 1, Math.max(0, Math.floor((y1 + pad) / bs)));
        const start = this._bucketStart;
        const bucketItems = this._bucketItems;

        let total = 0;
        for (let br = br0; br <= br1; br++) {
            for (let bc = bc0; bc <= bc1; bc++) {
                const b = br * cols + bc;
                total += start[b + 1] - start[b];
            }
        }
        if (this._scratch.length < total) {
            this._scratch = new Uint32Array(Math.max(total, this._scratch.length * 2));
        }
        const out = this._scratch;
        let n = 0;
        for (let br = br0; br <= br1; br++) {
            for (let bc = bc0; bc <= bc1; bc++) {
                const b = br * cols + bc;
                for (let k = start[b], end = start[b + 1]; k < end; k++) out[n++] = bucketItems[k];
            }
        }
        // Buckets are each ascending; merge them back into global draw order.
        if (bc1 > bc0 || br1 > br0) out.subarray(0, n).sort();
        return n;
    }

    _grow() {
        const cap = Math.max(TerrainChunkCache.INITIAL_CAPACITY, this._imgIdx.length * 2);
        const data = new Float32Array(cap * TerrainChunkCache.STRIDE);
        data.set(this._data);
        const imgIdx = new Uint16Array(cap);
        imgIdx.set(this._imgIdx);
        this._data = data;
        this._imgIdx = imgIdx;
    }

    _recycleCanvas(canvas) {
        if (this._freeCanvases.length < TerrainChunkCache.MAX_FREE_CANVASES) {
            this._freeCanvases.push(canvas);
        } else {
            canvas.width = 0; // release the backing store
            canvas.height = 0;
        }
    }

    _releaseAllChunks() {
        for (const chunk of this._chunks.values()) this._recycleCanvas(chunk.canvas);
        this._chunks.clear();
    }
}

TerrainChunkCache.STRIDE = 5;               // floats per placement
TerrainChunkCache.INITIAL_CAPACITY = 8192;  // placements; grows by doubling
TerrainChunkCache.BUCKET_SIZE = 256;        // world px per spatial-index bucket
TerrainChunkCache.MAX_FREE_CANVASES = 32;   // spare chunk canvases kept for reuse
TerrainChunkCache.GUTTER_PX = 2;            // device px of neighbour overlap per chunk edge (covers bilinear + edge AA)
