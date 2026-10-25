// js/SpatialGrid.js

// Every object in a grid remembers which grid it is in (_sgGrid) and the block of cells it covers
// (_sgMinCol.._sgMaxCol x _sgMinRow.._sgMaxRow), so an update that stays in the same cells costs a
// few compares and nothing is allocated. Cells are created the first time something enters them.
class SpatialGrid {
    constructor(worldWidth, worldHeight, cellSize, gameInstance) { // Added gameInstance
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cellSize = cellSize;
        this.game = gameInstance; // Store the game instance

        this.gridCols = Math.ceil(worldWidth / cellSize);
        this.gridRows = Math.ceil(worldHeight / cellSize);
        this.grid = new Array(this.gridCols * this.gridRows).fill(null);

        // Cell block of the object being added/updated (see _computeCells).
        this._minCol = 0; this._maxCol = -1; this._minRow = 0; this._maxRow = -1;

//        console.log(`[SpatialGrid] Initialized: ${this.gridCols}x${this.gridRows} grid, CellSize: ${this.cellSize}`);
    }

    _getCellIndex(x, y) {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);
        if (col < 0 || col >= this.gridCols || row < 0 || row >= this.gridRows) {
            return -1; // Out of bounds
        }
        return row * this.gridCols + col;
    }

    // Sets this._minCol/_maxCol/_minRow/_maxRow to the cells the object's bounds cover (empty when
    // it is entirely outside the world, as the old per-cell Set was).
    _computeCells(obj) {
        let minX, minY, maxX, maxY;
        if (obj instanceof Unit) {
            // Unit.getCollisionShape(): a circle of radius size / 2 (read directly, no shape object).
            const r = obj.size / 2;
            minX = obj.x - r; minY = obj.y - r; maxX = obj.x + r; maxY = obj.y + r;
        } else if (obj.collisionShape && this.game && this.game.level) { // Check for this.game and this.game.level
             const shapeOrShapes = this.game.level._getObstacleCollisionShape(obj);
             const shapes = Array.isArray(shapeOrShapes) ? shapeOrShapes : [shapeOrShapes];
             let shapeMinX = Infinity, shapeMinY = Infinity, shapeMaxX = -Infinity, shapeMaxY = -Infinity;
             for (const shape of shapes) {
                 let sxMin, syMin, sxMax, syMax;
                 if (shape.type === 'circle') {
                     sxMin = shape.x - shape.radius; syMin = shape.y - shape.radius;
                     sxMax = shape.x + shape.radius; syMax = shape.y + shape.radius;
                 } else if (shape.type === 'rectangle') {
                     sxMin = shape.x; syMin = shape.y;
                     sxMax = shape.x + shape.width; syMax = shape.y + shape.height;
                 } else if (shape.type === 'ellipse') {
                     sxMin = shape.x - shape.radiusX; syMin = shape.y - shape.radiusY;
                     sxMax = shape.x + shape.radiusX; syMax = shape.y + shape.radiusY;
                 } else {
                     sxMin = obj.x; syMin = obj.y; sxMax = obj.x + obj.width; syMax = obj.y + obj.height;
                 }
                 if (sxMin < shapeMinX) shapeMinX = sxMin;
                 if (syMin < shapeMinY) shapeMinY = syMin;
                 if (sxMax > shapeMaxX) shapeMaxX = sxMax;
                 if (syMax > shapeMaxY) shapeMaxY = syMax;
             }
             minX = shapeMinX; minY = shapeMinY; maxX = shapeMaxX; maxY = shapeMaxY;
        } else {
            minX = obj.x - (obj.size || obj.width || 0) / 2;
            minY = obj.y - (obj.size || obj.height || 0) / 2;
            maxX = obj.x + (obj.size || obj.width || 0) / 2;
            maxY = obj.y + (obj.size || obj.height || 0) / 2;
        }

        this._minCol = Math.max(0, Math.floor(minX / this.cellSize));
        this._maxCol = Math.min(this.gridCols - 1, Math.floor(maxX / this.cellSize));
        this._minRow = Math.max(0, Math.floor(minY / this.cellSize));
        this._maxRow = Math.min(this.gridRows - 1, Math.floor(maxY / this.cellSize));
    }

    _insert(obj) {
        const cols = this.gridCols, grid = this.grid;
        for (let r = this._minRow; r <= this._maxRow; r++) {
            for (let c = this._minCol; c <= this._maxCol; c++) {
                const i = r * cols + c;
                (grid[i] || (grid[i] = new Set())).add(obj);
            }
        }
        obj._sgGrid = this;
        obj._sgMinCol = this._minCol; obj._sgMaxCol = this._maxCol;
        obj._sgMinRow = this._minRow; obj._sgMaxRow = this._maxRow;
    }

    addObject(obj) {
        if (!obj || obj.isMarkedForDeletion) return;
        if (obj._sgGrid === this) { this.updateObject(obj); return; }
        this._computeCells(obj);
        this._insert(obj);
    }

    removeObject(obj) {
        if (!obj || obj._sgGrid !== this) return;
        const cols = this.gridCols, grid = this.grid;
        for (let r = obj._sgMinRow; r <= obj._sgMaxRow; r++) {
            for (let c = obj._sgMinCol; c <= obj._sgMaxCol; c++) {
                const cell = grid[r * cols + c];
                if (cell) cell.delete(obj);
            }
        }
        obj._sgGrid = null;
    }

    updateObject(obj) {
        if (!obj || obj.isMarkedForDeletion) return;
        if (obj._sgGrid !== this) { this._computeCells(obj); this._insert(obj); return; }
        this._computeCells(obj);
        const oMinC = obj._sgMinCol, oMaxC = obj._sgMaxCol, oMinR = obj._sgMinRow, oMaxR = obj._sgMaxRow;
        const nMinC = this._minCol, nMaxC = this._maxCol, nMinR = this._minRow, nMaxR = this._maxRow;
        if (oMinC === nMinC && oMaxC === nMaxC && oMinR === nMinR && oMaxR === nMaxR) return;

        const cols = this.gridCols, grid = this.grid;
        // Remove from cells it's no longer in
        for (let r = oMinR; r <= oMaxR; r++) {
            for (let c = oMinC; c <= oMaxC; c++) {
                if (r >= nMinR && r <= nMaxR && c >= nMinC && c <= nMaxC) continue;
                const cell = grid[r * cols + c];
                if (cell) cell.delete(obj);
            }
        }
        // Add to new cells it wasn't in before
        for (let r = nMinR; r <= nMaxR; r++) {
            for (let c = nMinC; c <= nMaxC; c++) {
                if (r >= oMinR && r <= oMaxR && c >= oMinC && c <= oMaxC) continue;
                const i = r * cols + c;
                (grid[i] || (grid[i] = new Set())).add(obj);
            }
        }
        obj._sgMinCol = nMinC; obj._sgMaxCol = nMaxC; obj._sgMinRow = nMinR; obj._sgMaxRow = nMaxR;
    }

    // Objects in the cells overlapping the square around (x, y), each listed once, in the same order
    // as the old Set-based version. Pass `out` to reuse an array (it is cleared first).
    queryRange(x, y, range, out = null) {
        const results = out || [];
        results.length = 0;
        const stamp = ++SpatialGrid.queryStamp;
        const minX = x - range;
        const minY = y - range;
        const maxX = x + range;
        const maxY = y + range;

        const startCol = Math.max(0, Math.floor(minX / this.cellSize));
        const endCol = Math.min(this.gridCols - 1, Math.floor(maxX / this.cellSize));
        const startRow = Math.max(0, Math.floor(minY / this.cellSize));
        const endRow = Math.min(this.gridRows - 1, Math.floor(maxY / this.cellSize));

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                const cell = this.grid[r * this.gridCols + c];
                if (cell) {
                    for (const obj of cell) {
                        if (obj._sgStamp !== stamp) { obj._sgStamp = stamp; results.push(obj); }
                    }
                }
            }
        }
        return results;
    }

    // Objects in the cells the segment passes through, each listed once. Duplicates (objects
    // spanning several cells) are skipped with a per-query stamp instead of a Set; pass `out` to
    // reuse an array across calls (it is cleared first).
    queryLine(x1, y1, x2, y2, out = null) {
        const results = out || [];
        results.length = 0;
        const stamp = ++SpatialGrid.queryStamp;
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);

        let currentX = Math.floor(x1 / this.cellSize);
        let currentY = Math.floor(y1 / this.cellSize);

        const endX = Math.floor(x2 / this.cellSize);
        const endY = Math.floor(y2 / this.cellSize);

        const stepX = (x1 < x2) ? 1 : -1;
        const stepY = (y1 < y2) ? 1 : -1;

        let tMaxX = (stepX > 0 ? (currentX + 1) * this.cellSize - x1 : x1 - currentX * this.cellSize) / Math.abs(x2 - x1 || 1e-5);
        let tMaxY = (stepY > 0 ? (currentY + 1) * this.cellSize - y1 : y1 - currentY * this.cellSize) / Math.abs(y2 - y1 || 1e-5);

        const tDeltaX = this.cellSize / Math.abs(x2 - x1 || 1e-5);
        const tDeltaY = this.cellSize / Math.abs(y2 - y1 || 1e-5);

        const startCellIndex = this._getCellIndex(x1, y1);
        if (startCellIndex !== -1 && this.grid[startCellIndex]) {
            for (const obj of this.grid[startCellIndex]) {
                if (obj._sgStamp !== stamp) { obj._sgStamp = stamp; results.push(obj); }
            }
        }

        while (currentX !== endX || currentY !== endY) {
            if (tMaxX < tMaxY) {
                tMaxX += tDeltaX;
                currentX += stepX;
            } else {
                tMaxY += tDeltaY;
                currentY += stepY;
            }

            const cellIndex = currentY * this.gridCols + currentX;
            if (cellIndex >= 0 && cellIndex < this.grid.length && this.grid[cellIndex]) {
                for (const obj of this.grid[cellIndex]) {
                    if (obj._sgStamp !== stamp) { obj._sgStamp = stamp; results.push(obj); }
                }
            }

            if (results.length > 1000 || (Math.abs(currentX - endX) > this.gridCols*2) || (Math.abs(currentY - endY) > this.gridRows*2)) {
                 break;
            }
        }
        return results;
    }


    clear() {
        for (let i = 0; i < this.grid.length; i++) {
            const cell = this.grid[i];
            if (cell) {
                for (const obj of cell) if (obj._sgGrid === this) obj._sgGrid = null;
                cell.clear();
            }
        }
    }

    renderDebug(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        for (let r = 0; r < this.gridRows; r++) {
            for (let c = 0; c < this.gridCols; c++) {
                const x = c * this.cellSize;
                const y = r * this.cellSize;
                ctx.strokeRect(x, y, this.cellSize, this.cellSize);
                const cellIndex = r * this.gridCols + c;
                if (this.grid[cellIndex] && this.grid[cellIndex].size > 0) {
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                    ctx.fillRect(x, y, this.cellSize, this.cellSize);
                    ctx.fillStyle = 'white';
                    ctx.font = '8px Arial';
                    ctx.fillText(this.grid[cellIndex].size, x + 2, y + 8);
                }
            }
        }
        ctx.restore();
    }
}

// Shared by every grid (a new one is built per mission while roster units carry over), so an
// object's leftover stamp from an earlier grid can never match a fresh query. Queries never nest,
// so queryRange and queryLine share it (and the per-object _sgStamp).
SpatialGrid.queryStamp = 0;
