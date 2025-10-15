import { Game } from './game';
import { Vector2D, PlayerType } from './types';

export class Ball {
  public game: Game;
  public position: Vector2D;
  public velocity: Vector2D;
  private initialSpeed: number = 300; // pixels per second
  private currentSpeed: number = 300;
  private maxSpeed: number = 800;

  constructor(game: Game) {
    this.game = game;
    const canvas = game.getCanvas();

    this.position = {
      x: canvas.width / 2,
      y: canvas.height / 2
    };

    this.velocity = { x: 0, y: 0 };
  }

  public update(deltaTime: number): void {
    // Update position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;



    // Check collision with paddles
    this.checkPaddleCollision();
  }

  private checkPaddleCollision(): void {
    const ballSize = this.game.config.ballSize;
    const paddleWidth = 40; // Character width
    const paddleHeight = 50; // Character height

    // Get player and opponent from game
    const players = this.getPlayers();

    for (const player of players) {
      const paddle = player.position;

      // AABB collision detection (top-down view: ball bounces off characters)
      if (
        this.position.x < paddle.x + paddleWidth &&
        this.position.x + ballSize > paddle.x &&
        this.position.y < paddle.y + paddleHeight &&
        this.position.y + ballSize > paddle.y
      ) {
        // Calculate hit position relative to paddle center (-1 to 1) horizontally
        const paddleCenter = paddle.x + paddleWidth / 2;
        const ballCenter = this.position.x + ballSize / 2;
        const hitPosition = (ballCenter - paddleCenter) / (paddleWidth / 2);

        this.game.lastHitBy = player.isPlayer ? PlayerType.PLAYER : PlayerType.AI;

        player.hit();

        // Reverse Y direction (ball bounces back toward other player)
        this.velocity.y = -this.velocity.y;

        // Add horizontal angle based on where the ball hit the paddle
        const maxAngle = 20 * (Math.PI / 180); // 20 degrees max angle
        const angle = hitPosition * maxAngle;

        // Calculate new velocity with angle
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        const direction = this.velocity.y > 0 ? 1 : -1;

        this.velocity.y = Math.cos(angle) * speed * direction;
        this.velocity.x = Math.sin(angle) * speed;

        // Increase speed slightly on each hit (up to max)
        this.currentSpeed = Math.min(this.currentSpeed * 1.05, this.maxSpeed);

        // Normalize and apply new speed
        const velocityMagnitude = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        this.velocity.x = (this.velocity.x / velocityMagnitude) * this.currentSpeed;
        this.velocity.y = (this.velocity.y / velocityMagnitude) * this.currentSpeed;

        // Move ball out of paddle to prevent multiple collisions
        if (player.isPlayer) {
          this.position.y = paddle.y - ballSize - 1;
        } else {
          this.position.y = paddle.y + paddleHeight + 1;
        }

        break;
      }
    }
  }

  private getPlayers(): any[] {
    // This is a workaround to access players from the game
    // In a better architecture, we'd pass players to the ball's update method
    return (this.game as any).player && (this.game as any).opponent
      ? [(this.game as any).player, (this.game as any).opponent]
      : [];
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const ballSize = this.game.config.ballSize;

    // Draw ball shadow (larger, more diffuse for top-down view)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(
      this.position.x + ballSize / 2,
      this.position.y + ballSize / 2 + 4,
      ballSize * 0.6,
      ballSize * 0.3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw ball with gradient for 3D effect
    const gradient = ctx.createRadialGradient(
      this.position.x + ballSize / 2 - 2,
      this.position.y + ballSize / 2 - 2,
      1,
      this.position.x + ballSize / 2,
      this.position.y + ballSize / 2,
      ballSize / 2
    );
    gradient.addColorStop(0, '#FFFF00'); // Bright yellow highlight
    gradient.addColorStop(0.7, '#FFD700'); // Gold middle
    gradient.addColorStop(1, '#FFA500'); // Orange edge

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(
      this.position.x + ballSize / 2,
      this.position.y + ballSize / 2,
      ballSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw ball outline
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw ball detail lines for pickleball holes
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;

    // Draw several small holes
    const holePositions = [
      { x: 0, y: -3 },
      { x: 4, y: 2 },
      { x: -4, y: 2 },
      { x: 0, y: 4 }
    ];

    holePositions.forEach(hole => {
      ctx.beginPath();
      ctx.arc(
        this.position.x + ballSize / 2 + hole.x,
        this.position.y + ballSize / 2 + hole.y,
        1.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }

  public reset(): void {
    const canvas = this.game.getCanvas();
    this.position = {
      x: canvas.width / 2 - this.game.config.ballSize / 2,
      y: canvas.height / 2 - this.game.config.ballSize / 2
    };
    this.velocity = { x: 0, y: 0 };
    this.currentSpeed = this.initialSpeed;
  }

  public serve(): void {
    // Serve toward opponent (upward) or toward player (downward)
    const direction = Math.random() > 0.5 ? -1 : 1; // -1 = toward top, 1 = toward bottom

    // Random horizontal angle between -25 and 25 degrees
    const angle = (Math.random() * 50 - 25) * (Math.PI / 180);

    this.velocity.y = Math.cos(angle) * this.currentSpeed * direction;
    this.velocity.x = Math.sin(angle) * this.currentSpeed;
  }

  public getCenter(): Vector2D {
    const ballSize = this.game.config.ballSize;
    return {
      x: this.position.x + ballSize / 2,
      y: this.position.y + ballSize / 2
    };
  }
}
