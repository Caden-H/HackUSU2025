import * as PIXI from 'pixi.js';
import { Wall } from './wall';

export class Bullet {
  public sprite: PIXI.Graphics;
  public isExpired: boolean = false;

  public vx: number;
  public vy: number;
  public speed: number;
  public radius: number;
  public slowdown: number; // slowdown factor (per second)

  // Explosion state (after pre-explosion)
  private explosionTriggered: boolean = false;
  private explosionDuration: number = 1; // how long the explosion effect lasts
  private explosionElapsed: number = 0;   // timer for explosion effect

  // Pre-explosion (flashing) state:
  private preExplosionActive: boolean = false;
  private preExplosionDelay: number = 1;  // time to flash before explosion starts
  private preExplosionElapsed: number = 0;  // timer for pre-explosion flashing

  // Accept speed as a parameter (default to 240 if not provided)
  constructor(
    x: number,
    y: number,
    dx: number,
    dy: number,
    speed: number = 240,
    radius: number,
    color: number,
    slowdown: number = 0.2 // default slowdown factor; adjust as needed
  ) {
    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(color);
    this.sprite.drawCircle(0, 0, radius);
    this.sprite.endFill();

    this.radius = radius;
    this.sprite.x = x;
    this.sprite.y = y;

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

    this.slowdown = slowdown;
  }

  /**
   * Update method now accepts a boundary parameter.
   */
  public update(delta: number, boundary: Wall): void {
    if (this.isExpired) return;

    // --- Pre-explosion (flashing) state ---
    if (this.preExplosionActive && !this.explosionTriggered) {
      this.preExplosionElapsed += delta;
      const flashFrequency = 5; // flashes per second (adjust as needed)
      this.sprite.alpha = (Math.sin(2 * Math.PI * flashFrequency * this.preExplosionElapsed) + 1) / 2;
      if (this.preExplosionElapsed >= this.preExplosionDelay) {
        this.triggerExplosion();
      }
      return;
    }

    // --- Explosion state ---
    if (this.explosionTriggered) {
      this.explosionElapsed += delta;
      if (this.explosionElapsed >= this.explosionDuration) {
        this.isExpired = true;
      }
      return;
    }

    // --- Normal Movement ---
    // Update position.
    this.sprite.x += this.vx * delta;
    this.sprite.y += this.vy * delta;

    // Check if bullet is outside the boundary.
    const { inside, closestSegment } = boundary.contains(this.sprite.x, this.sprite.y);
    if (!inside) {
      // Teleport bullet to the closest point on the wall.
      const nearest = boundary.nearestPoint(this.sprite.x, this.sprite.y);
      this.sprite.x = nearest.x;
      this.sprite.y = nearest.y;

      // Reflect the velocity relative to the wall's angle.
      // Compute the segment vector from the closest segment.
      const segX = closestSegment.p2.x - closestSegment.p1.x;
      const segY = closestSegment.p2.y - closestSegment.p1.y;
      // A candidate normal is (-segY, segX).
      let nx = -segY;
      let ny = segX;
      const nMag = Math.sqrt(nx * nx + ny * ny);
      if (nMag !== 0) {
        nx /= nMag;
        ny /= nMag;
      }
      // Determine correct orientation:
      // Use the midpoint of the segment and the bullet's position.
      const midX = (closestSegment.p1.x + closestSegment.p2.x) / 2;
      const midY = (closestSegment.p1.y + closestSegment.p2.y) / 2;
      const dX = this.sprite.x - midX;
      const dY = this.sprite.y - midY;
      if (nx * dX + ny * dY < 0) {
        nx = -nx;
        ny = -ny;
      }
      // Reflect: new_v = v - 2*(v dot n)*n.
      const dot = this.vx * nx + this.vy * ny;
      this.vx = this.vx - 2 * dot * nx;
      this.vy = this.vy - 2 * dot * ny;
    }

    // Apply slowdown.
    this.vx *= (1 - this.slowdown * delta);
    this.vy *= (1 - this.slowdown * delta);

    // Check current speed.
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed < 60 && !this.preExplosionActive) {
      this.preExplosionActive = true;
      this.preExplosionElapsed = 0;
      this.sprite.alpha = 1;
    }
  }

  private triggerExplosion(): void {
    // Clear the current graphics.
    this.sprite.clear();
    // Double the radius for explosion effect.
    this.radius = this.radius * 2;
    // Draw the explosion effect (a larger, orange circle).
    const explosionColor = 0xffa500; // orange
    this.sprite.beginFill(explosionColor);
    this.sprite.drawCircle(0, 0, this.radius);
    this.sprite.endFill();

    // Begin explosion mode.
    this.explosionTriggered = true;
    this.explosionElapsed = 0;
    // Reset alpha.
    this.sprite.alpha = 1;
  }
}
