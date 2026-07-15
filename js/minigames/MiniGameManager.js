/**
 * MiniGameManager — owns the modal overlay, the active mini-game, its
 * update/render loop, input routing, and the success/fail callback.
 *
 * Integration contract with Game:
 *   - Instantiated once in the Game constructor:  new MiniGameManager(this)
 *   - While a mini-game runs, game.gameState is set to 'MINIGAME_ACTIVE',
 *     which is NOT in Game.update()'s active-state list, so the main sim is
 *     paused automatically. Game.render() still redraws the frozen battlefield
 *     behind the (semi-transparent) modal, matching PAUSED behaviour.
 *   - The mini-game runs on the manager's OWN requestAnimationFrame loop.
 *
 * Usage:
 *   game.miniGameManager.launch('maze_shutdown', {
 *       difficulty,          // optional number; default derived from campaign phase
 *       seed,                // optional number; default derived from mission seed
 *       context: { turret }, // arbitrary payload passed to the mini-game
 *       onComplete: (result) => { ... } // 'success' | 'fail' | 'abort'
 *   });
 *
 * Global (no modules). Must load AFTER MiniGame.js and any concrete
 * mini-game classes it auto-registers, and BEFORE game.js.
 */
class MiniGameManager {
    constructor(game) {
        this.game = game;
        this.registry = {};          // key -> mini-game class
        this.activeGame = null;
        this.isVisible = false;

        this._returnState = 'RUNNING';
        this._onComplete = null;
        this._launchCount = 0;

        this._rafId = null;
        this._lastTime = 0;
        this._outroUntil = 0;
        this._closing = false;

        // DOM refs (built lazily)
        this.overlay = null;
        this.windowEl = null;
        this.titleEl = null;
        this.subtitleEl = null;
        this.canvas = null;
        this.ctx = null;
        this.instructionsEl = null;
        this.statusTextEl = null;
        this.progressFillEl = null;
        this.abortHintEl = null;

        // Bound handlers (stable refs for add/removeEventListener)
        this._boundLoop = this._loop.bind(this);
        this._boundPointerDown = this._onPointerDown.bind(this);
        this._boundPointerMove = this._onPointerMove.bind(this);
        this._boundPointerUp = this._onPointerUp.bind(this);
        this._boundKeyDown = this._onKeyDown.bind(this);
        this._boundKeyUp = this._onKeyUp.bind(this);

        this._pointerDown = false;

        this._buildDom();
        this._autoRegister();
    }

    // --- Registration ---------------------------------------------------
    register(key, gameClass) {
        if (key && typeof gameClass === 'function') this.registry[key] = gameClass;
    }

    _autoRegister() {
        // Auto-wire concrete games if their classes are present, so Game
        // doesn't need to know about specific mini-game types.
        if (typeof MazeShutdown !== 'undefined') this.register('maze_shutdown', MazeShutdown);
        if (typeof NullWave !== 'undefined') this.register('null_wave', NullWave);
        if (typeof BreakerCascade !== 'undefined') this.register('breaker_cascade', BreakerCascade);
        if (typeof TraceRace !== 'undefined') this.register('trace_race', TraceRace);
    }

    isActive() { return !!this.activeGame; }

