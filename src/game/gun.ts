import * as PIXI from 'pixi.js';
import { Bullet } from './bullet';

export class Gun {
  private direction = { x: 1, y: 0 };
  private bulletsRef: Bullet[] = [];
  private stageRef?: PIXI.Container;

  // Cooldown in milliseconds
  private cooldown: number = 500;
  private lastShotTime: number = 0;

  public setDirection(x: number, y: number): void {
    const magnitude = Math.sqrt(x * x + y * y);
    if (magnitude > 0.15) {
      this.direction.x = x;
      this.direction.y = y;
    }
  }

  public setBulletArray(bullets: Bullet[], stage: PIXI.Container) {
    console.log('bullet array updated');
    this.bulletsRef = bullets;
    this.stageRef = stage;
  }

  public shoot(originX: number, originY: number): void {
    if (!this.stageRef) return;
  
    // Check cooldown as before...
    const now = performance.now();
    if (now - this.lastShotTime < this.cooldown) {
      return;
    }
    this.lastShotTime = now;
  
    // Add an offset based on the player's size + bullet size
    // e.g., if the player radius = 20, bullet radius = 5, margin = 2 => 27
    const offset = 50;
    const offsetX = originX + this.direction.x * offset;
    const offsetY = originY + this.direction.y * offset;
  
    const bullet = new Bullet(offsetX, offsetY, this.direction.x, this.direction.y);
    this.bulletsRef.push(bullet);
    this.stageRef.addChild(bullet.sprite);
  }
}
