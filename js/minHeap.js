// js/minHeap.js
// complete
// Binary min-heap for the A* open list (see _astar in utils.js). Entries are (f, g, cell index)
// kept in parallel typed arrays, so pushing and popping allocate nothing and one heap is reused
// for every search. Ordering matches the old object-based heap exactly: smallest f first, and
// on equal f the smaller g, so A* expands cells in the same order and finds the same paths.
class MinHeap {
    constructor(initialCapacity = 4096) {
        this.f = new Float64Array(initialCapacity);
        this.g = new Float64Array(initialCapacity);
        this.idx = new Int32Array(initialCapacity);
        this.size = 0;
        this.poppedG = 0; // g of the entry returned by the last pop()
    }

    clear() {
        this.size = 0;
    }

    isEmpty() {
        return this.size === 0;
    }

    _grow() {
        const capacity = this.f.length * 2;
        const f = new Float64Array(capacity); f.set(this.f); this.f = f;
        const g = new Float64Array(capacity); g.set(this.g); this.g = g;
        const idx = new Int32Array(capacity); idx.set(this.idx); this.idx = idx;
    }

    push(f, g, idx) {
        if (this.size === this.f.length) this._grow();
        const F = this.f, G = this.g, I = this.idx;
        // Bubble up: shift parents that sort after the new entry down, then drop it into the gap.
        let i = this.size++;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (f < F[p] || (f === F[p] && g < G[p])) {
                F[i] = F[p]; G[i] = G[p]; I[i] = I[p];
                i = p;
            } else {
                break;
            }
        }
        F[i] = f; G[i] = g; I[i] = idx;
    }

    // Removes the minimum entry and returns its cell index (its g is left in this.poppedG).
    pop() {
        const F = this.f, G = this.g, I = this.idx;
        const top = I[0];
        this.poppedG = G[0];
        const n = --this.size;
        if (n > 0) {
            // Sift the last entry down from the root, moving the smaller child up each step.
            const xf = F[n], xg = G[n], xi = I[n];
            let i = 0;
            for (;;) {
                const l = 2 * i + 1;
                if (l >= n) break;
                let c = -1, cf = xf, cg = xg;
                if (F[l] < cf || (F[l] === cf && G[l] < cg)) { c = l; cf = F[l]; cg = G[l]; }
                const r = l + 1;
                if (r < n && (F[r] < cf || (F[r] === cf && G[r] < cg))) { c = r; }
                if (c < 0) break;
                F[i] = F[c]; G[i] = G[c]; I[i] = I[c];
                i = c;
            }
            F[i] = xf; G[i] = xg; I[i] = xi;
        }
        return top;
    }
}
