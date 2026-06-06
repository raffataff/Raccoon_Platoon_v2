// js/utils.js
// complete
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function hasLineOfSight(x1, y1, x2, y2, obstacles /* May become legacy */, gameLevelInstance = null, checkOnlyCover = false) {
    let candidateObstacles = obstacles; // Fallback

    // --- MODIFIED: Use Spatial Grid if available ---
    if (gameLevelInstance && gameLevelInstance.game && gameLevelInstance.game.spatialGrid) {
        const gridCandidates = gameLevelInstance.game.spatialGrid.queryLine(x1, y1, x2, y2);
        // Filter to only include actual obstacle objects from the level,
        // as the grid might contain units or projectiles too.
        candidateObstacles = gridCandidates.filter(obj => gameLevelInstance.obstacles.includes(obj));
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


class PathNode {
    /* ... (Unchanged from previous complete version) ... */
    constructor(x, y, g = 0, h = 0, parent = null) {
        this.x = x; // grid x
        this.y = y; // grid y
        this.g = g; // cost from start to this node
        this.h = h; // heuristic cost from this node to end
        this.f = g + h; // total estimated cost
        this.parent = parent; // parent node in the path
    }
}

function heuristic(nodeA, nodeB) { /* ... (Unchanged from previous complete version) ... */
    const dX = Math.abs(nodeA.x - nodeB.x);
    const dY = Math.abs(nodeA.y - nodeB.y);
    // Diagonal distance (Octile distance)
    const D = 1; // Cost of horizontal/vertical movement
    const D2 = Math.SQRT2; // Cost of diagonal movement (approx 1.414)
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

    const direct = _astar(startPos, endPos, grid, isUnitPhasing, CONFIG.PATHFINDING_MAX_EXPANSIONS);
    if (direct && direct.length > 0) {
        const last = direct[direct.length - 1];
        if (last.x === endPos.x && last.y === endPos.y) {
            return direct;
        }
    }

    const borderWaypoints = _findBorderWaypoints(startPos, endPos, grid, isUnitPhasing);
    if (borderWaypoints.length > 0) {
        const perLeg = Math.floor(CONFIG.PATHFINDING_MAX_EXPANSIONS * 0.33);
        for (const wp of borderWaypoints) {
            const first = _astar(startPos, wp, grid, isUnitPhasing, perLeg);
            if (!first || first.length === 0) continue;
            const second = _astar(wp, endPos, grid, isUnitPhasing, perLeg);
            if (!second || second.length === 0) continue;
            first.pop();
            return first.concat(second);
        }
        for (const wp of borderWaypoints) {
            const first = _astar(startPos, wp, grid, isUnitPhasing, perLeg);
            if (!first || first.length === 0) continue;
            const second = _astar(wp, endPos, grid, isUnitPhasing, perLeg * 2);
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

function _findBorderWaypoints(startPos, endPos, grid, isUnitPhasing) {
    const gridW = grid[0].length;
    const gridH = grid.length;
    const visited = new Uint8Array(gridW * gridH);
    const queue = new Array(gridW * gridH);
    let head = 0, tail = 0;

    queue[tail++] = startPos.x;
    queue[tail++] = startPos.y;
    visited[startPos.y * gridW + startPos.x] = 1;

    const cardinal = [
        { x: 0, y: -1 }, { x: 0, y: 1 },
        { x: -1, y: 0 }, { x: 1, y: 0 }
    ];

    const borderCells = [];
    const maxSearch = 4000;
    let searched = 0;

    while (head < tail && searched < maxSearch && borderCells.length < 20) {
        const cx = queue[head++];
        const cy = queue[head++];
        searched++;

        let isBorder = false;
        for (const d of cardinal) {
            const nnx = cx + d.x;
            const nny = cy + d.y;
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
            if (distFromStart > 5) {
                borderCells.push({ x: cx, y: cy, score: distToGoal + distFromStart * 0.3 });
            }
        }

        for (const d of cardinal) {
            const nx = cx + d.x;
            const ny = cy + d.y;
            if (nx < 0 || nx >= gridW || ny < 0 || ny >= gridH) continue;
            const idx = ny * gridW + nx;
            if (visited[idx]) continue;
            if (grid[ny][nx] === 1) {
                visited[idx] = 1;
                continue;
            }
            visited[idx] = 1;
            queue[tail++] = nx;
            queue[tail++] = ny;
        }
    }

    borderCells.sort((a, b) => a.score - b.score);
    return borderCells.slice(0, 10);
}

function _astar(startPos, endPos, grid, isUnitPhasing, maxExpansions) {
    const openList = new MinHeap();
    const closedList = new Set();
    const gCosts = new Map();

    const startNode = new PathNode(startPos.x, startPos.y, 0, heuristic(startPos, endPos));
    openList.insert(startNode);
    gCosts.set(`${startPos.x},${startPos.y}`, 0);

    const directions = [
        { x: 0, y: -1, cost: 1 }, { x: 0, y: 1, cost: 1 },
        { x: -1, y: 0, cost: 1 }, { x: 1, y: 0, cost: 1 },
        { x: -1, y: -1, cost: Math.SQRT2 }, { x: 1, y: -1, cost: Math.SQRT2 },
        { x: -1, y: 1, cost: Math.SQRT2 }, { x: 1, y: 1, cost: Math.SQRT2 }
    ];

    let expansions = 0;
    let bestNode = startNode;

    while (!openList.isEmpty()) {
        const cur = openList.extractMin();

        if (cur.h < bestNode.h) {
            bestNode = cur;
        }

        if (cur.x === endPos.x && cur.y === endPos.y) {
            const path = [];
            let temp = cur;
            while (temp) {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            return path.reverse();
        }

        const curKey = `${cur.x},${cur.y}`;
        if (closedList.has(curKey)) continue;
        closedList.add(curKey);

        expansions++;
        if (expansions > maxExpansions) {
            const path = [];
            let temp = bestNode;
            while (temp) {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            return path.reverse();
        }

        for (const dir of directions) {
            const nx = cur.x + dir.x;
            const ny = cur.y + dir.y;
            const nKey = `${nx},${ny}`;

            if (nx < 0 || nx >= grid[0].length || ny < 0 || ny >= grid.length) continue;
            if (grid[ny][nx] === 1 && !isUnitPhasing) continue;
            if (closedList.has(nKey)) continue;

            if (dir.x !== 0 && dir.y !== 0) {
                if (!isUnitPhasing && grid[cur.y][cur.x + dir.x] === 1 && grid[cur.y + dir.y][cur.x] === 1) continue;
            }

            const newG = cur.g + dir.cost;
            if (!gCosts.has(nKey) || newG < gCosts.get(nKey)) {
                gCosts.set(nKey, newG);
                openList.insert(new PathNode(nx, ny, newG, heuristic({ x: nx, y: ny }, endPos), cur));
            }
        }
    }

    if (bestNode !== startNode) {
        const path = [];
        let temp = bestNode;
        while (temp) {
            path.push({ x: temp.x, y: temp.y });
            temp = temp.parent;
        }
        return path.reverse();
    }
    return null;
}

function _smoothPathCheckLOS(anchorWorld, candidateGrid, pathingRadius, levelInstance, obstaclesForLOS) {
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

    return centerLOS && leftShoulderLOS && rightShoulderLOS;
}

function smoothPath(rawPathGridCoords, unitSize, levelInstance) {
    if (!rawPathGridCoords || rawPathGridCoords.length < 2 || !levelInstance) {
        return rawPathGridCoords ? rawPathGridCoords.map(p => levelInstance.gridToWorldCoords(p.x, p.y)) : [];
    }

    if (rawPathGridCoords.length <= 3) {
        return rawPathGridCoords.map(p => levelInstance.gridToWorldCoords(p.x, p.y));
    }

    const pathingRadius = (unitSize / 2) + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 0);
    const obstaclesForLOS = levelInstance.activeObstacles || [];
    const smoothedPathWorldCoords = [];
    let currentAnchorWorld = levelInstance.gridToWorldCoords(rawPathGridCoords[0].x, rawPathGridCoords[0].y);
    smoothedPathWorldCoords.push(currentAnchorWorld);

    let i = 0;
    const maxIterations = Math.max(rawPathGridCoords.length * 3, 100);
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
        if (remainingNodes > 40) coarseStep = Math.max(1, Math.floor(remainingNodes / 10));
        else if (remainingNodes > 15) coarseStep = Math.max(1, Math.floor(remainingNodes / 5));

        let coarseFoundIndex = -1;
        for (let j = rawPathGridCoords.length - 1; j > i; j -= coarseStep) {
            iterations++;
            if (iterations > maxIterations) break;
            if (_smoothPathCheckLOS(currentAnchorWorld, rawPathGridCoords[j], pathingRadius, levelInstance, obstaclesForLOS)) {
                coarseFoundIndex = j;
                break;
            }
        }

        if (coarseFoundIndex !== -1) {
            const fineSearchEnd = Math.min(rawPathGridCoords.length - 1, coarseFoundIndex + coarseStep - 1);
            for (let j = fineSearchEnd; j > i; j--) {
                iterations++;
                if (iterations > maxIterations) break;
                if (_smoothPathCheckLOS(currentAnchorWorld, rawPathGridCoords[j], pathingRadius, levelInstance, obstaclesForLOS)) {
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

    const pathingRadius = unitRadius + (CONFIG.UNIT_PATHING_RADIUS_BUFFER || 8);
    const obstacles = (levelInstance.activeObstacles || []).filter(o => o.blocksMovement && !o.isDestroyed);
    const useSpatialGrid = levelInstance.game && levelInstance.game.spatialGrid;

    const OFFSET_QUERY_MARGIN = 30; // extra margin beyond pathingRadius for spatial query
    const queryRadius = pathingRadius + OFFSET_QUERY_MARGIN;

    for (let iteration = 0; iteration < 3; iteration++) {
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
                            totalOffsetX += (awayX / awayDist) * penetration * 0.5;
                            totalOffsetY += (awayY / awayDist) * penetration * 0.5;
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
