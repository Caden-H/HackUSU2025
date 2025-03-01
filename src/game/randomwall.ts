import * as PIXI from 'pixi.js';

export class RandomWall {
  public points: PIXI.Point[];

  /**
   * Constructs a new RandomWall. It randomly chooses one of several
   * predefined wall shapes using the provided width and height.
   * @param width The width of the game area.
   * @param height The height of the game area.
   */
  constructor(width: number, height: number) {
    // Array of shape generator functions.
    const shapes: ((w: number, h: number) => PIXI.Point[])[] = [
      this.squareShape,
      this.octagonShape,
      this.funnelShape,
      this.mazeShape,
      this.zigzagShape
    ];

    // Pick one shape at random.
    const randomIndex = Math.floor(Math.random() * shapes.length);
    this.points = shapes[randomIndex](width, height);
  }

  /**
   * Returns points for a simple square.
   */
  private squareShape(w: number, h: number): PIXI.Point[] {
    return [
      new PIXI.Point(10, 10),
      new PIXI.Point(w - 10, 10),
      new PIXI.Point(w - 10, h - 10),
      new PIXI.Point(10, h - 10)
    ];
  }

  /**
   * Returns points for an octagon centered in the game area.
   */
  private octagonShape(w: number, h: number): PIXI.Point[] {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 10;
    const points: PIXI.Point[] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (2 * Math.PI * i) / 8;
      points.push(new PIXI.Point(cx + r * Math.cos(angle), cy + r * Math.sin(angle)));
    }
    return points;
  }

  /**
   * Returns points for two funnels pointing toward each other in the middle.
   */
  private funnelShape(w: number, h: number): PIXI.Point[] {
    return [
      new PIXI.Point(10, 10),
      new PIXI.Point(w / 2 - 50, 10),
      new PIXI.Point(w / 2, h / 2 - 30),
      new PIXI.Point(w / 2 + 50, 10),
      new PIXI.Point(w - 10, 10),
      new PIXI.Point(w - 10, h - 10),
      new PIXI.Point(w / 2 + 50, h - 10),
      new PIXI.Point(w / 2, h / 2 + 30),
      new PIXI.Point(w / 2 - 50, h - 10),
      new PIXI.Point(10, h - 10)
    ];
  }

  /**
   * Returns points for a maze-like wall with protrusions.
   */
  private mazeShape(w: number, h: number): PIXI.Point[] {
    return [
      new PIXI.Point(10, 10),
      new PIXI.Point(w - 10, 10),
      new PIXI.Point(w - 10, h / 2 - 20),
      new PIXI.Point((w * 3) / 4, h / 2 - 20),
      new PIXI.Point((w * 3) / 4, h / 2 + 20),
      new PIXI.Point(w - 10, h / 2 + 20),
      new PIXI.Point(w - 10, h - 10),
      new PIXI.Point(10, h - 10),
      new PIXI.Point(10, h / 2 + 20),
      new PIXI.Point(w / 4, h / 2 + 20),
      new PIXI.Point(w / 4, h / 2 - 20),
      new PIXI.Point(10, h / 2 - 20)
    ];
  }

  /**
   * Returns points for a zigzag perimeter wall.
   */
  private zigzagShape(w: number, h: number): PIXI.Point[] {
    const points: PIXI.Point[] = [];
    const margin = 10;
    const numZigs = 5;
    // Top edge: zigzag from left to right.
    for (let i = 0; i <= numZigs; i++) {
      const x = margin + ((w - 2 * margin) * i) / numZigs;
      const y = i % 2 === 0 ? margin : margin + 20;
      points.push(new PIXI.Point(x, y));
    }
    // Right edge.
    for (let i = 1; i <= numZigs; i++) {
      const y = margin + ((h - 2 * margin) * i) / numZigs;
      const x = i % 2 === 0 ? w - margin : w - margin - 20;
      points.push(new PIXI.Point(x, y));
    }
    // Bottom edge.
    for (let i = 1; i <= numZigs; i++) {
      const x = w - margin - ((w - 2 * margin) * i) / numZigs;
      const y = i % 2 === 0 ? h - margin : h - margin - 20;
      points.push(new PIXI.Point(x, y));
    }
    // Left edge.
    for (let i = 1; i < numZigs; i++) {
      const y = h - margin - ((h - 2 * margin) * i) / numZigs;
      const x = i % 2 === 0 ? margin : margin + 20;
      points.push(new PIXI.Point(x, y));
    }
    return points;
  }
}
