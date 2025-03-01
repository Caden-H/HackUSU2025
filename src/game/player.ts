import * as PIXI from 'pixi.js';
import { Gun } from './gun';
import { Bullet } from './bullet';

export class Player {
  public sprite: PIXI.Sprite;
  public gun: Gun;
  public vx: number = 0;
  public vy: number = 0;
  public speed: number = 180;
  public radius: number = 20;
  public isDead: boolean = false;

  private bulletArray: Bullet[] = [];

  constructor(
    body_sprite: PIXI.Sprite,
    gun_sprite: PIXI.Sprite,
    x: number,
    y: number,
    body_color: number,
    gun_color: number
  ) {
    this.sprite = body_sprite;
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.tint = body_color;
    this.sprite.scale = 0.2;
    gun_sprite.scale = this.sprite.scale;

    this.gun = new Gun(gun_sprite, x, y, gun_color);
  }

  public setBulletArray(bullets: Bullet[]) {
    this.bulletArray = bullets;
  }

  public update(delta: number) {
    if (this.isDead) return;

    // Update position with velocity (physics update)
    this.sprite.x += this.vx * delta;
    this.sprite.y += this.vy * delta;
    this.gun.sprite.x = this.sprite.x;
    this.gun.sprite.y = this.sprite.y;

    // Apply friction/damping so the bounce effect decays over time.
    const damping = 1 - 6 * delta;
    this.vx *= damping;
    this.vy *= damping;

    // Basic collision detection with bullets
    for (const bullet of this.bulletArray) {
      if (!bullet.isExpired) {
        const dx = bullet.sprite.x - this.sprite.x;
        const dy = bullet.sprite.y - this.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // sum of radii = 20 (player) + 5 (bullet) = 25
        if (dist < (this.radius + bullet.radius)) {
          this.isDead = true;
          this.sprite.visible = false;
          this.gun.sprite.visible = false;
          bullet.isExpired = true;
          break;
        }
      }
    }
  }


  public move(xAxis: number, yAxis: number, shouldRotate: boolean = true) {
    if (this.isDead) return;

    if (xAxis !== 0 || yAxis !== 0) {
      const desiredVX = xAxis * this.speed;
      const desiredVY = yAxis * this.speed;

      // Calculate current velocity magnitude.
      const currentVelMag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

      // If the current velocity is low (or at most equal to speed), snap to the desired velocity.
      if (currentVelMag <= this.speed) {
        this.vx = desiredVX;
        this.vy = desiredVY;
      }  else {
        const lerpFactor = 0.01; // Adjust between 0 and 1 to control influence.
        this.vx = this.vx + (desiredVX - this.vx) * lerpFactor;
        this.vy = this.vy + (desiredVY - this.vy) * lerpFactor;
      }

      // Update rotation to face the input direction.
      if (shouldRotate) {
        this.sprite.rotation = Math.atan2(yAxis, xAxis) + Math.PI / 2;
      }
    } else {
        const currentVelMag = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentVelMag <= this.speed) {
            this.vx = 0;
            this.vy = 0;
        }
    }
  }
}
