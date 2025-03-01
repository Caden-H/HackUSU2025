import * as PIXI from 'pixi.js';
import { Player } from './game/player';
import { Bullet } from './game/bullet';
import { WinScreen } from './game/winscreen';
import { Wall } from './game/wall'
import { RandomWall } from './game/randomwall';


import bodySrc from '../raw_assets/TankBody.svg?url';
import gunSrc from '../raw_assets/TankGun.svg?url';

(async () => {
  // Helper to ensure the canvas is a square of size window.innerHeight
  function getSquareSize() {
    return window.innerHeight;
  }

  // Create a Pixi Application
  const app = new PIXI.Application();
  await app.init({
    width: getSquareSize(),
    height: getSquareSize(),
    backgroundColor: 0x333333
  });
  document.body.appendChild(app.canvas);

  // Position the canvas absolutely at the top and center it horizontally
  app.canvas.style.position = 'absolute';
  app.canvas.style.top = '0';
  const updateCanvasPosition = () => {
    const size = getSquareSize();
    app.renderer.resize(size, size);
    app.canvas.style.left = `${(window.innerWidth - size) / 2}px`;
  };
  window.addEventListener('resize', updateCanvasPosition);
  updateCanvasPosition();

  const numPlayers = 2;
  const winScreen = new WinScreen(app, numPlayers);

  const player_body_texture = await PIXI.Assets.load({ src: bodySrc, data: { resolution: 10 } });
  const player_gun_texture = await PIXI.Assets.load({ src: gunSrc, data: { resolution: 10 } });

  const players: Player[] = [];
  const initialPositions: { x: number; y: number }[] = [];

  const fixedColors = [0x0000ff, 0xff0000, 0x00ff00, 0xffff00];
  const center = app.canvas.width / 2;
  const radius = 100;

  // Helper function to generate a random color (for players beyond the first four)
  function randomColor() {
    return Math.floor(Math.random() * 0xffffff);
  }

  // Create players in a circle around the center
  for (let i = 0; i < numPlayers; i++) {
    const angle = (2 * Math.PI / numPlayers) * i;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    initialPositions.push({ x, y });

    const playerColor = i < fixedColors.length ? fixedColors[i] : randomColor();
    const gunColor = 0xffffff;

    // Create new sprites for this player
    const bodySprite = new PIXI.Sprite(player_body_texture);
    bodySprite.anchor.set(0.5);
    app.stage.addChild(bodySprite);
    const gunSprite = new PIXI.Sprite(player_gun_texture);
    gunSprite.anchor.set(0.5);
    app.stage.addChild(gunSprite);

    const player = new Player(bodySprite, gunSprite, x, y, playerColor, gunColor);
    (player as any).color = playerColor;
    players.push(player);
  }

  for (let i = 0; i < players.length; i++) {
    const nextIndex = (i + 1) % players.length;
    players[nextIndex].gun.sprite.tint = players[i].sprite.tint;
  }

  // Create a boundary wall
  let randomWall = new RandomWall(app.canvas.width, app.canvas.height);
  let boundary = new Wall(randomWall.points);
  let boundaryGraphics = boundary.draw();
  app.stage.addChild(boundaryGraphics);

  // Shared bullet array
  const bullets: Bullet[] = [];
  // Provide references to the bullet array for each player's gun
  for (const player of players) {
    player.gun.setBulletArray(bullets, app.stage);
    player.setBulletArray(bullets);
  }

  // Reset function: reset players to their initial positions and clear bullets
  function reset() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      app.stage.removeChild(bullet.sprite);
      bullets.splice(i, 1);
    }
    
    // Remove old wall graphics.
    app.stage.removeChild(boundaryGraphics);
    
    // Create a new random wall and boundary.
    randomWall = new RandomWall(app.canvas.width, app.canvas.height);
    boundary = new Wall(randomWall.points);
    boundaryGraphics = boundary.draw();
    app.stage.addChild(boundaryGraphics);

    players.forEach((player, index) => {
      const pos = initialPositions[index];
      player.sprite.x = pos.x;
      player.sprite.y = pos.y;
      player.gun.sprite.x = pos.x;
      player.gun.sprite.y = pos.y;
      player.gun.gameStartTime = performance.now();
      player.isDead = false;
      player.sprite.visible = true;
      player.gun.sprite.visible = true;
    });
    winScreen.reset();

  }

  function applyDeadZone(ax: number, ay: number, deadZone: number = 0.1) {
    const mag = Math.sqrt(ax * ax + ay * ay);
    return mag > deadZone ? [ax, ay] : [0, 0];
  }

  const lineHighlight = new PIXI.Graphics();
  app.stage.addChild(lineHighlight);

  // Handle gamepad input: assign gamepad i to player i
  function readGamepads(): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < players.length; i++) {
      const gp = gamepads[i];
      if (gp) {
        // Movement: player i uses left stick for their own movement.
        const [moveX, moveY] = applyDeadZone(gp.axes[0], gp.axes[1])

        players[i].move(moveX, moveY);

        // Gun control: player i uses right stick to control next player's gun.
        const nextIndex = (i + 1) % players.length;
        const [gunX, gunY] = applyDeadZone(gp.axes[2], gp.axes[3]);
        players[nextIndex].gun.setDirection(gunX, gunY);

        // Normal shot via left triggers.
        if (gp.buttons[5]?.pressed || gp.buttons[7]?.pressed) {
          players[nextIndex].gun.shootNormal(
            players[nextIndex].sprite.x,
            players[nextIndex].sprite.y
          );
        }

        // Charge shot via right triggers.
        // We call updateCharge each frame, passing true if the button is pressed.
        const chargePressed = gp.buttons[4]?.pressed || gp.buttons[6]?.pressed;
        players[nextIndex].gun.updateCharge(
          players[nextIndex].sprite.x,
          players[nextIndex].sprite.y,
          chargePressed
        );

        // Reset game if button 0 is pressed and at least one player is dead.
        if (gp.buttons[0]?.pressed && players.some(p => p.isDead)) {
          reset();
        }
      }
    }
  }

  // Main game loop
  app.ticker.add((delta) => {
    readGamepads();

    // Update all players
    for (const player of players) {
      player.update(delta.elapsedMS / 1000, boundary);
    }

    // Loop over every unique pair of players.
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];

        // Only process collisions if both players are alive.
        if (p1.isDead || p2.isDead) continue;

        const dx = p2.sprite.x - p1.sprite.x;
        const dy = p2.sprite.y - p1.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;
        if (distance < minDist && distance > 0) {
          // Get normalized direction vector.
          const nx = dx / distance;
          const ny = dy / distance;

          // Calculate an impulse based on the overlap.
          // Adjust the impulseMultiplier to control "bounce power".
          const impulseMultiplier = 600;
          const impulse = impulseMultiplier;

          // Add impulse to each player's velocity in opposite directions.
          p1.vx -= nx * impulse;
          p1.vy -= ny * impulse;
          p2.vx += nx * impulse;
          p2.vy += ny * impulse;
        }
      }
    }

    // Update bullets & remove expired ones
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.update(delta.elapsedMS / 1000, boundary);
      if (bullet.isExpired) {
        app.stage.removeChild(bullet.sprite);
        bullets.splice(i, 1);
      }
    }

    // Win condition: if only one player is still alive, declare them the winner
    const alivePlayers = players.filter((player) => !player.isDead);
    if (alivePlayers.length === 1 && !winScreen.isGameOver()) {
      const winnerPlayer = alivePlayers[0] as any;
      // Map fixed colors to names. For any additional players, you might handle them differently.
      const fixedMapping: { [key: number]: 'Blue' | 'Red' | 'Green' | 'Yellow' | 'Winner' } = {
        [0x0000ff]: 'Blue',
        [0xff0000]: 'Red',
        [0x00ff00]: 'Green',
        [0xffff00]: 'Yellow',
        [0x000000]: 'Winner',
      };

      // Use the mapping if available; otherwise, default to a generic label.
      const winnerName = fixedMapping[winnerPlayer.color] || 'Winner';
      if (winnerName !== 'Winner') {
        winScreen.declareWinner(winnerName);
      }
    } else if (
      alivePlayers.length === 0 &&
      players.some((player) => player.isDead) &&
      !winScreen.isGameOver()
    ) {
      winScreen.declareWinner('Draw');
    }
  });
})();