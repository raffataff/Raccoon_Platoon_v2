// js/utils.js
// complete
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

function hasLineOfSight(x1, y1, x2, y2, obstacles, gameLevelInstance = null, checkOnlyCover = false) {
    for (const obs of obstacles) {
        const relevantObstacle = checkOnlyCover ? obs.providesCover : obs.blocksMovement;

        if (relevantObstacle && !obs.isDestroyed) {
            let collisionDetected = false;
            const obsShape = (gameLevelInstance && typeof gameLevelInstance._getObstacleCollisionShape === 'function')
                           ? gameLevelInstance._getObstacleCollisionShape(obs)
                           : {type:'rectangle', x:obs.x, y:obs.y, width:obs.width, height:obs.height}; // Fallback

            if (obsShape.type === 'rectangle') {
                if (lineIntersectsRect(x1, y1, x2, y2, obsShape)) {
                    collisionDetected = true;
                }
            } else if (obsShape.type === 'circle') {
                if (lineIntersectsCircle(x1, y1, x2, y2, obsShape)) {
                    collisionDetected = true;
                }
            } else if (obsShape.type === 'ellipse') { // *** NEW ***
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
    const { x, y, width, height } = rect;
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y, x + width, y)) return true; // Top
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y + height, x + width, y + height)) return true; // Bottom
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y, x, y + height)) return true; // Left
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x + width, y, x + width, y + height)) return true; // Right
    return false;
}
function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return false; // Lines are parallel or coincident
    const tNum = (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4);
    const uNum = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3));
    const t = tNum / den;
    const u = uNum / den;
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}
function rectOverlap(rect1, rect2) {
    if (rect1.x >= rect2.x + rect2.width || rect1.x + rect1.width <= rect2.x) { return false; }
    if (rect1.y >= rect2.y + rect2.height || rect1.y + rect1.height <= rect2.y) { return false; }
    return true;
}
function circleOverlap(circle1, circle2) {
    const distSq = (circle1.x - circle2.x) ** 2 + (circle1.y - circle2.y) ** 2;
    const radiiSumSq = (circle1.radius + circle2.radius) ** 2;
    return distSq <= radiiSumSq;
}
function rectCircleOverlap(rect, circle) {
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
    return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
}
function pointInCircle(px, py, circle) {
    const distSq = (px - circle.x) ** 2 + (py - circle.y) ** 2;
    return distSq <= circle.radius * circle.radius;
}

// *** NEW ELLIPSE FUNCTIONS ***
function pointInEllipse(px, py, ellipse) {
    const termX = (px - ellipse.x) / (ellipse.radiusX || 1e-6); // Avoid division by zero if radiusX is 0
    const termY = (py - ellipse.y) / (ellipse.radiusY || 1e-6); // Avoid division by zero if radiusY is 0
    return (termX * termX) + (termY * termY) <= 1;
}

function lineIntersectsEllipse(p1x, p1y, p2x, p2y, ellipse) {
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
        // Also check if the line segment is entirely inside the ellipse
        // This happens if both endpoints are inside and no intersection points are on segment
        // (which is covered if discriminant >= 0 and no t in [0,1])
        // A simpler check: if one point is inside and other outside, must intersect.
        // If both points are inside, it doesn't "intersect" the boundary but is contained.
        // For LOS, containment can also mean obstruction.
        const p1Inside = pointInEllipse(p1x, p1y, ellipse);
        const p2Inside = pointInEllipse(p2x, p2y, ellipse);
        if (p1Inside && p2Inside) return true; // Segment fully inside
        if ((p1Inside && !p2Inside) || (!p1Inside && p2Inside)) { // One in, one out, and discriminant >=0 means intersection
            // This case is tricky if the intersection points t1,t2 are outside [0,1] but segment crosses.
            // The t1,t2 check should be sufficient for boundary crossing.
            // If the line *passes through* without t in [0,1], it means the segment endpoints are on same side.
            // Let's refine: if solutions exist, check if they are on segment.
            // If no solutions on segment, check if segment is fully contained.
             if ((t1 > 0 && t1 < 1) || (t2 > 0 && t2 < 1)) return true; // Strict intersection on segment
             if (t1 === 0 || t1 === 1 || t2 === 0 || t2 === 1) return true; // Touches endpoint

        }
        // Consider a case where the segment doesn't cross the boundary but is contained
        // This is implicitly handled if pointInEllipse(p1x,p1y,ellipse) || pointInEllipse(p2x,p2y,ellipse) is true
        // and the above t-value checks are false.
        // For LOS, if either endpoint is inside, or the line crosses, it's blocked.
        // The pointInEllipse check for endpoints is important.
        if (pointInEllipse(p1x, p1y, ellipse) || pointInEllipse(p2x, p2y, ellipse)) return true;


        return false;
    }
}


