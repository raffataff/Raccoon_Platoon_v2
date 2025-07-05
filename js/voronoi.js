/*
Copyright (c) 2010-2013, Raymond Hill
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of the author nor the names of its contributors may be
  used to endorse or promote products derived from this software without
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

function Voronoi() {
    this.vertices = null;
    this.edges = null;
    this.cells = null;
    this.toRecycle = null;
    this.beachsectionJunkyard = [];
    this.circleEventJunkyard = [];
    this.vertexJunkyard = [];
    this.edgeJunkyard = [];
    this.cellJunkyard = []
}
Voronoi.prototype.reset = function() {
    if (!this.beachline) {
        this.beachline = new this.RBTree
    }
    if (this.beachline.root) {
        var a = this.beachline.getFirst(this.beachline.root);
        while (a) {
            this.beachsectionJunkyard.push(a);
            a = a.rbNext
        }
    }
    this.beachline.root = null;
    if (!this.circleEvents) {
        this.circleEvents = new this.RBTree
    }
    this.circleEvents.root = null;
    this.firstCircleEvent = null;
    this.vertices = [];
    this.edges = [];
    this.cells = []
};
Voronoi.prototype.RBTree = function() {
    this.root = null
};
Voronoi.prototype.RBTree.prototype.rbInsertSuccessor = function(b, e) {
    var d;
    if (b) {
        e.rbPrevious = b;
        e.rbNext = b.rbNext;
        if (b.rbNext) {
            b.rbNext.rbPrevious = e
        }
        b.rbNext = e;
        if (b.rbRight) {
            b = b.rbRight;
            while (b.rbLeft) {
                b = b.rbLeft
            }
            b.rbLeft = e
        } else {
            b.rbRight = e
        }
        d = b
    } else {
        if (this.root) {
            b = this.getFirst(this.root);
            e.rbPrevious = null;
            e.rbNext = b;
            b.rbPrevious = e;
            b.rbLeft = e;
            d = b
        } else {
            e.rbPrevious = e.rbNext = null;
            this.root = e;
            d = e
        }
    }
    e.rbLeft = e.rbRight = null;
    e.rbParent = d;
    e.rbRed = true;
    var c, a;
    b = e;
    while (d && d.rbRed) {
        c = d.rbParent;
        if (d === c.rbLeft) {
            a = c.rbRight;
            if (a && a.rbRed) {
                d.rbRed = a.rbRed = false;
                c.rbRed = true;
                b = c
            } else {
                if (b === d.rbRight) {
                    this.rbRotateLeft(d);
                    b = d;
                    d = b.rbParent
                }
                d.rbRed = false;
                c.rbRed = true;
                this.rbRotateRight(c)
            }
        } else {
            a = c.rbLeft;
            if (a && a.rbRed) {
                d.rbRed = a.rbRed = false;
                c.rbRed = true;
                b = c
            } else {
                if (b === d.rbLeft) {
                    this.rbRotateRight(d);
                    b = d;
                    d = b.rbParent
                }
                d.rbRed = false;
                c.rbRed = true;
                this.rbRotateLeft(c)
            }
        }
        d = b.rbParent
    }
    this.root.rbRed = false
};
Voronoi.prototype.RBTree.prototype.rbRemoveNode = function(e) {
    if (e.rbNext) {
        e.rbNext.rbPrevious = e.rbPrevious
    }
    if (e.rbPrevious) {
        e.rbPrevious.rbNext = e.rbNext
    }
    e.rbNext = e.rbPrevious = null;
    var d = e.rbParent,
        f = e.rbLeft,
        b = e.rbRight,
        g;
    if (!f) {
        g = b
    } else {
        if (!b) {
            g = f
        } else {
            g = this.getFirst(b)
        }
    }
    if (d) {
        if (d.rbLeft === e) {
            d.rbLeft = g
        } else {
            d.rbRight = g
        }
    } else {
        this.root = g
    }
    var a;
    if (f && b) {
        a = g.rbRed;
        g.rbRed = e.rbRed;
        g.rbLeft = f;
        f.rbParent = g;
        if (g !== b) {
            d = g.rbParent;
            g.rbParent = e.rbParent;
            e = g.rbRight;
            d.rbLeft = e;
            g.rbRight = b;
            b.rbParent = g
        } else {
            g.rbParent = d;
            d = g;
            e = g.rbRight
        }
    } else {
        a = e.rbRed;
        e = g
    }
    if (e) {
        e.rbParent = d
    }
    if (a) {
        return
    }
    if (e && e.rbRed) {
        e.rbRed = false;
        return
    }
    var c;
    do {
        if (e === this.root) {
            break
        }
        if (e === d.rbLeft) {
            c = d.rbRight;
            if (c.rbRed) {
                c.rbRed = false;
                d.rbRed = true;
                this.rbRotateLeft(d);
                c = d.rbRight
            }
            if ((c.rbLeft && c.rbLeft.rbRed) || (c.rbRight && c.rbRight.rbRed)) {
                if (!c.rbRight || !c.rbRight.rbRed) {
                    if (c.rbLeft) { c.rbLeft.rbRed = false; }
                    c.rbRed = true;
                    this.rbRotateRight(c);
                    c = d.rbRight
                }
                c.rbRed = d.rbRed;
                d.rbRed = c.rbRight.rbRed = false;
                this.rbRotateLeft(d);
                e = this.root;
                break
            }
        } else {
            c = d.rbLeft;
            if (c.rbRed) {
                c.rbRed = false;
                d.rbRed = true;
                this.rbRotateRight(d);
                c = d.rbLeft
            }
            if ((c.rbLeft && c.rbLeft.rbRed) || (c.rbRight && c.rbRight.rbRed)) {
                if (!c.rbLeft || !c.rbLeft.rbRed) {
                    if (c.rbRight) { c.rbRight.rbRed = false; }
                    c.rbRed = true;
                    this.rbRotateLeft(c);
                    c = d.rbLeft
                }
                c.rbRed = d.rbRed;
                d.rbRed = c.rbLeft.rbRed = false;
                this.rbRotateRight(d);
                e = this.root;
                break
            }
        }
        c.rbRed = true;
        e = d;
        d = d.rbParent
    } while (!e.rbRed);
    if (e) {
        e.rbRed = false
    }
};
Voronoi.prototype.RBTree.prototype.rbRotateLeft = function(b) {
    var d = b,
        c = b.rbRight,
        a = d.rbParent;
    if (a) {
        if (a.rbLeft === d) {
            a.rbLeft = c
        } else {
            a.rbRight = c
        }
    } else {
        this.root = c
    }
    if (c) { c.rbParent = a; } // BUG FIX
    d.rbParent = c;
    d.rbRight = c.rbLeft;
    if (d.rbRight) {
        d.rbRight.rbParent = d
    }
    c.rbLeft = d
};
Voronoi.prototype.RBTree.prototype.rbRotateRight = function(b) {
    var d = b,
        c = b.rbLeft,
        a = d.rbParent;
    if (a) {
        if (a.rbLeft === d) {
            a.rbLeft = c
        } else {
            a.rbRight = c
        }
    } else {
        this.root = c
    }
    if (c) { c.rbParent = a; } // BUG FIX
    d.rbParent = c;
    d.rbLeft = c.rbRight;
    if (d.rbLeft) {
        d.rbLeft.rbParent = d
    }
    c.rbRight = d
};
Voronoi.prototype.RBTree.prototype.getFirst = function(a) {
    while (a.rbLeft) {
        a = a.rbLeft
    }
    return a
};
Voronoi.prototype.RBTree.prototype.getLast = function(a) {
    while (a.rbRight) {
        a = a.rbRight
    }
    return a
};
Voronoi.prototype.Diagram = function(a) {
    this.site = a
};
Voronoi.prototype.Cell = function(a) {
    this.site = a;
    this.halfedges = [];
    this.closeMe = false
};
Voronoi.prototype.Cell.prototype.init = function(a) {
    this.site = a;
    this.halfedges = [];
    this.closeMe = false;
    return this
};
Voronoi.prototype.Cell.prototype.prepareHalfedges = function() {
    var a = this.halfedges,
        b = a.length,
        c;
    while (b--) {
        c = a[b].edge;
        if (!c.vb || !c.va) {
            a.splice(b, 1)
        }
    }
    a.sort(function(e, d) {
        return d.angle - e.angle
    });
    return a.length
};
Voronoi.prototype.Cell.prototype.getNeighborIds = function() {
    var a = [],
        b = this.halfedges.length,
        c;
    while (b--) {
        c = this.halfedges[b].edge;
        if (c.lSite !== null && c.lSite.voronoiId != this.site.voronoiId) {
            a.push(c.lSite.voronoiId)
        } else {
            if (c.rSite !== null && c.rSite.voronoiId != this.site.voronoiId) {
                a.push(c.rSite.voronoiId)
            }
        }
    }
    return a
};
Voronoi.prototype.Cell.prototype.getBbox = function() {
    var h = this.halfedges,
        i = h.length,
        a, g, e, f, d = Infinity,
        c = Infinity,
        b = -Infinity,
        j = -Infinity;
    while (i--) {
        a = h[i].getStartpoint();
        g = h[i].getEndpoint();
        e = a.x;
        f = a.y;
        if (e < d) {
            d = e
        }
        if (f < c) {
            c = f
        }
        if (e > b) {
            b = e
        }
        if (f > j) {
            j = f
        }
        e = g.x;
        f = g.y;
        if (e < d) {
            d = e
        }
        if (f < c) {
            c = f
        }
        if (e > b) {
            b = e
        }
        if (f > j) {
            j = f
        }
    }
    return {
        x: d,
        y: c,
        width: b - d,
        height: j - c
    }
};
Voronoi.prototype.Cell.prototype.pointIntersection = function(a, b) {
    var h = this.halfedges,
        i = h.length,
        c, g, e, f, d;
    while (i--) {
        c = h[i];
        g = c.getStartpoint();
        e = c.getEndpoint();
        d = (b - g.y) * (e.x - g.x) - (a - g.x) * (e.y - g.y);
        if (d > 0) {
            return 0
        }
    }
    return 1
};
Voronoi.prototype.Vertex = function(a, b) {
    this.x = a;
    this.y = b
};
Voronoi.prototype.Edge = function(b, a) {
    this.lSite = b;
    this.rSite = a;
    this.va = this.vb = null
};
Voronoi.prototype.Halfedge = function(d, c, a) {
    this.site = c;
    this.edge = d;
    if (a) {
        this.angle = Math.atan2(a.y - c.y, a.x - c.x)
    } else {
        var b = d.lSite,
            e = d.rSite;
        if (b === c) {
            e = d.rSite
        } else {
            b = d.rSite;
            e = d.lSite
        }
        this.angle = Math.atan2(e.y - b.y, e.x - b.x)
    }
};
Voronoi.prototype.Halfedge.prototype.getStartpoint = function() {
    return this.edge.lSite === this.site ? this.edge.va : this.edge.vb
};
Voronoi.prototype.Halfedge.prototype.getEndpoint = function() {
    return this.edge.lSite === this.site ? this.edge.vb : this.edge.va
};
Voronoi.prototype.createVertex = function(a, b) {
    var c = this.vertexJunkyard.pop();
    if (!c) {
        c = new this.Vertex(a, b)
    } else {
        c.x = a;
        c.y = b
    }
    this.vertices.push(c);
    return c
};
Voronoi.prototype.createEdge = function(d, a, c, b) {
    var e = this.edgeJunkyard.pop();
    if (!e) {
        e = new this.Edge(d, a)
    } else {
        e.lSite = d;
        e.rSite = a;
        e.va = e.vb = null
    }
    this.edges.push(e);
    if (c) {
        this.setEdgeStartpoint(e, c)
    }
    if (b) {
        this.setEdgeEndpoint(e, b)
    }
    this.cells[d.voronoiId].halfedges.push(this.createHalfedge(e, d, a));
    this.cells[a.voronoiId].halfedges.push(this.createHalfedge(e, a, d));
    return e
};
Voronoi.prototype.createHalfedge = function(c, b, a) {
    return new this.Halfedge(c, b, a)
};
Voronoi.prototype.createCell = function(a) {
    var b = this.cellJunkyard.pop(),
        c;
    if (b) {
        return b.init(a)
    }
    return new this.Cell(a)
};
Voronoi.prototype.createBeachsection = function(a) {
    var b = this.beachsectionJunkyard.pop();
    if (!b) {
        b = new this.Beachsection
    }
    b.site = a;
    return b
};
Voronoi.prototype.createCircleEvent = function(b, c, e, d, a) {
    var f = this.circleEventJunkyard.pop();
    if (!f) {
        f = new this.CircleEvent
    }
    f.arc = b;
    f.site = c;
    f.x = e;
    f.y = d;
    f.ycenter = a;
    return f
};
Voronoi.prototype.sqrt = Math.sqrt;
Voronoi.prototype.abs = Math.abs;
Voronoi.prototype.ε = 1e-9;
Voronoi.prototype.invε = 1 / Voronoi.prototype.ε;
Voronoi.prototype.equalWithEpsilon = function(a, b) {
    return this.abs(a - b) < 1e-9
};
Voronoi.prototype.greaterThanWithEpsilon = function(a, b) {
    return a - b > 1e-9
};
Voronoi.prototype.greaterThanOrEqualWithEpsilon = function(a, b) {
    return b - a < 1e-9
};
Voronoi.prototype.lessThanWithEpsilon = function(a, b) {
    return b - a > 1e-9
};
Voronoi.prototype.lessThanOrEqualWithEpsilon = function(a, b) {
    return a - b < 1e-9
};
Voronoi.prototype.Beachsection = function() {};
Voronoi.prototype.CircleEvent = function() {
    this.arc = null;
    this.site = null;
    this.x = this.y = this.ycenter = 0
};
Voronoi.prototype.connectEdge = function(e, a) {
    var d = e.vb;
    if (d) {
        return true
    }
    var c = e.va,
        l = e.lSite,
        k = e.rSite,
        j = l.x,
        i = l.y,
        m = k.x,
        h = k.y,
        g = (j + m) / 2,
        f = (i + h) / 2,
        b, n;
    this.cells[l.voronoiId].closeMe = true;
    this.cells[k.voronoiId].closeMe = true;
    if (c) {
        b = c
    } else {
        b = this.createVertex(g, f)
    }
    if (h !== i) {
        n = this.createVertex((a.xl + a.xr) / 2, (i * i - j * j + m * m - h * h + 2 * j * a.xl - 2 * m * a.xl) / (2 * (i - h)))
    } else {
        n = this.createVertex((j * j - i * i + h * h - m * m + 2 * i * a.yt - 2 * h * a.yt) / (2 * (j - m)), (a.yt + a.yb) / 2)
    }
    e.va = b;
    e.vb = n;
    return true
};
Voronoi.prototype.clipEdge = function(d, i) {
    var b = d.va.x,
        l = d.va.y,
        h = d.vb.x,
        g = d.vb.y,
        f = 0,
        e = 1,
        k = h - b,
        j = g - l;
    var c = b - i.xl;
    if (k === 0 && c < 0) {
        return false
    }
    var a = -c / k;
    if (k < 0) {
        if (a < f) {
            return false
        }
        if (a < e) {
            e = a
        }
    } else {
        if (k > 0) {
            if (a > e) {
                return false
            }
            if (a > f) {
                f = a
            }
        }
    }
    c = i.xr - b;
    if (k === 0 && c < 0) {
        return false
    }
    a = c / k;
    if (k < 0) {
        if (a > e) {
            return false
        }
        if (a > f) {
            f = a
        }
    } else {
        if (k > 0) {
            if (a < f) {
                return false
            }
            if (a < e) {
                e = a
            }
        }
    }
    c = l - i.yt;
    if (j === 0 && c < 0) {
        return false
    }
    a = -c / j;
    if (j < 0) {
        if (a < f) {
            return false
        }
        if (a < e) {
            e = a
        }
    } else {
        if (j > 0) {
            if (a > e) {
                return false
            }
            if (a > f) {
                f = a
            }
        }
    }
    c = i.yb - l;
    if (j === 0 && c < 0) {
        return false
    }
    a = c / j;
    if (j < 0) {
        if (a > e) {
            return false
        }
        if (a > f) {
            f = a
        }
    } else {
        if (j > 0) {
            if (a < f) {
                return false
            }
            if (a < e) {
                e = a
            }
        }
    }
    if (f > 0) {
        d.va = this.createVertex(b + f * k, l + f * j)
    }
    if (e < 1) {
        d.vb = this.createVertex(b + e * k, l + e * j)
    }
    return true
};
Voronoi.prototype.clipEdges = function(e) {
    var b = this.edges,
        d = b.length,
        a, c;
    while (d--) {
        a = b[d];
        c = a.lSite !== null && a.rSite !== null;
        if (!this.connectEdge(a, e) || (c && !this.clipEdge(a, e)) || (!c && this.abs(a.lSite.y - a.rSite.y) < 1e-9)) {
            a.va = a.vb = null;
            b.splice(d, 1)
        }
    }
};
Voronoi.prototype.closeCells = function(b) {
    var g = this.cells,
        a = g.length,
        f, e, d, c;
    while (a--) {
        f = g[a];
        if (!f.prepareHalfedges()) {
            continue
        }
        if (!f.closeMe) {
            continue
        }
        e = f.halfedges;
        d = e.length;
        c = 0;
        while (c < d) {
            if (e[c].getEndpoint() && e[(c + 1) % d].getStartpoint()) {
                if (this.equalWithEpsilon(e[c].getEndpoint().x, e[(c + 1) % d].getStartpoint().x) && this.equalWithEpsilon(e[c].getEndpoint().y, e[(c + 1) % d].getStartpoint().y)) {
                    c++;
                    continue
                }
            }
            e.splice((c + 1) % d, 0, this.createHalfedge(this.createEdge(f.site, null, e[c].getEndpoint(), e[(c + 1) % d].getStartpoint()), f.site, null));
            d++;
            c++
        }
    }
};
Voronoi.prototype.quantizeSites = function(c) {
    var b = this.ε,
        a = c.length,
        d;
    while (a--) {
        d = c[a];
        d.x = Math.floor(d.x / b) * b;
        d.y = Math.floor(d.y / b) * b
    }
};
Voronoi.prototype.recycle = function(a) {
    if (a) {
        if (a.diagram) {
            this.recycle(a.diagram)
        } else {
            if (a.cells) {
                this.recycle(a.cells)
            } else {
                if (a.edges) {
                    this.recycle(a.edges)
                } else {
                    if (a.vertices) {
                        this.recycle(a.vertices)
                    }
                }
            }
        }
    } else {
        if (this.toRecycle) {
            this.recycle(this.toRecycle.diagram)
        }
    }
    if (this.toRecycle) {
        this.vertexJunkyard = this.vertexJunkyard.concat(this.toRecycle.vertices);
        this.edgeJunkyard = this.edgeJunkyard.concat(this.toRecycle.edges);
        this.cellJunkyard = this.cellJunkyard.concat(this.toRecycle.cells);
        this.toRecycle = null
    }
};
Voronoi.prototype.compute = function(i, j) {
    var d = new Date;
    this.reset();
    if (this.toRecycle) {
        this.vertexJunkyard = this.vertexJunkyard.concat(this.toRecycle.vertices);
        this.edgeJunkyard = this.edgeJunkyard.concat(this.toRecycle.edges);
        this.cellJunkyard = this.cellJunkyard.concat(this.toRecycle.cells);
        this.toRecycle = null
    }
    var e = i.slice(0);
    e.sort(function(l, k) {
        var m = k.y - l.y;
        if (m) {
            return m
        }
        return k.x - l.x
    });
    var b = e.pop(),
        g = 0,
        f, a, k;
    this.cells = new Array(i.length);
    var h = i.length;
    while (h--) {
        i[h].voronoiId = h;
        this.cells[h] = this.createCell(i[h])
    }
    while (true) {
        k = this.firstCircleEvent;
        if (b && (!k || b.y < k.y || (b.y === k.y && b.x < k.x))) {
            f = b;
            b = e.pop()
        } else {
            if (k) {
                f = k.site
            } else {
                break
            }
        }
        this.addBeachsection(f);
        if (k) {
            this.removeCircleEvent(k);
            a = k.arc;
            this.removeBeachsection(a)
        }
    }
    this.clipEdges(j);
    this.closeCells(j);
    var m = new Date;
    var l = {
        vertices: this.vertices,
        edges: this.edges,
        cells: this.cells,
        execTime: m.getTime() - d.getTime()
    };
    this.toRecycle = l;
    return l
};
Voronoi.prototype.addBeachsection = function(a) {
    var j = a.x,
        p = a.y,
        l = null,
        k = null,
        g, i, h = this.beachline.root;
    if (!h) {
        this.beachline.root = this.createBeachsection(a);
        return
    }
    while (h) {
        g = this.leftBreak(h, p) - j;
        if (g > this.ε) {
            h = h.rbLeft
        } else {
            i = j - this.rightBreak(h, p);
            if (i > this.ε) {
                if (!h.rbRight) {
                    l = h;
                    break
                }
                h = h.rbRight
            } else {
                if (g > -this.ε) {
                    l = h.rbPrevious;
                    k = h
                } else {
                    if (i > -this.ε) {
                        l = h;
                        k = h.rbNext
                    } else {
                        l = k = h
                    }
                }
                break
            }
        }
    }
    var c = this.createBeachsection(a);
    this.beachline.rbInsertSuccessor(l, c);
    if (!l && !k) {
        return
    }
    if (l === k) {
        this.removeCircleEvent(l.circleEvent);
        k = this.createBeachsection(l.site);
        this.beachline.rbInsertSuccessor(c, k);
        c.edge = k.edge = this.createEdge(l.site, c.site);
        this.addCircleEvent(l, c, k);
        return
    }
    if (l) {
        if (k) {
            this.removeCircleEvent(l.circleEvent);
            this.removeCircleEvent(k.circleEvent);
            var o = l.site,
                q = o.x,
                r = o.y,
                t = a.x - q,
                s = a.y - r,
                e = k.site,
                d = e.x - q,
                b = e.y - r,
                f = 2 * (t * b - s * d),
                n = t * t + s * s,
                m = d * d + b * b,
                u = this.createVertex((b * n - s * m) / f + q, (t * m - d * n) / f + r);
            this.setEdgeEndpoint(l.edge, o, e, u);
            c.edge = this.createEdge(o, a, undefined, u);
            k.edge = this.createEdge(a, e, undefined, u);
            this.addCircleEvent(l, c, k);
            return
        }
    }
    c.edge = this.createEdge(l.site, k.site)
};
Voronoi.prototype.removeBeachsection = function(a) {
    var c = a.circleEvent,
        j = c.x,
        i = c.ycenter,
        b = this.createVertex(j, i),
        f = a.rbPrevious,
        d = a.rbNext,
        l = [a],
        g = Math.abs;
    this.detachBeachsection(a);
    var e = f;
    while (e.circleEvent && g(j - e.circleEvent.x) < 1e-9 && g(i - e.circleEvent.ycenter) < 1e-9) {
        f = e.rbPrevious;
        l.unshift(e);
        this.detachBeachsection(e);
        e = f
    }
    l.push(d);
    var k = d;
    while (k.circleEvent && g(j - k.circleEvent.x) < 1e-9 && g(i - k.circleEvent.ycenter) < 1e-9) {
        d = k.rbNext;
        l.push(k);
        this.detachBeachsection(k);
        k = d
    }
    var m = l.length,
        h;
    for (h = 1; h < m; h++) {
        k = l[h];
        e = l[h - 1];
        this.setEdgeStartpoint(k.edge, e.site, k.site, b)
    }
    e = l[0];
    k = l[m - 1];
    k.edge = this.createEdge(e.site, k.site, undefined, b);
    this.addCircleEvent(e, k, b)
};
Voronoi.prototype.addCircleEvent = function(c, m, j) {
    var g = c.site,
        l = m.site,
        i = g.x,
        h = g.y,
        f = l.x,
        e = l.y,
        d = j.x,
        b = j.y;
    var o = i - f,
        n = h - e,
        r = d - f,
        q = b - e;
    var s = 2 * (o * q - n * r);
    if (s >= -this.ε) {
        return
    }
    var k = o * o + n * n,
        p = r * r + q * q,
        a = (q * k - n * p) / s,
        t = (o * p - r * k) / s,
        v = t + e;
    var u = this.createCircleEvent(m, j, a + f, v, v + this.sqrt(a * a + t * t));
    m.circleEvent = u;
    var w = null,
        x = this.circleEvents.root;
    while (x) {
        if (u.ycenter > x.ycenter || (u.ycenter === x.ycenter && u.x >= x.x)) {
            w = x;
            x = x.rbRight
        } else {
            x = x.rbLeft
        }
    }
    this.circleEvents.rbInsertSuccessor(w, u);
    if (!w) {
        this.firstCircleEvent = u
    }
};
Voronoi.prototype.detachBeachsection = function(a) {
    this.removeCircleEvent(a.circleEvent);
    this.beachline.rbRemoveNode(a);
    this.beachsectionJunkyard.push(a)
};
Voronoi.prototype.removeCircleEvent = function(a) {
    if (a) {
        if (!a.rbPrevious) {
            this.firstCircleEvent = a.rbNext
        }
        this.circleEvents.rbRemoveNode(a);
        this.circleEventJunkyard.push(a)
    }
};
Voronoi.prototype.leftBreak = function(a, c) {
    var d = a.site,
        b = d.x,
        f = d.y,
        e = f - c;
    if (!e) {
        return b
    }
    if (!a.rbPrevious) {
        return -Infinity
    }
    d = a.rbPrevious.site;
    var g = d.x,
        i = d.y,
        h = i - c;
    if (!h) {
        return g
    }
    return Math.max((g * h - b * e + this.sqrt((b - g) * (b - g) + (e - h) * (e - h)) * this.sqrt(e * h)) / (h - e), (this.sqrt((d.x - a.site.x) * (d.x - a.site.x) + (h - e) * (h - e)) * this.sqrt(e * h) + g * h - b * e) / (h - e))
};
Voronoi.prototype.rightBreak = function(a, c) {
    var d = a.site,
        b = d.x,
        f = d.y,
        e = f - c;
    if (!e) {
        return b
    }
    if (!a.rbNext) {
        return Infinity
    }
    d = a.rbNext.site;
    var g = d.x,
        i = d.y,
        h = i - c;
    if (!h) {
        return g
    }
    return Math.min((g * h - b * e + this.sqrt((b - g) * (b - g) + (e - h) * (e - h)) * this.sqrt(e * h)) / (h - e), (this.sqrt((d.x - a.site.x) * (d.x - a.site.x) + (h - e) * (h - e)) * this.sqrt(e * h) + g * h - b * e) / (h - e))
};