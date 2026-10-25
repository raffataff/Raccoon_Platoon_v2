// js/utils.js
// complete
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// Reused candidate buffer for hasLineOfSight (not re-entrant, which it never needs to be).
const _losCandidates = [];

// The level's obstacles as a Set, for "is this grid entry an obstacle?" checks. During a mission
// obstacles are only ever appended (a new mission gets a new array), so the Set is rebuilt
// whenever the array or its length changes.
function levelObstacleSet(level) {
    const obstacles = level.obstacles;
    if (level._obstacleSetSource !== obstacles || level._obstacleSetSize !== obstacles.length) {
        level._obstacleSet = new Set(obstacles);
        level._obstacleSetSource = obstacles;
        level._obstacleSetSize = obstacles.length;
    }
    return level._obstacleSet;
}

function hasLineOfSight(x1, y1, x2, y2, obstacles /* May become legacy */, gameLevelInstance = null, checkOnlyCover = false) {
    let candidateObstacles = obstacles; // Fallback

    // --- MODIFIED: Use Spatial Grid if available ---
    if (gameLevelInstance && gameLevelInstance.game && gameLevelInstance.game.spatialGrid) {
        const gridCandidates = gameLevelInstance.game.spatialGrid.queryLine(x1, y1, x2, y2, _losCandidates);
        // Keep only actual obstacle objects from the level, as the grid holds units too.
        const levelObstacles = levelObstacleSet(gameLevelInstance);
        let kept = 0;
        for (let i = 0; i < gridCandidates.length; i++) {
            if (levelObstacles.has(gridCandidates[i])) gridCandidates[kept++] = gridCandidates[i];
        }
        gridCandidates.length = kept;
        candidateObstacles = gridCandidates;
    }
    // --- END MODIFIED ---

    if (!candidateObstacles) return true; // If no candidates (or original obstacles array was null/empty)

    for (const obs of candidateObstacles) {
        const relevantObstacleProperty = checkOnlyCover ? obs.providesCover : obs.blocksMovement;

        if (relevantObstacleProperty && !obs.isDestroyed) {
            let collisionDetected = false;
            const obsShapeOrShapes = (gameLevelInstance && typeof gameLevelInstance._getObstacleCollisionShape === 'function')
                           ? gameLevelInstance._getObstacleCollisionShape(obs)
                           : {type:'rectangle', x:obs.x, y:obs.y, width:obs.width, height:obs.height};

            if (!obsShapeOrShapes) continue;

            const shapesArray = Array.isArray(obsShapeOrShapes) ? obsShapeOrShapes : [obsShapeOrShapes];
            for (const obsShape of shapesArray) {
                if (obsShape.type === 'rectangle') {
                    if (lineIntersectsRect(x1, y1, x2, y2, obsShape)) {
                        collisionDetected = true; break;
                    }
                } else if (obsShape.type === 'circle') {
                    if (lineIntersectsCircle(x1, y1, x2, y2, obsShape)) {
                        collisionDetected = true; break;
                    }
                } else if (obsShape.type === 'ellipse') {
                    if (lineIntersectsEllipse(x1, y1, x2, y2, obsShape)) {
                        collisionDetected = true; break;
                    }
                }
            }
            if (collisionDetected) return false;
        }
    }
    return true;
}

function lineIntersectsCircle(p1x, p1y, p2x, p2y, circle) {
    /* ... (Unchanged from previous complete version) ... */
    const cx = circle.x;
    const cy = circle.y;
    const r = circle.radius;
    const dxLine = p2x - p1x;
    const dyLine = p2y - p1y;
    const lenSq = dxLine * dxLine + dyLine * dyLine;
    let t;
    if (lenSq === 0) { // Start and end points are the same
        t = -1; // Effectively, check if the single point is inside the circle
        return distance(p1x, p1y, cx, cy) <= r;
    } else {
        t = ((cx - p1x) * dxLine + (cy - p1y) * dyLine) / lenSq;
    }
    let closestX, closestY;
    if (t < 0) {
        closestX = p1x;
        closestY = p1y;
    } else if (t > 1) {
        closestX = p2x;
        closestY = p2y;
    } else {
        closestX = p1x + t * dxLine;
        closestY = p1y + t * dyLine;
    }
    const distToClosestSq = (cx - closestX) ** 2 + (cy - closestY) ** 2;
    return distToClosestSq <= r * r;
}
function lineIntersectsRect(p1x, p1y, p2x, p2y, rect) {
    /* ... (Unchanged from previous complete version) ... */
    const { x, y, width, height } = rect;
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y, x + width, y)) return true; // Top
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y + height, x + width, y + height)) return true; // Bottom
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y, x, y + height)) return true; // Left
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x + width, y, x + width, y + height)) return true; // Right
    return false;
}
function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    /* ... (Unchanged from previous complete version) ... */
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return false; // Lines are parallel or coincident
    const tNum = (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4);
    const uNum = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3));
    const t = tNum / den;
    const u = uNum / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
function rectOverlap(rect1, rect2) {
    /* ... (Unchanged from previous complete version) ... */
    if (rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x) { return false; }
    if (rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y) { return false; }
    return true;
}
function circleOverlap(circle1, circle2) {
    /* ... (Unchanged from previous complete version) ... */
    const distSq = (circle1.x - circle2.x) ** 2 + (circle1.y - circle2.y) ** 2;
    const radiiSumSq = (circle1.radius + circle2.radius) ** 2;
    return distSq <= radiiSumSq;
}
function rectCircleOverlap(rect, circle) {
    let closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    let closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
    const distX = circle.x - closestX;
    const distY = circle.y - closestY;
    const distSq = distX * distX + distY * distY;
    return distSq <= circle.radius * circle.radius;
}
function pointInRectangle(px, py, rect) {
    /* ... (Unchanged from previous complete version) ... */
    return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
}
function pointInCircle(px, py, circle) {
    /* ... (Unchanged from previous complete version) ... */
    const distSq = (px - circle.x) ** 2 + (py - circle.y) ** 2;
    return distSq <= circle.radius * circle.radius;
}

