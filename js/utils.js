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
            const obsShape = (gameLevelInstance && typeof gameLevelInstance._getObstacleCollisionShape === 'function')
                           ? gameLevelInstance._getObstacleCollisionShape(obs)
                           : {type:'rectangle', x:obs.x, y:obs.y, width:obs.width, height:obs.height}; 

            if (!obsShape) continue; // Should not happen if _getObstacleCollisionShape is robust

            if (obsShape.type === 'rectangle') {
                if (lineIntersectsRect(x1, y1, x2, y2, obsShape)) {
                    collisionDetected = true;
                }
            } else if (obsShape.type === 'circle') {
                if (lineIntersectsCircle(x1, y1, x2, y2, obsShape)) {
                    collisionDetected = true;
                }
            } else if (obsShape.type === 'ellipse') { 
                if (lineIntersectsEllipse(x1, y1, x2, y2, obsShape)) {
                    collisionDetected = true;
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
    /* ... (Unchanged from previous complete version) ... */
    let testX = circle.x;
    let testY = circle.y;
    if (circle.x < rect.x) testX = rect.x;
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width;
    if (circle.y < rect.y) testY = rect.y;
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height;
    const distX = circle.x - testX;
    const distY = circle.y - testY;
    const distanceSquared = (distX * distX) + (distY * distY);
    return distanceSquared <= circle.radius * circle.radius;
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

function findPath(startPos, endPos, grid) { /* ... (Unchanged from previous complete version) ... */
    const openList = new MinHeap(); 
    const closedList = new Set();     

    const startNode = new PathNode(startPos.x, startPos.y, 0, heuristic(startPos, endPos));
    openList.insert(startNode);
    
    const openListGCosts = new Map();
    openListGCosts.set(`${startNode.x},${startNode.y}`, startNode.g);

    const directions = [
        { x: 0, y: -1, cost: 1 }, { x: 0, y: 1, cost: 1 }, 
        { x: -1, y: 0, cost: 1 }, { x: 1, y: 0, cost: 1 }, 
        { x: -1, y: -1, cost: Math.SQRT2 }, { x: 1, y: -1, cost: Math.SQRT2 }, 
        { x: -1, y: 1, cost: Math.SQRT2 }, { x: 1, y: 1, cost: Math.SQRT2 }  
    ];

    while (!openList.isEmpty()) {
        const currentNode = openList.extractMin(); 

        if (currentNode.x === endPos.x && currentNode.y === endPos.y) {
            const path = [];
            let temp = currentNode;
            while (temp) {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            return path.reverse();
        }

        closedList.add(`${currentNode.x},${currentNode.y}`);

        for (const direction of directions) {
            const neighborX = currentNode.x + direction.x;
            const neighborY = currentNode.y + direction.y;
            const neighborKey = `${neighborX},${neighborY}`;

            if (neighborX < 0 || neighborX >= grid[0].length || neighborY < 0 || neighborY >= grid.length) {
                continue;
            }
            if (grid[neighborY][neighborX] === 1) {
                continue;
            }
            if (closedList.has(neighborKey)) {
                continue;
            }
            if (direction.x !== 0 && direction.y !== 0) { 
                const cardinalCell1X = currentNode.x + direction.x;
                const cardinalCell1Y = currentNode.y;
                const cardinalCell2X = currentNode.x;
                const cardinalCell2Y = currentNode.y + direction.y;
                if (grid[cardinalCell1Y][cardinalCell1X] === 1 && grid[cardinalCell2Y][cardinalCell2X] === 1) {
                    continue; 
                }
            }

            const gCost = currentNode.g + direction.cost;
            if (!openListGCosts.has(neighborKey) || gCost < openListGCosts.get(neighborKey)) {
                openListGCosts.set(neighborKey, gCost); 
                const hCost = heuristic({ x: neighborX, y: neighborY }, endPos);
                const neighborNode = new PathNode(neighborX, neighborY, gCost, hCost, currentNode);
                openList.insert(neighborNode); 
            }
        }
    }
    return null; 
}

function smoothPath(rawPathGridCoords, unitSize, levelInstance) {
    /* ... (Unchanged from previous complete version) ... */
    if (!rawPathGridCoords || rawPathGridCoords.length < 2 || !levelInstance) {
        return rawPathGridCoords ? rawPathGridCoords.map(p => levelInstance.gridToWorldCoords(p.x, p.y)) : [];
    }
    const smoothedPathWorldCoords = [];
    let currentAnchorWorld = levelInstance.gridToWorldCoords(rawPathGridCoords[0].x, rawPathGridCoords[0].y);
    smoothedPathWorldCoords.push(currentAnchorWorld);
    let i = 0;
    while (i < rawPathGridCoords.length -1) {
        let furthestVisibleIndex = i + 1;
        for (let j = rawPathGridCoords.length - 1; j > i + 1; j--) {
            const candidateWorld = levelInstance.gridToWorldCoords(rawPathGridCoords[j].x, rawPathGridCoords[j].y);
            // Note: hasLineOfSight will now use the spatial grid internally if gameLevelInstance.game.spatialGrid exists
            const obstaclesForLOS = levelInstance.obstacles.filter(obs => obs.blocksMovement && !obs.isDestroyed); // Keep this for fallback or direct calls
            if (hasLineOfSight(currentAnchorWorld.x, currentAnchorWorld.y, candidateWorld.x, candidateWorld.y, obstaclesForLOS, levelInstance)) {
                furthestVisibleIndex = j;
                break;
            }
        }
        currentAnchorWorld = levelInstance.gridToWorldCoords(rawPathGridCoords[furthestVisibleIndex].x, rawPathGridCoords[furthestVisibleIndex].y);
        smoothedPathWorldCoords.push(currentAnchorWorld);
        i = furthestVisibleIndex;
    }
    return smoothedPathWorldCoords;
}