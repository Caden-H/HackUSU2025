import * as PIXI from 'pixi.js';
import { Player } from './game/player';
import { Bullet } from './game/bullet';

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

  // Create two players
  const player1 = new Player(100, 100, 0xff0000);  // Red
  const player2 = new Player(700, 500, 0x0000ff);  // Blue

  // Add the players FIRST so that subsequent children can appear above them
  app.stage.addChild(player1.container);
  app.stage.addChild(player2.container);

  // Shared bullet array
  let bullets: Bullet[] = [];
  // Provide references
  player1.gun.setBulletArray(bullets, app.stage);
  player2.gun.setBulletArray(bullets, app.stage);
  player1.setBulletArray(bullets);
  player2.setBulletArray(bullets);

  // The offset used by the gun for bullet spawns
  const bulletOffset = 50;

  // -- AIM LINES --

  // 1) Player1's aim line (which is controlled by Player2's stick)
  // We'll show it in Player2's color or an "opposing" color:
  const p1AimContainer = new PIXI.Container();
  p1AimContainer.x = player1.container.x;
  p1AimContainer.y = player1.container.y; 
  p1AimContainer.zIndex = 10; // put above players
  app.stage.addChild(p1AimContainer);

  const p1AimLine = new PIXI.Graphics();
  p1AimLine.lineStyle(3, 0x0000ff); // thicker line, "blue" for opposition
  p1AimLine.moveTo(0, 0);
  p1AimLine.lineTo(bulletOffset, 0);
  p1AimContainer.addChild(p1AimLine);

  // 2) Player2's aim line (controlled by Player1's stick)
  const p2AimContainer = new PIXI.Container();
  p2AimContainer.x = player2.container.x;
  p2AimContainer.y = player2.container.y;
  p2AimContainer.zIndex = 10; // put above players
  app.stage.addChild(p2AimContainer);

  const p2AimLine = new PIXI.Graphics();
  p2AimLine.lineStyle(3, 0xff0000); // thicker line, "red" for opposition
  p2AimLine.moveTo(0, 0);
  p2AimLine.lineTo(bulletOffset, 0);
  p2AimContainer.addChild(p2AimLine);


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

  // Handle gamepad input
  function readGamepads(): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    // === Gamepad 0 -> Player1 ===
    const gp1 = gamepads[0];
    if (gp1) {
      // Move Player1 with left stick
      const moveX = gp1.axes[0] ?? 0;
      const moveY = gp1.axes[1] ?? 0;
      player1.move(moveX, moveY);

      // Right stick -> aim Player2's gun
      const gunX = gp1.axes[2] ?? 0;
      const gunY = gp1.axes[3] ?? 0;
      player2.gun.setDirection(gunX, gunY, player2.container.x, player2.container.y);

      // Reposition & rotate Player2's aim line
      p2AimContainer.x = player2.container.x;
      p2AimContainer.y = player2.container.y;

      const magnitude = Math.sqrt(gunX * gunX + gunY * gunY);
      if (magnitude > 0.15) {
        p2AimContainer.rotation = Math.atan2(gunY, gunX);
      }

      // Shoot if triggers pressed
      if (gp1.buttons[4]?.pressed || gp1.buttons[5]?.pressed ||
          gp1.buttons[6]?.pressed || gp1.buttons[7]?.pressed) {
        player2.gun.shoot(player2.container.x, player2.container.y);
      }
    }

    // === Gamepad 1 -> Player2 ===
    const gp2 = gamepads[1];
    if (gp2) {
      // Move Player2 with left stick
      const moveX = gp2.axes[0] ?? 0;
      const moveY = gp2.axes[1] ?? 0;
      player2.move(moveX, moveY);

      // Right stick -> aim Player1's gun
      const gunX = gp2.axes[2] ?? 0;
      const gunY = gp2.axes[3] ?? 0;
      player1.gun.setDirection(gunX, gunY, player1.container.x, player1.container.y);

      // Reposition & rotate Player1's aim line
      p1AimContainer.x = player1.container.x;
      p1AimContainer.y = player1.container.y;

      const magnitude = Math.sqrt(gunX * gunX + gunY * gunY);
      if (magnitude > 0.15) {
        p1AimContainer.rotation = Math.atan2(gunY, gunX);
      }

      // Shoot if triggers pressed
      if (gp2.buttons[4]?.pressed || gp2.buttons[5]?.pressed ||
          gp2.buttons[6]?.pressed || gp2.buttons[7]?.pressed) {
        player1.gun.shoot(player1.container.x, player1.container.y);
      }
    }
  }
})();