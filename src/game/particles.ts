import * as PIXI from "pixi.js";

type ParticleType = "explosion" | "gunSmoke";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
  scale: number;
  life: number;
  maxLife: number;
  sprite: PIXI.Sprite;
  type: ParticleType;
}

export class ParticleSystem {
  private container: PIXI.Container; // Change to regular Container instead of ParticleContainer
  private particles: Particle[] = [];
  private textures: Record<ParticleType, PIXI.Texture>;
  private app: PIXI.Application;

  constructor(app: PIXI.Application) {
    this.app = app;

    // Use a standard Container instead of ParticleContainer
    this.container = new PIXI.Container();
    app.stage.addChild(this.container);

    // Create textures for particles
    this.textures = {
      explosion: this.createExplosionTexture(),
      gunSmoke: this.createSmokeTexture(),
    };
  }

  private createExplosionTexture(): PIXI.Texture {
    const size = 32;
    const graphics = new PIXI.Graphics();

    // Create a gradient for explosion particles
    graphics.beginFill(0xffff00, 0.8); // Core - bright yellow
    graphics.drawCircle(size / 2, size / 2, (size / 2) * 0.4);
    graphics.endFill();

    graphics.beginFill(0xff8800, 0.6); // Mid - orange
    graphics.drawCircle(size / 2, size / 2, (size / 2) * 0.7);
    graphics.endFill();

    graphics.beginFill(0xff3300, 0.3); // Edge - red-orange
    graphics.drawCircle(size / 2, size / 2, size / 2);
    graphics.endFill();

    return this.app.renderer.generateTexture(graphics);
  }

  private createSmokeTexture(): PIXI.Texture {
    const size = 16;
    const graphics = new PIXI.Graphics();

    // Create a soft smoke puff
    graphics.beginFill(0xcccccc, 0.2); // Outer - light gray
    graphics.drawCircle(size / 2, size / 2, size / 2);
    graphics.endFill();

    graphics.beginFill(0xeeeeee, 0.4); // Mid - lighter gray
    graphics.drawCircle(size / 2, size / 2, (size / 2) * 0.6);
    graphics.endFill();

    graphics.beginFill(0xffffff, 0.5); // Core - white
    graphics.drawCircle(size / 2, size / 2, (size / 2) * 0.3);
    graphics.endFill();

    return this.app.renderer.generateTexture(graphics);
  }

  // Create explosion at specific coordinates
  createExplosion(
    x: number,
    y: number,
    size: number = 1,
    color: number = 0xffff00
  ): void {
    const particleCount = 30;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;

      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed * size,
        vy: Math.sin(angle) * speed * size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
        alpha: 0.8,
        scale: (0.5 + Math.random() * 0.5) * size,
        life: 1,
        maxLife: 1 + Math.random() * 0.5,
        type: "explosion",
      });
    }
  }

  // Create gun smoke at specific coordinates with direction
  createGunSmoke(x: number, y: number, dirX: number, dirY: number): void {
    const particleCount = 5;

    for (let i = 0; i < particleCount; i++) {
      // Randomize direction slightly
      const spread = 0.3;
      const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * spread;
      const speed = 0.5 + Math.random() * 1;

      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        alpha: 0.4,
        scale: 0.3 + Math.random() * 0.2,
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        type: "gunSmoke",
      });
    }
  }

  private createParticle(options: Omit<Particle, "sprite">): void {
    const sprite = new PIXI.Sprite(this.textures[options.type]);
    sprite.anchor.set(0.5);
    sprite.x = options.x;
    sprite.y = options.y;
    sprite.rotation = options.rotation;
    sprite.alpha = options.alpha;
    sprite.scale.set(options.scale);

    const particle: Particle = {
      ...options,
      sprite,
    };

    this.particles.push(particle);
    this.container.addChild(sprite); // This now works with the regular Container
  }

  update(delta: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      p.life -= delta;

      if (p.life <= 0) {
        // Remove dead particles
        this.container.removeChild(p.sprite); // This now works with the regular Container
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      p.x += p.vx * delta * 60; // Scale by delta for consistent speed
      p.y += p.vy * delta * 60;

      // Special behaviors based on type
      if (p.type === "explosion") {
        // Apply gravity for explosion particles
        p.vy += 0.05 * delta;
      } else if (p.type === "gunSmoke") {
        // Smoke rises slightly
        p.vy -= 0.02 * delta;
      }

      // Apply damping
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Update rotation
      p.rotation += p.rotationSpeed * delta * 60;

      // Fade out as life decreases
      const normalizedLifeRatio = p.life / p.maxLife;
      p.sprite.alpha = normalizedLifeRatio * p.alpha;

      // Update the sprite position and rotation
      p.sprite.x = p.x;
      p.sprite.y = p.y;
      p.sprite.rotation = p.rotation;

      // Special scale effects based on particle type
      if (p.type === "explosion") {
        // Explosions grow slightly as they age
        const scale = p.scale * (1 + 0.5 * (1 - normalizedLifeRatio));
        p.sprite.scale.set(scale);
      } else if (p.type === "gunSmoke") {
        // Smoke expands as it rises
        const scale = p.scale * (1 + 0.8 * (1 - normalizedLifeRatio));
        p.sprite.scale.set(scale);
      }
    }
  }
}
