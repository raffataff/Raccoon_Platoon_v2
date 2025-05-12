// js/utils.js
function distance(x1, y1, x2, y2) {
    return Math.hypot(x2 - x1, y2 - y1);
}

// Line of Sight (LOS) check for MVP:
// Checks if a line segment between (x1,y1) and (x2,y2) intersects any rectangular obstacles.
function hasLineOfSight(x1, y1, x2, y2, obstacles) {
    for (const obs of obstacles) {
        if (lineIntersectsRect(x1, y1, x2, y2, obs)) {
            return false; // Path is blocked
        }
    }
    return true; // Path is clear
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