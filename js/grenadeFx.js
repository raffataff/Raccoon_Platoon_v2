// js/grenadeFx.js
//
// Procedural explosion VFX for every grenade type (CONFIG.GRENADE_TYPES), plus the
// camera shake they drive. One GrenadeFx lives on Game (game.grenadeFx); blasts are
// started through game.addVisualEffect('grenade_explosion', { x, y, radius, typeKey }).
//
// Performance: every texture (glows, cloud puffs, shards, scorch / frost / lightning-burn
// decals, molten crust) is baked once at startup and tinted copies are cached, so drawing
// is plain drawImage calls. Particles, rings, lights, bolts and decals come from fixed
// pools: a blast allocates one small timeline object and a frame allocates nothing.
//
// Layers (called from Game.render):
//   renderGround()  after terrain, under units: decals, Slagger pool, shadows, ground glow.
//   render()        over the world: fireballs, smoke, sparks, shards, bolts, cores.
//   renderLights()  punches blast light into the night-mission darkness overlay.
//
// Shared tuning: CONFIG.VISUAL_EFFECTS.GRENADE_FX and CONFIG.VISUAL_EFFECTS.SCREEN_SHAKE.
// The look of each grenade type is its recipe in GRENADE_FX_RECIPES (bottom of file).
// Purely cosmetic, so Math.random() is fine here (never touches seeded procgen).

const FX_TAU = Math.PI * 2;

// What a particle does when it falls back to the ground (z <= 0).
const FX_LAND_NONE = 0;   // bounce (if bounce > 0) then lie still
const FX_LAND_DIE = 1;    // vanish on contact
const FX_LAND_DUST = 2;   // kick up a small dust puff
const FX_LAND_SPLAT = 3;  // molten glob: leaves a cooling slag splat decal
const FX_LAND_GLINT = 4;  // ice shard: sparkle where it lands
const FX_LAND_POP = 5;    // nanite rain: tiny green pop, then vanish

const FX_BOLT_MAX_PTS = 20;
const FX_BOLT_MAX_BRANCHES = 3;
const FX_BOLT_BRANCH_PTS = 6;

function fxRand(a, b) { return a + Math.random() * (b - a); }
function fxPick(arr) { return arr[(Math.random() * arr.length) | 0]; }
function fxSmooth(e0, e1, x) {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
}

const GRENADE_FX_PALETTE = {
    // Additive color ramps, hottest first. Sampled by particle life (white-hot -> cooled).
    RAMPS: {
        FIRE:   [[255, 255, 245], [255, 238, 170], [255, 196, 80], [255, 128, 32], [205, 60, 16], [96, 28, 12]],
        MAGMA:  [[255, 255, 225], [255, 226, 130], [255, 160, 45], [238, 88, 12], [150, 32, 6], [60, 16, 8]],
        CRYO:   [[255, 255, 255], [218, 248, 255], [130, 220, 255], [64, 150, 230], [24, 70, 140]],
        GRAV:   [[255, 236, 255], [238, 150, 255], [196, 60, 235], [120, 14, 175], [40, 0, 70]],
        ARC:    [[255, 255, 255], [255, 250, 212], [255, 228, 70], [255, 172, 10], [140, 82, 0]],
        VOLT:   [[255, 255, 255], [214, 236, 255], [148, 196, 255], [72, 112, 224]],
        NANITE: [[235, 255, 235], [150, 255, 160], [60, 214, 80], [22, 118, 44], [10, 52, 22]],
    },
    // Normal-blend clouds, lit from the top-left. Each tone is baked in three puff shapes.
    CLOUDS: {
        SMOKE: [[42, 38, 36], [62, 57, 53], [88, 83, 78], [118, 112, 105]],
        SOOT:  [[34, 28, 26], [52, 44, 40]],
        OZONE: [[128, 132, 140], [160, 165, 172]],
        DUST:  [[128, 108, 82], [156, 136, 106]],
        FOAM:  [[236, 248, 255], [206, 236, 250]],
        VOID:  [[44, 24, 60], [62, 36, 82]],
        HAZE:  [[104, 108, 110], [132, 136, 138], [96, 112, 100]],
    },
};

