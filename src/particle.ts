import { Vector2D } from './types';

export class Particle {
  public position: Vector2D;
  public velocity: Vector2D;
  public size: number;
  public color: string;
  public lifespan: number;

  constructor(x: number, y: number) {
    this.position = { x, y };
    this.velocity = {
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 500,
    };
    this.size = Math.random() * 12 + 6;
    // Vibrant neon colors: cyan, magenta, yellow, orange
    const colors = ['#00FFFF', '#FF00FF', '#FFFF00', '#FF6600', '#00FF00'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.lifespan = 0.8; // in seconds
  }

  public update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.lifespan -= deltaTime;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const alpha = Math.max(0, this.lifespan * 1.25);
    ctx.globalAlpha = alpha;

    // Add glow effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = this.color;

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    // Additional outer glow
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Reset
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1.0;
  }
}