    // --- Launch / lifecycle --------------------------------------------
    /**
     * Launch a mini-game by key.
     * @returns {boolean} true if launched; false if unavailable/disabled/busy.
     */
    launch(key, opts = {}) {
        const cfgRoot = (typeof CONFIG !== 'undefined' && CONFIG.MINIGAMES) ? CONFIG.MINIGAMES : null;
        if (!cfgRoot || cfgRoot.ENABLED === false) return false;
        if (this.activeGame) return false;               // one at a time
        const GameClass = this.registry[key];
        if (!GameClass) { console.warn('[MiniGameManager] unknown mini-game:', key); return false; }

        const gameCfg = this._configFor(GameClass, cfgRoot);
        const difficulty = this._resolveDifficulty(opts.difficulty, cfgRoot);
        const rng = this._makeRng(opts.seed);
        const size = gameCfg.CANVAS_SIZE || 520;

        // Size the canvas to a fixed logical resolution (crisp, DPR-independent).
        this.canvas.width = size;
        this.canvas.height = size;

        this.activeGame = new GameClass({
            manager: this,
            canvas: this.canvas,
            ctx: this.ctx,
            width: size,
            height: size,
            config: gameCfg,
            difficulty: difficulty,
            rng: rng,
            context: opts.context || {},
        });

        this._onComplete = (typeof opts.onComplete === 'function') ? opts.onComplete : null;
        this._closing = false;
        this._outroUntil = 0;

        // Pause the main sim.
        this._returnState = this.game ? this.game.gameState : 'RUNNING';
        if (this.game) this.game.gameState = 'MINIGAME_ACTIVE';

        // Populate chrome.
        this.titleEl.textContent = this.activeGame.getTitle();
        this.subtitleEl.textContent = this.activeGame.getSubtitle();
        this.instructionsEl.textContent = this.activeGame.getInstructions();
        const allowAbort = gameCfg.ALLOW_ABORT !== false;
        this.abortHintEl.style.display = allowAbort ? '' : 'none';
        this._allowAbort = allowAbort;

        try { this.activeGame.init(); } catch (e) { console.error('[MiniGameManager] init error', e); }

        this._show();
        this._attachInput();
        this._lastTime = performance.now();
        this._rafId = requestAnimationFrame(this._boundLoop);
        return true;
    }

    /**
     * Launch a mini-game chosen from a themed pool (CONFIG.MINIGAMES.POOLS).
     * The TYPE is picked deterministically from opts.selector (so a given
     * objective always presents the same kind of challenge), while the
     * internal layout stays fresh each attempt (launch() re-seeds per call).
     * @returns {boolean} true if launched.
     */
    launchFromPool(poolKey, opts = {}) {
        const cfgRoot = (typeof CONFIG !== 'undefined' && CONFIG.MINIGAMES) ? CONFIG.MINIGAMES : null;
        const pool = cfgRoot && cfgRoot.POOLS ? cfgRoot.POOLS[poolKey] : null;
        if (!pool || !pool.length) return false;
        // Filter to registered keys (a pool may reference not-yet-built games).
        const available = pool.filter(k => this.registry[k]);
        if (!available.length) return false;
        const idx = this._poolSeed(opts.selector) % available.length;
        return this.launch(available[idx], opts);
    }

    // Deterministic index from mission seed + a per-objective selector.
    _poolSeed(selector) {
        let base = 0;
        if (this.game) base = (this.game.currentMissionSeed || this.game.campaignSeed || 0);
        const sel = (typeof selector === 'number' && isFinite(selector)) ? Math.floor(selector) : this._launchCount;
        let h = ((base >>> 0) ^ (Math.imul(sel, 0x9E3779B1) >>> 0)) >>> 0;
        h = Math.imul(h ^ (h >>> 15), h | 1) >>> 0;
        h ^= h >>> 13;
        return h >>> 0;
    }

    // Called by MiniGame._finish().
    _onGameFinished(gameInstance, result) {
        if (gameInstance !== this.activeGame) return;
        // Brief hold on the final frame so the win/lose state is readable.
        const cfgRoot = (typeof CONFIG !== 'undefined' && CONFIG.MINIGAMES) ? CONFIG.MINIGAMES : {};
        const delay = (typeof cfgRoot.OUTRO_DELAY_MS === 'number') ? cfgRoot.OUTRO_DELAY_MS : 600;
        this._outroUntil = performance.now() + delay;
        this._detachInput();
        this.overlay.classList.add('minigame-finished-' + result);
    }

    _loop(now) {
        if (!this.activeGame) return;
        let dt = (now - this._lastTime) / 1000;
        this._lastTime = now;
        if (!(dt > 0)) dt = 1 / 60;
        dt = Math.min(dt, 0.05); // clamp (tab refocus / long frames)

        const g = this.activeGame;
        if (!g._finished) {
            try { g.update(dt); } catch (e) { console.error('[MiniGameManager] update error', e); g.fail(); }
        }

        // Render (reset context state each frame so a game can't leak alpha/shadow/transform).
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        try { g.render(this.ctx); } catch (e) { console.error('[MiniGameManager] render error', e); }

        // Footer status / progress.
        this._updateFooter(g);

        // Close once the outro hold elapses.
        if (g._finished && this._outroUntil && now >= this._outroUntil) {
            this._finishAndClose(g.result);
            return;
        }

        this._rafId = requestAnimationFrame(this._boundLoop);
    }

