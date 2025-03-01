import * as PIXI from 'pixi.js';
import { Bullet } from './bullet';

export class Gun {
  public sprite: PIXI.Sprite;
  private direction = { x: 1, y: 0 };
  private bulletsRef: Bullet[] = [];
  private stageRef?: PIXI.Container;

  // Record when the game started.
  public gameStartTime: number = performance.now();

  // Base cooldown in ms (at game start), and minimum cooldown.
  private baseCooldown: number = 1000;
  private minCooldown: number = 100;
  private lastShotTime: number = 0;

  // Offset distance for bullet spawn.
  private offset: number = 30;

  constructor(sprite: PIXI.Sprite, x: number, y: number, color: number) {
    this.sprite = sprite;
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.tint = color;
  }

  /**
   * Provide an array of bullets and the stage, so we can spawn new bullets.
   */
  public setBulletArray(bullets: Bullet[], stage: PIXI.Container) {
    this.bulletsRef = bullets;
    this.stageRef = stage;
  }

  public setDirection(x: number, y: number): void {
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 0.15) {
      this.direction.x = x / magnitude;
      this.direction.y = y / magnitude;
    }
    
    if (x !== 0 || y !== 0) {
      this.sprite.rotation = Math.atan2(y, x) + Math.PI / 2;
    }
  }

  /**
   * Shoot a bullet from the player's center plus some offset in the gun's direction.
   * The cooldown decreases over time (but never goes below minCooldown)
   * and bullet speed increases with elapsed time.
   */
  public shoot(originX: number, originY: number): void {
    if (!this.stageRef || !this.sprite.visible) return;

    const now = performance.now();
    // Calculate elapsed time (in ms) since the game started.
    const elapsedTime = now - this.gameStartTime;

    // Example: reduce cooldown linearly (with a rate, but clamp at minCooldown).
    const cooldownDecreaseRate = 0.05; // ms reduction per ms elapsed (tweak as needed)
    const currentCooldown = Math.max(this.minCooldown, this.baseCooldown - elapsedTime * cooldownDecreaseRate);

    if (now - this.lastShotTime < currentCooldown) {
      return;
    }
    this.lastShotTime = now;

    // Example: Increase bullet speed over time.
    const baseBulletSpeed = 5;
    const bulletSpeedIncreaseRate = 0.001; // speed increase per ms elapsed (tweak as needed)
    const currentBulletSpeed = baseBulletSpeed + elapsedTime * bulletSpeedIncreaseRate;

    // Spawn bullet at offset from the player center.
    const bulletX = originX + this.direction.x * this.offset;
    const bulletY = originY + this.direction.y * this.offset;

    // Pass currentBulletSpeed into the Bullet constructor.
    const bullet = new Bullet(bulletX, bulletY, this.direction.x, this.direction.y, currentBulletSpeed);
    this.bulletsRef.push(bullet);
    this.stageRef.addChild(bullet.sprite);
  }
}
