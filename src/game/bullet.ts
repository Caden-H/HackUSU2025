import * as PIXI from 'pixi.js';

export class Bullet {
  public sprite: PIXI.Graphics;
  public isExpired: boolean = false;

  public vx: number;
  public vy: number;
  public speed: number;
  public radius: number;
  private bounces: number = 0;
  private maxBounces: number;

  // Accept speed as a parameter (default to 5 if not provided)
  constructor(x: number, y: number, dx: number, dy: number, speed: number = 5, radius: number, color: number, maxBounces: number = 2) {
    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(color);
    this.sprite.drawCircle(0, 0, radius);
    this.sprite.endFill();

    this.radius = radius
    this.sprite.x = x;
    this.sprite.y = y;

    this.maxBounces = maxBounces;

    // Normalize the direction vector.
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag !== 0) {
      dx /= mag;
      dy /= mag;
    } else {
      dx = 1;
      dy = 0;
    }

    this.speed = speed;
    this.vx = dx * this.speed;
    this.vy = dy * this.speed;
  }

  public update(delta: number): void {
    if (this.isExpired) return;

    // Move the bullet.
    this.sprite.x += this.vx * delta;
    this.sprite.y += this.vy * delta;

    // Assume a game area of size window.innerHeight.
    const size = window.innerHeight;

    // Bounce off left/right.
    if (this.sprite.x < 0) {
      this.sprite.x = 0;
      this.vx *= -1;
      this.bounces++;
    } else if (this.sprite.x > size) {
      this.sprite.x = size;
      this.vx *= -1;
      this.bounces++;
    }

    // Bounce off top/bottom.
    if (this.sprite.y < 0) {
      this.sprite.y = 0;
      this.vy *= -1;
      this.bounces++;
    } else if (this.sprite.y > size) {
      this.sprite.y = size;
      this.vy *= -1;
      this.bounces++;
    }

    // Expire the bullet after too many bounces.
    if (this.bounces > this.maxBounces) {
      this.isExpired = true;
    }
  }
}
