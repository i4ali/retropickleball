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
      x: (Math.random() - 0.5) * 400,
      y: (Math.random() - 0.5) * 400,
    };
    this.size = Math.random() * 10 + 5;
    this.color = `hsl(${Math.random() * 60 + 200}, 100%, 50%)`;
    this.lifespan = 0.5; // in seconds
  }

  public update(deltaTime: number): void {
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.lifespan -= deltaTime;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color;
    ctx.globalAlpha = Math.max(0, this.lifespan * 2);
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}
