class SeededRandom {
    constructor(seed) {
        this.seed = parseInt(seed, 10);
        if (isNaN(this.seed) || this.seed === 0) {
            this.seed = Date.now();
        }
        this.seed = this.seed >>> 0; 
        if (this.seed === 0) this.seed = 1;
        this.perlinPermutation = this._generatePerlinPermutation();
    }

    _generatePerlinPermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        const perm = new Array(512);
        for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
        return perm;
    }

    _fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    _lerp(a, b, t) {
        return a + t * (b - a);
    }

    _grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -2 * v : 2 * v);
    }

    perlin2D(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this._fade(x);
        const v = this._fade(y);
        const A = this.perlinPermutation[X] + Y;
        const B = this.perlinPermutation[X + 1] + Y;
        return this._lerp(
            this._lerp(this._grad(this.perlinPermutation[A], x, y), this._grad(this.perlinPermutation[B], x - 1, y), u),
            this._lerp(this._grad(this.perlinPermutation[A + 1], x, y - 1), this._grad(this.perlinPermutation[B + 1], x - 1, y - 1), u),
            v
        );
    }

    fbm(x, y, octaves = 4, lacunarity = 2, persistence = 0.5) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;
        for (let i = 0; i < octaves; i++) {
            total += this.perlin2D(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return total / maxValue;
    }

    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        this.seed = t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }

    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    pickFrom(array) {
        if (!array || array.length === 0) return undefined;
        return array[this.nextInt(0, array.length - 1)];
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    chance(probability) {
        return this.next() < probability;
    }
}