function rectEllipseOverlap(rect, ellipse) {
    // Find the closest point on the rectangle to the ellipse's center
    const closestX = Math.max(rect.x, Math.min(ellipse.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(ellipse.y, rect.y + rect.height));

    // Check if this closest point is inside the ellipse
    return pointInEllipse(closestX, closestY, ellipse);
}

function circleEllipseOverlap(circle, ellipse) {
    // Scale the space so the ellipse becomes a unit circle at the origin.
    // Ellipse: ((x-cx)/a)^2 + ((y-cy)/b)^2 = 1
    // Transformed circle center:
    const transformedCircleX = (circle.x - ellipse.x) / (ellipse.radiusX || 1e-6);
    const transformedCircleY = (circle.y - ellipse.y) / (ellipse.radiusY || 1e-6);

    // The circle, when scaled non-uniformly, becomes an ellipse.
    // However, a simpler approach for collision is to find the closest point
    // on the *original* ellipse to the *original* circle's center.

    // Find the point on the ellipse boundary closest to the circle's center.
    // This is non-trivial. A common approximation or iterative method is used.
    // For a simpler (but less perfect) check, especially if ellipses are mostly axis-aligned:
    // 1. Check if circle center is in ellipse.
    if (pointInEllipse(circle.x, circle.y, ellipse)) return true;
    // 2. Check if ellipse center is in circle.
    if (pointInCircle(ellipse.x, ellipse.y, circle)) return true;

    // 3. More advanced: project circle onto ellipse axes or vice-versa (complex for arbitrary ellipses)
    // For axis-aligned ellipses, we can find the closest point on the ellipse to the circle center.
    // Let (xc, yc) be circle center, (xe, ye) be ellipse center, (a,b) ellipse radii.
    // Parametric form of ellipse: x = xe + a*cos(t), y = ye + b*sin(t)
    // We need to find t that minimizes distance from (xc, yc) to (x(t), y(t)).
    // This involves solving a quartic equation in general.

    // A robust method is to check the distance from the circle's center to the ellipse.
    // If this distance is less than or equal to the circle's radius, they overlap.
    // Finding this distance can be done by finding the roots of a polynomial.

    // Let's use a common iterative approach or a test based on relative positions.
    // Consider the vector from ellipse center to circle center
    let dx = circle.x - ellipse.x;
    let dy = circle.y - ellipse.y;

    // Find the closest point on the ellipse to the circle center
    // This can be approximated by clamping the vector (dx, dy) scaled to the ellipse boundary
    // This is not perfectly accurate for all cases but is often used.
    let angle = Math.atan2(dy / (ellipse.radiusY || 1e-6) , dx / (ellipse.radiusX || 1e-6)); // Angle in "ellipse space"
    let closestEllipseX = ellipse.x + ellipse.radiusX * Math.cos(angle);
    let closestEllipseY = ellipse.y + ellipse.radiusY * Math.sin(angle);

    // Check if this closest point on ellipse boundary is inside the circle
    if (pointInCircle(closestEllipseX, closestEllipseY, circle)) {
        return true;
    }

    // Another check: if the circle's bounding box overlaps the ellipse's bounding box,
    // it's a candidate. Then, a more precise check is needed.
    // The above checks (centers in shapes, closest point on ellipse in circle) cover many cases.
    // For more accuracy, especially with very eccentric ellipses or specific configurations,
    // numerical methods or more complex geometry (like Minkowski sum or separating axis for polygonized ellipse)
    // would be required. Given the context, the current checks provide a reasonable balance.

    // One more check: Test points on circle boundary against ellipse
    // This is computationally more expensive but can catch some edge cases.
    // For example, 8 points around the circle:
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

function smoothPath(rawPathGridCoords, unitSize, levelInstance) {
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