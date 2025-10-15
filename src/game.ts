import { GameState, GameConfig, PlayerType } from './types';
import { Court } from './court';
import { Player } from './player';
import { Ball } from './ball';
import { AI } from './ai';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private lastTime: number;
  private fps: number;
  private frameCount: number;
  private fpsUpdateTime: number;

  // Game configuration
  public config: GameConfig;

  // Game entities
  private court: Court;
  private player: Player;
  private opponent: Player;
  private ball: Ball;
  private ai: AI;

  // Scores
  public playerScore: number = 0;
  public aiScore: number = 0;
  public lastHitBy: PlayerType | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }

    this.ctx = ctx;
    this.gameState = GameState.START;
    this.lastTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateTime = 0;

    // Game configuration (side-view perspective)
    this.config = {
      canvasWidth: canvas.width,
      canvasHeight: canvas.height,
      courtWidth: 700,
      courtHeight: 500,
      paddleWidth: 40,
      paddleHeight: 50,
      ballSize: 14,
      winningScore: 11
    };

    // Initialize game entities (portrait view: players at top and bottom)
    this.court = new Court(this);
    // Player at bottom of court, centered horizontally
    this.player = new Player(this, canvas.width / 2 - 20, canvas.height - 200, true);
    // AI opponent at top of court, centered horizontally
    this.opponent = new Player(this, canvas.width / 2 - 20, 210, false);
    this.ball = new Ball(this);
    this.ai = new AI(this, this.opponent, this.ball);

    // Setup input handlers
    this.setupInputHandlers();
  }

  private setupInputHandlers(): void {
    // Keyboard controls for player (left/right movement)
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.player.moveLeft = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.player.moveRight = true;
      }

      // Start game or serve
      if (e.key === ' ' || e.key === 'Enter') {
        if (this.gameState === GameState.START) {
          this.gameState = GameState.SERVING;
          this.serveBall();
        } else if (this.gameState === GameState.GAME_OVER) {
          this.reset();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        this.player.moveLeft = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        this.player.moveRight = false;
      }
    });

    // Mouse/click to start
    this.canvas.addEventListener('click', () => {
      if (this.gameState === GameState.START) {
        this.gameState = GameState.SERVING;
        this.serveBall();
      } else if (this.gameState === GameState.GAME_OVER) {
        this.reset();
      }
    });
  }

  private serveBall(): void {
    // Reset ball to center and give it initial velocity
    this.ball.reset();
    setTimeout(() => {
      this.gameState = GameState.PLAYING;
      this.ball.serve();
    }, 1000); // 1 second delay before serving
  }

  private reset(): void {
    this.playerScore = 0;
    this.aiScore = 0;
    this.gameState = GameState.START;
    this.ball.reset();
    this.player.reset();
    this.opponent.reset();
  }

  public start(): void {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);
  }

  private gameLoop = (currentTime: number): void => {
    // Calculate delta time
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.fpsUpdateTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsUpdateTime = currentTime;
    }

    // Update game logic
    this.update(deltaTime);

    // Render everything
    this.render();

    // Continue the loop
    requestAnimationFrame(this.gameLoop);
  }

  private update(deltaTime: number): void {
    if (this.gameState === GameState.PLAYING) {
      // Update player
      this.player.update(deltaTime);

      // Update AI
      this.ai.update(deltaTime);
      this.opponent.update(deltaTime);

      // Update ball
      this.ball.update(deltaTime);

      // Check for scoring
      this.checkScoring();
    }
  }

  private checkScoring(): void {
    const ballY = this.ball.position.y;
    const ballX = this.ball.position.x;
    const ballSize = this.config.ballSize;
    const courtTop = 100;
    const courtBottom = this.canvas.height - 100;
    const courtLeft = 50;
    const courtRight = this.canvas.width - 50;

    // Ball out at the top
    if (ballY < courtTop) {
      if (this.lastHitBy === PlayerType.PLAYER) {
        this.aiScore++;
      } else {
        this.playerScore++;
      }
      this.onPointScored();
      return;
    }

    // Ball out at the bottom
    if (ballY + ballSize > courtBottom) {
      if (this.lastHitBy === PlayerType.AI) {
        this.playerScore++;
      } else {
        this.aiScore++;
      }
      this.onPointScored();
      return;
    }

    // Ball out on the sides
    if (ballX < courtLeft || ballX + ballSize > courtRight) {
      if (this.lastHitBy === PlayerType.PLAYER) {
        this.aiScore++;
      } else {
        this.playerScore++;
      }
      this.onPointScored();
      return;
    }
  }

  private onPointScored(): void {
    this.gameState = GameState.POINT_WON;

    // Check for game over
    if (this.playerScore >= this.config.winningScore || this.aiScore >= this.config.winningScore) {
      // Check win by 2 rule
      if (Math.abs(this.playerScore - this.aiScore) >= 2) {
        this.gameState = GameState.GAME_OVER;
        return;
      }
    }

    // Continue playing - serve next ball
    setTimeout(() => {
      this.serveBall();
    }, 1500);
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw court
    this.court.render(this.ctx);

    // Draw players
    this.player.render(this.ctx);
    this.opponent.render(this.ctx);

    // Draw ball
    this.ball.render(this.ctx);

    // Draw score
    this.drawScore();

    // Draw game state messages
    this.drawGameStateMessage();

    // Draw FPS counter (for debugging)
    this.drawFPS();
  }

  private drawScore(): void {
    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `PLAYER: ${this.playerScore} - AI: ${this.aiScore}`,
      this.canvas.width / 2,
      40
    );
  }

  private drawGameStateMessage(): void {
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'center';

    if (this.gameState === GameState.START) {
      this.ctx.fillText('PRESS SPACE OR CLICK TO START', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState === GameState.SERVING) {
      this.ctx.fillText('GET READY...', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState === GameState.GAME_OVER) {
      const winner = this.playerScore > this.aiScore ? 'PLAYER WINS!' : 'AI WINS!';
      this.ctx.fillText(winner, this.canvas.width / 2, this.canvas.height / 2 - 30);
      this.ctx.font = '18px monospace';
      this.ctx.fillText('PRESS SPACE OR CLICK TO PLAY AGAIN', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }
  }

  private drawFPS(): void {
    this.ctx.fillStyle = '#666';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getState(): GameState {
    return this.gameState;
  }
}
