import * as PIXI from "pixi.js";
import { Player } from "./game/player";
import { Bullet } from "./game/bullet";
import { WinScreen } from "./game/winscreen";
import { Wall } from "./game/wall";
import { RandomWall } from "./game/randomwall";
import { vibrateGamepad } from "./game/vibration";
import { ParticleSystem } from "./game/particles";

import logoSrc from "../raw_assets/Logo.svg?url";

import bodySrc from "../raw_assets/TankBody.svg?url";
import gunSrc from "../raw_assets/TankGun.svg?url";
import arrowSrc from "../raw_assets/Chevron.png?url";


import musicSrc from '../raw_assets/music.wav';

(async () => {
  function getSquareSize() {
    return window.innerHeight;
  }

  
  const music = new Audio(musicSrc);
  music.loop = true;
  music.volume = 0.5;

  // Create a Pixi Application
  const app = new PIXI.Application();
  await app.init({
    antialias: true,
    width: getSquareSize(),
    height: getSquareSize(),
    backgroundColor: 0x333333,
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
  const bgWidth = app.screen.width * 0.95;
  const bgHeight = app.screen.height * 0.5;
  startBg.beginFill(0x000000, 0.75);
  startBg.drawRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 20);
  startBg.endFill();
  startBg.x = app.screen.width / 2;
  startBg.y = app.screen.height / 2;
  startScreen.addChild(startBg);

  // Load the logo texture
  const logoTexture = await PIXI.Assets.load({
    src: logoSrc,
    data: { resolution: 10 },
  });
  // Create a sprite for the logo
  const logoSprite = new PIXI.Sprite(logoTexture);
  logoSprite.anchor.set(0.5);
  logoSprite.scale = 2;
  logoSprite.x = app.screen.width / 2;
  // We'll position it a bit above the center of the start screen rectangle
  logoSprite.y = app.screen.height / 2 - 100;
  startScreen.addChild(logoSprite);

  // Replace the simple "Press 'B' to Start" Text with a container that includes button graphics
  const startButtonContainer = new PIXI.Container();

  // "Press" text
  const pressStartText = new PIXI.Text("Press ", {
    fontFamily: "Arial",
    fontSize: 36,
    fill: 0xffffff,
    align: "center",
  });
  pressStartText.anchor.set(1, 0.5); // Right align
  startButtonContainer.addChild(pressStartText);

  // Create button indicator graphic - same as in WinScreen
  const startButtonGraphic = new PIXI.Graphics();
  const buttonSize = 8; // Circle diameter
  const buttonSpacing = 8; // Spacing between circles

  startButtonGraphic.clear();

  // Top button (hollow)
  startButtonGraphic.lineStyle(2, 0xffffff);
  startButtonGraphic.beginFill(0, 0);
  startButtonGraphic.drawCircle(0, -buttonSpacing, buttonSize / 2);
  startButtonGraphic.endFill();

  // Right button (hollow)
  startButtonGraphic.lineStyle(2, 0xffffff);
  startButtonGraphic.beginFill(0, 0);
  startButtonGraphic.drawCircle(buttonSpacing, 0, buttonSize / 2);
  startButtonGraphic.endFill();

  // Left button (hollow)
  startButtonGraphic.lineStyle(2, 0xffffff);
  startButtonGraphic.beginFill(0, 0);
  startButtonGraphic.drawCircle(-buttonSpacing, 0, buttonSize / 2);
  startButtonGraphic.endFill();

  // Bottom button (filled in white)
  startButtonGraphic.lineStyle(2, 0xffffff);
  startButtonGraphic.beginFill(0xffffff); // Yellow fill color
  startButtonGraphic.drawCircle(0, buttonSpacing, buttonSize / 2);
  startButtonGraphic.endFill();

  startButtonContainer.addChild(startButtonGraphic);

  // "to Start" text
  const toStartText = new PIXI.Text(" to Start", {
    fontFamily: "Arial",
    fontSize: 36,
    fill: 0xffffff,
    align: "center",
  });
  toStartText.anchor.set(0, 0.5); // Left align
  startButtonContainer.addChild(toStartText);

  // Position elements horizontally
  pressStartText.x = -10;
  pressStartText.y = 0;
  toStartText.x = 10;
  toStartText.y = 0;

  // Center the whole container where the original text was
  startButtonContainer.x = app.screen.width / 2;
  startButtonContainer.y = app.screen.height / 2 + 20;
  startScreen.addChild(startButtonContainer);

  // Instructions Text (below "Press B to Start")
  const instructionsText = new PIXI.Text(
    "Use the left stick to move YOUR tank.\n" +
      "Use the right stick to move and fire your OPPONENT's gun.\n" +
      "Hold R/ZR to fire continuously or L/ZL to charge a powerful shot.\n" +
      "If YOUR tank is destroyed, you lose.",
    {
      fontFamily: "Arial",
      fontSize: 24,
      fill: 0xffffff,
      align: "center",
    }
  );
  instructionsText.anchor.set(0.5);
  // Position it slightly below the startButtonText
  instructionsText.x = startButtonContainer.x;
  instructionsText.y = startButtonContainer.y + 80; // adjust as needed
  startScreen.addChild(instructionsText);

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

  let gunMapping: Array<number>;

  function randomDerangement(n: number) {
    while (true) {
      const arr = [...Array(n).keys()];  // e.g. [0,1,2,...,n-1]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      // Check if deranged (i.e., arr[i] != i for all i)
      if (arr.every((val, idx) => val !== idx)) {
        return arr;
      }
    }
  }

  /**
   * Start the actual game with the given number of players
   */
  async function startGame(numPlayers: number) {
    music.play()
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
    const arrow_texture = await PIXI.Assets.load({
      src: arrowSrc,
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

      const arrowSprite = new PIXI.Sprite(arrow_texture);
      arrowSprite.anchor.set(0.5);
      app.stage.addChild(arrowSprite);

      // Pass the particleSystem to the Player constructor
      const player = new Player(
        bodySprite,
        gunSprite,
        arrowSprite,
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

    const derangement = randomDerangement(players.length);
    for (let i = 0; i < players.length; i++) {
      players[derangement[i]].gun.sprite.tint = players[i].sprite.tint;
    }
    gunMapping = derangement;

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
      
      const gunIndex = gunMapping[index];
      players[gunIndex].gun.updateCharge(
        players[gunIndex].sprite.x,
        players[gunIndex].sprite.y,
        false
      );
    });
    
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      app.stage.removeChild(bullet.sprite);
      bullets.splice(i, 1);
    }

    const derangement = randomDerangement(players.length);
    for (let i = 0; i < players.length; i++) {
      players[derangement[i]].gun.sprite.tint = players[i].sprite.tint;
    }
    gunMapping = derangement;

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
        const gunIndex = gunMapping[i];
        const [gunX, gunY] = applyDeadZone(gp.axes[2], gp.axes[3]);
        players[gunIndex].gun.setDirection(gunX, gunY);

        // Normal shot via triggers (e.g. 5 or 7).
        if (gp.buttons[5]?.pressed || gp.buttons[7]?.pressed) {
          players[gunIndex].gun.shootNormal(
            players[gunIndex].sprite.x,
            players[gunIndex].sprite.y,
            gp
          );
        }

        // Charge shot via triggers 4 or 6
        const chargePressed = gp.buttons[4]?.pressed || gp.buttons[6]?.pressed;
        players[gunIndex].gun.updateCharge(
          players[gunIndex].sprite.x,
          players[gunIndex].sprite.y,
          chargePressed,
          gp
        );

        // If B pressed and a player is dead, reset
        if (gp.buttons[0]?.pressed && winScreen.isGameOver()) {
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