    _updateFooter(g) {
        const status = g.getStatusText ? g.getStatusText() : '';
        if (this.statusTextEl.textContent !== status) this.statusTextEl.textContent = status;
        const p = g.getProgress ? g.getProgress() : -1;
        if (p < 0) {
            this.progressFillEl.parentElement.style.visibility = 'hidden';
        } else {
            this.progressFillEl.parentElement.style.visibility = 'visible';
            this.progressFillEl.style.width = Math.max(0, Math.min(1, p)) * 100 + '%';
        }
    }

    _finishAndClose(result) {
        if (this._closing) return;
        this._closing = true;
        if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }

        const g = this.activeGame;
        const cb = this._onComplete;
        this._detachInput();
        this._hide();

        // Restore game state.
        if (this.game && this.game.gameState === 'MINIGAME_ACTIVE') {
            this.game.gameState = this._returnState || 'RUNNING';
        }

        if (g) { try { g.destroy(); } catch (e) { /* ignore */ } }
        this.activeGame = null;
        this._onComplete = null;

        if (cb) { try { cb(result); } catch (e) { console.error('[MiniGameManager] onComplete error', e); } }
    }

    /** Force-close (e.g. mission ended out from under the mini-game). */
    forceClose() {
        if (!this.activeGame) return;
        this._finishAndClose('abort');
    }

    // --- Difficulty / RNG / config resolution --------------------------
    _configFor(GameClass, cfgRoot) {
        // A game class advertises its config key via a static CONFIG_KEY.
        const key = GameClass.CONFIG_KEY || 'MAZE_SHUTDOWN';
        return cfgRoot[key] || {};
    }

    _resolveDifficulty(override, cfgRoot) {
        const d = (cfgRoot && cfgRoot.DIFFICULTY) || {};
        const max = (typeof d.MAX === 'number') ? d.MAX : 6;
        if (typeof override === 'number' && override > 0) return Math.max(1, Math.min(override, max));
        const phase = (this.game && typeof this.game.currentPhaseIndex === 'number') ? this.game.currentPhaseIndex : 0;
        const val = (d.BASE || 1) + phase * (d.PER_PHASE || 0);
        return Math.max(1, Math.min(val, max));
    }

    _makeRng(override) {
        let seed;
        if (typeof override === 'number' && override) {
            seed = override >>> 0;
        } else {
            let base = Date.now();
            if (this.game) base = this.game.currentMissionSeed || this.game.campaignSeed || base;
            // Vary per launch so consecutive turrets aren't identical mazes,
            // but remain reproducible for a given mission seed + launch index.
            seed = ((base >>> 0) + this._launchCount * 0x9E3779B1) >>> 0;
        }
        this._launchCount++;
        if (typeof SeededRandom !== 'undefined') return new SeededRandom(seed || 1);
        return null; // MiniGame.rand() falls back to Math.random()
    }

    // --- DOM ------------------------------------------------------------
    _buildDom() {
        if (this.overlay) return;
        const overlay = document.createElement('div');
        overlay.id = 'minigame-overlay';
        overlay.className = 'minigame-overlay';

        const win = document.createElement('div');
        win.className = 'minigame-window';

        const header = document.createElement('div');
        header.className = 'minigame-header';
        const title = document.createElement('div');
        title.className = 'minigame-title';
        const subtitle = document.createElement('div');
        subtitle.className = 'minigame-subtitle';
        header.appendChild(title);
        header.appendChild(subtitle);

        const stage = document.createElement('div');
        stage.className = 'minigame-stage';
        const canvas = document.createElement('canvas');
        canvas.className = 'minigame-canvas';
        stage.appendChild(canvas);

        const footer = document.createElement('div');
        footer.className = 'minigame-footer';
        const instructions = document.createElement('div');
        instructions.className = 'minigame-instructions';
        const statusbar = document.createElement('div');
        statusbar.className = 'minigame-statusbar';
        const statusText = document.createElement('div');
        statusText.className = 'minigame-status-text';
        const progress = document.createElement('div');
        progress.className = 'minigame-progress';
        const progressFill = document.createElement('div');
        progressFill.className = 'minigame-progress-fill';
        progress.appendChild(progressFill);
        statusbar.appendChild(statusText);
        statusbar.appendChild(progress);
        const abortHint = document.createElement('div');
        abortHint.className = 'minigame-abort-hint';
        abortHint.textContent = 'Esc — abort (turret stays online)';

        footer.appendChild(instructions);
        footer.appendChild(statusbar);
        footer.appendChild(abortHint);

        win.appendChild(header);
        win.appendChild(stage);
        win.appendChild(footer);
        overlay.appendChild(win);
        document.body.appendChild(overlay);

        this.overlay = overlay;
        this.windowEl = win;
        this.titleEl = title;
        this.subtitleEl = subtitle;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.instructionsEl = instructions;
        this.statusTextEl = statusText;
        this.progressFillEl = progressFill;
        this.abortHintEl = abortHint;
    }

    _show() {
        this.overlay.classList.remove('minigame-finished-success', 'minigame-finished-fail', 'minigame-finished-abort');
        this.overlay.classList.add('visible');
        this.isVisible = true;
    }

    _hide() {
        this.overlay.classList.remove('visible');
        this.overlay.classList.remove('minigame-finished-success', 'minigame-finished-fail', 'minigame-finished-abort');
        this.isVisible = false;
    }

    // --- Input ----------------------------------------------------------
    _attachInput() {
        this.canvas.addEventListener('pointerdown', this._boundPointerDown);
        this.canvas.addEventListener('pointermove', this._boundPointerMove);
        window.addEventListener('pointerup', this._boundPointerUp);
        // Capture phase so game-level key handlers never see these while modal.
        document.addEventListener('keydown', this._boundKeyDown, true);
        document.addEventListener('keyup', this._boundKeyUp, true);
    }

    _detachInput() {
        this.canvas.removeEventListener('pointerdown', this._boundPointerDown);
        this.canvas.removeEventListener('pointermove', this._boundPointerMove);
        window.removeEventListener('pointerup', this._boundPointerUp);
        document.removeEventListener('keydown', this._boundKeyDown, true);
        document.removeEventListener('keyup', this._boundKeyUp, true);
        this._pointerDown = false;
    }

    _canvasCoords(evt) {
        const rect = this.canvas.getBoundingClientRect();
        const sx = this.canvas.width / (rect.width || 1);
        const sy = this.canvas.height / (rect.height || 1);
        return { x: (evt.clientX - rect.left) * sx, y: (evt.clientY - rect.top) * sy };
    }

    _onPointerDown(evt) {
        if (!this.activeGame) return;
        this._pointerDown = true;
        const p = this._canvasCoords(evt);
        this.activeGame.handlePointerDown(p.x, p.y);
    }

    _onPointerMove(evt) {
        if (!this.activeGame) return;
        const p = this._canvasCoords(evt);
        this.activeGame.handlePointerMove(p.x, p.y);
    }

    _onPointerUp(evt) {
        if (!this.activeGame || !this._pointerDown) return;
        this._pointerDown = false;
        const p = this._canvasCoords(evt);
        this.activeGame.handlePointerUp(p.x, p.y);
    }

    _onKeyDown(evt) {
        if (!this.activeGame) return;
        const key = evt.key;
        if (key === 'Escape') {
            evt.preventDefault();
            evt.stopPropagation();
            if (this._allowAbort) this.activeGame.abort();
            return;
        }
        // Swallow movement keys so the page/game don't react.
        if (MiniGameManager.SWALLOW_KEYS[key] || MiniGameManager.SWALLOW_KEYS[key.toLowerCase()]) {
            evt.preventDefault();
            evt.stopPropagation();
        }
        this.activeGame.handleKeyDown(key, evt);
    }

    _onKeyUp(evt) {
        if (!this.activeGame) return;
        this.activeGame.handleKeyUp(evt.key, evt);
    }
}

// Keys the modal consumes (prevents page scroll / game hotkeys leaking through).
MiniGameManager.SWALLOW_KEYS = {
    ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1,
    w: 1, a: 1, s: 1, d: 1, ' ': 1, Enter: 1,
};

if (typeof window !== 'undefined') window.MiniGameManager = MiniGameManager;
