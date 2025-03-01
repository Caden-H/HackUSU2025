import * as PIXI from 'pixi.js';
import { Gun } from './gun';
import { Bullet } from './bullet';

export class Player {
  public container: PIXI.Container;
  public gun: Gun;

  private speed: number = 3;
  private radius: number = 20;
  public isDead: boolean = false;

  private bulletArray: Bullet[] = [];

  constructor(x: number, y: number, color: number) {
    this.container = new PIXI.Container();
    this.container.x = x;
    this.container.y = y;

    const gfx = new PIXI.Graphics();
    gfx.beginFill(color);
    gfx.drawCircle(0, 0, this.radius);
    gfx.endFill();
    this.container.addChild(gfx);

    this.gun = new Gun();
  }

  public setBulletArray(bullets: Bullet[]) {
    this.bulletArray = bullets;
  }

  public update(delta: number) {
    if (this.isDead) return;

    // Basic collision detection with bullets
    for (const bullet of this.bulletArray) {
      if (!bullet.isExpired) {
        const dx = bullet.sprite.x - this.container.x;
        const dy = bullet.sprite.y - this.container.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // sum of radii = 20 (player) + 5 (bullet) = 25
        if (dist < (this.radius + 5)) {
          this.isDead = true;
          this.container.visible = false;
          // Optionally bullet.isExpired = true
          break;
        }
      }
    }
  }

  public move(xAxis: number, yAxis: number) {
    if (this.isDead) return;

    this.container.x += xAxis * this.speed;
    this.container.y += yAxis * this.speed;
  }
}