function pointInEllipse(px, py, ellipse) {
    /* ... (Unchanged from previous complete version) ... */
    const termX = (px - ellipse.x) / (ellipse.radiusX || 1e-6); // Avoid division by zero if radiusX is 0
    const termY = (py - ellipse.y) / (ellipse.radiusY || 1e-6); // Avoid division by zero if radiusY is 0
    return (termX * termX) + (termY * termY) <= 1;
}

function lineIntersectsEllipse(p1x, p1y, p2x, p2y, ellipse) {
    /* ... (Unchanged from previous complete version) ... */
    // For axis-aligned ellipses.
    // Translate problem so ellipse is centered at origin
    const cx = ellipse.x;
    const cy = ellipse.y;
    const a = ellipse.radiusX;
    const b = ellipse.radiusY;

    if (a <= 0 || b <= 0) return false; // Invalid ellipse

    const x1 = p1x - cx;
    const y1 = p1y - cy;
    const x2 = p2x - cx;
    const y2 = p2y - cy;

    // Equation of line: P(t) = (x1, y1) + t * (x2-x1, y2-y1)
    // Equation of ellipse: (x/a)^2 + (y/b)^2 = 1
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Coefficients of the quadratic equation At^2 + Bt + C = 0
    const A = (dx * dx) / (a * a) + (dy * dy) / (b * b);
    const B = (2 * x1 * dx) / (a * a) + (2 * y1 * dy) / (b * b);
    const C = (x1 * x1) / (a * a) + (y1 * y1) / (b * b) - 1;

    const discriminant = B * B - 4 * A * C;

    if (discriminant < 0) {
        return false; // No real solutions, no intersection
    } else {
        // Check if any part of the line segment (0 <= t <= 1) intersects
        const t1 = (-B - Math.sqrt(discriminant)) / (2 * A);
        const t2 = (-B + Math.sqrt(discriminant)) / (2 * A);

        if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) {
            return true;
        }
        
        const p1Inside = pointInEllipse(p1x, p1y, ellipse);
        const p2Inside = pointInEllipse(p2x, p2y, ellipse);
        if (p1Inside && p2Inside) return true; 
        if ((p1Inside && !p2Inside) || (!p1Inside && p2Inside)) { 
             if ((t1 > 0 && t1 < 1) || (t2 > 0 && t2 < 1)) return true; 
             if (t1 === 0 || t1 === 1 || t2 === 0 || t2 === 1) return true; 
        }
        if (pointInEllipse(p1x, p1y, ellipse) || pointInEllipse(p2x, p2y, ellipse)) return true;

        return false;
    }
}


