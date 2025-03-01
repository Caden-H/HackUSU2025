import * as PIXI from "pixi.js";
import { Player } from "./game/player";
import { Bullet } from "./game/bullet";
import { WinScreen } from "./game/winscreen";
import { Wall } from "./game/wall";
import { RandomWall } from "./game/randomwall";
import { vibrateGamepad } from "./game/vibration";
import { ParticleSystem } from "./game/particles";

import bodySrc from "../raw_assets/TankBody.svg?url";
import gunSrc from "../raw_assets/TankGun.svg?url";

(async () => {
  function getSquareSize() {
    return window.innerHeight;
  }

  // Create a Pixi Application
  const app = new PIXI.Application();
  await app.init({
    antialias: true,
    width: getSquareSize(),
    height: getSquareSize(),
    backgroundColor: 0x333333,
    resolution: window.devicePixelRatio || 1,
  });
  document.body.appendChild(app.canvas);

  // Create particle system
  const particleSystem = new ParticleSystem(app);

  // Position the canvas absolutely at the top and center it horizontally
  app.canvas.style.position = "absolute";
  app.canvas.style.top = "0";
  const updateCanvasPosition = () => {
    const size = getSquareSize();
    app.renderer.resize(size, size);
    app.canvas.style.left = `${(window.innerWidth - size) / 2}px`;
  };
  window.addEventListener("resize", updateCanvasPosition);
  updateCanvasPosition();

  // ----- GAME STATE: "start" or "play" -----
  let gameState: "start" | "play" = "start";

  // Create a container for the Start Screen
  const startScreen = new PIXI.Container();
  app.stage.addChild(startScreen);

  // We'll create a rounded rectangle as a backdrop
  const startBg = new PIXI.Graphics();
  const bgWidth = app.screen.width * 0.7;
  const bgHeight = app.screen.height * 0.3;
  startBg.beginFill(0x000000, 0.75);
  startBg.drawRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 20);
  startBg.endFill();
  startBg.x = app.screen.width / 2;
  startBg.y = app.screen.height / 2;
  startScreen.addChild(startBg);

  // Title Text (bigger)
  const titleText = new PIXI.Text("SaboTank", {
    fontFamily: "Arial",
    fontSize: 90,
    fill: 0xffffff,
    align: "center",
    fontWeight: "bold",
  });
  titleText.anchor.set(0.5);
  titleText.x = app.screen.width / 2;
  titleText.y = app.screen.height / 2 - bgHeight / 6;
  startScreen.addChild(titleText);

  // "Press B to Start" Text (smaller)
  const startButtonText = new PIXI.Text("Press 'B' to Start", {
    fontFamily: "Arial",
    fontSize: 36,
    fill: 0xffffff,
    align: "center",
  });
  startButtonText.anchor.set(0.5);
  startButtonText.x = app.screen.width / 2;
  startButtonText.y = app.screen.height / 2 + bgHeight / 6;
  startScreen.addChild(startButtonText);

  // When the game starts, we will create new players, bullets, wall, etc.
  let players: Player[] = [];
  let initialPositions: { x: number; y: number }[] = [];
  let bullets: Bullet[] = [];
  let randomWall: RandomWall;
  let boundary: Wall;
  let boundaryGraphics: PIXI.Graphics;
  // We initialize WinScreen with 0; we'll re-init it properly in startGame().
  let winScreen = new WinScreen(app, 0);

  // Function to count how many gamepads are connected (non-empty).
  function countConnectedControllers(): number {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    let count = 0;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        count++;
      }
    }
    return count;
  }

  // Helper function to generate random color
  function randomColor() {
    return Math.floor(Math.random() * 0xffffff);
  }

  /**
   * Start the actual game with the given number of players
   */
  async function startGame(numPlayers: number) {
    // Remove the start screen from the stage
    gameState = "play"; // switch the game state
    app.stage.removeChild(startScreen);

    // Clear any old data
    players = [];
    initialPositions = [];
    bullets = [];

    // Reinitialize the WinScreen with the new number of players
    winScreen = new WinScreen(app, numPlayers);

    // Load textures
    const player_body_texture = await PIXI.Assets.load({
      src: bodySrc,
      data: { resolution: 10 },
    });
    const player_gun_texture = await PIXI.Assets.load({
      src: gunSrc,
      data: { resolution: 10 },
    });

    // Colors
    const fixedColors = [
      0x1180ff, // Blue
      0xff4827, // Red
      0x2aff23, // Green
      0xfff23b, // Yellow
      0xe523ff, // Purple
      0x23ffa3, // Cyan
      0xffa63f, // Orange
    ];
    const center = app.screen.width / 2;
    // The circle radius that spawns the players
    const radius = 100 * Math.max(1, (2 * numPlayers) / 10);

    // Create players in a circle
    for (let i = 0; i < numPlayers; i++) {
      const angle = ((2 * Math.PI) / numPlayers) * i;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      initialPositions.push({ x, y });

      const playerColor =
        i < fixedColors.length ? fixedColors[i] : randomColor();
      const gunColor = 0xffffff;

      // Create new sprites for this player
      const bodySprite = new PIXI.Sprite(player_body_texture);
      bodySprite.anchor.set(0.5);
      app.stage.addChild(bodySprite);

      const gunSprite = new PIXI.Sprite(player_gun_texture);
      gunSprite.anchor.set(0.5);
      app.stage.addChild(gunSprite);

      // Pass the particleSystem to the Player constructor
      const player = new Player(
        bodySprite,
        gunSprite,
        x,
        y,
        playerColor,
        gunColor,
        i,
        particleSystem
      );

      (player as any).color = playerColor;
      players.push(player);
    }

    // Tint each next gun sprite to match the player's color controlling it
    for (let i = 0; i < players.length; i++) {
      const nextIndex = (i + 1) % players.length;
      players[nextIndex].gun.sprite.tint = players[i].sprite.tint;
    }

    // Create a new random wall
    randomWall = new RandomWall(app.canvas.width, app.canvas.height);
    boundary = new Wall(randomWall.points);
    boundaryGraphics = boundary.draw();
    app.stage.addChild(boundaryGraphics);

    // Provide bullet references
    for (const player of players) {
      player.gun.setBulletArray(bullets, app.stage);
      player.setBulletArray(bullets);
    }
  }

  /**
   * Reset the game while in "play" state
   */
  function reset() {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      app.stage.removeChild(bullet.sprite);
      bullets.splice(i, 1);
    }
    // Remove old wall
    app.stage.removeChild(boundaryGraphics);

    // Create a new random wall
    randomWall = new RandomWall(app.canvas.width, app.canvas.height);
    boundary = new Wall(randomWall.points);
    boundaryGraphics = boundary.draw();
    app.stage.addChild(boundaryGraphics);

    // Reset players to their initial positions
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

  // Handle gamepad input
  function readGamepads(): void {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];

    // If we're on the start screen, wait for B button press to start the game.
    if (gameState === "start") {
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        // B button is typically index 0
        if (gp && gp.buttons[0]?.pressed) {
          const count = countConnectedControllers();
          const numPlayers = count > 0 ? count : 2;
          startGame(numPlayers);
          break;
        }
      }
      return;
    }

    // If in "play" state, handle normal gameplay
    for (let i = 0; i < players.length; i++) {
      const gp = gamepads[i];
      if (gp) {
        // Movement: player i -> left stick
        const [moveX, moveY] = applyDeadZone(gp.axes[0], gp.axes[1]);
        players[i].move(moveX, moveY);

        // Gun control: player i -> next player's gun
        const nextIndex = (i + 1) % players.length;
        const [gunX, gunY] = applyDeadZone(gp.axes[2], gp.axes[3]);
        players[nextIndex].gun.setDirection(gunX, gunY);

        // Normal shot via triggers (e.g. 5 or 7).
        if (gp.buttons[5]?.pressed || gp.buttons[7]?.pressed) {
          players[nextIndex].gun.shootNormal(
            players[nextIndex].sprite.x,
            players[nextIndex].sprite.y,
            gp
          );
        }

        // Charge shot via triggers 4 or 6
        const chargePressed = gp.buttons[4]?.pressed || gp.buttons[6]?.pressed;
        players[nextIndex].gun.updateCharge(
          players[nextIndex].sprite.x,
          players[nextIndex].sprite.y,
          chargePressed,
          gp
        );

        // If B pressed and a player is dead, reset
        if (gp.buttons[0]?.pressed && players.some((p) => p.isDead)) {
          reset();
        }
      }
    }
  }

  // Main game loop
  app.ticker.add((delta) => {
    readGamepads();

    if (gameState === "start") {
      return;
    }

    // Update particle system
    particleSystem.update(delta.elapsedMS / 1000);

    // Now we're in "play" mode
    for (const player of players) {
      player.update(delta.elapsedMS / 1000, boundary);
    }

    // Player-vs-player collision
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const p1 = players[i];
        const p2 = players[j];
        if (p1.isDead || p2.isDead) continue;

        const dx = p2.sprite.x - p1.sprite.x;
        const dy = p2.sprite.y - p1.sprite.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius;
        if (distance < minDist && distance > 0) {
          // Normalized direction
          const nx = dx / distance;
          const ny = dy / distance;

          const impulseMultiplier = 600;
          const impulse = impulseMultiplier;

          p1.vx -= nx * impulse;
          p1.vy -= ny * impulse;
          p2.vx += nx * impulse;
          p2.vy += ny * impulse;

          // Vibrate all connected controllers
          const allGamepads = navigator.getGamepads();
          for (let k = 0; k < players.length; k++) {
            const gp = allGamepads[k];
            if (gp) vibrateGamepad(gp, 100, 0.5, 0.5);
          }
        }
      }
    }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      bullet.update(delta.elapsedMS / 1000, boundary);
      if (bullet.isExpired) {
        app.stage.removeChild(bullet.sprite);
        bullets.splice(i, 1);
      }
    }

    // Win condition
    const alivePlayers = players.filter((player) => !player.isDead);
    if (alivePlayers.length === 1 && !winScreen.isGameOver()) {
      const winnerPlayer = alivePlayers[0] as any;
      const fixedMapping: {
        [key: number]:
          | "Blue"
          | "Red"
          | "Green"
          | "Yellow"
          | "Purple"
          | "Cyan"
          | "Orange"
          | "Winner";
      } = {
        [0x1180ff]: "Blue",
        [0xff4827]: "Red",
        [0x2aff23]: "Green",
        [0xfff23b]: "Yellow",
        [0xe523ff]: "Purple",
        [0x23ffa3]: "Cyan",
        [0xffa63f]: "Orange",
        [0x000000]: "Winner",
      };
      const winnerName = fixedMapping[winnerPlayer.color] || "Winner";
      if (winnerName !== "Winner") {
        winScreen.declareWinner(winnerName);
      }
    } else if (
      alivePlayers.length === 0 &&
      players.some((player) => player.isDead) &&
      !winScreen.isGameOver()
    ) {
      winScreen.declareWinner("Draw");
    }
  });
})();
