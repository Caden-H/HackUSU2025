import * as PIXI from 'pixi.js';

export class Bullet {
  public sprite: PIXI.Graphics;
  public isExpired: boolean = false;

  private vx: number;
  private vy: number;
  private speed: number = 5;

  private bounces: number = 0;
  private maxBounces: number = 3;

  constructor(x: number, y: number, dx: number, dy: number) {
    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(0xffffff);
    this.sprite.drawCircle(0, 0, 5);
    this.sprite.endFill();

    this.sprite.x = x;
    this.sprite.y = y;

    // Normalize direction so speed is consistent
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag !== 0) {
      dx /= mag;
      dy /= mag;
    } else {
      dx = 1;
      dy = 0;
    }

    this.vx = dx * this.speed;
    this.vy = dy * this.speed;
  }

  public update(delta: number): void {
    if (this.isExpired) return;

    // Move the bullet
    this.sprite.x += this.vx;
    this.sprite.y += this.vy;

    // We'll assume a game area the size of window.innerHeight
    const size = window.innerHeight;

    // Bounce left/right
    if (this.sprite.x < 0) {
      this.sprite.x = 0;
      this.vx *= -1;
      this.bounces++;
    } else if (this.sprite.x > size) {
      this.sprite.x = size;
      this.vx *= -1;
      this.bounces++;
    }

    // Bounce top/bottom
    if (this.sprite.y < 0) {
      this.sprite.y = 0;
      this.vy *= -1;
      this.bounces++;
    } else if (this.sprite.y > size) {
      this.sprite.y = size;
      this.vy *= -1;
      this.bounces++;
    }

    // If we've bounced too many times, expire
    if (this.bounces > this.maxBounces) {
      this.isExpired = true;
    }
  }
}
