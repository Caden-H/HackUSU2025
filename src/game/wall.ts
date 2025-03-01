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
}