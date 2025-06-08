class SeededRandom {
    constructor(seed) {
        // Ensure seed is a number. If not, or if it's 0, use a timestamp.
        // Make sure it's an integer for the Mulberry32 algorithm.
        this.seed = parseInt(seed, 10);
        if (isNaN(this.seed) || this.seed === 0) {
            this.seed = Date.now();
        }
        // Normalize to a 32-bit unsigned integer range if it's too large or negative
        this.seed = this.seed >>> 0; 
        if (this.seed === 0) this.seed = 1; // Avoid seed 0 as it can cause issues with some PRNGs
        
        // console.log(`[SeededRandom] Initialized with seed: ${this.seed}`);
    }

    // Mulberry32 algorithm
    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1); // Ensure t is not 0
        t ^= t + Math.imul(t ^ t >>> 7, t | 61); // Ensure t is not 0
        this.seed = t; // Update the seed for the next call
        return ((t ^ t >>> 14) >>> 0) / 4294967296; // Convert to float in [0, 1)
    }

    // Get a random float in [min, max)
    nextFloat(min, max) {
        return this.next() * (max - min) + min;
    }

    // Get a random integer in [min, max] (inclusive)
    nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

    // Pick a random element from an array
    pickFrom(array) {
        if (!array || array.length === 0) return undefined;
        return array[this.nextInt(0, array.length - 1)];
    }

    // Shuffle an array in place (Fisher-Yates shuffle)
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.nextInt(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Returns true with a given probability (0.0 to 1.0)
    chance(probability) {
        return this.next() < probability;
    }
}