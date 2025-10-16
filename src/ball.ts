import { Game } from './game';
import { Vector2D, PlayerType } from './types';

export class Ball {
  public game: Game;
  public position: Vector2D; // x, y position on court
  public velocity: Vector2D; // x, y velocity
  public height: number = 0; // z position (height above ground)
  public verticalVelocity: number = 0; // z velocity
  public bounces: number = 0;
  public lastBounceSide: PlayerType | null = null;
  private gravity: number = 1200; // pixels per second squared
  private bounceCoefficient: number = 0.7; // Energy retained after bounce
  private initialSpeed: number = 250; // pixels per second (reduced for easier gameplay)
  private currentSpeed: number = 250;
  private maxSpeed: number = 700;
  private trail: Vector2D[] = []; // Trail positions for motion blur
  private maxTrailLength: number = 8;

  constructor(game: Game) {
    this.game = game;
    const canvas = game.getCanvas();

    this.position = {
      x: canvas.width / 2,
      y: canvas.height / 2
    };

    this.velocity = { x: 0, y: 0 };
    this.height = 0;
    this.verticalVelocity = 0;
  }

  public update(deltaTime: number): void {
    // Add current position to trail
    this.trail.push({ x: this.position.x, y: this.position.y });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Update horizontal position based on velocity
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Update vertical (height) physics
    this.verticalVelocity -= this.gravity * deltaTime;
    this.height += this.verticalVelocity * deltaTime;

    // Bounce when ball hits ground
    if (this.height <= 0) {
      this.height = 0;

      // Only bounce if there's significant downward velocity
      if (this.verticalVelocity < -50) {
        this.bounces++;
        const canvas = this.game.getCanvas();
        const courtY = 300;
        const courtHeight = canvas.height - 500;
        const netY = courtY + courtHeight / 2;
        this.lastBounceSide = this.position.y > netY ? PlayerType.PLAYER : PlayerType.AI;

        this.verticalVelocity = -this.verticalVelocity * this.bounceCoefficient;
        this.game.audio.playPaddleHit(); // Use paddle hit sound for bounce
      } else {
        // Ball has settled on ground
        this.verticalVelocity = 0;
      }
    }

    // Check collision with paddles (only when ball is low enough)
    this.checkPaddleCollision();
  }

