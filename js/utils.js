// js/utils.js
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// Line of Sight (LOS) check for MVP:
function hasLineOfSight(x1, y1, x2, y2, obstacles, gameLevelInstance = null) {
    for (const obs of obstacles) {
        if (obs.providesCover && !obs.isDestroyed) {
            let collisionDetected = false;
            const obsShape = gameLevelInstance ? gameLevelInstance._getObstacleCollisionShape(obs) : {type:'rectangle', x:obs.x, y:obs.y, width:obs.width, height:obs.height}; // Basic fallback

            if (obsShape.type === 'rectangle') {
                if (lineIntersectsRect(x1, y1, x2, y2, obsShape)) {
                    collisionDetected = true;
                }
            } else if (obsShape.type === 'circle') {
                if (lineIntersectsCircle(x1, y1, x2, y2, obsShape)) {
                    collisionDetected = true;
                }
            }
            // Add other shape types if needed

            if (collisionDetected) return false;
        }
    }
    return true;
}

// Line vs. Circle Intersection
function lineIntersectsCircle(p1x, p1y, p2x, p2y, circle) {
    const cx = circle.x;
    const cy = circle.y;
    const r = circle.radius;

    const dx = p2x - p1x;
    const dy = p2y - p1y;
    const lenSq = dx * dx + dy * dy;

    // t is the projection of C-P1 onto P2-P1, normalized
    let t;
    if (lenSq === 0) { // P1 and P2 are the same point
        t = -1; // effectively, no segment, check if P1 is inside circle
        return distance(p1x, p1y, cx, cy) <= r;
    } else {
        t = ((cx - p1x) * dx + (cy - p1y) * dy) / lenSq;
    }


    let closestX, closestY;
    if (t < 0) { // Closest point is P1
        closestX = p1x;
        closestY = p1y;
    } else if (t > 1) { // Closest point is P2
        closestX = p2x;
        closestY = p2y;
    } else { // Closest point is on the segment
        closestX = p1x + t * dx;
        closestY = p1y + t * dy;
    }

    const distToClosestSq = (cx - closestX) ** 2 + (cy - closestY) ** 2;
    return distToClosestSq <= r * r;
}


// Helper: Check if line segment (p1x,p1y)-(p2x,p2y) intersects rectangle
function lineIntersectsRect(p1x, p1y, p2x, p2y, rect) {
    const { x, y, width, height } = rect;
    // Check intersection with each of the 4 edges of the rectangle
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y, x + width, y)) return true; // Top edge
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y + height, x + width, y + height)) return true; // Bottom edge
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x, y, x, y + height)) return true; // Left edge
    if (lineIntersectsLine(p1x, p1y, p2x, p2y, x + width, y, x + width, y + height)) return true; // Right edge
    return false;
}

// Helper: Checks if two line segments intersect (x1,y1)-(x2,y2) and (x3,y3)-(x4,y4)
function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return false; // Lines are parallel or collinear

    const tNum = (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4);
    const uNum = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3));

    const t = tNum / den;
    const u = uNum / den;

    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function rectOverlap(rect1, rect2) {
    // Check if one rectangle is on left side of other
    if (rect1.x + rect1.width < rect2.x || rect2.x + rect2.width < rect1.x) {
        return false;
    }
    // Check if one rectangle is above other
    if (rect1.y + rect1.height < rect2.y || rect2.y + rect2.height < rect1.y) {
        return false;
    }
    return true; // Rectangles overlap
}

function circleOverlap(circle1, circle2) {
    const distSq = (circle1.x - circle2.x) ** 2 + (circle1.y - circle2.y) ** 2;
    const radiiSumSq = (circle1.radius + circle2.radius) ** 2;
    return distSq <= radiiSumSq;
}

function rectCircleOverlap(rect, circle) {
    // Find the closest point on the rectangle to the circle's center
    let testX = circle.x;
    let testY = circle.y;

    if (circle.x < rect.x) testX = rect.x; // Circle is to the left of the rect
    else if (circle.x > rect.x + rect.width) testX = rect.x + rect.width; // Circle is to the right

    if (circle.y < rect.y) testY = rect.y; // Circle is above the rect
    else if (circle.y > rect.y + rect.height) testY = rect.y + rect.height; // Circle is below

    // Calculate distance from closest point to circle center
    const distX = circle.x - testX;
    const distY = circle.y - testY;
    const distanceSquared = (distX * distX) + (distY * distY);

    return distanceSquared <= circle.radius * circle.radius;
}

function pointInRectangle(px, py, rect) {
    return px >= rect.x && px <= rect.x + rect.width &&
           py >= rect.y && py <= rect.y + rect.height;
}

function pointInCircle(px, py, circle) {
    const distSq = (px - circle.x) ** 2 + (py - circle.y) ** 2;
    return distSq <= circle.radius * circle.radius;
}