function rectEllipseOverlap(rect, ellipse) {
    /* ... (Unchanged from previous complete version) ... */
    // Find the closest point on the rectangle to the ellipse's center
    const closestX = Math.max(rect.x, Math.min(ellipse.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(ellipse.y, rect.y + rect.height));

    // Check if this closest point is inside the ellipse
    return pointInEllipse(closestX, closestY, ellipse);
}

function circleEllipseOverlap(circle, ellipse) {
    /* ... (Unchanged from previous complete version) ... */
    // Scale the space so the ellipse becomes a unit circle at the origin.
    // Ellipse: ((x-cx)/a)^2 + ((y-cy)/b)^2 = 1
    // Transformed circle center:
    const transformedCircleX = (circle.x - ellipse.x) / (ellipse.radiusX || 1e-6);
    const transformedCircleY = (circle.y - ellipse.y) / (ellipse.radiusY || 1e-6);

    if (pointInEllipse(circle.x, circle.y, ellipse)) return true;
    if (pointInCircle(ellipse.x, ellipse.y, circle)) return true;

    let dx = circle.x - ellipse.x;
    let dy = circle.y - ellipse.y;

    let angle = Math.atan2(dy / (ellipse.radiusY || 1e-6) , dx / (ellipse.radiusX || 1e-6)); 
    let closestEllipseX = ellipse.x + ellipse.radiusX * Math.cos(angle);
    let closestEllipseY = ellipse.y + ellipse.radiusY * Math.sin(angle);

    if (pointInCircle(closestEllipseX, closestEllipseY, circle)) {
        return true;
    }
    for (let i = 0; i < 8; i++) {
        const testAngle = i * (Math.PI / 4);
        const pointOnCircleX = circle.x + circle.radius * Math.cos(testAngle);
        const pointOnCircleY = circle.y + circle.radius * Math.sin(testAngle);
        if (pointInEllipse(pointOnCircleX, pointOnCircleY, ellipse)) {
            return true;
        }
    }
    return false;
}

function getOBBCorners(obb) {
    const cx = obb.x + obb.width / 2;
    const cy = obb.y + obb.height / 2;
    const hw = obb.width / 2;
    const hh = obb.height / 2;
    const cos = Math.cos(obb.rotation || 0);
    const sin = Math.sin(obb.rotation || 0);
    return [
        { x: cx + cos * -hw - sin * -hh, y: cy + sin * -hw + cos * -hh },
        { x: cx + cos * hw - sin * -hh, y: cy + sin * hw + cos * -hh },
        { x: cx + cos * hw - sin * hh, y: cy + sin * hw + cos * hh },
        { x: cx + cos * -hw - sin * hh, y: cy + sin * -hw + cos * hh }
    ];
}

function projectOntoAxis(corners, axis) {
    let min = Infinity, max = -Infinity;
    for (const corner of corners) {
        const proj = corner.x * axis.x + corner.y * axis.y;
        if (proj < min) min = proj;
        if (proj > max) max = proj;
    }
    return { min, max };
}

function obbOverlap(obb1, obb2) {
    const r1 = obb1.rotation || 0;
    const r2 = obb2.rotation || 0;
    if (r1 === 0 && r2 === 0) {
        return !(obb1.x >= obb2.x + obb2.width || obb1.x + obb1.width <= obb2.x ||
                 obb1.y >= obb2.y + obb2.height || obb1.y + obb1.height <= obb2.y);
    }
    const corners1 = getOBBCorners(obb1);
    const corners2 = getOBBCorners(obb2);
    const axes = [
        { x: Math.cos(r1), y: Math.sin(r1) },
        { x: -Math.sin(r1), y: Math.cos(r1) },
        { x: Math.cos(r2), y: Math.sin(r2) },
        { x: -Math.sin(r2), y: Math.cos(r2) }
    ];
    for (const axis of axes) {
        const proj1 = projectOntoAxis(corners1, axis);
        const proj2 = projectOntoAxis(corners2, axis);
        if (proj1.max < proj2.min || proj2.max < proj1.min) {
            return false;
        }
    }
    return true;
}

function obbCircleOverlap(obb, circle) {
    const r = obb.rotation || 0;
    if (r === 0) {
        return rectCircleOverlap({ x: obb.x, y: obb.y, width: obb.width, height: obb.height }, circle);
    }
    const cx = obb.x + obb.width / 2;
    const cy = obb.y + obb.height / 2;
    const cos = Math.cos(-r);
    const sin = Math.sin(-r);
    const relX = circle.x - cx;
    const relY = circle.y - cy;
    const localCircleX = cos * relX - sin * relY;
    const localCircleY = sin * relX + cos * relY;
    const hw = obb.width / 2;
    const hh = obb.height / 2;
    const closestX = Math.max(-hw, Math.min(localCircleX, hw));
    const closestY = Math.max(-hh, Math.min(localCircleY, hh));
    const distX = localCircleX - closestX;
    const distY = localCircleY - closestY;
    const distSq = distX * distX + distY * distY;
    return distSq <= circle.radius * circle.radius;
}

function obbEllipseOverlap(obb, ellipse) {
    const r = obb.rotation || 0;
    if (r === 0) {
        return rectEllipseOverlap({ x: obb.x, y: obb.y, width: obb.width, height: obb.height }, ellipse);
    }
    const cx = obb.x + obb.width / 2;
    const cy = obb.y + obb.height / 2;
    const cos = Math.cos(-r);
    const sin = Math.sin(-r);
    const relX = ellipse.x - cx;
    const relY = ellipse.y - cy;
    const localEllipseX = cos * relX - sin * relY;
    const localEllipseY = sin * relX + cos * relY;
    const localEllipse = { x: localEllipseX, y: localEllipseY, radiusX: ellipse.radiusX, radiusY: ellipse.radiusY };
    const hw = obb.width / 2;
    const hh = obb.height / 2;
    const closestX = Math.max(-hw, Math.min(localEllipseX, hw));
    const closestY = Math.max(-hh, Math.min(localEllipseY, hh));
    const termX = (closestX - localEllipseX) / (ellipse.radiusX || 1e-6);
    const termY = (closestY - localEllipseY) / (ellipse.radiusY || 1e-6);
    return (termX * termX + termY * termY) <= 1;
}


// Scratch state shared by every A* and border search, grown to the largest nav grid seen.
// Instead of allocating and clearing whole-grid arrays per search (which made even a one-cell
// path cost ~0.15 ms on late-phase maps), each search takes a new searchId: a cell's g-cost and
// parent count only while gStamp[idx] === searchId, and it is closed while
// closedStamp[idx] === searchId. A search then only pays for the cells it touches.
const _pathScratch = {
    capacity: 0,
    searchId: 0,
    gCost: null,
    parent: null,
    gStamp: null,
    closedStamp: null,
    heap: null,
    bfsQueue: new Int32Array(4096)
};

// Neighbour order matches the old directions table (cardinals first, then diagonals), so
// searches expand cells in the same order as before.
const _PATH_DIR_X = [0, 0, -1, 1, -1, 1, -1, 1];
const _PATH_DIR_Y = [-1, 1, 0, 0, -1, -1, 1, 1];
const _PATH_DIR_COST = [1, 1, 1, 1, Math.SQRT2, Math.SQRT2, Math.SQRT2, Math.SQRT2];

function _beginPathSearch(gridLen) {
    const s = _pathScratch;
    if (s.capacity < gridLen) {
        s.capacity = gridLen;
        s.gCost = new Float64Array(gridLen);
        s.parent = new Int32Array(gridLen);
        s.gStamp = new Uint32Array(gridLen);
        s.closedStamp = new Uint32Array(gridLen);
    }
    if (s.searchId >= 0xFFFFFFFE) {
        // Stamps are about to wrap around: forget every old stamp and start counting again.
        s.gStamp.fill(0);
        s.closedStamp.fill(0);
        s.searchId = 0;
    }
    return ++s.searchId;
}

// Walks the parent links of the current search back from `idx` to the start cell.
function _buildGridPath(idx, gridW) {
    const parent = _pathScratch.parent;
    const path = [];
    while (idx !== -1) {
        const x = idx % gridW;
        path.push({ x: x, y: (idx - x) / gridW });
        idx = parent[idx];
    }
    return path.reverse();
}

function heuristic(ax, ay, bx, by) {
    const dX = Math.abs(ax - bx);
    const dY = Math.abs(ay - by);
    const D = 1;
    const D2 = Math.SQRT2;
    return D * (dX + dY) + (D2 - 2 * D) * Math.min(dX, dY);
}

function findPath(startPos, endPos, grid, isUnitPhasing = false) {
    if (grid[startPos.y] === undefined || grid[startPos.y][startPos.x] === undefined) {
        return null;
    }
    if (grid[endPos.y] === undefined || grid[endPos.y][endPos.x] === undefined) {
        return null;
    }
    if (grid[startPos.y][startPos.x] === 1 && !isUnitPhasing) {
        return null;
    }
    if (grid[endPos.y][endPos.x] === 1 && !isUnitPhasing) {
        return null;
    }

    if (startPos.x === endPos.x && startPos.y === endPos.y) {
        return [{ x: startPos.x, y: startPos.y }];
    }

    const gridW = grid[0].length;
    const gridH = grid.length;

    const direct = _astar(startPos, endPos, grid, gridW, gridH, isUnitPhasing, CONFIG.PATHFINDING.PATHFINDING_MAX_EXPANSIONS);
    if (direct && direct.length > 0) {
        const last = direct[direct.length - 1];
        if (last.x === endPos.x && last.y === endPos.y) {
            return direct;
        }
    }

    const borderWaypoints = _findBorderWaypoints(startPos, endPos, grid, gridW, gridH, isUnitPhasing);
    if (borderWaypoints.length > 0) {
        const perLeg = Math.floor(CONFIG.PATHFINDING.PATHFINDING_MAX_EXPANSIONS * CONFIG.PATHFINDING.BORDER_LEG_EXPANSION_FRACTION);
        for (const wp of borderWaypoints) {
            const first = _astar(startPos, wp, grid, gridW, gridH, isUnitPhasing, perLeg);
            if (!first || first.length === 0) continue;
            const second = _astar(wp, endPos, grid, gridW, gridH, isUnitPhasing, perLeg);
            if (!second || second.length === 0) continue;
            first.pop();
            return first.concat(second);
        }
        for (const wp of borderWaypoints) {
            const first = _astar(startPos, wp, grid, gridW, gridH, isUnitPhasing, perLeg);
            if (!first || first.length === 0) continue;
            const second = _astar(wp, endPos, grid, gridW, gridH, isUnitPhasing, perLeg * 2);
            if (!second || second.length === 0) {
                if (first.length > 1) return first;
                continue;
            }
            first.pop();
            return first.concat(second);
        }
    }

    if (direct && direct.length > 1) {
        return direct;
    }

    return null;
}

function _findBorderWaypoints(startPos, endPos, grid, gridW, gridH, isUnitPhasing) {
    // Visited = closedStamp of a search of its own; the queue is a reused, growable buffer.
    const searchId = _beginPathSearch(gridW * gridH);
    const visited = _pathScratch.closedStamp;
    let queue = _pathScratch.bfsQueue;
    let head = 0, tail = 0;

    queue[tail++] = startPos.x;
    queue[tail++] = startPos.y;
    visited[startPos.y * gridW + startPos.x] = searchId;

    const borderCells = [];
    const maxSearch = CONFIG.PATHFINDING.BORDER_BFS_MAX_CELLS;
    let searched = 0;

    while (head < tail && searched < maxSearch && borderCells.length < CONFIG.PATHFINDING.BORDER_MAX_CELLS_COLLECT) {
        const cx = queue[head++];
        const cy = queue[head++];
        searched++;

        let isBorder = false;
        for (let d = 0; d < 4; d++) {
            const nnx = cx + _PATH_DIR_X[d];
            const nny = cy + _PATH_DIR_Y[d];
            if (nnx < 0 || nnx >= gridW || nny < 0 || nny >= gridH) continue;
            if (grid[nny][nnx] === 1) {
                isBorder = true;
                break;
            }
        }

        if (isBorder && (cx !== startPos.x || cy !== startPos.y)) {
            const dx = cx - endPos.x;
            const dy = cy - endPos.y;
            const distToGoal = Math.sqrt(dx * dx + dy * dy);
            const sdx = cx - startPos.x;
            const sdy = cy - startPos.y;
            const distFromStart = Math.sqrt(sdx * sdx + sdy * sdy);
            if (distFromStart > CONFIG.PATHFINDING.BORDER_MIN_DISTANCE) {
                borderCells.push({ x: cx, y: cy, score: distToGoal + distFromStart * 0.3 });
            }
        }

        for (let d = 0; d < 4; d++) {
            const nx = cx + _PATH_DIR_X[d];
            const ny = cy + _PATH_DIR_Y[d];
            if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
            const idx = ny * gridW + nx;
            if (visited[idx] === searchId) continue;
            visited[idx] = searchId;
            if (grid[ny][nx] === 1) continue;
            if (tail + 2 > queue.length) {
                const grown = new Int32Array(queue.length * 2);
                grown.set(queue);
                queue = _pathScratch.bfsQueue = grown;
            }
            queue[tail++] = nx;
            queue[tail++] = ny;
        }
    }

    borderCells.sort((a, b) => a.score - b.score);
    return borderCells.slice(0, CONFIG.PATHFINDING.BORDER_WAYPOINTS_MAX_TRY);
}

function _astar(startPos, endPos, grid, gridW, gridH, isUnitPhasing, maxExpansions) {
    const searchId = _beginPathSearch(gridW * gridH);
    const s = _pathScratch;
    const gCost = s.gCost, parent = s.parent, gStamp = s.gStamp, closed = s.closedStamp;
    const openList = s.heap || (s.heap = new MinHeap());
    openList.clear();

    const endX = endPos.x, endY = endPos.y;
    const startIdx = startPos.y * gridW + startPos.x;
    const endH = heuristic(startPos.x, startPos.y, endX, endY);
    gCost[startIdx] = 0;
    gStamp[startIdx] = searchId;
    parent[startIdx] = -1;
    openList.push(endH, 0, startIdx);

    let expansions = 0;
    // Closest cell to the goal popped so far (by heuristic): the fallback when the goal is out of reach.
    let bestIdx = startIdx, bestH = endH;

    while (!openList.isEmpty()) {
        const curIdx = openList.pop();
        const curG = openList.poppedG;
        const curX = curIdx % gridW;
        const curY = (curIdx - curX) / gridW;

        const curH = heuristic(curX, curY, endX, endY);
        if (curH < bestH) {
            bestIdx = curIdx;
            bestH = curH;
        }

        if (curX === endX && curY === endY) {
            return _buildGridPath(curIdx, gridW);
        }

        // Cells can be queued more than once (no decrease-key); later copies are stale.
        if (closed[curIdx] === searchId) continue;
        closed[curIdx] = searchId;

        expansions++;
        if (expansions > maxExpansions) {
            return _buildGridPath(bestIdx, gridW);
        }

        const curRow = grid[curY];
        for (let d = 0; d < 8; d++) {
            const nx = curX + _PATH_DIR_X[d];
            const ny = curY + _PATH_DIR_Y[d];

            if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
            if (grid[ny][nx] === 1 && !isUnitPhasing) continue;

            const nIdx = ny * gridW + nx;
            if (closed[nIdx] === searchId) continue;

            // Diagonal: don't squeeze between two blocked corners.
            if (d >= 4 && !isUnitPhasing && curRow[nx] === 1 && grid[ny][curX] === 1) continue;

            const newG = curG + _PATH_DIR_COST[d];
            if (gStamp[nIdx] !== searchId || newG < gCost[nIdx]) {
                gCost[nIdx] = newG;
                gStamp[nIdx] = searchId;
                parent[nIdx] = curIdx;
                openList.push(newG + heuristic(nx, ny, endX, endY), newG, nIdx);
            }
        }
    }

    if (bestIdx !== startIdx) {
        return _buildGridPath(bestIdx, gridW);
    }
    return null;
}

function _smoothPathCheckLOS(anchorWorld, candidateGrid, pathingRadius, levelInstance, obstaclesForLOS, nearbyUnits) {
    const candidateWorld = levelInstance.gridToWorldCoords(candidateGrid.x, candidateGrid.y);
    const dx = candidateWorld.x - anchorWorld.x;
    const dy = candidateWorld.y - anchorWorld.y;
    const len = Math.hypot(dx, dy);

    if (len < 1e-6) return true;

    const p_dx = -dy / len;
    const p_dy = dx / len;

    const centerLOS = hasLineOfSight(anchorWorld.x, anchorWorld.y, candidateWorld.x, candidateWorld.y, obstaclesForLOS, levelInstance);
    if (!centerLOS) return false;

    const leftShoulderLOS = hasLineOfSight(
        anchorWorld.x + p_dx * pathingRadius,
        anchorWorld.y + p_dy * pathingRadius,
        candidateWorld.x + p_dx * pathingRadius,
        candidateWorld.y + p_dy * pathingRadius,
        obstaclesForLOS,
        levelInstance
    );
    if (!leftShoulderLOS) return false;

    const rightShoulderLOS = hasLineOfSight(
        anchorWorld.x - p_dx * pathingRadius,
        anchorWorld.y - p_dy * pathingRadius,
        candidateWorld.x - p_dx * pathingRadius,
        candidateWorld.y - p_dy * pathingRadius,
        obstaclesForLOS,
        levelInstance
    );
    if (!rightShoulderLOS) return false;

    if (nearbyUnits && nearbyUnits.length > 0) {
        const checkPoints = [
            { x: anchorWorld.x, y: anchorWorld.y },
            { x: candidateWorld.x, y: candidateWorld.y },
            { x: anchorWorld.x + p_dx * pathingRadius, y: anchorWorld.y + p_dy * pathingRadius },
            { x: anchorWorld.x - p_dx * pathingRadius, y: anchorWorld.y - p_dy * pathingRadius },
            { x: candidateWorld.x + p_dx * pathingRadius, y: candidateWorld.y + p_dy * pathingRadius },
            { x: candidateWorld.x - p_dx * pathingRadius, y: candidateWorld.y - p_dy * pathingRadius }
        ];
        for (const unit of nearbyUnits) {
            const combinedR = unit.size * 0.5 + pathingRadius;
            const ux = unit.x;
            const uy = unit.y;
            for (const pt of checkPoints) {
                const ddx = pt.x - ux;
                const ddy = pt.y - uy;
                if (ddx * ddx + ddy * ddy < combinedR * combinedR) return false;
            }
            const edgeDist = pointToSegmentDist(ux, uy, anchorWorld.x, anchorWorld.y, candidateWorld.x, candidateWorld.y);
            if (edgeDist < combinedR) return false;
        }
    }

    return true;
}

function smoothPath(rawPathGridCoords, unitSize, levelInstance, startWorldPos = null) {
    if (!rawPathGridCoords || rawPathGridCoords.length < 2 || !levelInstance) {
        return rawPathGridCoords ? rawPathGridCoords.map(p => levelInstance.gridToWorldCoords(p.x, p.y)) : [];
    }

    if (rawPathGridCoords.length <= 3) {
        return rawPathGridCoords.map(p => levelInstance.gridToWorldCoords(p.x, p.y));
    }

    const pathingRadius = (unitSize / 2) + (CONFIG.PATHFINDING.UNIT_PATHING_RADIUS_BUFFER || 0);
    const obstaclesForLOS = levelInstance.activeObstacles || [];
    const allUnits = [];
    if (levelInstance.game && levelInstance.game.selectedUnits) {
        for (const su of levelInstance.game.selectedUnits) {
            if (su.id === CONFIG.DEBUG_PATHING_UNIT_ID) {
                console.log(`[${su.id} smoothPath] rawPath: ${rawPathGridCoords.length} nodes, units: ${allUnits.length}, obstacles: ${obstaclesForLOS.length}`);
                for (let pi = 0; pi < rawPathGridCoords.length; pi++) {
                    const pt = rawPathGridCoords[pi];
                    const wx = pt.x * levelInstance.gridCellSize + levelInstance.gridCellSize / 2;
                    const wy = pt.y * levelInstance.gridCellSize + levelInstance.gridCellSize / 2;
                    for (const unit of allUnits) {
                        const dx = wx - unit.x;
                        const dy = wy - unit.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < unit.size * 0.5 + 10) {
                            console.log(`  rawPath node ${pi} (${wx.toFixed(0)},${wy.toFixed(0)}) is inside unit ${unit.id} at (${unit.x.toFixed(0)},${unit.y.toFixed(0)}) dist=${dist.toFixed(1)} unitRadius=${(unit.size * 0.5).toFixed(0)}`);
                        }
                    }
                }
                break;
            }
        }
    }
    const smoothedPathWorldCoords = [];
    let currentAnchorWorld, startIndex;
    if (startWorldPos) {
        currentAnchorWorld = { x: startWorldPos.x, y: startWorldPos.y };
        startIndex = 0;
        while (startIndex < rawPathGridCoords.length - 1) {
            const wp = levelInstance.gridToWorldCoords(rawPathGridCoords[startIndex].x, rawPathGridCoords[startIndex].y);
            const dx = wp.x - startWorldPos.x;
            const dy = wp.y - startWorldPos.y;
            if (dx * dx + dy * dy > pathingRadius * pathingRadius) break;
            startIndex++;
        }
    } else {
        currentAnchorWorld = levelInstance.gridToWorldCoords(rawPathGridCoords[0].x, rawPathGridCoords[0].y);
        startIndex = 0;
    }
    smoothedPathWorldCoords.push(currentAnchorWorld);
    // Every node but the last is within the unit's radius of where it stands: the loop below
    // wouldn't run and the path would end where it starts (the unit then "arrives" at once and
    // asks for the same path again every frame).
    if (startIndex >= rawPathGridCoords.length - 1) {
        const last = rawPathGridCoords[rawPathGridCoords.length - 1];
        smoothedPathWorldCoords.push(levelInstance.gridToWorldCoords(last.x, last.y));
        return smoothedPathWorldCoords;
    }

    let i = startIndex;
    const maxIterations = Math.max(rawPathGridCoords.length * CONFIG.PATHFINDING.SMOOTHING_MAX_ITER_FACTOR, 100);
    let iterations = 0;

    while (i < rawPathGridCoords.length - 1) {
        iterations++;
        if (iterations > maxIterations) {
            for (let k = i + 1; k < rawPathGridCoords.length; k++) {
                smoothedPathWorldCoords.push(levelInstance.gridToWorldCoords(rawPathGridCoords[k].x, rawPathGridCoords[k].y));
            }
            return smoothedPathWorldCoords;
        }

        let furthestVisibleIndex = -1;
        const remainingNodes = rawPathGridCoords.length - 1 - i;

        let coarseStep = 1;
        if (remainingNodes > CONFIG.PATHFINDING.SMOOTHING_COARSE_THRESHOLD_HIGH) coarseStep = Math.max(1, Math.floor(remainingNodes / 10));
        else if (remainingNodes > CONFIG.PATHFINDING.SMOOTHING_COARSE_THRESHOLD_LOW) coarseStep = Math.max(1, Math.floor(remainingNodes / 5));

        let coarseFoundIndex = -1;
        for (let j = rawPathGridCoords.length - 1; j > i; j -= coarseStep) {
            iterations++;
            if (iterations > maxIterations) break;
            if (_smoothPathCheckLOS(currentAnchorWorld, rawPathGridCoords[j], pathingRadius, levelInstance, obstaclesForLOS, allUnits)) {
                coarseFoundIndex = j;
                break;
            }
        }

        if (coarseFoundIndex !== -1) {
            const fineSearchEnd = Math.min(rawPathGridCoords.length - 1, coarseFoundIndex + coarseStep - 1);
            for (let j = fineSearchEnd; j > i; j--) {
                iterations++;
                if (iterations > maxIterations) break;
                if (_smoothPathCheckLOS(currentAnchorWorld, rawPathGridCoords[j], pathingRadius, levelInstance, obstaclesForLOS, allUnits)) {
                    furthestVisibleIndex = j;
                    break;
                }
            }
        }

        if (furthestVisibleIndex !== -1) {
            currentAnchorWorld = levelInstance.gridToWorldCoords(rawPathGridCoords[furthestVisibleIndex].x, rawPathGridCoords[furthestVisibleIndex].y);
            smoothedPathWorldCoords.push(currentAnchorWorld);
            i = furthestVisibleIndex;
        } else {
            i++;
            currentAnchorWorld = levelInstance.gridToWorldCoords(rawPathGridCoords[i].x, rawPathGridCoords[i].y);
            smoothedPathWorldCoords.push(currentAnchorWorld);
        }
    }
    return smoothedPathWorldCoords;
}

function pointToSegmentDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy;
    if (lenSq < 1e-12) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
}

function lerpAngle(a, b, t) {
    let diff = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    return a + diff * t;
}

function closestPointOnCollisionShape(px, py, shape) {
    if (shape.type === 'rectangle') {
        const cx = Math.max(shape.x, Math.min(px, shape.x + shape.width));
        const cy = Math.max(shape.y, Math.min(py, shape.y + shape.height));
        return { x: cx, y: cy };
    } else if (shape.type === 'circle') {
        const dx = px - shape.x;
        const dy = py - shape.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 1e-6) return { x: shape.x + shape.radius, y: shape.y };
        const scale = shape.radius / dist;
        return { x: shape.x + dx * scale, y: shape.y + dy * scale };
    } else if (shape.type === 'ellipse') {
        const dx = px - shape.x;
        const dy = py - shape.y;
        const rx = shape.radiusX || 1e-6;
        const ry = shape.radiusY || 1e-6;
        const angle = Math.atan2(dy / ry, dx / rx);
        return { x: shape.x + rx * Math.cos(angle), y: shape.y + ry * Math.sin(angle) };
    }
    return { x: px, y: py };
}

function deflatePath(pathNodes, unitRadius, levelInstance) {
    if (!pathNodes || pathNodes.length < 2 || !levelInstance) return pathNodes;

    const pathingRadius = unitRadius + (CONFIG.PATHFINDING.UNIT_PATHING_RADIUS_BUFFER || 8);
    const obstacles = (levelInstance.activeObstacles || []).filter(o => o.blocksMovement && !o.isDestroyed);
    const useSpatialGrid = levelInstance.game && levelInstance.game.spatialGrid;
    const allUnits = [];

    const OFFSET_QUERY_MARGIN = CONFIG.PATHFINDING.DEFLATION_OFFSET_MARGIN;
    const queryRadius = pathingRadius + OFFSET_QUERY_MARGIN;

    for (let iteration = 0; iteration < CONFIG.PATHFINDING.DEFLATION_ITERATIONS; iteration++) {
        let anyMoved = false;

        for (let i = 1; i < pathNodes.length - 1; i++) {
            const node = pathNodes[i];
            const prev = pathNodes[i - 1];
            const next = pathNodes[i + 1];

            // Gather nearby obstacles via spatial grid or full list
            let nearbyObstacles;
            if (useSpatialGrid) {
                const nearbyObjects = useSpatialGrid.queryRange(node.x, node.y, queryRadius);
                nearbyObstacles = nearbyObjects.filter(o => obstacles.indexOf(o) !== -1);
            } else {
                nearbyObstacles = obstacles;
            }

            let totalOffsetX = 0;
            let totalOffsetY = 0;
            let pushed = false;

            for (const obs of nearbyObstacles) {
                const obsShapes = levelInstance._getObstacleCollisionShape(obs);
                const shapesArray = Array.isArray(obsShapes) ? obsShapes : [obsShapes];

                for (const shape of shapesArray) {
                    const dist = pointToCollisionShapeDist(node.x, node.y, shape);
                    if (dist < pathingRadius) {
                        const closest = closestPointOnCollisionShape(node.x, node.y, shape);
                        const awayX = node.x - closest.x;
                        const awayY = node.y - closest.y;
                        const awayDist = Math.hypot(awayX, awayY);
                        if (awayDist < 1e-6) {
                            if (dist < 0) {
                                // Inside geometry: find nearest edge midpoint
                                if (shape.type === 'rectangle') {
                                    const cx = shape.x + shape.width / 2;
                                    const cy = shape.y + shape.height / 2;
                                    const hw = shape.width / 2;
                                    const hh = shape.height / 2;
                                    // Pick the nearest edge to exit through
                                    const candidates = [
                                        { x: shape.x, y: cy }, { x: shape.x + shape.width, y: cy },
                                        { x: cx, y: shape.y }, { x: cx, y: shape.y + shape.height }
                                    ];
                                    let best = candidates[0];
                                    let bestDist = Infinity;
                                    for (const c of candidates) {
                                        const d = Math.hypot(node.x - c.x, node.y - c.y);
                                        if (d < bestDist) { bestDist = d; best = c; }
                                    }
                                    const edx = node.x - best.x;
                                    const edy = node.y - best.y;
                                    const ed = Math.hypot(edx, edy);
                                    if (ed > 1e-6) {
                                        totalOffsetX += (edx / ed) * (pathingRadius - dist);
                                        totalOffsetY += (edy / ed) * (pathingRadius - dist);
                                        pushed = true;
                                    }
                                } else if (shape.type === 'circle') {
                                    const angle = Math.atan2(node.y - shape.y, node.x - shape.x);
                                    totalOffsetX += Math.cos(angle) * (pathingRadius - dist);
                                    totalOffsetY += Math.sin(angle) * (pathingRadius - dist);
                                    pushed = true;
                                } else {
                                    const pathTangentX = next.x - prev.x;
                                    const pathTangentY = next.y - prev.y;
                                    const perpX = -pathTangentY;
                                    const perpY = pathTangentX;
                                    const perpLen = Math.hypot(perpX, perpY);
                                    if (perpLen > 1e-6) {
                                        totalOffsetX += (perpX / perpLen) * (pathingRadius - dist);
                                        totalOffsetY += (perpY / perpLen) * (pathingRadius - dist);
                                        pushed = true;
                                    }
                                }
                            } else {
                                // On the edge; push along path perpendicular
                                const pathTangentX = next.x - prev.x;
                                const pathTangentY = next.y - prev.y;
                                const perpX = -pathTangentY;
                                const perpY = pathTangentX;
                                const perpLen = Math.hypot(perpX, perpY);
                                if (perpLen > 1e-6) {
                                    totalOffsetX += (perpX / perpLen) * (pathingRadius);
                                    totalOffsetY += (perpY / perpLen) * (pathingRadius);
                                    pushed = true;
                                }
                            }
                        } else {
                            const penetration = pathingRadius - dist;
                            totalOffsetX += (awayX / awayDist) * penetration * CONFIG.PATHFINDING.DEFLATION_NODE_PUSH_FACTOR;
                            totalOffsetY += (awayY / awayDist) * penetration * CONFIG.PATHFINDING.DEFLATION_NODE_PUSH_FACTOR;
                            pushed = true;
                        }
                    }
                }
            }

            if (pushed) {
                node.x += totalOffsetX;
                node.y += totalOffsetY;
                anyMoved = true;
            }

            let nearbyUnits = [];
            if (useSpatialGrid) {
                const nearbyObjects = useSpatialGrid.queryRange(node.x, node.y, queryRadius);
                nearbyUnits = nearbyObjects.filter(o => allUnits.indexOf(o) !== -1);
            } else {
                nearbyUnits = allUnits;
            }
            for (const unit of nearbyUnits) {
                const dx = node.x - unit.x;
                const dy = node.y - unit.y;
                const combinedR = pathingRadius + unit.size * 0.5;
                const distSq = dx * dx + dy * dy;
                if (distSq < combinedR * combinedR && distSq > 1e-12) {
                    const dist = Math.sqrt(distSq);
                    const penetration = combinedR - dist;
                    node.x += (dx / dist) * penetration * CONFIG.PATHFINDING.DEFLATION_UNIT_PUSH_FACTOR;
                    node.y += (dy / dist) * penetration * CONFIG.PATHFINDING.DEFLATION_UNIT_PUSH_FACTOR;
                    anyMoved = true;
                } else if (distSq < 1e-12) {
                    node.x += (Math.random() - 0.5) * 2;
                    node.y += (Math.random() - 0.5) * 2;
                    anyMoved = true;
                }
            }
        }

        if (!anyMoved) break;
    }

    return pathNodes;
}

