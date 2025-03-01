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
  color?: number; // Optional color property for tinting
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
    const size = 24;
    const graphics = new PIXI.Graphics();

    // Create a simple flat shape for explosions - just a circle
    graphics.beginFill(0xffffff, 0.8); // Use white so we can tint it later
    graphics.drawCircle(size / 2, size / 2, size / 2);
    graphics.endFill();

    return this.app.renderer.generateTexture(graphics);
  }

  private createSmokeTexture(): PIXI.Texture {
    const size = 16;
    const graphics = new PIXI.Graphics();

    // Create a flat smoke puff (simpler, vector-like design)
    graphics.beginFill(0xeeeeee, 0.5); // Use a single flat color with moderate opacity

    // Simple circle for vector look
    graphics.drawCircle(size / 2, size / 2, size / 2);
    graphics.endFill();

    return this.app.renderer.generateTexture(graphics);
  }

  // Create explosion at specific coordinates with tank color
  createExplosion(
    x: number,
    y: number,
    size: number = 1,
    color: number = 0xffffff
  ): void {
    // Increase particle count for more consistent shape
    const particleCount = 36;

    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;

      // Reduce speed by ~50% so particles don't go as far
      const speed = 0.5 + Math.random() * 1.5;

      // Slightly randomize the particle color for variation
      // Mix in some white to brighten the center particles
      const isCore = Math.random() > 0.7;
      const particleColor = isCore ? 0xffffff : color;

      // Create with different opacity based on position
      const alpha = isCore ? 0.9 : 0.7;

      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed * size,
        vy: Math.sin(angle) * speed * size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05, // Even less rotation
        alpha: alpha,
        // Make particles slightly smaller overall
        scale: (0.2 + Math.random() * 0.3) * size,
        // Keep them visible slightly longer since they move slower
        life: 0.7 + Math.random() * 0.4,
        maxLife: 0.9 + Math.random() * 0.5,
        type: "explosion",
        color: particleColor,
      });
    }

    // Add a central burst of smaller particles for a more intense core
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      // Very short range for these particles
      const speed = 0.2 + Math.random() * 0.5;

      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed * size,
        vy: Math.sin(angle) * speed * size,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        alpha: 1.0, // Full opacity
        scale: (0.15 + Math.random() * 0.2) * size, // Even smaller
        life: 0.5 + Math.random() * 0.3, // Shorter life
        maxLife: 0.7 + Math.random() * 0.4,
        type: "explosion",
        color: 0xffffff, // Always white for the core
      });
    }
  }

  // Create gun smoke at specific coordinates with direction
  createGunSmoke(
    x: number,
    y: number,
    dirX: number,
    dirY: number,
    isCharged: boolean = false
  ): void {
    // More particles for charged shots
    const particleCount = isCharged ? 12 : 5;

    // Larger spread for charged shots
    const spread = isCharged ? 0.6 : 0.3;

    // Longer life for charged shot smoke
    const baseLife = isCharged ? 1.5 : 0.8;

    for (let i = 0; i < particleCount; i++) {
      // Randomize direction slightly
      const angle = Math.atan2(dirY, dirX) + (Math.random() - 0.5) * spread;

      // Faster speed for charged shots
      const speed = 0.5 + Math.random() * (isCharged ? 1.5 : 1);

      // Larger scale for charged shots
      const scale = isCharged
        ? 0.5 + Math.random() * 0.4
        : 0.3 + Math.random() * 0.2;

      this.createParticle({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        alpha: 0.4,
        scale: scale,
        life: baseLife,
        maxLife: baseLife + Math.random() * 0.5,
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

    // Apply tint if color is provided
    if (options.color !== undefined) {
      sprite.tint = options.color;
    }

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

      // Apply tint based on color
      if (p.color) {
        p.sprite.tint = p.color;
      }
    }
  }
}
