/**
 * TraceRace ("Trace Race") — a HACK-pool mini-game for intel consoles.
 *
 * You inject an intrusion at the ENTRY node and hop across a network graph to
 * the data CORE. Meanwhile ICE (Intrusion Countermeasure) tokens pathfind
 * toward your current node through the same graph via BFS — a *smart* pursuer,
 * unlike the maze's random-walk sparks. Reach the core before ICE catches you
 * (or before the system lockout timer expires).
 *
 * Fair-chase design: you move on demand (fast); ICE moves on a fixed interval
 * (slower), and its next hop is telegraphed with a red edge, so a decisive
 * player can outrun it — getting cornered or dawdling is what kills you.
 *
 * Controls: click a linked node, or press an Arrow/WASD toward the neighbour
 * you want.
 *
 * The graph is built from a Euclidean MST (guarantees connectivity) plus a few
 * short extra edges (alternate routes), all from the seeded RNG.
 *
 * Extends MiniGame. Balance from CONFIG.MINIGAMES.TRACE_RACE. Colours local.
 */
class TraceRace extends MiniGame {
    getTitle() { return this.config.TITLE || 'TRACE RACE'; }
    getSubtitle() { return this.config.SUBTITLE || ''; }
    getInstructions() { return this.config.INSTRUCTIONS || ''; }

    init() {
        const c = this.config;
        const diff = this.difficulty;

        this.nodeR = 15;
        this.moveAnim = c.MOVE_ANIM || 0.16;
        this.clock = 0;

        this.lockoutLimit = Math.max(c.LOCKOUT_MIN || 16,
            (c.LOCKOUT_BASE || 30) + (diff - 1) * (c.LOCKOUT_PER_DIFFICULTY || 0));
        this.lockoutLeft = this.lockoutLimit;

        const wantNodes = this._clampInt((c.BASE_NODES || 8) + (diff - 1) * (c.NODES_PER_DIFFICULTY || 0),
            5, c.MAX_NODES || 15);

        this._placeNodes(wantNodes);
        this._buildEdges();
        this._chooseKeyNodes(c.TRACER_HEADSTART || 2);

        // Player token.
        this.player = {
            node: this.entry, prevNode: this.entry,
            px: this.nodes[this.entry].x, py: this.nodes[this.entry].y,
            tx: this.nodes[this.entry].x, ty: this.nodes[this.entry].y,
            animating: false, animT: 0,
        };

        // ICE tracers.
        const tracerCount = this._clampInt((c.TRACERS_BASE || 1) + (diff - 1) * (c.TRACERS_PER_DIFFICULTY || 0),
            1, c.TRACERS_MAX || 2);
        const stepInterval = Math.max(c.TRACER_STEP_MIN || 0.45,
            (c.TRACER_STEP_BASE || 0.95) + (diff - 1) * (c.TRACER_STEP_PER_DIFFICULTY || 0));
        this.tracers = [];
        for (let i = 0; i < tracerCount && i < this.tracerStarts.length; i++) {
            const n = this.tracerStarts[i];
            this.tracers.push({
                node: n, prevNode: n,
                px: this.nodes[n].x, py: this.nodes[n].y,
                tx: this.nodes[n].x, ty: this.nodes[n].y,
                animating: false, animT: 0,
                timer: stepInterval * (0.6 + 0.4 * i), // stagger multiple tracers
                interval: stepInterval,
            });
        }

        this.phase = 'PLAYING';    // 'PLAYING' | 'WON' | 'FAILED'
        this.failReason = '';
        this.winHold = 0;
        this._winHoldTime = 0.5;
    }