  private checkPaddleCollision(): void {
    const ballSize = this.game.config.ballSize;
    const paddleWidth = 40; // Character width
    const paddleHeight = 50; // Character height
    const hitHeight = 100; // Maximum height at which paddle can hit ball

    // Only check collision if ball is low enough to be hit
    if (this.height > hitHeight) {
      return;
    }

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

        this.bounces = 0; // Reset bounces on paddle hit
        this.game.lastHitBy = player.isPlayer ? PlayerType.PLAYER : PlayerType.AI;

        player.hit();

        // Reverse Y direction (ball bounces back toward other player)
        this.velocity.y = -this.velocity.y;

        // Add upward velocity to make ball arc through the air
        this.verticalVelocity = 250 + Math.random() * 100; // Random upward velocity (reduced for easier gameplay)

        // Add horizontal angle based on where the ball hit the paddle
        const maxAngle = 20 * (Math.PI / 180); // 20 degrees max angle
        const angle = hitPosition * maxAngle;

        // Calculate new velocity with angle
        const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        const direction = this.velocity.y > 0 ? 1 : -1;

        this.velocity.y = Math.cos(angle) * speed * direction;
        this.velocity.x = Math.sin(angle) * speed;

        // Power shot
        if (player.isPlayer && this.game.powerShot) {
          this.currentSpeed = Math.min(this.currentSpeed * 1.5, this.maxSpeed * 1.5); // Increase speed by 50% for power shot
          this.verticalVelocity *= 1.3; // Higher arc for power shot
          this.game.audio.playPowerShot();
          this.game.createParticles(this.position.x + this.game.config.ballSize / 2, this.position.y + this.game.config.ballSize / 2, 20);
          // Trigger screen shake
          (this.game as any).screenShake = 15;
        } else {
          // Increase speed slightly on each hit (up to max)
          this.currentSpeed = Math.min(this.currentSpeed * 1.05, this.maxSpeed);
          this.game.audio.playPaddleHit();
        }

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

    // Calculate visual offset based on height (higher = appears higher on screen)
    const heightOffset = -this.height * 0.4; // Scale factor for visual effect

    // Dramatic scale based on depth for true POV perspective
    const canvas = this.game.getCanvas();
    const courtTop = 300;
    const courtBottom = canvas.height - 200;
    const courtDepth = courtBottom - courtTop;
    const ballDepth = (this.position.y - courtTop) / courtDepth; // 0 = far, 1 = near
    const minDepthScale = 0.4; // Much smaller when far
    const maxDepthScale = 1.6; // Much larger when near
    const depthScale = minDepthScale + (maxDepthScale - minDepthScale) * ballDepth;

    // Draw trail effect (at ground position)
    for (let i = 0; i < this.trail.length; i++) {
      const trailPos = this.trail[i];
      const alpha = (i + 1) / this.trail.length * 0.3;
      const size = ballSize * ((i + 1) / this.trail.length) * 0.8;

      ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#FFD700';
      ctx.beginPath();
      ctx.arc(
        trailPos.x + ballSize / 2,
        trailPos.y + ballSize / 2,
        size / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Draw ball shadow on ground (shows where ball would land)
    const shadowSize = ballSize * 0.6;
    const shadowAlpha = Math.min(0.5, 0.2 + this.height / 200); // Darker when higher
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(
      this.position.x + ballSize / 2,
      this.position.y + ballSize / 2 + 4,
      shadowSize,
      shadowSize * 0.5,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw ball at elevated position
    const ballX = this.position.x + ballSize / 2;
    const ballY = this.position.y + ballSize / 2 + heightOffset;

    // Ball appears slightly larger when higher (perspective) and scales with depth
    const heightScale = 1 + this.height / 400;
    const visualBallSize = ballSize * heightScale * depthScale / 2;

    // Draw ball with gradient for 3D effect and glow
    const gradient = ctx.createRadialGradient(
      ballX - 2,
      ballY - 2,
      1,
      ballX,
      ballY,
      visualBallSize
    );
    gradient.addColorStop(0, '#FFFF00'); // Bright yellow highlight
    gradient.addColorStop(0.7, '#FFD700'); // Gold middle
    gradient.addColorStop(1, '#FFA500'); // Orange edge

    // Add glow effect to ball (stronger when higher)
    ctx.shadowBlur = 15 + this.height / 20;
    ctx.shadowColor = '#FFD700';

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ballX, ballY, visualBallSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw ball outline with glow
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10 + this.height / 30;
    ctx.shadowColor = '#FFA500';
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw ball detail lines for pickleball holes
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.lineWidth = 1;

    // Draw several small holes (scaled with ball)
    const holePositions = [
      { x: 0, y: -3 },
      { x: 4, y: 2 },
      { x: -4, y: 2 },
      { x: 0, y: 4 }
    ];

    holePositions.forEach(hole => {
      const combinedScale = heightScale * depthScale;
      ctx.beginPath();
      ctx.arc(
        ballX + hole.x * combinedScale,
        ballY + hole.y * combinedScale,
        1.5 * combinedScale,
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
    this.height = 0;
    this.verticalVelocity = 0;
    this.currentSpeed = this.initialSpeed;
    this.trail = [];
    this.bounces = 0;
    this.lastBounceSide = null;
  }

  public serve(direction: number): void {
    // Random horizontal angle between -25 and 25 degrees
    const angle = (Math.random() * 50 - 25) * (Math.PI / 180);

    this.velocity.y = Math.cos(angle) * this.currentSpeed * direction;
    this.velocity.x = Math.sin(angle) * this.currentSpeed;

    // Give ball initial upward velocity for serve (reduced for easier gameplay)
    this.verticalVelocity = 200 + Math.random() * 100;
    this.height = 20; // Start slightly above ground
  }

  public getCenter(): Vector2D {
    const ballSize = this.game.config.ballSize;
    return {
      x: this.position.x + ballSize / 2,
      y: this.position.y + ballSize / 2
    };
  }
}
