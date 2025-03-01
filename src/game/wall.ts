import * as PIXI from 'pixi.js';

export class Wall {
    private points: PIXI.Point[];

    constructor(points: PIXI.Point[]) {
        this.points = points;
    }

    public draw(): PIXI.Graphics {
        const gfx = new PIXI.Graphics();
        gfx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            gfx.lineTo(this.points[i].x, this.points[i].y);
        }
        gfx.lineTo(this.points[0].x, this.points[0].y);
        gfx.stroke({
          color: 0xff0000,
          width: 1,
          alignment: 0.5,
        });
        return gfx;
    }

    // Detect if point is inside the wall and find the closest segment
    public contains(x: number, y: number): { inside: boolean, closestSegment: { p1: PIXI.Point, p2: PIXI.Point } } {
        let inside = false;
        let closestSegment = { p1: this.points[0], p2: this.points[1]};
        let minDistance = Infinity;

        for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            const xi = this.points[i].x;
            const yi = this.points[i].y;
            const xj = this.points[j].x;
            const yj = this.points[j].y;

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;

            const distance = this.pointToSegmentDistance(x, y, xi, yi, xj, yj);
            if (distance < minDistance) {
                minDistance = distance;
                closestSegment = { p1: this.points[i], p2: this.points[j] };
            }
        }

        return { inside, closestSegment };
    }

    public nearestPoint(x: number, y: number): PIXI.Point {
        let minDistance = Infinity;
        let closestPoint = new PIXI.Point(0, 0);

        for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
            const xi = this.points[i].x;
            const yi = this.points[i].y;
            const xj = this.points[j].x;
            const yj = this.points[j].y;

            const distance = this.pointToSegmentDistance(x, y, xi, yi, xj, yj);
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = this.nearestPointOnSegment(x, y, xi, yi, xj, yj);
            }
        }

        return closestPoint;
    }

    // Calculate the distance from a point to a line segment
    private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const p = this.nearestPointOnSegment(px, py, x1, y1, x2, y2);
        const dx = px - p.x;
        const dy = py - p.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    private nearestPointOnSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): PIXI.Point {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        if (len_sq !== 0) param = dot / len_sq;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        return new PIXI.Point(xx, yy);
    }
}