    // ---------------------------------------------------------------------
    // Graph construction
    // ---------------------------------------------------------------------
    _placeNodes(N) {
        const margin = 52;
        const w = this.width - margin * 2;
        const h = this.height - margin * 2;
        const minSep = Math.max(58, Math.min(120, Math.sqrt((w * h) / N) * 0.72));
        this.minSep = minSep;
        const nodes = [];
        const maxAttempts = N * 240;
        let attempts = 0;
        while (nodes.length < N && attempts < maxAttempts) {
            attempts++;
            const x = margin + this.rand() * w;
            const y = margin + this.rand() * h;
            let ok = true;
            for (let i = 0; i < nodes.length; i++) {
                const dx = nodes[i].x - x, dy = nodes[i].y - y;
                if (dx * dx + dy * dy < minSep * minSep) { ok = false; break; }
            }
            if (ok) nodes.push({ x, y });
        }
        this.nodes = nodes; // may be < N if packing failed; that's fine
    }

    _dist(i, j) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    _buildEdges() {
        const N = this.nodes.length;
        this.adj = [];
        for (let i = 0; i < N; i++) this.adj.push([]);
        if (N < 2) return;

        // Prim's MST (guarantees a connected graph).
        const inTree = new Array(N).fill(false);
        inTree[0] = true;
        for (let added = 1; added < N; added++) {
            let bestI = -1, bestJ = -1, bestD = Infinity;
            for (let i = 0; i < N; i++) {
                if (!inTree[i]) continue;
                for (let j = 0; j < N; j++) {
                    if (inTree[j]) continue;
                    const d = this._dist(i, j);
                    if (d < bestD) { bestD = d; bestI = i; bestJ = j; }
                }
            }
            if (bestJ === -1) break;
            this._addEdge(bestI, bestJ);
            inTree[bestJ] = true;
        }

        // Extra short edges create loops / alternate routes.
        const threshold = this.minSep * 1.75;
        const maxDeg = 4;
        for (let i = 0; i < N; i++) {
            for (let j = i + 1; j < N; j++) {
                if (this.adj[i].indexOf(j) !== -1) continue;
                if (this._dist(i, j) > threshold) continue;
                if (this.adj[i].length >= maxDeg || this.adj[j].length >= maxDeg) continue;
                this._addEdge(i, j);
            }
        }
    }

    _addEdge(i, j) {
        if (this.adj[i].indexOf(j) === -1) this.adj[i].push(j);
        if (this.adj[j].indexOf(i) === -1) this.adj[j].push(i);
    }

    _chooseKeyNodes(headstart) {
        const N = this.nodes.length;
        // Core = node nearest the top-right corner.
        let core = 0, bestC = Infinity;
        for (let i = 0; i < N; i++) {
            const dx = this.width - this.nodes[i].x;
            const dy = this.nodes[i].y;
            const d = dx * dx + dy * dy;
            if (d < bestC) { bestC = d; core = i; }
        }
        this.core = core;

        // Entry = graph-farthest node from the core (longest race).
        const distFromCore = this._bfsDist(core);
        let entry = 0, bestE = -1;
        for (let i = 0; i < N; i++) {
            if (i === core) continue;
            if (distFromCore[i] > bestE) { bestE = distFromCore[i]; entry = i; }
        }
        this.entry = entry;

        // Tracer start(s): a few hops from the entry, on your side of the map
        // (far from the core), so they chase you toward the goal.
        const distFromEntry = this._bfsDist(entry);
        const candidates = [];
        for (let i = 0; i < N; i++) {
            if (i === entry || i === core) continue;
            if (distFromEntry[i] >= headstart) candidates.push(i);
        }
        if (candidates.length === 0) {
            for (let i = 0; i < N; i++) if (i !== entry && i !== core) candidates.push(i);
        }
        // Prefer candidates deepest on the entry side (max distance from core).
        candidates.sort((a, b) => distFromCore[b] - distFromCore[a]);
        this.tracerStarts = candidates;
    }

