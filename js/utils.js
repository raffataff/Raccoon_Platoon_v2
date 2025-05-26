// js/utils.js
// complete
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// MODIFIED: LOS now checks against obstacles that BLOCK MOVEMENT by default for pathing/smoothing
function hasLineOfSight(x1, y1, x2, y2, obstacles, gameLevelInstance = null, checkOnlyCover = false) {
    for (const obs of obstacles) {
        // If checkOnlyCover is true, only check obstacles that provideCover.
        // Otherwise (default for pathing/smoothing), check obstacles that blockMovement.
        const relevantObstacle = checkOnlyCover ? obs.providesCover : obs.blocksMovement;

        if (relevantObstacle && !obs.isDestroyed) {
            let collisionDetected = false;
            const obsShape = (gameLevelInstance && typeof gameLevelInstance._getObstacleCollisionShape === 'function')
                           ? gameLevelInstance._getObstacleCollisionShape(obs)
                           : {type:'rectangle', x:obs.x, y:obs.y, width:obs.width, height:obs.height};

            if (obsShape.type === 'rectangle') {
                if (lineIntersectsRect(x1, y1, x2, y2, obsShape)) {
                    collisionDetected = true;
                }
            } else if (obsShape.type === 'circle') {
                if (lineIntersectsCircle(x1, y1, x2, y2, obsShape)) {
                    collisionDetected = true;
                }
            }
            if (collisionDetected) return false;
        }
    }
    return true;
}
// ... (rest of utils.js is the same as the version with path smoothing)
function lineIntersectsCircle(p1x, p1y, p2x, p2y, circle) { /* ... (Unchanged) ... */
    const cx = circle.x;
    const cy = circle.y;
    const r = circle.radius;
    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const lenSq = dx * dx + dy * dy;
    let t;
    if (lenSq === 0) {
        t = -1;
        return distance(p1x, p1y, cx, cy) <= r;
    } else {
        t = ((cx - p1x) * dx + (cy - p1y) * dy) / lenSq;
    }
    let closestX, closestY;
    if (t < 0) {
        closestX = p1x;
        closestY = p1y;
    } else if (t > 1) {
        closestX = p2x;
        closestY = p2y;
    } else {
        closestX = p1x + t * dx;
        closestY = p1y + t * dy;
    }
    const distToClosestSq = (cx - closestX) ** 2 + (cy - closestY) ** 2;
    return distToClosestSq <= r * r;
}
function lineIntersectsRect(p1x, p1y, p2x, p2y, rect) { /* ... (Unchanged) ... */
    const { x, y, width, height } = rect;
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y, x + width, y)) return true;
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y + height, x + width, y + height)) return true;
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y, x, y + height)) return true;
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x + width, y, x + width, y + height)) return true;
    return false;
}
function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) { /* ... (Unchanged) ... */
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return false;
    const tNum = (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4);
    const uNum = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3));
    const t = tNum / den;
    const u = uNum / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
