import * as PIXI from 'pixi.js';
import { Gun } from './gun';
import { Bullet } from './bullet';

export class Player {
  public container: PIXI.Container;
  public gun: Gun;

  private speed: number = 3;
  private radius: number = 20;  // radius of the player circle
  public isDead: boolean = false;

  private bulletArray: Bullet[] = [];

  constructor(x: number, y: number, color: number) {
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    // Draw a simple circle representing the player
    const gfx = new PIXI.Graphics();
    gfx.beginFill(color);
    gfx.drawCircle(0, 0, this.radius);
    gfx.endFill();
    this.container.addChild(gfx);

    // Create a gun
    this.gun = new Gun();
  }

  public setBulletArray(bullets: Bullet[]): void {
    this.bulletArray = bullets;
  }

  // Called each frame (from main.ts)
  public update(delta: number) {
    if (this.isDead) return;

    // Check for collision with all active bullets
    for (const bullet of this.bulletArray) {
      if (!bullet.isExpired) {
        const dx = bullet.sprite.x - this.container.x;
        const dy = bullet.sprite.y - this.container.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Sum of radii: player's 20 + bullet's 5 = 25
        if (dist < (this.radius + 5)) {
          // Player is hit
          this.isDead = true;
          // Hide or remove the player from stage
          this.container.visible = false;
          // You could also mark bullet as expired if you want one-hit bullets
          // bullet.isExpired = true;
          break;
        }
      }
    }
  }

  // Called when you move the left stick
  public move(xAxis: number, yAxis: number) {
    if (this.isDead) return;

    this.container.x += xAxis * this.speed;
    this.container.y += yAxis * this.speed;
  }
}
