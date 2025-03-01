import * as PIXI from 'pixi.js';
import { Bullet } from './bullet';
import { vibrateGamepad } from "./vibration";
// Import the Player type if needed so TypeScript knows about vx and vy.
import { Player } from './player';

export class Gun {
  public sprite: PIXI.Sprite;
  private direction = { x: 1, y: 0 };
  private bulletsRef: Bullet[] = [];
  private stageRef?: PIXI.Container;

  // A reference to the player who owns this gun, so we can apply recoil.
  private owner: Player;

  // Track game start (for normal shot cooldown, etc.)
  public gameStartTime: number = performance.now();

  // Base values for normal shot.
  private baseCooldown: number = 500;
  private minCooldown: number = 500;
  private lastShotTime: number = 0;
  private offset: number = 28; // spawn offset
  private offsetMult: number = 1; // number of radii added to spawn offset

  // For charge shot
  private isCharging: boolean = false;
  private chargeStartTime: number = 0;
  private maxCharge: number = 3000; // 3 seconds

  // The strength of recoil when a shot is fully charged
  private recoilPower: number = 450;

  // Charge indicator graphic for animation.
  private chargeIndicator: PIXI.Graphics;

  /**
   * @param sprite The gun sprite.
   * @param x Initial x position.
   * @param y Initial y position.
   * @param color Tint for the gun.
   * @param owner The Player owning this gun (so we can adjust their vx, vy for recoil).
   */
  constructor(sprite: PIXI.Sprite, x: number, y: number, color: number, owner: Player) {
    this.sprite = sprite;
    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.tint = color;
    this.owner = owner;

    // Create the charge indicator (initially invisible)
    this.chargeIndicator = new PIXI.Graphics();
    this.chargeIndicator.visible = false;

    // Set initial direction to (1, 0)
    this.setDirection(1, 0);
  }

  public setBulletArray(bullets: Bullet[], stage: PIXI.Container) {
    this.bulletsRef = bullets;
    this.stageRef = stage;
    // Add the charge indicator to the stage so it renders above the gun.
    this.stageRef.addChild(this.chargeIndicator);
  }

  public setDirection(x: number, y: number): void {
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude !== 0) {
      this.direction.x = x / magnitude;
      this.direction.y = y / magnitude;
    }

