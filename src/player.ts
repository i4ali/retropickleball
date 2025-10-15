import { Game } from './game';
import { Vector2D } from './types';

export class Player {
  private game: Game;
  public position: Vector2D;
  private initialPosition: Vector2D;
  public velocity: Vector2D;
  private speed: number = 400; // pixels per second
  public isPlayer: boolean; // true for human player, false for AI

  // Input state
  public moveLeft: boolean = false;
  public moveRight: boolean = false;

  public hitAnimationState: number = 0;
  public paddleHand: 'left' | 'right' = 'right';

  constructor(game: Game, x: number, y: number, isPlayer: boolean) {
    this.game = game;
    this.position = { x, y };
    this.initialPosition = { x, y };
    this.velocity = { x: 0, y: 0 };
    this.isPlayer = isPlayer;
  }

  public hit(): void {
    this.hitAnimationState = 1;
  }

  public update(deltaTime: number): void {
    // Update hit animation
    if (this.hitAnimationState > 0) {
      this.hitAnimationState -= deltaTime * 5; // Animation lasts for 1/5 second
      if (this.hitAnimationState < 0) {
        this.hitAnimationState = 0;
      }
    }

    // Update paddle hand based on ball position
    const ball = this.game.ball;
    if (ball) {
      const playerCenter = this.position.x + 20; // 20 is half of player width
      if (ball.position.x < playerCenter) {
        this.paddleHand = 'left';
      } else {
        this.paddleHand = 'right';
      }
    }

    // Handle movement based on input (left/right movement)
    if (this.moveLeft) {
      this.velocity.x = -this.speed;
    } else if (this.moveRight) {
      this.velocity.x = this.speed;
    } else {
      this.velocity.x = 0;
    }

    // Update position
    this.position.x += this.velocity.x * deltaTime;

    // Keep player within court bounds (horizontal movement)
    const playerWidth = 40;
    const canvas = this.game.getCanvas();
    const courtLeft = 50;
    const courtRight = canvas.width - 50;

    if (this.position.x < courtLeft) {
      this.position.x = courtLeft;
    }
    if (this.position.x + playerWidth > courtRight) {
      this.position.x = courtRight - playerWidth;
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    // Draw pixel art character in top-down/three-quarters view
    this.drawTopDownCharacter(ctx);
  }

  private drawTopDownCharacter(ctx: CanvasRenderingContext2D): void {
    const x = this.position.x;
    const y = this.position.y;
    const scale = this.isPlayer ? 1 : 0.85; // Far player is slightly smaller for perspective

    // Character colors
    const shirtColor = this.isPlayer ? '#4169E1' : '#DC143C'; // Blue for player, Red for AI
    const skinColor = '#FFD0A0';
    const hairColor = '#4A3728';
    const pantsColor = '#2C2C2C';
    const paddleColor = '#FFE4B5';

    // Shadow (oval for top-down view)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(x + 20 * scale, y + 45 * scale, 18 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs (top-down view - shorter and angled)
    ctx.fillStyle = pantsColor;
    ctx.fillRect(x + 10 * scale, y + 28 * scale, 6 * scale, 12 * scale); // Left leg
    ctx.fillRect(x + 24 * scale, y + 28 * scale, 6 * scale, 12 * scale); // Right leg

    // Shoes (top-down)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(x + 9 * scale, y + 38 * scale, 8 * scale, 6 * scale);
    ctx.fillRect(x + 23 * scale, y + 38 * scale, 8 * scale, 6 * scale);

    // Body/torso (wider, more oval for top-down)
    ctx.fillStyle = shirtColor;
    ctx.fillRect(x + 8 * scale, y + 14 * scale, 24 * scale, 18 * scale);

    // Add darker shading for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x + 8 * scale, y + 14 * scale, 24 * scale, 4 * scale);

    // Arms and paddle
    ctx.fillStyle = skinColor;
    if (this.paddleHand === 'right') {
      // Left arm
      ctx.fillRect(x + 2 * scale, y + 18 * scale, 8 * scale, 8 * scale);
      // Right arm (holding paddle)
      ctx.fillRect(x + 30 * scale, y + 18 * scale, 8 * scale, 8 * scale);

      // Paddle (held in right hand, angled)
      ctx.save();
      ctx.translate(x + 38 * scale, y + 22 * scale);
      const baseRotation = Math.PI / 6;
      const hitRotation = -Math.PI / 4 * this.hitAnimationState; // Swing forward
      ctx.rotate(baseRotation + hitRotation);
      ctx.fillStyle = paddleColor;
      ctx.fillRect(-6 * scale, -10 * scale, 12 * scale, 20 * scale);
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 1;
      ctx.strokeRect(-6 * scale, -10 * scale, 12 * scale, 20 * scale);

      // Paddle handle
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-2 * scale, 8 * scale, 4 * scale, 8 * scale);
      ctx.restore();
    } else { // left hand
      // Right arm
      ctx.fillRect(x + 30 * scale, y + 18 * scale, 8 * scale, 8 * scale);
      // Left arm (holding paddle)
      ctx.fillRect(x + 2 * scale, y + 18 * scale, 8 * scale, 8 * scale);

      // Paddle (held in left hand, angled)
      ctx.save();
      ctx.translate(x + 2 * scale, y + 22 * scale);
      const baseRotation = -Math.PI / 6;
      const hitRotation = Math.PI / 4 * this.hitAnimationState; // Swing forward
      ctx.rotate(baseRotation + hitRotation);
      ctx.fillStyle = paddleColor;
      ctx.fillRect(-6 * scale, -10 * scale, 12 * scale, 20 * scale);
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 1;
      ctx.strokeRect(-6 * scale, -10 * scale, 12 * scale, 20 * scale);

      // Paddle handle
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(-2 * scale, 8 * scale, 4 * scale, 8 * scale);
      ctx.restore();
    }

    // Head (top-down view - more circular)
    ctx.fillStyle = skinColor;
    ctx.fillRect(x + 12 * scale, y + 4 * scale, 16 * scale, 14 * scale);

    // Hair (top-down - covers most of head)
    ctx.fillStyle = hairColor;
    ctx.fillRect(x + 12 * scale, y + 2 * scale, 16 * scale, 10 * scale);

    // Face details (small since viewed from above)
    ctx.fillStyle = skinColor;
    ctx.fillRect(x + 14 * scale, y + 10 * scale, 12 * scale, 6 * scale);

    // Eyes (dots, viewed from above/angle)
    ctx.fillStyle = '#000000';
    ctx.fillRect(x + 16 * scale, y + 11 * scale, 2 * scale, 2 * scale);
    ctx.fillRect(x + 22 * scale, y + 11 * scale, 2 * scale, 2 * scale);
  }

  public reset(): void {
    this.position = { ...this.initialPosition };
    this.velocity = { x: 0, y: 0 };
    this.moveLeft = false;
    this.moveRight = false;
  }

  public getCenter(): Vector2D {
    return {
      x: this.position.x + this.game.config.paddleWidth / 2,
      y: this.position.y + this.game.config.paddleHeight / 2
    };
  }
}
