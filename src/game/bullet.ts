import * as PIXI from 'pixi.js';

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

  public update(delta: number): void {
    if (this.isExpired) return;

    // If in pre-explosion (flashing) state, update that timer and flash.
    if (this.preExplosionActive && !this.explosionTriggered) {
      this.preExplosionElapsed += delta;
      // Flashing effect: modulate alpha using a sine wave.
      const flashFrequency = 5; // flashes per second (adjust as needed)
      this.sprite.alpha = (Math.sin(2 * Math.PI * flashFrequency * this.preExplosionElapsed) + 1) / 2;
      if (this.preExplosionElapsed >= this.preExplosionDelay) {
        this.triggerExplosion();
      }
      return;
    }

    // If explosion has already been triggered, update explosion timer.
    if (this.explosionTriggered) {
      this.explosionElapsed += delta;
      if (this.explosionElapsed >= this.explosionDuration) {
        this.isExpired = true;
      }
      return;
    }

    // Normal movement.
    this.sprite.x += this.vx * delta;
    this.sprite.y += this.vy * delta;

    // Bounce off walls.
    const size = window.innerHeight;
    if (this.sprite.x < 0) {
      this.sprite.x = 0;
      this.vx *= -1;
    } else if (this.sprite.x > size) {
      this.sprite.x = size;
      this.vx *= -1;
    }
    if (this.sprite.y < 0) {
      this.sprite.y = 0;
      this.vy *= -1;
    } else if (this.sprite.y > size) {
      this.sprite.y = size;
      this.vy *= -1;
    }

    // Apply slowdown to the velocity.
    this.vx *= (1 - this.slowdown * delta);
    this.vy *= (1 - this.slowdown * delta);

    // Check current speed.
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    // When speed falls below threshold and not already in pre-explosion mode,
    // start the pre-explosion (flashing) phase.
    if (currentSpeed < 60 && !this.preExplosionActive) {
      this.preExplosionActive = true;
      this.preExplosionElapsed = 0;
      // Optionally ensure full opacity at the start.
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
    // Reset alpha to 1.
    this.sprite.alpha = 1;
  }
}