    _bfsDist(src) {
        const N = this.nodes.length;
        const dist = new Array(N).fill(-1);
        dist[src] = 0;
        const q = [src];
        let head = 0;
        while (head < q.length) {
            const u = q[head++];
            const nb = this.adj[u];
            for (let k = 0; k < nb.length; k++) {
                const v = nb[k];
                if (dist[v] === -1) { dist[v] = dist[u] + 1; q.push(v); }
            }
        }
        return dist;
    }

    // First node to step to from `from` along a shortest path to `to` (or -1).
    _bfsNext(from, to) {
        if (from === to) return -1;
        const N = this.nodes.length;
        const prev = new Array(N).fill(-2);
        prev[from] = -1;
        const q = [from];
        let head = 0;
        while (head < q.length) {
            const u = q[head++];
            if (u === to) break;
            const nb = this.adj[u];
            for (let k = 0; k < nb.length; k++) {
                const v = nb[k];
                if (prev[v] === -2) { prev[v] = u; q.push(v); }
            }
        }
        if (prev[to] === -2) return -1; // unreachable (shouldn't happen on MST)
        let cur = to;
        while (prev[cur] !== from && prev[cur] !== -1) cur = prev[cur];
        return cur;
    }

    // ---------------------------------------------------------------------
    // Input
    // ---------------------------------------------------------------------
    handlePointerDown(x, y) {
        if (this.phase !== 'PLAYING' || this.player.animating) return;
        // Find the nearest node to the click.
        let best = -1, bestD = this.nodeR * 1.8;
        for (let i = 0; i < this.nodes.length; i++) {
            const dx = this.nodes[i].x - x, dy = this.nodes[i].y - y;
            const d = Math.sqrt(dx * dx + dy * dy);
            if (d < bestD) { bestD = d; best = i; }
        }
        if (best === -1) return;
        if (this.adj[this.player.node].indexOf(best) !== -1) this._hopPlayer(best);
    }

    handleKeyDown(key) {
        if (this.phase !== 'PLAYING' || this.player.animating) return;
        let vx = 0, vy = 0;
        switch (key) {
            case 'ArrowUp': case 'w': case 'W': vy = -1; break;
            case 'ArrowDown': case 's': case 'S': vy = 1; break;
            case 'ArrowLeft': case 'a': case 'A': vx = -1; break;
            case 'ArrowRight': case 'd': case 'D': vx = 1; break;
            default: return;
        }
        // Pick the neighbour whose direction best matches the pressed arrow.
        const from = this.nodes[this.player.node];
        const nb = this.adj[this.player.node];
        let best = -1, bestDot = 0.25;
        for (let k = 0; k < nb.length; k++) {
            const to = this.nodes[nb[k]];
            let dx = to.x - from.x, dy = to.y - from.y;
            const len = Math.hypot(dx, dy) || 1;
            dx /= len; dy /= len;
            const dot = dx * vx + dy * vy;
            if (dot > bestDot) { bestDot = dot; best = nb[k]; }
        }
        if (best !== -1) this._hopPlayer(best);
    }

    _hopPlayer(target) {
        const p = this.player;
        p.prevNode = p.node;
        p.node = target;
        p.tx = this.nodes[target].x;
        p.ty = this.nodes[target].y;
        p.animating = true;
        p.animT = 0;
    }

    // ---------------------------------------------------------------------
    // Update
    // ---------------------------------------------------------------------
    update(dt) {
        this.elapsed += dt;
        this.clock += dt;

        if (this.phase === 'WON') {
            this.winHold += dt;
            if (this.winHold >= this._winHoldTime) this.succeed();
            return;
        }
        if (this.phase !== 'PLAYING') return;

        // Lockout backstop.
        this.lockoutLeft -= dt;
        if (this.lockoutLeft <= 0) { this.lockoutLeft = 0; this.phase = 'FAILED'; this.failReason = 'lockout'; this.fail(); return; }

        // Animate player.
        this._animate(this.player, dt);
        if (!this.player.animating && this.player.node === this.core) {
            this.phase = 'WON'; this.winHold = 0; return;
        }

        // Tracers: animate + step toward the player on their interval.
        for (let i = 0; i < this.tracers.length; i++) {
            const t = this.tracers[i];
            this._animate(t, dt);
            if (t.animating) continue;
            t.timer -= dt;
            if (t.timer <= 0) {
                t.timer += t.interval;
                const next = this._bfsNext(t.node, this.player.node);
                if (next !== -1) {
                    t.prevNode = t.node;
                    t.node = next;
                    t.tx = this.nodes[next].x;
                    t.ty = this.nodes[next].y;
                    t.animating = true; t.animT = 0;
                }
            }
        }

        this._checkCaught();
    }