    if (x !== 0 || y !== 0) {
      this.sprite.rotation = Math.atan2(y, x) + Math.PI / 2;
    }
  }

  /**
   * Fire a normal shot.
   */
  public shootNormal(originX: number, originY: number, gp?: Gamepad): void {
    if (!this.stageRef || !this.sprite.visible || this.isCharging) return;

    const now = performance.now();
    const elapsedTime = now - this.gameStartTime;
    const cooldownDecreaseRate = 0.05;
    const currentCooldown = Math.max(this.minCooldown, this.baseCooldown - elapsedTime * cooldownDecreaseRate);

    if (now - this.lastShotTime < currentCooldown) return;
    this.lastShotTime = now;

    const baseBulletSpeed = 240;
    // Normal shot uses base parameters:
    const bulletX = originX + this.direction.x * (this.offset + 5);
    const bulletY = originY + this.direction.y * (this.offset + 5);

    // Create a bullet with base speed, base radius (5), white color.
    const bullet = new Bullet(
      bulletX,
      bulletY,
      this.direction.x,
      this.direction.y,
      baseBulletSpeed,
      5,
      0xffffff
    );
    this.bulletsRef.push(bullet);
    this.stageRef.addChild(bullet.sprite);

    // Vibrate after successfully firing the bullet
    if (gp) {
      vibrateGamepad(gp, 50, 0.8, 0.4); // Using fixed duration
    }
  }

  /**
   * Call this each frame with the current state of the charge button.
   * If chargeButtonPressed is true, then start (or continue) charging.
   * When it becomes false, release the charged shot.
   */
  public updateCharge(originX: number, originY: number, chargeButtonPressed: boolean, gp?: Gamepad): void {
    const now = performance.now();
    const elapsedTime = now - this.gameStartTime;
    const cooldownDecreaseRate = 0.05;
    const currentCooldown = Math.max(this.minCooldown, this.baseCooldown - elapsedTime * cooldownDecreaseRate);

    if (now - this.lastShotTime < currentCooldown) return;

    if (chargeButtonPressed && this.sprite.visible) {
      if (!this.isCharging) {
        // Start charging on the first frame the button is held.
        this.isCharging = true;
        this.chargeStartTime = now;
      }
      // Calculate charge duration and factor (0 to 1)
      const chargeDuration = now - this.chargeStartTime;
      const t = Math.min(1, chargeDuration / this.maxCharge);

      // Use the same base radius as normal shot.
      const baseBulletRadius = 5;
      // Grow the indicator: linearly scale up to 5× base radius.
      const indicatorRadius = baseBulletRadius * (1 + 4 * t);
      // Change to gold if fully charged.
      const indicatorColor = t >= 1 ? 0xFFD700 : 0xffffff;

      // Very slight vibration while charging
      if (gp && chargeDuration < this.maxCharge) {
        vibrateGamepad(gp, 10, 0.5, 0.2);
      }

      // Update the charge indicator graphic.
      this.chargeIndicator.clear();
      this.chargeIndicator.beginFill(indicatorColor);
      this.chargeIndicator.drawCircle(0, 0, indicatorRadius);
      this.chargeIndicator.endFill();

      // Position the indicator at the tip of the gun.
      const tipX = this.sprite.x + this.direction.x * (this.offset + indicatorRadius * this.offsetMult);
      const tipY = this.sprite.y + this.direction.y * (this.offset + indicatorRadius * this.offsetMult);
      this.chargeIndicator.x = tipX;
      this.chargeIndicator.y = tipY;

      this.chargeIndicator.visible = true;
    } else {
      // If the button was released while charging, fire the charged shot.
      if (this.isCharging) {
        this.releaseChargeShot(originX, originY, gp);
        this.isCharging = false;
      }
      // Hide and clear the charge indicator.
      this.chargeIndicator.visible = false;
      this.chargeIndicator.clear();
    }
  }

  /**
   * Fire a charged shot based on how long the charge button was held.
   */
  private releaseChargeShot(originX: number, originY: number, gp?: Gamepad): void {
    const now = performance.now();
    this.lastShotTime = now;
    const chargeDuration = now - this.chargeStartTime;
    let bulletSpeed: number;
    let bulletRadius: number;
    let bulletColor: number;
    const baseBulletSpeed = 240;
    const baseBulletRadius = 5;
    let slowdown = 0.2;

    if (chargeDuration < this.maxCharge) {
      // Linear interpolation: at 0 ms, shot = base values; at 3000ms, shot = 2x base speed and 5x base radius.
      const t = chargeDuration / this.maxCharge; // 0 to 1
      if (gp) {
        vibrateGamepad(gp, 100, 0.5, 0.2 * (1 + t));
      }
      bulletSpeed = baseBulletSpeed * (1 + t);
      bulletRadius = baseBulletRadius * (1 + 4 * t);
      bulletColor = 0xffffff;
    } else {
      // Overcharged: radius stays at 5x base, speed drops to half, color = gold
      if (gp) {
        vibrateGamepad(gp, 100, 0.5, 0.5);
      }
      bulletSpeed = baseBulletSpeed * 0.5;
      bulletRadius = baseBulletRadius * 5;
      bulletColor = 0xFFD700; // gold
      slowdown = 0.03;

      // ---- RECOIL ----
      // We'll push the player backwards by recoilPower in the opposite direction of the shot
      // i.e. negative of this.direction
      this.owner.vx -= this.direction.x * this.recoilPower;
      this.owner.vy -= this.direction.y * this.recoilPower;
    }

    // Spawn the bullet at the tip of the gun plus an offset equal to the bullet radius
    const bulletX = originX + this.direction.x * (this.offset + bulletRadius * this.offsetMult);
    const bulletY = originY + this.direction.y * (this.offset + bulletRadius * this.offsetMult);
    const bullet = new Bullet(
      bulletX,
      bulletY,
      this.direction.x,
      this.direction.y,
      bulletSpeed,
      bulletRadius,
      bulletColor,
      slowdown
    );
    this.bulletsRef.push(bullet);
    if (this.stageRef) {
      this.stageRef.addChild(bullet.sprite);
    }
  }
}