// ---------------------------------------------------------------------------------
// Texture baking (startup only)
// ---------------------------------------------------------------------------------
const FxTex = {
    canvas(w, h) {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        return c;
    },

    rgbStr(rgb, k = 1) {
        const r = Math.min(255, Math.round(rgb[0] * k));
        const g = Math.min(255, Math.round(rgb[1] * k));
        const b = Math.min(255, Math.round(rgb[2] * k));
        return `rgb(${r},${g},${b})`;
    },

    blob(g, x, y, r, rgb, a) {
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`);
        grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
        g.fillStyle = grad;
        g.beginPath(); g.arc(x, y, r, 0, FX_TAU); g.fill();
    },

    // Soft radial falloff: glows, flashes, light pools, and (stretched) sparks.
    glow(size) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2;
        const grad = g.createRadialGradient(h, h, 0, h, h, h);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.18, 'rgba(255,255,255,0.8)');
        grad.addColorStop(0.42, 'rgba(255,255,255,0.32)');
        grad.addColorStop(0.7, 'rgba(255,255,255,0.08)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
        return c;
    },

    // Billowy cloud mask: overlapping soft lobes, faded so nothing touches the texture edge.
    puffMask(size, lobes) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2;
        for (let i = 0; i < lobes; i++) {
            const a = Math.random() * FX_TAU, d = Math.random() * size * 0.2;
            const x = h + Math.cos(a) * d, y = h + Math.sin(a) * d;
            const r = size * fxRand(0.16, 0.3);
            const grad = g.createRadialGradient(x, y, 0, x, y, r);
            grad.addColorStop(0, 'rgba(255,255,255,0.9)');
            grad.addColorStop(0.6, 'rgba(255,255,255,0.55)');
            grad.addColorStop(1, 'rgba(255,255,255,0)');
            g.fillStyle = grad;
            g.beginPath(); g.arc(x, y, r, 0, FX_TAU); g.fill();
        }
        g.globalCompositeOperation = 'destination-in';
        const edge = g.createRadialGradient(h, h, size * 0.22, h, h, h);
        edge.addColorStop(0, 'rgba(0,0,0,1)');
        edge.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = edge;
        g.fillRect(0, 0, size, size);
        return c;
    },

    tint(src, rgb) {
        const c = FxTex.canvas(src.width, src.height), g = c.getContext('2d');
        g.drawImage(src, 0, 0);
        g.globalCompositeOperation = 'source-in';
        g.fillStyle = FxTex.rgbStr(rgb);
        g.fillRect(0, 0, c.width, c.height);
        return c;
    },

    // Tinted with a top-left highlight and bottom-right shade so a cloud reads as volume.
    lit(src, rgb) {
        const c = FxTex.canvas(src.width, src.height), g = c.getContext('2d');
        g.drawImage(src, 0, 0);
        g.globalCompositeOperation = 'source-in';
        const grad = g.createLinearGradient(0, 0, c.width, c.height);
        grad.addColorStop(0.15, FxTex.rgbStr(rgb, 1.35));
        grad.addColorStop(0.55, FxTex.rgbStr(rgb, 1.0));
        grad.addColorStop(0.95, FxTex.rgbStr(rgb, 0.62));
        g.fillStyle = grad;
        g.fillRect(0, 0, c.width, c.height);
        return c;
    },

    // Flame body for normal blending: paler hot heart, darker rim, so fire keeps its real
    // orange/red on bright terrain (additive alone washes out to yellow over grass).
    hot(src, rgb) {
        const c = FxTex.canvas(src.width, src.height), g = c.getContext('2d'), h = c.width / 2;
        g.drawImage(src, 0, 0);
        g.globalCompositeOperation = 'source-in';
        const grad = g.createRadialGradient(h * 0.85, h * 0.8, 0, h, h, h);
        grad.addColorStop(0, FxTex.rgbStr([rgb[0] + (255 - rgb[0]) * 0.5, rgb[1] + (255 - rgb[1]) * 0.5, rgb[2] + (255 - rgb[2]) * 0.5]));
        grad.addColorStop(0.45, FxTex.rgbStr(rgb));
        grad.addColorStop(1, FxTex.rgbStr(rgb, 0.55));
        g.fillStyle = grad;
        g.fillRect(0, 0, c.width, c.height);
        return c;
    },

    ramp(src, stops, steps, colorize = FxTex.tint) {
        const out = [];
        for (let i = 0; i < steps; i++) {
            const f = (i / (steps - 1)) * (stops.length - 1);
            const k = Math.min(stops.length - 2, Math.floor(f));
            const t = f - k, a = stops[k], b = stops[k + 1];
            out.push(colorize(src, [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]));
        }
        return out;
    },

    // Hard-cored dot: nanite motes, snowflakes.
    mote(size) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2;
        const grad = g.createRadialGradient(h, h, 0, h, h, h);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.45, 'rgba(255,255,255,0.85)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
        return c;
    },

    // Four-point twinkle.
    star(size) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2, w = size * 0.07;
        FxTex.blob(g, h, h, h * 0.42, [255, 255, 255], 0.9);
        g.fillStyle = 'rgba(255,255,255,0.95)';
        g.beginPath(); g.moveTo(0, h); g.lineTo(h, h - w); g.lineTo(size, h); g.lineTo(h, h + w); g.closePath(); g.fill();
        g.beginPath(); g.moveTo(h, 0); g.lineTo(h + w, h); g.lineTo(h, size); g.lineTo(h - w, h); g.closePath(); g.fill();
        return c;
    },

    // Glowing square: the nanites' "digital" glitch flecks.
    pixel(size) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2;
        FxTex.blob(g, h, h, h, [255, 255, 255], 0.35);
        g.fillStyle = '#ffffff';
        g.fillRect(h - size * 0.18, h - size * 0.18, size * 0.36, size * 0.36);
        return c;
    },

    // Thin glowing ring: molten bubbles popping on the Slagger pool.
    bubble(size) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2;
        FxTex.blob(g, h, h, h * 0.9, [255, 255, 255], 0.25);
        g.strokeStyle = 'rgba(255,255,255,0.95)';
        g.lineWidth = size * 0.09;
        g.beginPath(); g.arc(h, h, h * 0.62, 0, FX_TAU); g.stroke();
        return c;
    },

    // Ice crystal sliver, drawn pointing along +x.
    shard(w, h) {
        const c = FxTex.canvas(w, h), g = c.getContext('2d'), m = h / 2;
        const kink = w * fxRand(0.25, 0.4);
        g.beginPath();
        g.moveTo(1, m);
        g.lineTo(kink, 1);
        g.lineTo(w - 1, m + fxRand(-1.5, 1.5));
        g.lineTo(kink * fxRand(0.8, 1.2), h - 1);
        g.closePath();
        const grad = g.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(255,255,255,0.98)');
        grad.addColorStop(0.5, 'rgba(170,230,255,0.92)');
        grad.addColorStop(1, 'rgba(90,170,230,0.9)');
        g.fillStyle = grad;
        g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.95)';
        g.lineWidth = 1;
        g.stroke();
        g.beginPath(); g.moveTo(3, m); g.lineTo(w - 3, m);
        g.strokeStyle = 'rgba(255,255,255,0.6)';
        g.stroke();
        return c;
    },

    // Rock / dirt / casing chunk.
    debris(size, rgb) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2;
        const n = 6 + ((Math.random() * 3) | 0);
        g.beginPath();
        for (let i = 0; i < n; i++) {
            const a = (i / n) * FX_TAU + fxRand(-0.25, 0.25), r = h * fxRand(0.55, 0.95);
            if (i === 0) g.moveTo(h + Math.cos(a) * r, h + Math.sin(a) * r);
            else g.lineTo(h + Math.cos(a) * r, h + Math.sin(a) * r);
        }
        g.closePath();
        const grad = g.createLinearGradient(0, 0, size, size);
        grad.addColorStop(0, FxTex.rgbStr(rgb, 1.5));
        grad.addColorStop(1, FxTex.rgbStr(rgb, 0.6));
        g.fillStyle = grad;
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.45)';
        g.lineWidth = 1;
        g.stroke();
        return c;
    },

    // Blast mark: soot pool, ragged edge, radial streaks, ash flecks.
    scorch(size) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2;
        const grad = g.createRadialGradient(h, h, 0, h, h, h * 0.62);
        grad.addColorStop(0, 'rgba(12,9,7,0.92)');
        grad.addColorStop(0.45, 'rgba(20,14,10,0.75)');
        grad.addColorStop(1, 'rgba(25,18,12,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
        for (let i = 0; i < 34; i++) {
            const a = Math.random() * FX_TAU, d = h * fxRand(0.25, 0.55);
            FxTex.blob(g, h + Math.cos(a) * d, h + Math.sin(a) * d, h * fxRand(0.06, 0.16), [18, 12, 9], fxRand(0.25, 0.45));
        }
        for (let i = 0; i < 46; i++) {
            const a = Math.random() * FX_TAU, ca = Math.cos(a), sa = Math.sin(a);
            const r0 = h * fxRand(0.08, 0.22), r1 = h * fxRand(0.5, 0.96), w = h * fxRand(0.012, 0.04);
            g.fillStyle = `rgba(14,10,7,${fxRand(0.15, 0.38).toFixed(2)})`;
            g.beginPath();
            g.moveTo(h + ca * r0 - sa * w, h + sa * r0 + ca * w);
            g.lineTo(h + ca * r1, h + sa * r1);
            g.lineTo(h + ca * r0 + sa * w, h + sa * r0 - ca * w);
            g.closePath();
            g.fill();
        }
        for (let i = 0; i < 70; i++) {
            const a = Math.random() * FX_TAU, d = h * Math.sqrt(Math.random()) * 0.7;
            g.fillStyle = Math.random() < 0.5 ? 'rgba(170,160,150,0.16)' : 'rgba(8,6,4,0.4)';
            const s = fxRand(1, 3);
            g.fillRect(h + Math.cos(a) * d, h + Math.sin(a) * d, s, s);
        }
        return c;
    },

    // Lichtenberg burn left by the Tesla Egg: { burn (dark scar), hot (glowing copy) }.
    lightningScar(size) {
        const h = size / 2, lines = [];
        const grow = (x, y, ang, len, w, depth) => {
            const segs = Math.max(3, Math.round(len / (size * 0.028)));
            const step = len / segs, pts = [x, y];
            let cx = x, cy = y, a = ang;
            for (let i = 0; i < segs; i++) {
                a += fxRand(-0.6, 0.6);
                a = a * 0.8 + ang * 0.2;     // wander, but keep heading outward
                cx += Math.cos(a) * step; cy += Math.sin(a) * step;
                pts.push(cx, cy);
                if (depth > 0 && Math.random() < 0.32) {
                    const side = Math.random() < 0.5 ? -1 : 1;
                    grow(cx, cy, a + side * fxRand(0.45, 1.0), (len - step * i) * fxRand(0.35, 0.6), w * 0.62, depth - 1);
                }
            }
            lines.push({ pts, w });
        };
        const arms = 7 + ((Math.random() * 4) | 0);
        for (let k = 0; k < arms; k++) {
            grow(h, h, (k / arms) * FX_TAU + fxRand(-0.3, 0.3), h * fxRand(0.6, 0.92), size * 0.012, 2);
        }
        const strokeAll = (g, style, widthMul, alpha) => {
            g.strokeStyle = style; g.globalAlpha = alpha;
            g.lineCap = 'round'; g.lineJoin = 'round';
            for (const L of lines) {
                g.lineWidth = Math.max(0.6, L.w * widthMul);
                g.beginPath();
                g.moveTo(L.pts[0], L.pts[1]);
                for (let i = 2; i < L.pts.length; i += 2) g.lineTo(L.pts[i], L.pts[i + 1]);
                g.stroke();
            }
            g.globalAlpha = 1;
        };
        const burn = FxTex.canvas(size, size), bg = burn.getContext('2d');
        FxTex.blob(bg, h, h, h * 0.16, [14, 10, 6], 0.8);
        strokeAll(bg, 'rgb(30,20,12)', 3.4, 0.22);
        strokeAll(bg, 'rgb(14,9,5)', 1.0, 0.85);
        const hot = FxTex.canvas(size, size), hg = hot.getContext('2d');
        FxTex.blob(hg, h, h, h * 0.2, [255, 240, 170], 0.9);
        strokeAll(hg, 'rgb(255,210,90)', 3.0, 0.4);
        strokeAll(hg, 'rgb(255,250,225)', 0.9, 1);
        return { burn, hot };
    },

    // Frost burst: pale rime with dendritic crystals. { frost, sheen (additive flash) }.
    frost(size) {
        const h = size / 2;
        const frost = FxTex.canvas(size, size), g = frost.getContext('2d');
        const grad = g.createRadialGradient(h, h, 0, h, h, h * 0.9);
        grad.addColorStop(0, 'rgba(236,250,255,0.78)');
        grad.addColorStop(0.35, 'rgba(216,243,255,0.55)');
        grad.addColorStop(0.7, 'rgba(200,235,252,0.22)');
        grad.addColorStop(1, 'rgba(195,232,252,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
        // Mottled rime, heavier toward the middle.
        for (let i = 0; i < 48; i++) {
            const a = Math.random() * FX_TAU, d = h * Math.sqrt(Math.random()) * 0.85;
            FxTex.blob(g, h + Math.cos(a) * d, h + Math.sin(a) * d, h * fxRand(0.05, 0.16), [228, 247, 255], fxRand(0.18, 0.4));
        }
        const segs = [];   // flat x1, y1, x2, y2, width
        // Irregular fern-like crystals: random headings and lengths, each ray a wandering
        // polyline with side fronds sprouting at ~60 degrees, as real frost grows.
        const rays = 11 + ((Math.random() * 5) | 0);
        for (let k = 0; k < rays; k++) {
            let a = Math.random() * FX_TAU;
            const len = h * fxRand(0.32, 0.95), steps = 4, w = size * fxRand(0.005, 0.0075);
            let x = h + Math.cos(a) * h * 0.05, y = h + Math.sin(a) * h * 0.05;
            for (let s = 0; s < steps; s++) {
                a += fxRand(-0.18, 0.18);
                const sl = len / steps, nx = x + Math.cos(a) * sl, ny = y + Math.sin(a) * sl;
                const sw = w * (1 - s * 0.18);
                segs.push(x, y, nx, ny, sw);
                for (let f = 0.2; f < 1; f += fxRand(0.25, 0.45)) {
                    const fx = x + (nx - x) * f, fy = y + (ny - y) * f;
                    const fl = len * (1 - (s + f) / steps) * fxRand(0.18, 0.4);
                    if (fl < size * 0.008) continue;
                    for (let side = -1; side <= 1; side += 2) {
                        if (Math.random() < 0.3) continue;
                        const ba = a + side * fxRand(0.85, 1.2);
                        const ex = fx + Math.cos(ba) * fl, ey = fy + Math.sin(ba) * fl;
                        segs.push(fx, fy, ex, ey, sw * 0.55);
                        if (fl > size * 0.03 && Math.random() < 0.6) {
                            const tx = fx + Math.cos(ba) * fl * 0.55, ty = fy + Math.sin(ba) * fl * 0.55, ta = ba - side * 0.9;
                            segs.push(tx, ty, tx + Math.cos(ta) * fl * 0.35, ty + Math.sin(ta) * fl * 0.35, sw * 0.35);
                        }
                    }
                }
                x = nx; y = ny;
            }
        }
        // Scattered tiny six-armed flakes.
        for (let i = 0; i < 26; i++) {
            const a = Math.random() * FX_TAU, d = h * fxRand(0.15, 0.85), fr = h * fxRand(0.018, 0.045);
            const cx = h + Math.cos(a) * d, cy = h + Math.sin(a) * d, r0 = Math.random() * FX_TAU;
            for (let m = 0; m < 6; m++) {
                const ma = r0 + (m / 6) * FX_TAU;
                segs.push(cx, cy, cx + Math.cos(ma) * fr, cy + Math.sin(ma) * fr, size * 0.003);
            }
        }
        const strokeSegs = (ctx, style, mul, alpha) => {
            ctx.strokeStyle = style; ctx.globalAlpha = alpha; ctx.lineCap = 'round';
            for (let i = 0; i < segs.length; i += 5) {
                ctx.lineWidth = Math.max(0.5, segs[i + 4] * mul);
                ctx.beginPath(); ctx.moveTo(segs[i], segs[i + 1]); ctx.lineTo(segs[i + 2], segs[i + 3]); ctx.stroke();
            }
            ctx.globalAlpha = 1;
        };
        strokeSegs(g, 'rgb(150,215,250)', 2.6, 0.35);
        strokeSegs(g, 'rgb(248,253,255)', 1, 0.9);
        g.fillStyle = 'rgba(255,255,255,0.75)';
        for (let i = 0; i < 40; i++) {
            const a = Math.random() * FX_TAU, d = h * Math.sqrt(Math.random()) * 0.85, s = fxRand(1, 2.5);
            g.fillRect(h + Math.cos(a) * d, h + Math.sin(a) * d, s, s);
        }
        const sheen = FxTex.canvas(size, size), s = sheen.getContext('2d');
        FxTex.blob(s, h, h, h * 0.55, [170, 235, 255], 0.5);
        strokeSegs(s, 'rgb(160,230,255)', 3, 0.5);
        strokeSegs(s, 'rgb(255,255,255)', 1.1, 1);
        return { frost, sheen };
    },

    // Graviton scar: dark dent with spiral scoring dragged toward the center.
    gravScar(size) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2;
        const grad = g.createRadialGradient(h, h, 0, h, h, h * 0.95);
        grad.addColorStop(0, 'rgba(16,5,24,0.88)');
        grad.addColorStop(0.3, 'rgba(28,10,42,0.6)');
        grad.addColorStop(0.7, 'rgba(40,18,55,0.18)');
        grad.addColorStop(1, 'rgba(40,18,55,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
        for (let i = 0; i < 28; i++) {
            const a = Math.random() * FX_TAU, d = h * fxRand(0.78, 0.95);
            FxTex.blob(g, h + Math.cos(a) * d, h + Math.sin(a) * d, h * fxRand(0.05, 0.1), [110, 92, 74], 0.2);
        }
        g.lineCap = 'round';
        const arms = 10;
        for (let k = 0; k < arms; k++) {
            const a0 = (k / arms) * FX_TAU + fxRand(-0.15, 0.15), turn = fxRand(1.8, 2.6);
            let px = 0, py = 0;
            for (let i = 0; i <= 20; i++) {
                const s = i / 20;
                const r = h * 0.92 * Math.pow(1 - s, 1.3) + h * 0.03, a = a0 + s * turn;
                const x = h + Math.cos(a) * r, y = h + Math.sin(a) * r;
                if (i > 0) {
                    g.strokeStyle = `rgba(10,3,18,${(0.15 + 0.35 * s).toFixed(2)})`;
                    g.lineWidth = size * (0.004 + 0.012 * s);
                    g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
                }
                px = x; py = y;
            }
        }
        g.strokeStyle = 'rgba(160,70,210,0.22)'; g.lineWidth = size * 0.025;
        g.beginPath(); g.arc(h, h, h * 0.32, 0, FX_TAU); g.stroke();
        g.strokeStyle = 'rgba(190,110,240,0.15)'; g.lineWidth = size * 0.01;
        g.beginPath(); g.arc(h, h, h * 0.55, 0, FX_TAU); g.stroke();
        return c;
    },

    // Gray Rain corrosion: mottled stain, pitting, etched hex cells, live nanite specks.
    corrosion(size) {
        const c = FxTex.canvas(size, size), g = c.getContext('2d'), h = size / 2;
        const grad = g.createRadialGradient(h, h, 0, h, h, h);
        grad.addColorStop(0, 'rgba(44,48,42,0.62)');
        grad.addColorStop(0.55, 'rgba(52,56,48,0.4)');
        grad.addColorStop(0.9, 'rgba(58,62,52,0.1)');
        grad.addColorStop(1, 'rgba(58,62,52,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, size, size);
        // Ashen metal-gray eaten patches with streaks of rust.
        const tones = [[60, 64, 56], [38, 42, 36], [84, 88, 76], [92, 70, 42]];
        for (let i = 0; i < 80; i++) {
            const a = Math.random() * FX_TAU, d = h * Math.sqrt(Math.random()) * 0.88;
            FxTex.blob(g, h + Math.cos(a) * d, h + Math.sin(a) * d, h * fxRand(0.03, 0.11), fxPick(tones), fxRand(0.18, 0.42));
        }
        g.lineWidth = 1;
        for (let i = 0; i < 60; i++) {
            const a = Math.random() * FX_TAU, d = h * Math.sqrt(Math.random()) * 0.8, r = h * fxRand(0.008, 0.028);
            const x = h + Math.cos(a) * d, y = h + Math.sin(a) * d;
            g.fillStyle = 'rgba(22,28,18,0.65)';
            g.beginPath(); g.arc(x, y, r, 0, FX_TAU); g.fill();
            g.strokeStyle = 'rgba(150,190,135,0.3)';
            g.stroke();
        }
        g.strokeStyle = 'rgba(120,230,130,0.35)';
        g.lineWidth = 1.2;
        for (let i = 0; i < 16; i++) {
            const a = Math.random() * FX_TAU, d = h * Math.sqrt(Math.random()) * 0.7, hr = h * fxRand(0.03, 0.06);
            const x = h + Math.cos(a) * d, y = h + Math.sin(a) * d;
            g.beginPath();
            for (let k = 0; k <= 6; k++) {
                const ha = (k / 6) * FX_TAU;
                if (k === 0) g.moveTo(x + Math.cos(ha) * hr, y + Math.sin(ha) * hr);
                else g.lineTo(x + Math.cos(ha) * hr, y + Math.sin(ha) * hr);
            }
            g.stroke();
        }
        g.fillStyle = 'rgba(140,255,140,0.75)';
        for (let i = 0; i < 70; i++) {
            const a = Math.random() * FX_TAU, d = h * Math.sqrt(Math.random()) * 0.85, s = fxRand(1, 2.4);
            g.fillRect(h + Math.cos(a) * d, h + Math.sin(a) * d, s, s);
        }
        return c;
    },

    // Molten splash where a Slagger glob lands. { crust (cooled), hot (glow, fades) }.
    splat(size) {
        const h = size / 2, core = [], spikes = [], drops = [];
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * FX_TAU, r = h * fxRand(0.26, 0.36);
            core.push(h + Math.cos(a) * r, h + Math.sin(a) * r);
        }
        const ns = 5 + ((Math.random() * 4) | 0);
        for (let k = 0; k < ns; k++) spikes.push(Math.random() * FX_TAU, h * fxRand(0.45, 0.85), h * fxRand(0.07, 0.13));
        for (let k = 0; k < 5; k++) {
            const a = Math.random() * FX_TAU, d = h * fxRand(0.6, 0.92);
            drops.push(h + Math.cos(a) * d, h + Math.sin(a) * d, h * fxRand(0.04, 0.08));
        }
        const shape = (g) => {
            g.beginPath();
            g.moveTo(core[0], core[1]);
            for (let i = 2; i < core.length; i += 2) g.lineTo(core[i], core[i + 1]);
            g.closePath(); g.fill();
            for (let i = 0; i < spikes.length; i += 3) {
                const a = spikes[i], len = spikes[i + 1], w = spikes[i + 2], ca = Math.cos(a), sa = Math.sin(a);
                const tx = h + ca * len, ty = h + sa * len;
                g.beginPath();
                g.moveTo(h - sa * w, h + ca * w);
                g.lineTo(tx, ty);
                g.lineTo(h + sa * w, h - ca * w);
                g.closePath(); g.fill();
                g.beginPath(); g.arc(tx, ty, w * 0.6, 0, FX_TAU); g.fill();
            }
            for (let i = 0; i < drops.length; i += 3) {
                g.beginPath(); g.arc(drops[i], drops[i + 1], drops[i + 2], 0, FX_TAU); g.fill();
            }
        };
        const crust = FxTex.canvas(size, size), cg = crust.getContext('2d');
        cg.fillStyle = 'rgb(46,22,14)';
        shape(cg);
        cg.globalCompositeOperation = 'source-atop';
        FxTex.blob(cg, h * 0.85, h * 0.85, h * 0.35, [96, 48, 30], 0.7);
        const hot = FxTex.canvas(size, size), hg = hot.getContext('2d');
        hg.fillStyle = 'rgb(255,176,64)';
        shape(hg);
        hg.globalCompositeOperation = 'source-atop';
        FxTex.blob(hg, h, h, h * 0.45, [255, 250, 200], 1);
        return { crust, hot };
    },

    // Molten surface for the Slagger pool: Voronoi crust plates over white-gold cracks.
    // { hot (molten), cool (the same plates gone to ash, cross-faded in as it cools) }.
    lava(size) {
        const n = 22, pts = new Float32Array(n * 2);
        for (let i = 0; i < n; i++) { pts[i * 2] = fxRand(0, size); pts[i * 2 + 1] = fxRand(0, size); }
        const hot = FxTex.canvas(size, size), cool = FxTex.canvas(size, size);
        const hctx = hot.getContext('2d'), cctx = cool.getContext('2d');
        const hi = hctx.createImageData(size, size), ci = cctx.createImageData(size, size);
        const hd = hi.data, cd = ci.data, h = size / 2;
        const crackW = size * 0.02, rimW = size * 0.1, ph = Math.random() * 10;
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                let d1 = 1e12, d2 = 1e12;
                for (let k = 0; k < n; k++) {
                    const dx = x - pts[k * 2], dy = y - pts[k * 2 + 1], d = dx * dx + dy * dy;
                    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
                }
                const e = Math.sqrt(d2) - Math.sqrt(d1);
                const crack = Math.max(0, 1 - e / crackW);
                let rim = Math.max(0, 1 - e / rimW); rim *= rim;
                const dx = x - h, dy = y - h, rr = Math.sqrt(dx * dx + dy * dy) / h, ang = Math.atan2(dy, dx);
                const edge = 0.84 + 0.07 * Math.sin(ang * 5 + ph) + 0.04 * Math.sin(ang * 13 + ph * 2);
                const a = Math.max(0, Math.min(1, (edge - rr) / 0.16)) * 255;
                const i = (y * size + x) * 4;
                const pr = 62 + 150 * rim, pg = 16 + 48 * rim, pb = 6 + 6 * rim;
                hd[i] = pr + (255 - pr) * crack;
                hd[i + 1] = pg + (214 - pg) * crack;
                hd[i + 2] = pb + (96 - pb) * crack;
                hd[i + 3] = a;
                cd[i] = 40 + 18 * rim + 70 * crack;
                cd[i + 1] = 33 + 10 * rim + 12 * crack;
                cd[i + 2] = 30 + 6 * rim;
                cd[i + 3] = a;
            }
        }
        hctx.putImageData(hi, 0, 0);
        cctx.putImageData(ci, 0, 0);
        return { hot, cool };
    },
};

// ---------------------------------------------------------------------------------
// Pools
// ---------------------------------------------------------------------------------
class FxPool {
    constructor(factory, size, recycleOldest = false) {
        this.free = [];
        this.live = [];
        this.recycleOldest = recycleOldest;
        for (let i = 0; i < size; i++) this.free.push(factory());
        this.sink = factory();   // absorbs writes when the pool is dry; never drawn
    }

    obtain() {
        let o;
        if (this.free.length > 0) o = this.free.pop();
        else if (this.recycleOldest && this.live.length > 0) o = this.live.shift();
        else return this.sink;
        this.live.push(o);
        return o;
    }

    // Stable in-place compaction (draw order kept, so overlapping smoke never pops).
    compact() {
        const live = this.live;
        let j = 0;
        for (let i = 0; i < live.length; i++) {
            const o = live[i];
            if (o.dead) { o.dead = false; this.free.push(o); }
            else live[j++] = o;
        }
        live.length = j;
    }

    clear() {
        for (let i = 0; i < this.live.length; i++) this.free.push(this.live[i]);
        this.live.length = 0;
    }
}

class FxParticle {
    constructor() { this.reset(); }

    reset() {
        this.x = 0; this.y = 0; this.z = 0;           // z = height above ground (drawn at y - z)
        this.vx = 0; this.vy = 0; this.vz = 0;
        this.drag = 0;                                // velocity damping per second
        this.gravity = 0;                             // pulls z down; negative = buoyant (smoke)
        this.bounce = -1;                             // < 0: ignores the ground; else restitution
        this.land = FX_LAND_NONE;
        this.landed = false;
        this.attract = 0; this.ax = 0; this.ay = 0;   // accel toward (ax, ay) (graviton infall)
        this.killRadius = 0;
        this.age = 0; this.life = 1; this.delay = 0;
        this.size0 = 4; this.size1 = 4; this.grow = 0; // diameter over life; grow > 0 = ease-out power
        this.stretch = 0;                             // > 0: streak along motion, +speed*stretch long
        this.aspect = 1;                              // height/width for rotated sprites
        this.rot = 0; this.spin = 0;
        this.alpha = 1; this.fadeIn = 0; this.fadeOut = 0.6; this.flicker = 0;
        this.tex = null;
        this.ramp = null; this.rampOffset = 0; this.rampSpeed = 1;
        this.additive = false;
        this.shadow = false;
        this.dead = false;
    }
}

class FxBolt {
    constructor() {
        this.pts = new Float32Array(FX_BOLT_MAX_PTS * 2);
        this.br = new Float32Array(FX_BOLT_MAX_BRANCHES * FX_BOLT_BRANCH_PTS * 2);
        this.n = 0; this.brN = 0;
        this.x1 = 0; this.y1 = 0; this.x2 = 0; this.y2 = 0;
        this.age = 0; this.life = 0.1; this.delay = 0;
        this.jitterEvery = 0.04; this.jitterTimer = 0;
        this.amp = 0.2; this.branches = 0; this.width = 2;
        this.glow = '#FFDC00'; this.core = '#FFFFFF';
        this.impact = false; this.started = false; this.dead = false;
    }
}

function fxRingObj() {
    return { x: 0, y: 0, r0: 0, r1: 0, age: 0, life: 1, delay: 0, rgb: '#fff', w0: 4, w1: 1, alpha: 1,
             ease: 2.5, easeIn: false, fadeIn: 0, additive: true, ground: false, jitter: 0, dead: false };
}
function fxLightObj() {
    return { x: 0, y: 0, radius: 0, age: 0, life: 1, delay: 0, intensity: 1, flicker: 0, tex: null, dead: false };
}
function fxDecalObj() {
    return { x: 0, y: 0, size: 0, rot: 0, age: 0, life: 1, delay: 0, alpha: 1, fadeIn: 0, fadeOut: 1,
             tex: null, hot: null, hotLife: 0, hotAlpha: 1, dead: false };
}

// ---------------------------------------------------------------------------------
// Camera shake
// ---------------------------------------------------------------------------------
// Trauma model: offset = MAX_OFFSET x trauma^2 and trauma decays linearly, so big hits
// jolt hard and settle fast. Summed sines rather than per-frame noise, so it reads as a
// shove instead of jitter. Offsets are screen px; Game.render applies them to the camera.
class CameraShake {
    constructor() { this.reset(); }

    reset() { this.trauma = 0; this.time = 0; this.offsetX = 0; this.offsetY = 0; }

    add(amount) { this.trauma = Math.min(1, this.trauma + amount); }

    update(deltaTime) {
        if (this.trauma <= 0) { this.offsetX = 0; this.offsetY = 0; return; }
        const cfg = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.SCREEN_SHAKE) || {};
        this.trauma = Math.max(0, this.trauma - (cfg.DECAY || 1.6) * deltaTime);
        this.time += deltaTime * (cfg.FREQUENCY || 30);
        const t = this.time, s = (cfg.MAX_OFFSET || 22) * this.trauma * this.trauma;
        this.offsetX = s * (Math.sin(t + 0.3) * 0.6 + Math.sin(t * 2.31 + 1.7) * 0.4);
        this.offsetY = s * (Math.sin(t * 1.17 + 2.1) * 0.6 + Math.sin(t * 2.07 + 0.4) * 0.4);
    }
}

// ---------------------------------------------------------------------------------
// The system
// ---------------------------------------------------------------------------------
class GrenadeFx {
    constructor(game) {
        this.game = game;
        this.cfg = (CONFIG.VISUAL_EFFECTS && CONFIG.VISUAL_EFFECTS.GRENADE_FX) || {};
        this.enabled = this.cfg.ENABLED !== false;
        this.maxParticles = this.cfg.MAX_PARTICLES || 2400;
        this.decalScale = this.cfg.DECAL_LIFETIME_SCALE !== undefined ? this.cfg.DECAL_LIFETIME_SCALE : 1;
        this.density = 1;

        this.particles = new FxPool(() => new FxParticle(), this.maxParticles);
        this.rings = new FxPool(fxRingObj, 64);
        this.lights = new FxPool(fxLightObj, 48);
        this.bolts = new FxPool(() => new FxBolt(), 96);
        this.decals = new FxPool(fxDecalObj, this.cfg.MAX_DECALS || 96, true);
        this.blasts = [];

        // View rect (world units) from the latest renderGround(), for culling.
        this._vx0 = -1e9; this._vy0 = -1e9; this._vx1 = 1e9; this._vy1 = 1e9;

        this.tex = GrenadeFx._bakeTextures();
    }

    static _bakeTextures() {
        if (GrenadeFx._texCache) return GrenadeFx._texCache;
        const P = GRENADE_FX_PALETTE;
        const glow = FxTex.glow(64);
        const puffs = [FxTex.puffMask(96, 9), FxTex.puffMask(96, 12), FxTex.puffMask(96, 14)];
        const T = { glow, shadow: FxTex.tint(glow, [0, 0, 0]), glowRamp: {}, puffRamp: {}, cloud: {} };
        for (const key in P.RAMPS) {
            T.glowRamp[key] = FxTex.ramp(glow, P.RAMPS[key], 10);
            T.puffRamp[key] = FxTex.ramp(puffs[1], P.RAMPS[key], 10);
        }
        T.flameRamp = {
            FIRE: FxTex.ramp(puffs[0], P.RAMPS.FIRE, 10, FxTex.hot),
            MAGMA: FxTex.ramp(puffs[2], P.RAMPS.MAGMA, 10, FxTex.hot),
        };
        for (const key in P.CLOUDS) {
            T.cloud[key] = [];
            for (const rgb of P.CLOUDS[key]) for (const m of puffs) T.cloud[key].push(FxTex.lit(m, rgb));
        }
        T.shards = [FxTex.shard(64, 20), FxTex.shard(64, 18), FxTex.shard(56, 22)];
        T.debris = [
            FxTex.debris(24, [70, 55, 40]), FxTex.debris(24, [85, 82, 78]),
            FxTex.debris(24, [60, 64, 70]), FxTex.debris(24, [92, 72, 50]),
        ];
        const star = FxTex.star(32), mote = FxTex.mote(12);
        T.star = {
            WHITE: star,
            CYAN: FxTex.tint(star, [160, 235, 255]),
            GOLD: FxTex.tint(star, [255, 230, 140]),
        };
        T.mote = {
            WHITE: FxTex.tint(mote, [250, 253, 255]),
            SILVER: FxTex.tint(mote, [178, 186, 182]),
            GUNMETAL: FxTex.tint(mote, [62, 68, 74]),
            GREEN: FxTex.tint(mote, [110, 255, 130]),
        };
        T.pixel = FxTex.tint(FxTex.pixel(16), [120, 255, 140]);
        T.bubble = FxTex.tint(FxTex.bubble(32), [255, 200, 90]);
        T.scorch = [FxTex.scorch(256), FxTex.scorch(256), FxTex.scorch(256)];
        T.lightning = [FxTex.lightningScar(384), FxTex.lightningScar(384)];
        T.frost = [FxTex.frost(384), FxTex.frost(384)];
        T.gravScar = [FxTex.gravScar(256), FxTex.gravScar(256)];
        T.corrosion = [FxTex.corrosion(256), FxTex.corrosion(256)];
        T.splat = [FxTex.splat(64), FxTex.splat(64), FxTex.splat(64)];
        T.lava = [FxTex.lava(256), FxTex.lava(256)];
        GrenadeFx._texCache = T;
        return T;
    }

    // --- Spawning --------------------------------------------------------------------

    // shakeKey picks the GRENADE_FX.SHAKE entry (defaults to the recipe's own key), so
    // barrels and boss deaths can reuse the frag look with their own camera kick.
    spawnBlast(typeKey, x, y, radius, shakeKey) {
        if (!this.enabled) return;
        const key = GRENADE_FX_RECIPES[typeKey] ? typeKey : 'FRAG';
        const recipe = GRENADE_FX_RECIPES[key];
        const R = radius || 85;
        this._refreshDensity();
        // R sizes area-filling elements (rings, clouds, decals) to the real AoE; K grows
        // slower so a huge-radius blast doesn't get a cartoonishly huge fireball core.
        const b = { typeKey: key, shakeKey: shakeKey || key, recipe, x, y, R, K: 85 * Math.sqrt(R / 85),
                    age: 0, dead: false, popped: false, zap: 0, rain: 0 };
        recipe.start(this, b);
        if (recipe.duration > 0) this.blasts.push(b);
    }

    // One Tesla Egg chain jump; delay staggers the jumps so the chain visibly travels.
    spawnChainArc(x1, y1, x2, y2, color, delay) {
        if (!this.enabled) return;
        const b = this.bolt(x1, y1, x2, y2, color || '#FFDC00', '#FFFFF5');
        b.delay = delay || 0; b.life = 0.3; b.width = 2.8; b.amp = 0.16; b.branches = 3;
        b.jitterEvery = 0.035; b.impact = true;
    }

    p() {
        const p = this.particles.obtain();
        p.reset();
        return p;
    }

    // Scale a recipe's particle count by density (quality setting, low-FPS and load backoff).
    n(count) { return Math.max(1, Math.round(count * this.density)); }

    ring(x, y, r0, r1, life, rgb) {
        const o = this.rings.obtain();
        o.x = x; o.y = y; o.r0 = r0; o.r1 = r1; o.life = life; o.rgb = rgb;
        o.age = 0; o.delay = 0; o.w0 = 4; o.w1 = 1; o.alpha = 0.9; o.ease = 2.5; o.easeIn = false;
        o.fadeIn = 0; o.additive = true; o.ground = false; o.jitter = 0; o.dead = false;
        return o;
    }

    light(x, y, radius, life, tex) {
        const o = this.lights.obtain();
        o.x = x; o.y = y; o.radius = radius; o.life = life; o.tex = tex;
        o.age = 0; o.delay = 0; o.intensity = 1; o.flicker = 0; o.dead = false;
        return o;
    }

    decal(x, y, size, life, tex) {
        const o = this.decals.obtain();
        o.x = x; o.y = y; o.size = size; o.rot = Math.random() * FX_TAU; o.tex = tex;
        o.life = life * this.decalScale; o.age = 0; o.delay = 0; o.alpha = 0.8;
        o.fadeIn = 0.06; o.fadeOut = Math.min(4, o.life * 0.4);
        o.hot = null; o.hotLife = 0; o.hotAlpha = 1; o.dead = false;
        return o;
    }

    bolt(x1, y1, x2, y2, glow, core) {
        const b = this.bolts.obtain();
        b.x1 = x1; b.y1 = y1; b.x2 = x2; b.y2 = y2; b.glow = glow; b.core = core;
        b.age = 0; b.life = 0.08; b.delay = 0; b.jitterEvery = 0.04; b.jitterTimer = 0;
        b.amp = 0.2; b.branches = 1; b.width = 2; b.n = 0; b.brN = 0;
        b.impact = false; b.started = false; b.dead = false;
        return b;
    }

    shake(b, mult) {
        const table = this.cfg.SHAKE || {};
        const base = table[b.shakeKey] !== undefined ? table[b.shakeKey] : (table.DEFAULT || 0);
        if (base > 0 && this.game && typeof this.game.addScreenShake === 'function') {
            this.game.addScreenShake(base * mult, b.x, b.y);
        }
    }

    _refreshDensity() {
        let d = this.cfg.PARTICLE_DENSITY !== undefined ? this.cfg.PARTICLE_DENSITY : 1;
        const fps = this.game ? this.game.fps : 0;
        if (fps > 0 && fps < (this.cfg.LOW_FPS_THRESHOLD || 40)) {
            d *= this.cfg.LOW_FPS_DENSITY !== undefined ? this.cfg.LOW_FPS_DENSITY : 0.5;
        }
        // Many blasts at once: thin the new ones out instead of running the pool dry.
        const fill = this.particles.live.length / this.maxParticles;
        if (fill > 0.5) d *= Math.max(0.25, 1 - (fill - 0.5) * 1.5);
        this.density = d;
    }

    clear() {
        this.particles.clear();
        this.rings.clear();
        this.lights.clear();
        this.bolts.clear();
        this.decals.clear();
        this.blasts.length = 0;
    }

    // --- Simulation ------------------------------------------------------------------

    update(deltaTime) {
        const dt = deltaTime;
        const blasts = this.blasts;
        let j = 0;
        for (let i = 0; i < blasts.length; i++) {
            const b = blasts[i];
            b.age += dt;
            if (b.recipe.update) b.recipe.update(this, b, dt);
            if (b.age < b.recipe.duration) blasts[j++] = b;
        }
        blasts.length = j;

        this._updateParticles(dt);
        this._updateBolts(dt);
        this._age(this.rings, dt);
        this._age(this.lights, dt);
        this._age(this.decals, dt);
    }

    _age(pool, dt) {
        const live = pool.live;
        for (let i = 0; i < live.length; i++) {
            const o = live[i];
            if (o.delay > 0) { o.delay -= dt; continue; }
            o.age += dt;
            if (o.age >= o.life) o.dead = true;
        }
        pool.compact();
    }

    _updateParticles(dt) {
        const live = this.particles.live;
        // live.length is re-read each pass: particles spawned on landing join this frame.
        for (let i = 0; i < live.length; i++) {
            const p = live[i];
            if (p.delay > 0) { p.delay -= dt; continue; }
            p.age += dt;
            if (p.age >= p.life) { p.dead = true; continue; }

            if (p.attract !== 0) {
                const dx = p.ax - p.x, dy = p.ay - p.y, d = Math.sqrt(dx * dx + dy * dy);
                if (d < p.killRadius) { p.dead = true; continue; }
                const a = (p.attract * dt) / d;
                p.vx += dx * a; p.vy += dy * a;
            }
            if (p.drag !== 0) {
                const k = 1 / (1 + p.drag * dt);
                p.vx *= k; p.vy *= k; p.vz *= k;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            if (p.gravity !== 0 || p.vz !== 0) {
                p.vz -= p.gravity * dt;
                p.z += p.vz * dt;
                if (p.z < 0 && p.bounce >= 0) {
                    p.z = 0;
                    if (!p.landed) {
                        p.landed = true;
                        if (p.land !== FX_LAND_NONE) this._land(p);
                        if (p.dead) continue;
                    }
                    if (p.bounce > 0 && p.vz < -60) {
                        p.vz = -p.vz * p.bounce;
                        p.vx *= 0.55; p.vy *= 0.55; p.spin *= 0.5;
                    } else {
                        p.vz = 0; p.gravity = 0; p.vx = 0; p.vy = 0; p.spin = 0;
                    }
                }
            }
            if (p.spin !== 0) p.rot += p.spin * dt;
        }
        this.particles.compact();
    }

    _land(p) {
        const T = this.tex;
        switch (p.land) {
            case FX_LAND_DIE:
                p.dead = true;
                break;
            case FX_LAND_DUST: {
                const d = this.p();
                d.x = p.x; d.y = p.y; d.life = fxRand(0.4, 0.6);
                d.size0 = p.size0 * 1.6; d.size1 = p.size0 * 4; d.grow = 2;
                d.tex = fxPick(T.cloud.DUST); d.alpha = 0.35; d.fadeOut = 0.2;
                d.vz = 8; d.gravity = -10;
                break;
            }
            case FX_LAND_SPLAT: {
                const s = fxPick(T.splat);
                const dec = this.decal(p.x, p.y, p.size0 * fxRand(3.2, 4.6), 10, s.crust);
                dec.hot = s.hot; dec.hotLife = fxRand(2.2, 3.2); dec.alpha = 0.9; dec.fadeIn = 0.02; dec.fadeOut = 3;
                fxSparks(this, p.x, p.y, 22, 3, T.glowRamp.MAGMA, 2, 5, 0);
                p.dead = true;
                break;
            }
            case FX_LAND_GLINT: {
                const g = this.p();
                g.x = p.x; g.y = p.y; g.life = fxRand(0.2, 0.32);
                g.size0 = fxRand(6, 10); g.size1 = g.size0 * 1.3;
                g.tex = T.star.WHITE; g.additive = true; g.rot = Math.random() * FX_TAU; g.fadeOut = 0.3;
                break;
            }
            case FX_LAND_POP: {
                const g = this.p();
                g.x = p.x; g.y = p.y; g.life = 0.16;
                g.size0 = 3; g.size1 = 9; g.grow = 2;
                g.tex = T.glowRamp.NANITE[1]; g.additive = true; g.alpha = 0.7; g.fadeOut = 0;
                p.dead = true;
                break;
            }
        }
    }

    _updateBolts(dt) {
        const live = this.bolts.live;
        for (let i = 0; i < live.length; i++) {
            const b = live[i];
            if (b.delay > 0) { b.delay -= dt; if (b.delay > 0) continue; }
            if (!b.started) {
                b.started = true;
                this._shapeBolt(b);
                b.jitterTimer = b.jitterEvery;
                if (b.impact) this._boltImpact(b);
            }
            b.age += dt;
            if (b.age >= b.life) { b.dead = true; continue; }
            b.jitterTimer -= dt;
            if (b.jitterTimer <= 0) {     // re-strike: a fresh path each flicker
                b.jitterTimer += b.jitterEvery;
                this._shapeBolt(b);
            }
        }
        this.bolts.compact();
    }

    _shapeBolt(b) {
        const dx = b.x2 - b.x1, dy = b.y2 - b.y1;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const nx = -dy / len, ny = dx / len;
        const segs = Math.max(4, Math.min(FX_BOLT_MAX_PTS - 1, Math.round(len / 16)));
        const pts = b.pts;
        let walk = 0;
        for (let i = 0; i <= segs; i++) {
            const t = i / segs;
            // Smoothed random walk, pinned to both ends by the sine envelope.
            walk = walk * 0.55 + fxRand(-1, 1) * b.amp * len * 0.45;
            const off = (i === 0 || i === segs) ? 0 : walk * Math.sin(t * Math.PI);
            pts[i * 2] = b.x1 + dx * t + nx * off;
            pts[i * 2 + 1] = b.y1 + dy * t + ny * off;
        }
        b.n = segs + 1;

        const nb = Math.min(b.branches, FX_BOLT_MAX_BRANCHES);
        const baseAng = Math.atan2(dy, dx), br = b.br;
        for (let k = 0; k < nb; k++) {
            const s = 1 + ((Math.random() * (segs - 1)) | 0);
            let x = pts[s * 2], y = pts[s * 2 + 1];
            let a = baseAng + (Math.random() < 0.5 ? -1 : 1) * fxRand(0.45, 1.0);
            const step = len * fxRand(0.05, 0.09), o = k * FX_BOLT_BRANCH_PTS * 2;
            br[o] = x; br[o + 1] = y;
            for (let m = 1; m < FX_BOLT_BRANCH_PTS; m++) {
                a += fxRand(-0.5, 0.5);
                x += Math.cos(a) * step; y += Math.sin(a) * step;
                br[o + m * 2] = x; br[o + m * 2 + 1] = y;
            }
        }
        b.brN = nb;
    }

    _boltImpact(b) {
        const T = this.tex;
        fxFlash(this, b.x2, b.y2, 60, 0.14, T.glowRamp.ARC[1], 1);
        fxSparks(this, b.x2, b.y2, 40, 8, T.glowRamp.ARC, 2, 6, 0.5);
        const l = this.light(b.x2, b.y2, 110, 0.3, T.glowRamp.VOLT[1]);
        l.flicker = 0.4;
        const d = this.decal(b.x2, b.y2, 46, 10, fxPick(T.scorch));
        d.alpha = 0.45;
    }

    // --- Slagger molten pool (PlasmaPoolEffect delegates its look here) ---------------

    _poolHeat(pool) { return 1 - fxSmooth(0.45, 1.0, pool.elapsedTime / pool.duration); }

    emitMoltenPool(pool) {
        const T = this.tex, heat = this._poolHeat(pool);
        if (heat < 0.08) return;
        const r = pool.radius * 0.8;
        if (Math.random() < 0.8 * heat) {
            const a = Math.random() * FX_TAU, d = Math.sqrt(Math.random()) * r;
            const p = this.p();
            p.x = pool.x + Math.cos(a) * d; p.y = pool.y + Math.sin(a) * d;
            p.life = fxRand(0.25, 0.45); p.size0 = 3; p.size1 = fxRand(10, 18); p.grow = 1.5;
            p.tex = T.bubble; p.additive = true; p.alpha = 0.85 * heat; p.fadeIn = 0.2; p.fadeOut = 0.5;
        }
        if (Math.random() < 0.5 * heat) {
            const a = Math.random() * FX_TAU, d = Math.sqrt(Math.random()) * r;
            const p = this.p();
            p.x = pool.x + Math.cos(a) * d; p.y = pool.y + Math.sin(a) * d;
            p.vx = fxRand(-10, 10); p.vy = fxRand(-10, 10); p.vz = fxRand(40, 90); p.gravity = -20; p.drag = 1.2;
            p.life = fxRand(0.8, 1.6); p.size0 = p.size1 = fxRand(1.8, 3.2);
            p.ramp = T.glowRamp.MAGMA; p.rampOffset = 0.2; p.rampSpeed = 0.7;
            p.additive = true; p.flicker = 0.5; p.fadeOut = 0.5;
        }
        if (Math.random() < 0.12) {
            const a = Math.random() * FX_TAU, d = Math.sqrt(Math.random()) * r * 0.7;
            const p = this.p();
            p.x = pool.x + Math.cos(a) * d; p.y = pool.y + Math.sin(a) * d;
            p.vz = 12; p.gravity = -22; p.drag = 1.4; p.vx = fxRand(-6, 6);
            p.life = fxRand(1.4, 2.0); p.size0 = pool.radius * 0.18; p.size1 = pool.radius * 0.5; p.grow = 2;
            p.tex = fxPick(T.cloud.SOOT); p.alpha = 0.28; p.fadeIn = 0.2; p.fadeOut = 0.4;
            p.rot = fxRand(-0.4, 0.4);
        }
    }

    renderMoltenPool(ctx, pool) {
        const T = this.tex;
        const t = pool.elapsedTime, prog = t / pool.duration;
        const spread = 1 - Math.pow(1 - Math.min(1, t / 0.35), 3);   // pours outward on impact
        const heat = this._poolHeat(pool);
        const fade = prog > 0.82 ? Math.max(0, (1 - prog) / 0.18) : 1;
        if (fade <= 0) return;
        const r = pool.radius * (0.35 + 0.65 * spread);
        const lava = T.lava[pool.variant < 0.5 ? 0 : 1];
        const pulse = 0.88 + 0.12 * Math.sin(t * 5.5);
        const rotA = pool.rotA + t * 0.06;

        ctx.save();
        ctx.globalAlpha = 0.95 * fade;
        this._drawRotated(ctx, lava.hot, pool.x, pool.y, r * 2, rotA);
        if (heat < 1) {
            ctx.globalAlpha = (1 - heat) * 0.95 * fade;
            this._drawRotated(ctx, lava.cool, pool.x, pool.y, r * 2, rotA);
        }
        // A counter-rotating additive copy makes the crack web shift: the surface churns.
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.4 * heat * fade * pulse;
        this._drawRotated(ctx, lava.hot, pool.x, pool.y, r * 1.9, pool.rotB - t * 0.09);
        ctx.globalAlpha = 0.45 * heat * fade * pulse;
        const glow = T.glowRamp.MAGMA[2 + Math.min(6, ((1 - heat) * 6) | 0)], d = r * 2.6;
        ctx.drawImage(glow, pool.x - d / 2, pool.y - d / 2, d, d);
        ctx.restore();
    }

    renderMoltenPoolLight(octx, pool, camX, camY, zoom) {
        if (this.cfg.NIGHT_LIGHT === false) return;
        const prog = pool.elapsedTime / pool.duration;
        const fade = prog > 0.82 ? Math.max(0, (1 - prog) / 0.18) : 1;
        const a = 0.85 * this._poolHeat(pool) * fade * (0.9 + 0.1 * Math.sin(pool.elapsedTime * 5.5));
        if (a <= 0.01) return;
        const d = pool.radius * 4.4 * zoom;
        const sx = (pool.x - camX) * zoom, sy = (pool.y - camY) * zoom;
        octx.save();
        octx.globalCompositeOperation = 'destination-out';
        octx.globalAlpha = a;
        octx.drawImage(this.tex.glow, sx - d / 2, sy - d / 2, d, d);
        octx.restore();
    }

    // --- Rendering -------------------------------------------------------------------

    _drawRotated(ctx, tex, x, y, size, rot) {
        ctx.translate(x, y); ctx.rotate(rot);
        ctx.drawImage(tex, -size / 2, -size / 2, size, size);
        ctx.rotate(-rot); ctx.translate(-x, -y);
    }

    // Under units. groundEffects: game.visualEffects; any with renderGround() (the
    // Slagger pool) is drawn here, above the scorch marks and below shadows and glow.
    renderGround(ctx, viewX, viewY, viewW, viewH, groundEffects) {
        this._vx0 = viewX; this._vy0 = viewY; this._vx1 = viewX + viewW; this._vy1 = viewY + viewH;
        ctx.save();
        this._renderDecals(ctx, false);
        if (groundEffects) {
            for (let i = 0; i < groundEffects.length; i++) {
                const e = groundEffects[i];
                if (e && typeof e.renderGround === 'function') e.renderGround(ctx);
            }
        }
        this._renderRings(ctx, true);
        this._renderShadows(ctx);
        ctx.globalCompositeOperation = 'lighter';
        this._renderDecals(ctx, true);
        this._renderGroundLights(ctx);
        ctx.restore();
    }

    // Over the world. Normal-blend smoke and debris first, so the fire glows through it.
    render(ctx) {
        if (this.particles.live.length === 0 && this.rings.live.length === 0 &&
            this.bolts.live.length === 0 && this.blasts.length === 0) return;
        ctx.save();
        this._renderParticles(ctx, false);
        ctx.globalCompositeOperation = 'lighter';
        this._renderParticles(ctx, true);
        this._renderRings(ctx, false);
        this._renderBolts(ctx);
        for (let i = 0; i < this.blasts.length; i++) {
            const b = this.blasts[i];
            if (b.recipe.render) b.recipe.render(this, b, ctx);
        }
        ctx.restore();
    }

    // Night missions: erase darkness where blasts are burning (octx is in screen px).
    renderLights(octx, camX, camY, zoom) {
        if (this.cfg.NIGHT_LIGHT === false) return;
        const live = this.lights.live;
        if (live.length === 0) return;
        const tex = this.tex.glow;
        octx.save();
        octx.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < live.length; i++) {
            const o = live[i];
            if (o.delay > 0) continue;
            let a = o.intensity * (1 - o.age / o.life);
            if (o.flicker > 0) a *= 1 - o.flicker * Math.random();
            if (a <= 0.01) continue;
            const d = o.radius * 2.4 * zoom;
            const sx = (o.x - camX) * zoom, sy = (o.y - camY) * zoom;
            octx.globalAlpha = a > 1 ? 1 : a;
            octx.drawImage(tex, sx - d / 2, sy - d / 2, d, d);
        }
        octx.restore();
    }

    _renderParticles(ctx, additive) {
        const live = this.particles.live;
        for (let i = 0; i < live.length; i++) {
            const p = live[i];
            if (p.delay > 0 || p.additive !== additive) continue;
            const t = p.age / p.life;
            let a = p.alpha;
            if (p.fadeIn > 0 && t < p.fadeIn) a *= t / p.fadeIn;
            if (t > p.fadeOut) a *= (1 - t) / (1 - p.fadeOut);
            if (p.flicker > 0) a *= 1 - p.flicker * Math.random();
            if (a < 0.004) continue;
            const e = p.grow > 0 ? 1 - Math.pow(1 - t, p.grow) : t;
            const s = p.size0 + (p.size1 - p.size0) * e;
            let tex = p.tex;
            if (p.ramp) {
                const ri = ((p.rampOffset + t * p.rampSpeed) * p.ramp.length) | 0;
                tex = p.ramp[ri < p.ramp.length ? ri : p.ramp.length - 1];
            }
            if (!tex) continue;
            const sx = p.x, sy = p.y - p.z;
            ctx.globalAlpha = a > 1 ? 1 : a;
            if (p.stretch > 0) {
                const svx = p.vx, svy = p.vy - p.vz;     // on-screen velocity
                const len = s + Math.sqrt(svx * svx + svy * svy) * p.stretch;
                if (len > s * 1.05) {
                    const ang = Math.atan2(svy, svx);
                    ctx.translate(sx, sy); ctx.rotate(ang);
                    ctx.drawImage(tex, s * 0.5 - len, -s * 0.5, len, s);
                    ctx.rotate(-ang); ctx.translate(-sx, -sy);
                    continue;
                }
            } else if (p.rot !== 0 || p.aspect !== 1) {
                const h = s * p.aspect;
                ctx.translate(sx, sy); ctx.rotate(p.rot);
                ctx.drawImage(tex, -s * 0.5, -h * 0.5, s, h);
                ctx.rotate(-p.rot); ctx.translate(-sx, -sy);
                continue;
            }
            ctx.drawImage(tex, sx - s * 0.5, sy - s * 0.5, s, s);
        }
        ctx.globalAlpha = 1;
    }

    _renderShadows(ctx) {
        const live = this.particles.live, tex = this.tex.shadow;
        for (let i = 0; i < live.length; i++) {
            const p = live[i];
            if (!p.shadow || p.delay > 0 || p.z <= 0.5) continue;
            const t = p.age / p.life;
            const fade = t > p.fadeOut ? (1 - t) / (1 - p.fadeOut) : 1;
            const a = 0.32 * fade * Math.max(0.25, 1 - p.z / 220);
            const w = Math.max(p.size0, 4) * (1.2 + p.z * 0.004), h = w * 0.5;
            ctx.globalAlpha = a;
            ctx.drawImage(tex, p.x - w / 2, p.y - h / 2, w, h);
        }
        ctx.globalAlpha = 1;
    }

    _renderRings(ctx, ground) {
        const live = this.rings.live;
        for (let i = 0; i < live.length; i++) {
            const o = live[i];
            if (o.delay > 0 || o.ground !== ground) continue;
            const t = o.age / o.life;
            const e = o.easeIn ? Math.pow(t, o.ease) : 1 - Math.pow(1 - t, o.ease);
            const r = o.r0 + (o.r1 - o.r0) * e;
            if (r < 0.5) continue;
            let a = o.alpha * (1 - t);
            if (o.fadeIn > 0 && t < o.fadeIn) a *= t / o.fadeIn;
            if (a < 0.004) continue;
            const w = o.w0 + (o.w1 - o.w0) * t;
            ctx.globalCompositeOperation = o.additive ? 'lighter' : 'source-over';
            ctx.strokeStyle = o.rgb;
            ctx.beginPath();
            if (o.jitter > 0) {
                for (let k = 0; k <= 40; k++) {
                    const ang = (k / 40) * FX_TAU, rr = r * (1 + (Math.random() * 2 - 1) * o.jitter);
                    if (k === 0) ctx.moveTo(o.x + Math.cos(ang) * rr, o.y + Math.sin(ang) * rr);
                    else ctx.lineTo(o.x + Math.cos(ang) * rr, o.y + Math.sin(ang) * rr);
                }
            } else {
                ctx.arc(o.x, o.y, r, 0, FX_TAU);
            }
            ctx.globalAlpha = a * 0.28; ctx.lineWidth = w * 3.2; ctx.stroke();
            ctx.globalAlpha = a; ctx.lineWidth = w; ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = ground ? 'source-over' : 'lighter';
    }

    _renderDecals(ctx, hotPass) {
        const live = this.decals.live;
        for (let i = 0; i < live.length; i++) {
            const o = live[i];
            const half = o.size * 0.5;
            if (o.x + half < this._vx0 || o.x - half > this._vx1 || o.y + half < this._vy0 || o.y - half > this._vy1) continue;
            let a, tex;
            if (hotPass) {
                if (!o.hot || o.age >= o.hotLife) continue;
                a = o.hotAlpha * Math.pow(1 - o.age / o.hotLife, 1.6);
                tex = o.hot;
            } else {
                a = o.alpha;
                tex = o.tex;
            }
            if (o.fadeIn > 0 && o.age < o.fadeIn) a *= o.age / o.fadeIn;
            const left = o.life - o.age;
            if (left < o.fadeOut) a *= left / o.fadeOut;
            if (a < 0.004 || !tex) continue;
            ctx.globalAlpha = a > 1 ? 1 : a;
            this._drawRotated(ctx, tex, o.x, o.y, o.size, o.rot);
        }
        ctx.globalAlpha = 1;
    }

    _renderGroundLights(ctx) {
        const live = this.lights.live;
        for (let i = 0; i < live.length; i++) {
            const o = live[i];
            if (o.delay > 0 || !o.tex) continue;
            const k = 1 - o.age / o.life;
            let a = o.intensity * 0.5 * k * k;
            if (o.flicker > 0) a *= 1 - o.flicker * Math.random();
            if (a < 0.004) continue;
            const d = o.radius * 2;
            if (o.x + d < this._vx0 || o.x - d > this._vx1 || o.y + d < this._vy0 || o.y - d > this._vy1) continue;
            ctx.globalAlpha = a > 1 ? 1 : a;
            ctx.drawImage(o.tex, o.x - d / 2, o.y - d / 2, d, d);
        }
        ctx.globalAlpha = 1;
    }

    _renderBolts(ctx) {
        const live = this.bolts.live;
        if (live.length === 0) return;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        const spot = this.tex.glowRamp.ARC[1];
        for (let i = 0; i < live.length; i++) {
            const b = live[i];
            if (b.delay > 0 || b.n < 2) continue;
            const t = b.age / b.life;
            const k = (1 - t * t) * (0.6 + 0.4 * Math.random());
            ctx.beginPath();
            ctx.moveTo(b.pts[0], b.pts[1]);
            for (let j = 1; j < b.n; j++) ctx.lineTo(b.pts[j * 2], b.pts[j * 2 + 1]);
            this._strokeBolt(ctx, b, k, b.width);
            if (b.brN > 0) {
                ctx.beginPath();
                for (let m = 0; m < b.brN; m++) {
                    const o = m * FX_BOLT_BRANCH_PTS * 2;
                    ctx.moveTo(b.br[o], b.br[o + 1]);
                    for (let j = 1; j < FX_BOLT_BRANCH_PTS; j++) ctx.lineTo(b.br[o + j * 2], b.br[o + j * 2 + 1]);
                }
                this._strokeBolt(ctx, b, k * 0.8, b.width * 0.55);
            }
            const d = b.width * 9;
            ctx.globalAlpha = k * 0.8;
            ctx.drawImage(spot, b.x2 - d / 2, b.y2 - d / 2, d, d);
        }
        ctx.globalAlpha = 1;
    }

    _strokeBolt(ctx, b, k, w) {
        ctx.strokeStyle = b.glow;
        ctx.globalAlpha = 0.2 * k; ctx.lineWidth = w * 5; ctx.stroke();
        ctx.globalAlpha = 0.55 * k; ctx.lineWidth = w * 2.2; ctx.stroke();
        ctx.strokeStyle = b.core;
        ctx.globalAlpha = k; ctx.lineWidth = w * 0.8; ctx.stroke();
    }
}

// ---------------------------------------------------------------------------------
// Building blocks shared by the recipes. Sizes are diameters in world units;
// K is the blast's "core" scale (see spawnBlast), R its AoE radius.
// ---------------------------------------------------------------------------------
function fxFlash(fx, x, y, d, life, tex, alpha) {
    const p = fx.p();
    p.x = x; p.y = y; p.life = life;
    p.size0 = d * 0.55; p.size1 = d; p.grow = 3;
    p.tex = tex; p.additive = true; p.alpha = alpha; p.fadeOut = 0;
    return p;
}

// Rolling fireball: normal-blend flame body (keeps its orange/red on any terrain and
// cools to soot) under a shorter-lived additive heat layer that makes it glow.
function fxFireball(fx, x, y, K, flameRamp, heatRamp, count, rise) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = Math.random() * K * 0.25, sp = K * fxRand(0.8, 2.0);
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.vz = fxRand(10, 40) * rise; p.gravity = -60 * rise; p.drag = 5;
        p.life = fxRand(0.5, 0.9);
        p.size0 = K * fxRand(0.55, 0.75); p.size1 = K * fxRand(1.1, 1.45); p.grow = 2;
        p.ramp = flameRamp; p.alpha = 1; p.fadeOut = 0.55;
        p.rot = Math.random() * FX_TAU; p.spin = fxRand(-1.2, 1.2);
    }
    for (let i = 0, n = fx.n(Math.ceil(count * 0.5)); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = Math.random() * K * 0.2, sp = K * fxRand(0.6, 1.6);
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.vz = fxRand(10, 40) * rise; p.gravity = -60 * rise; p.drag = 5;
        p.life = fxRand(0.25, 0.45);
        p.size0 = K * 0.4; p.size1 = K * 0.85; p.grow = 2;
        p.ramp = heatRamp; p.additive = true; p.alpha = 0.7; p.fadeOut = 0.4;
        p.rot = Math.random() * FX_TAU; p.spin = fxRand(-1.5, 1.5);
    }
}

// White-hot heart that lingers a beat after the flash.
function fxCore(fx, x, y, K, ramp, count) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        p.x = x + fxRand(-0.08, 0.08) * K; p.y = y + fxRand(-0.08, 0.08) * K;
        p.life = fxRand(0.14, 0.24);
        p.size0 = K * 0.5; p.size1 = K * 0.85; p.grow = 2;
        p.ramp = ramp; p.rampSpeed = 0.35; p.additive = true; p.alpha = 1; p.fadeOut = 0.3;
        p.rot = Math.random() * FX_TAU;
    }
}

function fxSmoke(fx, x, y, K, count, tones, delayMax, alpha) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = Math.random() * K * 0.4, sp = K * fxRand(0.3, 1.0);
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.vz = fxRand(6, 18); p.gravity = -26; p.drag = 1.6;
        p.delay = fxRand(0.04, delayMax);
        p.life = fxRand(1.8, 3.0);
        p.size0 = K * 0.5; p.size1 = K * fxRand(1.05, 1.35); p.grow = 2;
        p.tex = fxPick(tones); p.alpha = alpha * fxRand(0.75, 1);
        p.fadeIn = 0.12; p.fadeOut = 0.35;
        p.rot = fxRand(-0.4, 0.4); p.spin = fxRand(-0.15, 0.15);
    }
}

function fxSparks(fx, x, y, K, count, ramp, speedLo, speedHi, ballisticFrac) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, sp = K * fxRand(speedLo, speedHi);
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.drag = 3.2; p.life = fxRand(0.22, 0.55);
        p.size0 = p.size1 = fxRand(2.4, 3.8); p.stretch = 0.06;
        p.ramp = ramp; p.rampSpeed = 0.75; p.additive = true; p.fadeOut = 0.5;
        if (Math.random() < ballisticFrac) {    // arcs up, skips off the ground
            p.vz = fxRand(60, 200); p.gravity = 700; p.bounce = 0.45; p.drag = 1.5; p.life *= 1.8;
        }
    }
}

function fxDebris(fx, x, y, K, count) {
    const T = fx.tex;
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, sp = K * fxRand(0.9, 2.4);
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.vz = fxRand(140, 300); p.gravity = 680; p.drag = 0.5; p.bounce = 0.32; p.land = FX_LAND_DUST;
        p.life = fxRand(1.4, 2.2); p.size0 = p.size1 = fxRand(5, 10);
        p.tex = fxPick(T.debris); p.shadow = true; p.fadeOut = 0.7;
        p.rot = Math.random() * FX_TAU; p.spin = fxRand(-14, 14);
    }
}

function fxEmbers(fx, x, y, K, count, ramp) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = Math.random() * K * 0.3, sp = K * fxRand(0.2, 1.2);
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.vz = fxRand(20, 80); p.gravity = -25; p.drag = 1.3;
        p.life = fxRand(0.9, 2.0); p.size0 = p.size1 = fxRand(1.8, 3.4);
        p.ramp = ramp; p.rampOffset = 0.25; p.rampSpeed = 0.6;
        p.additive = true; p.flicker = 0.55; p.fadeOut = 0.5;
    }
}

// Ring of dust shoved outward along the ground by the blast wave.
function fxDustRing(fx, x, y, R, count, tones) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = (i / n) * FX_TAU + fxRand(-0.15, 0.15), sp = R * fxRand(2.6, 3.4);
        p.x = x + Math.cos(a) * R * 0.25; p.y = y + Math.sin(a) * R * 0.25;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.drag = 4.2;
        p.vz = 4; p.gravity = -8;
        p.life = fxRand(0.7, 1.1);
        p.size0 = R * 0.32; p.size1 = R * 0.7; p.grow = 2;
        p.tex = fxPick(tones); p.alpha = 0.58; p.fadeOut = 0.25;
        p.rot = fxRand(-0.4, 0.4);
    }
}

// Slagger: molten globs lobbed high; each leaves a cooling splat where it lands.
function fxGlobs(fx, x, y, K, count, ramp) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, sp = K * fxRand(0.4, 2.4);
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
        p.vz = fxRand(160, 360); p.gravity = 720; p.drag = 0.35; p.bounce = 0; p.land = FX_LAND_SPLAT;
        p.life = 3; p.size0 = fxRand(5, 9); p.size1 = p.size0 * 0.7; p.stretch = 0.028;
        p.ramp = ramp; p.rampSpeed = 0.55; p.additive = true; p.shadow = true; p.fadeOut = 0.95;
    }
}

function fxFoam(fx, x, y, R, count, tones) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = Math.random() * R * 0.15, sp = R * fxRand(1.4, 3.0);
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.drag = 4.2;
        p.vz = fxRand(0, 10); p.gravity = -4;
        p.life = fxRand(1.6, 2.6);
        p.size0 = R * 0.24; p.size1 = R * fxRand(0.5, 0.68); p.grow = 3;
        p.tex = fxPick(tones); p.alpha = 0.88; p.fadeIn = 0.04; p.fadeOut = 0.5;
        p.rot = fxRand(-0.5, 0.5); p.spin = fxRand(-0.3, 0.3);
    }
}

// Faint additive cold haze hanging over the foam.
function fxMist(fx, x, y, R, count, ramp) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = Math.random() * R * 0.5, sp = R * fxRand(0.2, 0.6);
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.drag = 1.2;
        p.life = fxRand(2.0, 3.0);
        p.size0 = R * 0.6; p.size1 = R * fxRand(1.0, 1.3); p.grow = 2;
        p.ramp = ramp; p.rampOffset = 0.35; p.rampSpeed = 0.6;
        p.additive = true; p.alpha = 0.16; p.fadeIn = 0.1; p.fadeOut = 0.4;
        p.rot = Math.random() * FX_TAU; p.spin = fxRand(-0.2, 0.2);
    }
}

function fxShards(fx, x, y, K, count) {
    const T = fx.tex;
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, sp = K * fxRand(2.2, 5.5);
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.drag = 3.5;
        p.vz = fxRand(60, 170); p.gravity = 520; p.bounce = 0.25; p.land = FX_LAND_GLINT;
        p.life = fxRand(1.8, 2.8); p.size0 = p.size1 = fxRand(12, 22); p.aspect = 0.3;
        p.tex = fxPick(T.shards); p.shadow = true; p.fadeOut = 0.72;
        p.rot = Math.random() * FX_TAU; p.spin = fxRand(-16, 16);
    }
}

function fxGlitter(fx, x, y, R, count, texs) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = Math.sqrt(Math.random()) * R * 0.9;
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.z = fxRand(0, 30); p.vz = fxRand(5, 25);
        p.delay = fxRand(0.05, 1.3); p.life = fxRand(0.3, 0.75);
        p.size0 = fxRand(4, 7); p.size1 = p.size0 * 1.6;
        p.tex = fxPick(texs); p.additive = true; p.flicker = 0.35; p.fadeIn = 0.35; p.fadeOut = 0.55;
        p.rot = Math.random() * FX_TAU; p.spin = fxRand(-2, 2);
    }
}

function fxSnow(fx, x, y, R, count, tex) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = Math.sqrt(Math.random()) * R * 0.95;
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.z = fxRand(30, 95); p.vz = -fxRand(15, 35); p.bounce = 0;
        p.vx = fxRand(-12, 12); p.vy = fxRand(-12, 12);
        p.delay = fxRand(0, 0.5); p.life = fxRand(1.8, 3.2);
        p.size0 = p.size1 = fxRand(1.8, 3.2);
        p.tex = tex; p.alpha = 0.9; p.fadeIn = 0.15; p.fadeOut = 0.7;
    }
}

// Graviton: bright streaks spiralling into the singularity.
function fxInfall(fx, x, y, R, count, ramp) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = R * fxRand(0.55, 1.25), tv = R * fxRand(0.25, 0.6);
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = -Math.sin(a) * tv; p.vy = Math.cos(a) * tv;    // same spin for all: one vortex
        p.ax = x; p.ay = y; p.attract = R * fxRand(14, 20); p.killRadius = 10;
        p.delay = fxRand(0, 0.15); p.life = 0.7;
        p.size0 = p.size1 = fxRand(3, 5); p.stretch = 0.07;
        p.ramp = ramp; p.rampSpeed = 0.5;
        p.additive = true; p.fadeIn = 0.15; p.fadeOut = 0.85;
    }
}

// Graviton: a dark vortex of light and dust swirling down the drain.
function fxVortex(fx, x, y, R, count, tones) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = R * fxRand(0.6, 1.1), tv = R * fxRand(0.5, 0.9);
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = -Math.sin(a) * tv; p.vy = Math.cos(a) * tv;
        p.ax = x; p.ay = y; p.attract = R * 10; p.killRadius = R * 0.1;
        p.delay = fxRand(0, 0.2); p.life = 0.6;
        p.size0 = R * 0.38; p.size1 = R * 0.14;
        p.tex = fxPick(tones); p.alpha = 0.5; p.fadeIn = 0.25; p.fadeOut = 0.6;
        p.rot = fxRand(-0.4, 0.4);
    }
}

// Graviton: violet wisps flung out in a swirl after the collapse.
function fxWisps(fx, x, y, K, count, ramp) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, out = K * fxRand(0.6, 1.4), tv = K * 0.8;
        p.x = x; p.y = y;
        p.vx = Math.cos(a) * out - Math.sin(a) * tv; p.vy = Math.sin(a) * out + Math.cos(a) * tv;
        p.drag = 1.8; p.life = fxRand(0.8, 1.3);
        p.size0 = K * 0.25; p.size1 = K * 0.55; p.grow = 2;
        p.ramp = ramp; p.rampOffset = 0.15; p.rampSpeed = 0.8;
        p.additive = true; p.alpha = 0.35; p.fadeOut = 0.4;
        p.rot = Math.random() * FX_TAU; p.spin = fxRand(-2, 2);
    }
}

// Gray Rain: a vortex of metallic motes that hangs, then drifts back down.
function fxSwarm(fx, x, y, R, count) {
    const T = fx.tex;
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, out = R * fxRand(0.9, 2.6), swirl = out * fxRand(0.4, 0.9);
        const d = Math.random() * R * 0.06;
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = Math.cos(a) * out - Math.sin(a) * swirl; p.vy = Math.sin(a) * out + Math.cos(a) * swirl;
        p.z = fxRand(4, 16); p.vz = fxRand(40, 150); p.gravity = 55; p.drag = 2.4; p.bounce = 0;
        p.delay = fxRand(0, 0.08); p.life = fxRand(2.2, 3.4);
        p.size0 = p.size1 = fxRand(3, 6); p.stretch = 0.02;    // streaks while flung, dots once adrift
        const roll = Math.random();
        p.tex = roll < 0.3 ? T.mote.GREEN : (roll < 0.75 ? T.mote.SILVER : T.mote.GUNMETAL);
        p.additive = roll < 0.3; p.flicker = roll < 0.3 ? 0.75 : 0.3; p.alpha = 1;
        p.fadeIn = 0.05; p.fadeOut = 0.7;
    }
}

function fxHaze(fx, x, y, R, count, tones) {
    for (let i = 0, n = fx.n(count); i < n; i++) {
        const p = fx.p();
        const a = Math.random() * FX_TAU, d = Math.sqrt(Math.random()) * R * 0.5, sp = R * fxRand(0.25, 0.8);
        p.x = x + Math.cos(a) * d; p.y = y + Math.sin(a) * d;
        p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp; p.drag = 1.4;
        p.vz = 3; p.gravity = -5;
        p.life = fxRand(2.6, 3.8);
        p.size0 = R * 0.35; p.size1 = R * fxRand(0.7, 0.85); p.grow = 2;
        p.tex = fxPick(tones); p.alpha = 0.42; p.fadeIn = 0.12; p.fadeOut = 0.5;
        p.rot = fxRand(-0.4, 0.4); p.spin = fxRand(-0.1, 0.1);
    }
}

function fxRaindrop(fx, b) {
    const p = fx.p();
    const a = Math.random() * FX_TAU, d = Math.sqrt(Math.random()) * b.R * 0.95;
    p.x = b.x + Math.cos(a) * d; p.y = b.y + Math.sin(a) * d;
    p.z = fxRand(70, 130); p.vz = -fxRand(240, 320); p.gravity = 200; p.bounce = 0;
    p.land = Math.random() < 0.5 ? FX_LAND_POP : FX_LAND_DIE;
    p.vx = fxRand(-12, 12); p.vy = fxRand(-6, 6);
    p.life = 1.2; p.size0 = p.size1 = fxRand(2, 3); p.stretch = 0.045;
    const glint = Math.random() < 0.3;     // mostly gunmetal drizzle, some lit green
    p.tex = glint ? fx.tex.mote.GREEN : fx.tex.mote.SILVER; p.additive = glint;
    p.alpha = 0.85; p.fadeIn = 0.1; p.fadeOut = 0.95;
}

function fxGlitch(fx, b) {
    const p = fx.p();
    const a = Math.random() * FX_TAU, d = Math.sqrt(Math.random()) * b.R * 0.9;
    p.x = b.x + Math.cos(a) * d; p.y = b.y + Math.sin(a) * d; p.z = fxRand(0, 20);
    p.life = fxRand(0.1, 0.25); p.size0 = p.size1 = fxRand(4, 7);
    p.tex = fx.tex.pixel; p.additive = true; p.flicker = 0.8; p.alpha = 0.9; p.fadeOut = 0.5;
}

// ---------------------------------------------------------------------------------
// Recipes: one per CONFIG.GRENADE_TYPES key (unknown keys fall back to FRAG).
//   start(fx, b)          fires once at detonation
//   update(fx, b, dt)     optional timeline, runs while b.age < duration
//   render(fx, b, ctx)    optional set piece, drawn last in the additive pass
// ---------------------------------------------------------------------------------
const GRENADE_FX_RECIPES = {
    // Classic HE: white flash, rolling fireball, shrapnel, debris, smoke column, scorch.
    FRAG: {
        duration: 0,
        start(fx, b) {
            const T = fx.tex, x = b.x, y = b.y, R = b.R, K = b.K;
            fxFlash(fx, x, y, K * 3.4, 0.11, T.glowRamp.FIRE[0], 0.9);
            fxFlash(fx, x, y, K * 1.3, 0.2, T.glowRamp.FIRE[1], 1);
            fx.light(x, y, R * 2.6, 0.55, T.glowRamp.FIRE[3]);
            const ring = fx.ring(x, y, R * 0.15, R * 1.3, 0.26, 'rgb(255,236,196)');
            ring.w0 = 6; ring.w1 = 1;
            fxDustRing(fx, x, y, R, 18, T.cloud.DUST);
            fxSmoke(fx, x, y, K, 14, T.cloud.SMOKE, 0.22, 0.62);
            fxFireball(fx, x, y, K, T.flameRamp.FIRE, T.puffRamp.FIRE, 16, 1);
            fxCore(fx, x, y, K, T.puffRamp.FIRE, 5);
            fxSparks(fx, x, y, K, 40, T.glowRamp.FIRE, 3.5, 8.5, 0.3);
            fxDebris(fx, x, y, K, 12);
            fxEmbers(fx, x, y, K, 14, T.glowRamp.FIRE);
            const d = fx.decal(x, y, R * 1.7, 24, fxPick(T.scorch));
            d.alpha = 0.78; d.fadeOut = 6;
            fx.shake(b, 1);
        },
    },

    // Slagger: magma fireball and a fountain of molten globs that splat and cool. The
    // PlasmaPoolEffect it leaves behind is drawn by renderMoltenPool().
    PLASMA_SLAG: {
        duration: 0,
        start(fx, b) {
            const T = fx.tex, x = b.x, y = b.y, R = b.R, K = b.K;
            fxFlash(fx, x, y, K * 3.2, 0.13, T.glowRamp.MAGMA[0], 0.9);
            fxFlash(fx, x, y, K * 1.4, 0.24, T.glowRamp.MAGMA[1], 1);
            fx.light(x, y, R * 2.6, 0.8, T.glowRamp.MAGMA[3]);
            const r1 = fx.ring(x, y, R * 0.2, R * 1.25, 0.3, 'rgb(255,200,110)');
            r1.w0 = 7; r1.w1 = 1;
            const r2 = fx.ring(x, y, R * 0.1, R * 1.55, 0.5, 'rgb(255,120,40)');
            r2.delay = 0.06; r2.w0 = 3; r2.w1 = 0.5; r2.alpha = 0.55;
            fxSmoke(fx, x, y, K, 8, T.cloud.SOOT, 0.25, 0.6);
            fxFireball(fx, x, y, K * 0.95, T.flameRamp.MAGMA, T.puffRamp.MAGMA, 14, 1.8);
            fxCore(fx, x, y, K, T.puffRamp.MAGMA, 5);
            fxGlobs(fx, x, y, K, 20, T.glowRamp.MAGMA);
            fxSparks(fx, x, y, K, 22, T.glowRamp.MAGMA, 3, 7, 0.4);
            fxEmbers(fx, x, y, K, 18, T.glowRamp.MAGMA);
            const d = fx.decal(x, y, R * 1.5, 24, fxPick(T.scorch));
            d.alpha = 0.85; d.fadeOut = 6;
            fx.shake(b, 1);
        },
    },

    // Freezer: blue-white snap, a billow of cryo foam, tumbling ice shards, glitter and
    // snow, and a frost bloom on the ground that lasts as long as the slow.
    CRYO_FOAM: {
        duration: 0,
        start(fx, b) {
            const T = fx.tex, x = b.x, y = b.y, R = b.R, K = b.K;
            fxFlash(fx, x, y, K * 3.0, 0.1, T.glowRamp.CRYO[0], 0.85);
            fxFlash(fx, x, y, K * 1.2, 0.2, T.glowRamp.CRYO[1], 1);
            const l = fx.light(x, y, R * 2.0, 0.55, T.glowRamp.CRYO[2]);
            l.intensity = 0.85;
            const r1 = fx.ring(x, y, R * 0.1, R * 1.08, 0.34, 'rgb(225,250,255)');
            r1.w0 = 5; r1.w1 = 1.5; r1.ease = 3; r1.alpha = 0.95;
            const r2 = fx.ring(x, y, R * 0.05, R * 0.85, 0.4, 'rgb(150,225,255)');
            r2.delay = 0.05; r2.w0 = 2; r2.w1 = 0.5; r2.alpha = 0.6;
            const gr = fx.ring(x, y, R * 0.2, R * 1.05, 0.5, 'rgb(200,240,255)');
            gr.ground = true; gr.additive = false; gr.w0 = 12; gr.w1 = 3; gr.alpha = 0.35;
            fxFoam(fx, x, y, R, 30, T.cloud.FOAM);
            fxMist(fx, x, y, R, 9, T.puffRamp.CRYO);
            fxShards(fx, x, y, K, 30);
            fxGlitter(fx, x, y, R, 30, [T.star.WHITE, T.star.CYAN]);
            fxSnow(fx, x, y, R, 26, T.mote.WHITE);
            const f = fxPick(T.frost);
            const d = fx.decal(x, y, R * 2.3, 7.5, f.frost);
            d.hot = f.sheen; d.hotLife = 0.9; d.hotAlpha = 0.9; d.alpha = 0.9; d.fadeIn = 0.12; d.fadeOut = 2.5;
            fx.shake(b, 1);
        },
    },

    // Pucker: everything is dragged into a growing black singularity with a whipping
    // accretion disk, which then collapses into a violet detonation.
    GRAVITON: {
        duration: 1.4,
        start(fx, b) {
            const T = fx.tex, x = b.x, y = b.y, R = b.R, K = b.K;
            fxFlash(fx, x, y, K * 1.3, 0.12, T.glowRamp.GRAV[1], 0.8);
            const l = fx.light(x, y, R * 1.7, 1.0, T.glowRamp.GRAV[2]);
            l.intensity = 0.7; l.flicker = 0.25;
            for (let k = 0; k < 3; k++) {
                const r = fx.ring(x, y, R * 1.15, R * 0.06, 0.38, 'rgb(205,110,255)');
                r.delay = k * 0.11; r.easeIn = true; r.ease = 2; r.w0 = 2; r.w1 = 5; r.alpha = 0.85; r.fadeIn = 0.3;
            }
            const gr = fx.ring(x, y, R * 1.2, R * 0.1, 0.5, 'rgb(30,10,45)');
            gr.ground = true; gr.additive = false; gr.easeIn = true; gr.ease = 1.6; gr.w0 = 16; gr.w1 = 4; gr.alpha = 0.45;
            fxVortex(fx, x, y, R, 22, T.cloud.VOID);
            fxInfall(fx, x, y, R, 60, T.glowRamp.GRAV);
            const d = fx.decal(x, y, R * 1.6, 16, fxPick(T.gravScar));
            d.alpha = 0.75; d.fadeIn = 0.45; d.fadeOut = 5;
            fx.shake(b, 0.3);
        },
        update(fx, b) {
            if (b.popped || b.age < 0.5) return;
            b.popped = true;
            const T = fx.tex, x = b.x, y = b.y, R = b.R, K = b.K;
            fxFlash(fx, x, y, K * 2.4, 0.16, T.glowRamp.GRAV[0], 1);
            fxFlash(fx, x, y, K * 1.1, 0.26, T.glowRamp.GRAV[1], 1);
            fx.light(x, y, R * 2.0, 0.45, T.glowRamp.GRAV[1]);
            const r1 = fx.ring(x, y, R * 0.05, R * 1.25, 0.3, 'rgb(245,190,255)');
            r1.w0 = 8; r1.w1 = 1; r1.ease = 3;
            const r2 = fx.ring(x, y, R * 0.05, R * 0.95, 0.42, 'rgb(170,60,240)');
            r2.delay = 0.05; r2.w0 = 3; r2.w1 = 0.5; r2.alpha = 0.6;
            fxSparks(fx, x, y, K, 26, T.glowRamp.GRAV, 3, 7.5, 0);
            fxWisps(fx, x, y, K, 12, T.puffRamp.GRAV);
            fx.shake(b, 1);
        },
        render(fx, b, ctx) {
            const t = b.age;
            if (t > 0.56) return;
            const T = fx.tex, x = b.x, y = b.y;
            const grow = 1 - Math.pow(1 - Math.min(1, t / 0.42), 3);
            const collapse = t > 0.47 ? Math.max(0, 1 - (t - 0.47) / 0.07) : 1;
            const r = b.R * 0.22 * grow * collapse * (1 + 0.06 * Math.sin(t * 60));
            if (r < 0.5) return;
            let d = r * 7;
            ctx.globalAlpha = 0.55 * collapse;                       // lensing halo
            ctx.drawImage(T.glowRamp.GRAV[2], x - d / 2, y - d / 2, d, d);
            ctx.globalCompositeOperation = 'source-over';            // event horizon
            d = r * 3.4;
            ctx.globalAlpha = 0.9;
            ctx.drawImage(T.shadow, x - d / 2, y - d / 2, d, d);
            ctx.globalAlpha = 1;
            ctx.fillStyle = '#07000D';
            ctx.beginPath(); ctx.arc(x, y, r, 0, FX_TAU); ctx.fill();
            ctx.globalCompositeOperation = 'lighter';                // accretion disk
            const spin = t * 16;
            ctx.lineCap = 'round';
            ctx.strokeStyle = 'rgb(225,140,255)';
            ctx.lineWidth = Math.max(1, r * 0.22);
            ctx.globalAlpha = 0.8;
            for (let k = 0; k < 3; k++) {
                const s = spin + k * 2.094;
                ctx.beginPath(); ctx.ellipse(x, y, r * 1.75, r * 0.7, 0.4, s, s + 1.6); ctx.stroke();
            }
            ctx.strokeStyle = 'rgb(255,225,255)';
            ctx.lineWidth = Math.max(1, r * 0.1);
            ctx.globalAlpha = 0.95;
            ctx.beginPath(); ctx.arc(x, y, r * 1.04, 0, FX_TAU); ctx.stroke();
            ctx.globalAlpha = 1;
        },
    },

    // Tesla Egg: crackling plasma ball spitting bolts across the radius, bouncing sparks,
    // and a Lichtenberg burn that glows then cools. Chain jumps come via spawnChainArc().
    ARC_CASCADE: {
        duration: 0.7,
        start(fx, b) {
            const T = fx.tex, x = b.x, y = b.y, R = b.R, K = b.K;
            fxFlash(fx, x, y, K * 2.6, 0.1, T.glowRamp.ARC[0], 1);
            fxFlash(fx, x, y, K * 1.6, 0.18, T.glowRamp.VOLT[1], 0.8);
            const l = fx.light(x, y, R * 1.5, 0.65, T.glowRamp.VOLT[1]);
            l.flicker = 0.5;
            const r1 = fx.ring(x, y, R * 0.08, R * 1.0, 0.22, 'rgb(255,240,160)');
            r1.w0 = 3.5; r1.w1 = 1; r1.jitter = 0.045;
            const r2 = fx.ring(x, y, R * 0.05, R * 0.75, 0.3, 'rgb(160,205,255)');
            r2.delay = 0.04; r2.w0 = 2; r2.w1 = 0.5; r2.jitter = 0.06; r2.alpha = 0.7;
            fxSparks(fx, x, y, K, 38, T.glowRamp.ARC, 3, 7, 0.5);
            fxSmoke(fx, x, y, K * 0.8, 5, T.cloud.OZONE, 0.3, 0.28);
            const s = fxPick(T.lightning);
            const d = fx.decal(x, y, R * 1.25, 22, s.burn);
            d.hot = s.hot; d.hotLife = 1.4; d.alpha = 0.85; d.fadeIn = 0.02; d.fadeOut = 6;
            const c = fx.decal(x, y, R * 0.55, 22, fxPick(T.scorch));
            c.alpha = 0.6; c.fadeOut = 6;
            fx.shake(b, 1);
        },
        update(fx, b, dt) {
            if (b.age > 0.55) return;
            b.zap -= dt;
            if (b.zap > 0) return;
            b.zap = 0.045;
            const T = fx.tex;
            for (let i = 0, n = 3 + ((Math.random() * 3) | 0); i < n; i++) {
                const a = Math.random() * FX_TAU, reach = b.R * fxRand(0.35, 1.0) * (1 - b.age * 0.7);
                const ex = b.x + Math.cos(a) * reach, ey = b.y + Math.sin(a) * reach;
                const bolt = fx.bolt(b.x, b.y, ex, ey, 'rgb(255,226,80)', 'rgb(255,255,240)');
                bolt.life = fxRand(0.05, 0.09); bolt.width = fxRand(1.6, 2.6); bolt.amp = 0.22;
                bolt.branches = 2; bolt.jitterEvery = 0.03;
                fxSparks(fx, ex, ey, 30, 2, T.glowRamp.ARC, 2, 5, 0);
            }
        },
        render(fx, b, ctx) {
            const t = b.age;
            if (t > 0.65) return;
            const T = fx.tex, x = b.x, y = b.y;
            const fade = 1 - fxSmooth(0.4, 0.65, t);
            const r = b.K * 0.2 * (0.85 + 0.3 * Math.random()) * (0.6 + 0.4 * fade);
            let d = r * 7;
            ctx.globalAlpha = 0.45 * fade;
            ctx.drawImage(T.glowRamp.VOLT[2], x - d / 2, y - d / 2, d, d);
            d = r * 3.4;
            ctx.globalAlpha = 0.9 * fade;
            ctx.drawImage(T.glowRamp.ARC[1], x - d / 2, y - d / 2, d, d);
            d = r * 1.7;
            ctx.globalAlpha = fade;
            ctx.drawImage(T.glowRamp.ARC[0], x - d / 2, y - d / 2, d, d);
            ctx.globalAlpha = 1;
        },
    },

    // Gray Rain: a dull pop that releases a swirling cloud of metallic nanites. They
    // hang in a toxic haze, rain back down glinting, and corrode the ground.
    NANITE_SWARM: {
        duration: 2.4,
        start(fx, b) {
            const T = fx.tex, x = b.x, y = b.y, R = b.R, K = b.K;
            fxFlash(fx, x, y, K * 0.9, 0.12, T.glowRamp.NANITE[1], 0.65);
            fxFlash(fx, x, y, K * 0.45, 0.18, T.glowRamp.NANITE[0], 0.9);
            const l = fx.light(x, y, R * 1.2, 0.7, T.glowRamp.NANITE[2]);
            l.intensity = 0.55;
            const r1 = fx.ring(x, y, R * 0.04, R * 0.55, 0.28, 'rgb(150,240,160)');
            r1.w0 = 3; r1.w1 = 0.5; r1.alpha = 0.7;
            const r2 = fx.ring(x, y, R * 0.1, R * 1.02, 1.2, 'rgb(70,200,90)');
            r2.ease = 2.2; r2.w0 = 2.5; r2.w1 = 1; r2.alpha = 0.4;
            const gr = fx.ring(x, y, R * 0.1, R * 1.0, 0.9, 'rgb(60,80,60)');
            gr.ground = true; gr.additive = false; gr.w0 = 10; gr.w1 = 2; gr.alpha = 0.3;
            fxHaze(fx, x, y, R, 16, T.cloud.HAZE);
            fxSwarm(fx, x, y, R, 220);
            const d = fx.decal(x, y, R * 2.05, 8.5, fxPick(T.corrosion));
            d.alpha = 0.88; d.fadeIn = 0.7; d.fadeOut = 2.5;
            fx.shake(b, 1);
        },
        update(fx, b, dt) {
            if (b.age < 0.35 || b.age > 2.3) return;
            b.rain += dt * 110 * fx.density;
            while (b.rain >= 1) { b.rain -= 1; fxRaindrop(fx, b); }
            if (Math.random() < dt * 14) fxGlitch(fx, b);
        },
    },
};