    _animate(tok, dt) {
        if (!tok.animating) return;
        tok.animT += dt;
        const k = Math.min(1, tok.animT / this.moveAnim);
        const sx = this.nodes[tok.prevNode].x, sy = this.nodes[tok.prevNode].y;
        tok.px = sx + (tok.tx - sx) * k;
        tok.py = sy + (tok.ty - sy) * k;
        if (k >= 1) { tok.animating = false; tok.px = tok.tx; tok.py = tok.ty; }
    }

    _checkCaught() {
        const p = this.player;
        for (let i = 0; i < this.tracers.length; i++) {
            const t = this.tracers[i];
            // ICE resting on the player's node.
            if (!t.animating && t.node === p.node) { this._caught(); return; }
            // Swap: exchanged nodes across the same edge.
            if (t.node === p.prevNode && p.node === t.prevNode && !t.animating && !p.animating) {
                this._caught(); return;
            }
        }
    }

    _caught() { this.phase = 'FAILED'; this.failReason = 'caught'; this.fail(); }

    // ---------------------------------------------------------------------
    // Footer hooks
    // ---------------------------------------------------------------------
    getProgress() {
        if (this.phase === 'WON') return 1;
        return this.lockoutLimit > 0 ? this.lockoutLeft / this.lockoutLimit : 0;
    }

    getStatusText() {
        if (this.phase === 'WON') return 'CORE BREACHED';
        if (this.phase === 'FAILED') return this.failReason === 'caught' ? 'TRACE LOCKED' : 'SYSTEM LOCKOUT';
        // Show hops-to-nearest-ICE as a danger read.
        let nearest = 99;
        for (let i = 0; i < this.tracers.length; i++) {
            const d = this._bfsDist(this.tracers[i].node)[this.player.node];
            if (d >= 0 && d < nearest) nearest = d;
        }
        return 'LOCKOUT IN ' + this.lockoutLeft.toFixed(1) + 's  ·  ICE ' + nearest + ' hop' + (nearest === 1 ? '' : 's');
    }