function pointToCollisionShapeDist(px, py, shape) {
    if (shape.type === 'rectangle') {
        const closestX = Math.max(shape.x, Math.min(px, shape.x + shape.width));
        const closestY = Math.max(shape.y, Math.min(py, shape.y + shape.height));
        const dx = px - closestX;
        const dy = py - closestY;
        const dist = Math.hypot(dx, dy);
        // Inside rectangle
        if (px >= shape.x && px <= shape.x + shape.width && py >= shape.y && py <= shape.y + shape.height) {
            const toLeft = px - shape.x;
            const toRight = shape.x + shape.width - px;
            const toTop = py - shape.y;
            const toBottom = shape.y + shape.height - py;
            return -Math.min(toLeft, toRight, toTop, toBottom);
        }
        return dist;
    } else if (shape.type === 'circle') {
        const dx = px - shape.x;
        const dy = py - shape.y;
        const dist = Math.hypot(dx, dy) - shape.radius;
        return dist;
    } else if (shape.type === 'ellipse') {
        const dx = px - shape.x;
        const dy = py - shape.y;
        const rx = shape.radiusX || 1;
        const ry = shape.radiusY || 1;
        const closestAngle = Math.atan2(dy / ry, dx / rx);
        const ecx = shape.x + rx * Math.cos(closestAngle);
        const ecy = shape.y + ry * Math.sin(closestAngle);
        const dist = Math.hypot(px - ecx, py - ecy);
        // Approximate inside check
        const normalized = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);
        return normalized < 1 ? -dist : dist;
    }
    return Infinity;
}

