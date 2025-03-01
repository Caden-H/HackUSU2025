import * as PIXI from 'pixi.js';
import { Bullet } from './bullet';

export class Gun {
  private direction = { x: 1, y: 0 };
  private bulletsRef: Bullet[] = [];
  private stageRef?: PIXI.Container;

  // Cooldown in ms
  private cooldown: number = 500;
  private lastShotTime: number = 0;

  // The offset distance for bullet spawn (matches the line in main.ts)
  private offset: number = 50;

  /**
   * Provide an array of bullets and the stage, so we can spawn new bullets.
   */
  public setBulletArray(bullets: Bullet[], stage: PIXI.Container) {
    this.bulletsRef = bullets;
    this.stageRef = stage;
  }

  /**
   * Called from main.ts's readGamepads() to aim the gun.
   * We also get the player's center if we need it for anything else,
   * but here we only store the direction vector.
   */
  public setDirection(x: number, y: number, _originX: number, _originY: number): void {
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 0.15) {
      this.direction.x = x / magnitude;
      this.direction.y = y / magnitude;
    }
  }

  /**
   * Shoot a bullet from the player's center plus some offset in the gun's direction.
   */
  public shoot(originX: number, originY: number): void {
    if (!this.stageRef) return;

    const now = performance.now();
    if (now - this.lastShotTime < this.cooldown) {
      return;
    }
    this.lastShotTime = now;

    // Spawn bullet at offset from the player center
    const bulletX = originX + this.direction.x * this.offset;
    const bulletY = originY + this.direction.y * this.offset;
    console.log(this.direction.x)
    console.log(this.direction.y)

    const bullet = new Bullet(bulletX, bulletY, this.direction.x, this.direction.y);
    this.bulletsRef.push(bullet);
    this.stageRef.addChild(bullet.sprite);
  }
}