    // ---------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------
    render(ctx) {
        const C = TraceRace.COLORS;
        ctx.fillStyle = C.bg;
        ctx.fillRect(0, 0, this.width, this.height);

        const adjacent = this.phase === 'PLAYING' ? this.adj[this.player.node] : [];

        // Edges.
        ctx.lineWidth = 2;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let k = 0; k < this.adj[i].length; k++) {
                const j = this.adj[i][k];
                if (j < i) continue; // draw once
                const clickable = (adjacent.indexOf(i) !== -1 && this.player.node === j) ||
                    (adjacent.indexOf(j) !== -1 && this.player.node === i);
                ctx.strokeStyle = clickable ? C.edgeHot : C.edge;
                ctx.beginPath();
                ctx.moveTo(this.nodes[i].x, this.nodes[i].y);
                ctx.lineTo(this.nodes[j].x, this.nodes[j].y);
                ctx.stroke();
            }
        }

        // Tracer telegraph: red line toward each ICE's next hop.
        if (this.phase === 'PLAYING') {
            for (let i = 0; i < this.tracers.length; i++) {
                const t = this.tracers[i];
                if (t.animating) continue;
                const next = this._bfsNext(t.node, this.player.node);
                if (next === -1) continue;
                ctx.strokeStyle = C.telegraph;
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(this.nodes[t.node].x, this.nodes[t.node].y);
                ctx.lineTo(this.nodes[next].x, this.nodes[next].y);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Nodes.
        for (let i = 0; i < this.nodes.length; i++) this._renderNode(ctx, i, adjacent.indexOf(i) !== -1);

        // Tokens.
        for (let i = 0; i < this.tracers.length; i++) this._renderTracer(ctx, this.tracers[i]);
        if (this.phase !== 'FAILED') this._renderPlayer(ctx);

        if (this.phase === 'WON') this._renderBanner(ctx, 'CORE BREACHED', C.player);
        else if (this.phase === 'FAILED') {
            this._renderBanner(ctx, this.failReason === 'caught' ? 'TRACE LOCKED' : 'SYSTEM LOCKOUT', C.ice);
        }
    }

    _renderNode(ctx, i, clickable) {
        const C = TraceRace.COLORS;
        const n = this.nodes[i];
        const isCore = i === this.core;
        const isEntry = i === this.entry;
        let r = this.nodeR;
        let fill = C.node, edge = C.nodeEdge;
        if (isCore) { fill = C.coreFill; edge = C.core; r = this.nodeR * 1.15; }
        else if (isEntry) { fill = C.entryFill; edge = C.entry; }

        if (clickable) {
            ctx.strokeStyle = C.player;
            ctx.lineWidth = 2;
            ctx.shadowColor = C.player; ctx.shadowBlur = 8;
            ctx.beginPath(); ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2); ctx.stroke();
            ctx.shadowBlur = 0;
        }
        if (isCore) { ctx.shadowColor = C.core; ctx.shadowBlur = 14; }
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = edge;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2); ctx.stroke();

        if (isCore || isEntry) {
            ctx.fillStyle = '#04121a';
            ctx.font = 'bold ' + Math.floor(r * 0.7) + "px 'Consolas', monospace";
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(isCore ? '◈' : 'IN', n.x, n.y + 1);
        }
    }

    _renderTracer(ctx, t) {
        const C = TraceRace.COLORS;
        const flick = 0.7 + this.rand() * 0.3;
        ctx.fillStyle = C.ice;
        ctx.shadowColor = C.ice;
        ctx.shadowBlur = 16 * flick;
        ctx.beginPath(); ctx.arc(t.px, t.py, this.nodeR * 0.85, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        // crackle
        ctx.strokeStyle = '#fff0c0';
        ctx.lineWidth = 1.5;
        const r = this.nodeR * 0.6;
        ctx.beginPath();
        ctx.moveTo(t.px - r, t.py); ctx.lineTo(t.px + r, t.py);
        ctx.moveTo(t.px, t.py - r); ctx.lineTo(t.px, t.py + r);
        ctx.stroke();
    }

    _renderPlayer(ctx) {
        const C = TraceRace.COLORS;
        const p = this.player;
        ctx.fillStyle = C.player;
        ctx.shadowColor = C.playerGlow;
        ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(p.px, p.py, this.nodeR * 0.7, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
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

    destroy() { this.nodes = this.adj = this.tracers = null; }
}

TraceRace.CONFIG_KEY = 'TRACE_RACE';
TraceRace.COLORS = {
    bg: '#0a141c',
    edge: 'rgba(90,170,190,0.30)',
    edgeHot: 'rgba(79,216,255,0.85)',
    telegraph: 'rgba(255,80,70,0.6)',
    node: '#16323f',
    nodeEdge: 'rgba(120,190,200,0.6)',
    coreFill: '#1c5a44',
    core: '#43e0b0',
    entryFill: '#294a55',
    entry: '#9fd0da',
    player: '#4fd8ff',
    playerGlow: 'rgba(79,216,255,0.8)',
    ice: '#ff5a46',
};

if (typeof window !== 'undefined') window.TraceRace = TraceRace;
