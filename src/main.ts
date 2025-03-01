import * as PIXI from 'pixi.js';
import { Player } from './game/player';
import { Bullet } from './game/bullet';

(async () => {
  function getSquareSize() {
    return window.innerHeight;
  }
  
  // Create the Pixi Application with an initial size
  const app = new PIXI.Application();
  await app.init({
    width: getSquareSize(),
    height: getSquareSize(),
    backgroundColor: 0x333333
  });
  document.body.appendChild(app.canvas);
  
  // Position the canvas at the top of the page, center horizontally
  app.canvas.style.position = 'absolute';
  app.canvas.style.top = '0';
  
  // Handle window resize so the game remains a square that fills vertical space
  window.addEventListener('resize', () => {
    const size = getSquareSize();
    app.renderer.resize(size, size);
  
    // Recompute canvas horizontal center
    // (canvas's left corner is half the leftover space)
    app.canvas.style.left = `${(window.innerWidth - size) / 2}px`;
  });
  
  // Run the initial placement once:
  (function initCanvasPosition() {
    const size = getSquareSize();
    app.canvas.style.left = `${(window.innerWidth - size) / 2}px`;
  })();
  
  // Create two players
  const player1 = new Player(100, 100, 0xff0000);  // Red
  const player2 = new Player(700, 500, 0x0000ff);  // Blue
  
  app.stage.addChild(player1.container);
  app.stage.addChild(player2.container);
  
  // Keep all bullets in one array. Each gun pushes bullets here.
  let bullets: Bullet[] = [];
  
  // Provide each player's gun a reference to this shared array and stage
  player1.gun.setBulletArray(bullets, app.stage);
  player2.gun.setBulletArray(bullets, app.stage);

  player1.setBulletArray(bullets);
  player2.setBulletArray(bullets);
  
  // Main game loop
  app.ticker.add((delta) => {
    readGamepads();
    player1.update(delta);
    player2.update(delta);
  
    // Update and remove bullets that expire
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.update(delta);
    
      if (bullet.isExpired) {
        // Remove from the stage if needed
        app.stage.removeChild(bullet.sprite);
        // Remove the bullet from the array
        bullets.splice(i, 1);
      }
    }
  });
  
  // Reads the gamepad input to control each player's movement & opponent's gun
  function readGamepads(): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
  
    // Gamepad 0 -> player1
    const gp1 = gamepads[0];
    if (gp1) {
      // Left stick to move player1
      const moveX = gp1.axes[0] ?? 0;
      const moveY = gp1.axes[1] ?? 0;
      player1.move(moveX, moveY);
  
      // Right stick to aim player2's gun
      const gunX = gp1.axes[2] ?? 0;
      const gunY = gp1.axes[3] ?? 0;
      player2.gun.setDirection(gunX, gunY);
  
      // Shoot the opponent's gun if L/R/ZL/ZR are pressed
      if (gp1.buttons[4]?.pressed || gp1.buttons[5]?.pressed ||
          gp1.buttons[6]?.pressed || gp1.buttons[7]?.pressed) {
        player2.gun.shoot(player2.container.x, player2.container.y);
      }
    }
  
    // Gamepad 1 -> player2
    const gp2 = gamepads[1];
    if (gp2) {
      // Left stick to move player2
      const moveX = gp2.axes[0] ?? 0;
      const moveY = gp2.axes[1] ?? 0;
      player2.move(moveX, moveY);
  
      // Right stick to aim player1's gun
      const gunX = gp2.axes[2] ?? 0;
      const gunY = gp2.axes[3] ?? 0;
      player1.gun.setDirection(gunX, gunY);
  
      // Shoot the opponent's gun if L/R/ZL/ZR are pressed
      if (gp2.buttons[4]?.pressed || gp2.buttons[5]?.pressed ||
          gp2.buttons[6]?.pressed || gp2.buttons[7]?.pressed) {
        player1.gun.shoot(player1.container.x, player1.container.y);
      }
    }
  }
})();