/**
 * HiDPI support: make shadowBlur / shadowOffsetX / shadowOffsetY on `ctx` measure
 * logical (CSS) pixels, like every other canvas length.
 *
 * HiDPI canvases draw in logical pixels and rely on a base setTransform(pixelRatio)
 * to fill a higher-resolution backing store. Paths, line widths, fonts and images all
 * follow that transform, but the canvas spec defines shadow blur/offset in raw
 * backing-store pixels and ignores the transform. Without this, every glow and drop
 * shadow would shrink by the pixel ratio (half size on a 200%-scaled display).
 *
 * Installs instance-level accessors that scale on write and unscale on read, so
 * existing code (`ctx.shadowBlur = 4`, save()/restore()) works unchanged.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {() => number} getScale  current backing-store pixels per logical pixel
 */
function installHiDpiShadowScaling(ctx, getScale) {
    if (!ctx || ctx.__hiDpiShadowScaling) return;
    const proto = Object.getPrototypeOf(ctx);
    ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY'].forEach(prop => {
        const desc = Object.getOwnPropertyDescriptor(proto, prop);
        if (!desc || typeof desc.get !== 'function' || typeof desc.set !== 'function') return;
        Object.defineProperty(ctx, prop, {
            configurable: true,
            enumerable: true,
            get() { return desc.get.call(this) / (getScale() || 1); },
            set(value) { desc.set.call(this, value * (getScale() || 1)); }
        });
    });
    ctx.__hiDpiShadowScaling = true;
}
