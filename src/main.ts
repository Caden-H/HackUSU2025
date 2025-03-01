import * as PIXI from 'pixi.js';
import { Player } from './game/player';
import { Bullet } from './game/bullet';

import bodySrc from '../raw_assets/TankBody.svg?url';
import gunSrc from '../raw_assets/TankGun.svg?url';

// An async IIFE, matching your prior style
(async () => {
  // Helper to ensure the canvas is a square of size window.innerHeight
  function getSquareSize() {
    return window.innerHeight;
  }

  // Create a Pixi Application
  // (If you're using a custom app.init, adapt accordingly)
  const app = new PIXI.Application();
  await app.init({
    width: getSquareSize(),
    height: getSquareSize(),
    backgroundColor: 0x333333
  });
  document.body.appendChild(app.canvas);

  // Position the canvas absolutely at the top
  app.canvas.style.position = 'absolute';
  app.canvas.style.top = '0';

  // On resize, keep it square and center horizontally
  window.addEventListener('resize', () => {
    const size = getSquareSize();
    app.renderer.resize(size, size);
    app.canvas.style.left = `${(window.innerWidth - size) / 2}px`;
  });

  // Initial position
  (function initCanvasPosition() {
    const size = getSquareSize();
    app.canvas.style.left = `${(window.innerWidth - size) / 2}px`;
  })();

  // Enable zIndex sorting
  app.stage.sortableChildren = true;

  
  // Player
  const player_body_texture = await PIXI.Assets.load({src: bodySrc, data: {resolution: 10}});
  const p1_body_sprite = PIXI.Sprite.from(player_body_texture);
  p1_body_sprite.anchor.set(0.5);
  app.stage.addChild(p1_body_sprite);
  const p2_body_sprite = PIXI.Sprite.from(player_body_texture);
  p2_body_sprite.anchor.set(0.5);
  app.stage.addChild(p2_body_sprite);

  const player_gun_texture = await PIXI.Assets.load({src: gunSrc, data: {resolution: 10}});
  const p1_gun_sprite = PIXI.Sprite.from(player_gun_texture);
  p1_gun_sprite.anchor.set(0.5);
  app.stage.addChild(p1_gun_sprite);
  const p2_gun_sprite = PIXI.Sprite.from(player_gun_texture);
  p2_gun_sprite.anchor.set(0.5);
  app.stage.addChild(p2_gun_sprite);

  const centerY = window.innerHeight / 2 
  const centerX = window.innerWidth / 2
  const center = app.canvas.width / 2;
  console.log(centerX, centerY, center)
  // Create two players
  const player1 = new Player(p1_body_sprite, p1_gun_sprite, center - 100, center - 100, 0xff0000, 0x0000ff);  // Red
  const player2 = new Player(p2_body_sprite, p2_gun_sprite, center + 100, center + 100, 0x0000ff, 0xff0000);  // Blue

  function reset() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      app.stage.removeChild(bullet.sprite);
      bullets.splice(i, 1);
    }

    player1.sprite.x = centerX - 100;
    player1.sprite.y = centerX - 100;
    player1.gun.sprite.x = centerX - 100;
    player1.gun.sprite.y = centerX - 100;
    player1.isDead = false;
    player1.sprite.visible = true;
    player1.gun.sprite.visible = true;
    
    player2.sprite.x = centerX + 100;
    player2.sprite.y = centerX + 100;
    player2.gun.sprite.x = centerX + 100;
    player2.gun.sprite.y = centerX + 100;
    player2.isDead = false;
    player2.sprite.visible = true;
    player2.gun.sprite.visible = true;
  }



  // Shared bullet array
  let bullets: Bullet[] = [];
  // Provide references
  player1.gun.setBulletArray(bullets, app.stage);
  player2.gun.setBulletArray(bullets, app.stage);
  player1.setBulletArray(bullets);
  player2.setBulletArray(bullets);

  // Main game loop
  app.ticker.add((delta) => {
    readGamepads();
    player1.update(delta);
    player2.update(delta);

    // Update bullets & remove if expired
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.update(delta);

      if (bullet.isExpired) {
        app.stage.removeChild(bullet.sprite);
        bullets.splice(i, 1);
      }
    }
  });

  function applyDeadZone(ax: number, ay: number, deadZone: number = 0.1) {
    const mag = Math.sqrt(ax * ax + ay * ay);
    return mag > deadZone ? [ax / mag, ay / mag] : [0, 0];
  }
  
  // Handle gamepad input
  function readGamepads(): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    // === Gamepad 0 -> Player1 ===
    const gp1 = gamepads[0];
    if (gp1) {
      // Move Player1 with left stick
      const [moveX, moveY] = applyDeadZone(gp1.axes[0], gp1.axes[1])
      player1.move(moveX, moveY);

      // Right stick -> aim Player2's gun
      const [gunX, gunY] = applyDeadZone(gp1.axes[2], gp1.axes[3])
      player2.gun.setDirection(gunX, gunY);

      // Shoot if triggers pressed
      if (gp1.buttons[4]?.pressed || gp1.buttons[5]?.pressed ||
          gp1.buttons[6]?.pressed || gp1.buttons[7]?.pressed) {
        player2.gun.shoot(player2.sprite.x, player2.sprite.y);
      }
    }

    // === Gamepad 1 -> Player2 ===
    const gp2 = gamepads[1];
    if (gp2) {
      // Move Player1 with left stick
      const [moveX, moveY] = applyDeadZone(gp2.axes[0], gp2.axes[1])
      player2.move(moveX, moveY);

      // Right stick -> aim Player2's gun
      const [gunX, gunY] = applyDeadZone(gp2.axes[2], gp2.axes[3])
      player1.gun.setDirection(gunX, gunY);

      // Shoot if triggers pressed
      if (gp2.buttons[4]?.pressed || gp2.buttons[5]?.pressed ||
          gp2.buttons[6]?.pressed || gp2.buttons[7]?.pressed) {
        player1.gun.shoot(player1.sprite.x, player1.sprite.y);
      }
    }

    if (gp1 && gp2) {
      if ((player1.isDead || player2.isDead) && (gp1.buttons[0]?.pressed || gp2.buttons[0]?.pressed)) {
        reset()
      }
    }
  }
})();