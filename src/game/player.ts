import * as PIXI from 'pixi.js';
import { Gun } from './gun';
import { Bullet } from './bullet';

export class Player {
  public sprite: PIXI.Sprite;
  public gun: Gun;

  private speed: number = 3;
  private radius: number = 20;
  public isDead: boolean = false;

  private bulletArray: Bullet[] = [];

  constructor(body_sprite: PIXI.Sprite, gun_sprite: PIXI.Sprite, x: number, y: number, body_color: number, gun_color: number) {
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

    // Basic collision detection with bullets
    for (const bullet of this.bulletArray) {
      if (!bullet.isExpired) {
        const dx = bullet.sprite.x - this.sprite.x;
        const dy = bullet.sprite.y - this.sprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // sum of radii = 20 (player) + 5 (bullet) = 25
        if (dist < (this.radius + 5)) {
          this.isDead = true;
          this.sprite.visible = false;
          this.gun.sprite.visible = false;
          // Optionally bullet.isExpired = true
          break;
        }
      }
    }
  }

  public move(xAxis: number, yAxis: number) {
    if (this.isDead) return;

    this.sprite.x += xAxis * this.speed;
    this.sprite.y += yAxis * this.speed;

    if (xAxis !== 0 || yAxis !== 0) {
        this.sprite.rotation = Math.atan2(yAxis, xAxis) + Math.PI / 2;
    }

    this.gun.sprite.x = this.sprite.x;
    this.gun.sprite.y = this.sprite.y;
  }
}
