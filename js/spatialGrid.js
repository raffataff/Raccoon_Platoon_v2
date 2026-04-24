// js/SpatialGrid.js

class SpatialGrid {
    constructor(worldWidth, worldHeight, cellSize, gameInstance) { // Added gameInstance
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
        this.cellSize = cellSize;
        this.game = gameInstance; // Store the game instance

        this.gridCols = Math.ceil(worldWidth / cellSize);
        this.gridRows = Math.ceil(worldHeight / cellSize);
        this.grid = [];

        for (let i = 0; i < this.gridCols * this.gridRows; i++) {
            this.grid[i] = new Set();
        }

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

    _getCellsForObject(obj) {
        const cells = new Set();
        if (!obj || obj.isMarkedForDeletion) return cells;

        let minX, minY, maxX, maxY;
        if (obj.getCollisionShape && typeof obj.getCollisionShape === 'function') {
            const shape = obj.getCollisionShape();
            if (shape.type === 'circle') {
                minX = shape.x - shape.radius;
                minY = shape.y - shape.radius;
                maxX = shape.x + shape.radius;
                maxY = shape.y + shape.radius;
            } else if (shape.type === 'rectangle') {
                minX = shape.x;
                minY = shape.y;
                maxX = shape.x + shape.width;
                maxY = shape.y + shape.height;
            } else if (shape.type === 'ellipse') {
                minX = shape.x - shape.radiusX;
                minY = shape.y - shape.radiusY;
                maxX = shape.x + shape.radiusX;
                maxY = shape.y + shape.radiusY;
            } else { 
                minX = obj.x - (obj.size || obj.width || 0) / 2;
                minY = obj.y - (obj.size || obj.height || 0) / 2;
                maxX = obj.x + (obj.size || obj.width || 0) / 2;
                maxY = obj.y + (obj.size || obj.height || 0) / 2;
            }
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

        const startCol = Math.max(0, Math.floor(minX / this.cellSize));
        const endCol = Math.min(this.gridCols - 1, Math.floor(maxX / this.cellSize));
        const startRow = Math.max(0, Math.floor(minY / this.cellSize));
        const endRow = Math.min(this.gridRows - 1, Math.floor(maxY / this.cellSize));

        for (let r = startRow; r <= endRow; r++) {
            for (let c = startCol; c <= endCol; c++) {
                cells.add(r * this.gridCols + c);
            }
        }
        return cells;
    }

    addObject(obj) {
        if (!obj || obj.isMarkedForDeletion) return;
        const cells = this._getCellsForObject(obj);
        cells.forEach(cellIndex => {
            if (this.grid[cellIndex]) {
                this.grid[cellIndex].add(obj);
                obj._spatialGridCells = obj._spatialGridCells || new Set();
                obj._spatialGridCells.add(cellIndex);
            }
        });
    }

    removeObject(obj) {
        if (obj && obj._spatialGridCells) {
            obj._spatialGridCells.forEach(cellIndex => {
                if (this.grid[cellIndex]) {
                    this.grid[cellIndex].delete(obj);
                }
            });
            obj._spatialGridCells.clear();
        }
    }

    updateObject(obj) {
        if (!obj || obj.isMarkedForDeletion) return;

        const oldCells = obj._spatialGridCells ? new Set(obj._spatialGridCells) : new Set();
        const newCells = this._getCellsForObject(obj);

        // Remove from cells it's no longer in
        oldCells.forEach(cellIndex => {
            if (!newCells.has(cellIndex) && this.grid[cellIndex]) {
                this.grid[cellIndex].delete(obj);
            }
        });

        // Add to new cells it wasn't in before
        newCells.forEach(cellIndex => {
            if (!oldCells.has(cellIndex) && this.grid[cellIndex]) {
                this.grid[cellIndex].add(obj);
            }
        });

        obj._spatialGridCells = newCells;
    }

    queryRange(x, y, range) {
        const results = new Set();
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
                const cellIndex = r * this.gridCols + c;
                if (this.grid[cellIndex]) {
                    this.grid[cellIndex].forEach(obj => results.add(obj));
                }
            }
        }
        return Array.from(results); 
    }

    queryLine(x1, y1, x2, y2) {
        const results = new Set();
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
            this.grid[startCellIndex].forEach(obj => results.add(obj));
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
                this.grid[cellIndex].forEach(obj => results.add(obj));
            }
            
            if (results.size > 1000 || (Math.abs(currentX - endX) > this.gridCols*2) || (Math.abs(currentY - endY) > this.gridRows*2)) {
                 break;
            }
        }
        return Array.from(results);
    }


    clear() {
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i].clear();
        }
    }

    renderDebug(ctx, cameraX, cameraY) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        for (let r = 0; r < this.gridRows; r++) {
            for (let c = 0; c < this.gridCols; c++) {
                ctx.strokeRect(c * this.cellSize - cameraX, r * this.cellSize - cameraY, this.cellSize, this.cellSize);
                const cellIndex = r * this.gridCols + c;
                if (this.grid[cellIndex] && this.grid[cellIndex].size > 0) {
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
                    ctx.fillRect(c * this.cellSize - cameraX, r * this.cellSize - cameraY, this.cellSize, this.cellSize);
                    ctx.fillStyle = 'white';
                    ctx.font = '8px Arial';
                    ctx.fillText(this.grid[cellIndex].size, c * this.cellSize - cameraX + 2, r * this.cellSize - cameraY + 8);
                }
            }
        }
        ctx.restore();
    }
}