function rectOverlap(rect1, rect2) { /* ... (Unchanged) ... */
    if (rect1.x + rect1.width < rect2.x || rect2.x + rect2.width < rect1.x) { return false; }
    if (rect1.y + rect1.height < rect2.y || rect2.y + rect2.height < rect1.y) { return false; }
    return true;
}
function circleOverlap(circle1, circle2) { /* ... (Unchanged) ... */
    const distSq = (circle1.x - circle2.x) ** 2 + (circle1.y - circle2.y) ** 2;
    const radiiSumSq = (circle1.radius + circle2.radius) ** 2;
    return distSq <= radiiSumSq;
}
function rectCircleOverlap(rect, circle) { /* ... (Unchanged) ... */
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
function pointInRectangle(px, py, rect) { /* ... (Unchanged) ... */
    return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
}
function pointInCircle(px, py, circle) { /* ... (Unchanged) ... */
    const distSq = (px - circle.x) ** 2 + (py - circle.y) ** 2;
    return distSq <= circle.radius * circle.radius;
}
class PathNode {
    constructor(x, y, g = 0, h = 0, parent = null) {
        this.x = x; // grid x
        this.y = y; // grid y
        this.g = g; // cost from start to this node
        this.h = h; // heuristic cost from this node to end
        this.f = g + h; // total estimated cost
        this.parent = parent; // parent node in the path
    }
}

function heuristic(nodeA, nodeB) { // nodeA, nodeB are {x, y} grid coords
    const dX = Math.abs(nodeA.x - nodeB.x);
    const dY = Math.abs(nodeA.y - nodeB.y);
    // Diagonal distance (Octile distance)
    const D = 1; // Cost of horizontal/vertical movement
    const D2 = Math.SQRT2; // Cost of diagonal movement (approx 1.414)
    return D * (dX + dY) + (D2 - 2 * D) * Math.min(dX, dY);
}

function findPath(startPos, endPos, grid) { // startPos, endPos are {x, y} grid coords
    const openList = new MinHeap(); // Use MinHeap instead of array
    const closedList = new Set();     // Stores "x,y" strings to mark visited nodes

    const startNode = new PathNode(startPos.x, startPos.y, 0, heuristic(startPos, endPos));
    openList.insert(startNode);

    // Map to keep track of the G-costs of nodes currently in the open list or considered.
    // Key: "x,y", Value: gCost. This helps in updating nodes if a shorter path is found.
    const openListGCosts = new Map();
    openListGCosts.set(`${startNode.x},${startNode.y}`, startNode.g);

    const directions = [
        { x: 0, y: -1, cost: 1 }, { x: 0, y: 1, cost: 1 }, // N, S
        { x: -1, y: 0, cost: 1 }, { x: 1, y: 0, cost: 1 }, // W, E
        { x: -1, y: -1, cost: Math.SQRT2 }, { x: 1, y: -1, cost: Math.SQRT2 }, // NW, NE
        { x: -1, y: 1, cost: Math.SQRT2 }, { x: 1, y: 1, cost: Math.SQRT2 }  // SW, SE
    ];

    while (!openList.isEmpty()) {
        const currentNode = openList.extractMin(); // Get node with smallest F-cost

        if (currentNode.x === endPos.x && currentNode.y === endPos.y) {
            // Path found, reconstruct it
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

            // Check bounds
            if (neighborX < 0 || neighborX >= grid[0].length || neighborY < 0 || neighborY >= grid.length) {
                continue;
            }
            // Check if walkable
            if (grid[neighborY][neighborX] === 1) {
                continue;
            }
            // Check if already processed
            if (closedList.has(neighborKey)) {
                continue;
            }

            // Prevent corner cutting through two diagonally adjacent blocked cells
            if (direction.x !== 0 && direction.y !== 0) { // Diagonal move
                const cardinalCell1X = currentNode.x + direction.x;
                const cardinalCell1Y = currentNode.y;
                const cardinalCell2X = currentNode.x;
                const cardinalCell2Y = currentNode.y + direction.y;
                if (grid[cardinalCell1Y][cardinalCell1X] === 1 && grid[cardinalCell2Y][cardinalCell2X] === 1) {
                    continue; // Blocked diagonal
                }
            }

            const gCost = currentNode.g + direction.cost;

            // If neighbor is not in openListGCosts or new path is shorter
            if (!openListGCosts.has(neighborKey) || gCost < openListGCosts.get(neighborKey)) {
                openListGCosts.set(neighborKey, gCost); // Update G-cost or add new
                const hCost = heuristic({ x: neighborX, y: neighborY }, endPos);
                const neighborNode = new PathNode(neighborX, neighborY, gCost, hCost, currentNode);
                openList.insert(neighborNode); // Insert/re-insert into MinHeap
                                               // The MinHeap handles positioning based on F (and G for tie-breaking)
            }
        }
    }

    return null; // No path found
}

function smoothPath(rawPathGridCoords, unitSize, levelInstance) { /* ... (Unchanged from previous complete version - uses the modified hasLineOfSight by default) ... */
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
            const obstaclesForLOS = levelInstance.obstacles.filter(obs => obs.blocksMovement && !obs.isDestroyed);
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