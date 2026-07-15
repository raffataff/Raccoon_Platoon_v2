/**
 * MiniGame — reusable base class for modal mini-games.
 *
 * A mini-game is a small, self-contained challenge rendered into its own
 * canvas inside a modal overlay (see MiniGameManager). The main game sim is
 * paused while a mini-game is active, so mini-games own their own update/render
 * loop driven by the manager.
 *
 * Lifecycle (all called by MiniGameManager):
 *   constructor(opts)  -> store refs, don't build state yet
 *   init()             -> build puzzle state (uses this.rng for reproducibility)
 *   update(dt)         -> advance state; dt is seconds (already clamped)
 *   render(ctx)        -> draw to this.ctx (logical coords, this.width x this.height)
 *   pointer/key hooks  -> input, in logical canvas coordinates
 *   destroy()          -> release any resources / timers
 *
 * To finish, a subclass calls this.succeed(), this.fail(), or this.abort().
 * The manager then invokes the launch()'s onComplete callback with the result.
 *
 * Subclasses MUST NOT hardcode balance values — read them from the `config`
 * object handed in (sourced from CONFIG.MINIGAMES.*). Keep per-frame work cheap:
 * no allocations in update()/render() hot paths (Steam target).
 *
 * Global (no modules). Loaded before MiniGameManager in index.html.
 */
class MiniGame {
    /**
     * @param {object} opts
     * @param {MiniGameManager} opts.manager  owning manager
     * @param {HTMLCanvasElement} opts.canvas the mini-game canvas
     * @param {CanvasRenderingContext2D} opts.ctx
     * @param {number} opts.width   logical canvas width
     * @param {number} opts.height  logical canvas height
     * @param {object} opts.config  per-game config block (from CONFIG.MINIGAMES.*)
     * @param {number} opts.difficulty  resolved difficulty scalar (>= 1)
     * @param {SeededRandom} opts.rng   deterministic RNG instance
     * @param {object} opts.context  arbitrary caller context (e.g. { turret })
     */
    constructor(opts = {}) {
        this.manager = opts.manager || null;
        this.canvas = opts.canvas || null;
        this.ctx = opts.ctx || null;
        this.width = opts.width || 0;
        this.height = opts.height || 0;
        this.config = opts.config || {};
        this.difficulty = (typeof opts.difficulty === 'number') ? opts.difficulty : 1;
        this.rng = opts.rng || null;
        this.context = opts.context || {};

        this.result = null;         // 'success' | 'fail' | 'abort'
        this.isComplete = false;
        this._finished = false;
        this.elapsed = 0;           // seconds since init
    }

    // --- Metadata (override for the header/footer UI) --------------------
    getTitle() { return (this.config && this.config.TITLE) || 'MINI-GAME'; }
    getSubtitle() { return (this.config && this.config.SUBTITLE) || ''; }
    getInstructions() { return (this.config && this.config.INSTRUCTIONS) || ''; }

    // --- Lifecycle (override) -------------------------------------------
    /** Build puzzle state. Called once before the first update. */
    init() {}

    /** Advance state. dt in seconds. Call succeed()/fail()/abort() to end. */
    update(dt) { this.elapsed += dt; }

    /** Draw a frame. Canvas is pre-cleared by the manager. */
    render(ctx) {} // eslint-disable-line no-unused-vars

    /** Release resources. Called once after the game finishes. */
    destroy() {}

    // --- Input hooks (override; coords are logical canvas px) -----------
    handlePointerDown(x, y) {}  // eslint-disable-line no-unused-vars
    handlePointerMove(x, y) {}  // eslint-disable-line no-unused-vars
    handlePointerUp(x, y) {}    // eslint-disable-line no-unused-vars
    handleKeyDown(key, event) {} // eslint-disable-line no-unused-vars
    handleKeyUp(key, event) {}   // eslint-disable-line no-unused-vars

    // --- Progress reporting (optional, drives the footer status line) ---
    /** @returns {number} 0..1 completion for a progress bar, or -1 to hide. */
    getProgress() { return -1; }
    /** @returns {string} short status shown in the footer, or '' */
    getStatusText() { return ''; }

    // --- Termination helpers (call from subclass) -----------------------
    succeed() { this._finish('success'); }
    fail() { this._finish('fail'); }
    abort() { this._finish('abort'); }

    _finish(result) {
        if (this._finished) return;
        this._finished = true;
        this.result = result;
        this.isComplete = true;
        if (this.manager && typeof this.manager._onGameFinished === 'function') {
            this.manager._onGameFinished(this, result);
        }
    }

    // --- Small shared helpers -------------------------------------------
    /** Deterministic int in [min,max] using the seeded RNG (falls back to Math). */
    randInt(min, max) {
        if (this.rng && typeof this.rng.nextInt === 'function') return this.rng.nextInt(min, max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** Deterministic float in [0,1). */
    rand() {
        if (this.rng && typeof this.rng.next === 'function') return this.rng.next();
        return Math.random();
    }
}

// Expose globally (no module system in this project).
if (typeof window !== 'undefined') window.MiniGame = MiniGame;
