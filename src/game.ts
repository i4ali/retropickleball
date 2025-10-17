import { GameState, GameConfig, PlayerType, DifficultyLevel } from './types';
import { Court } from './court';
import { Player } from './player';
import { Ball } from './ball';
import { AI } from './ai';
import { AudioManager } from './audio';
import { Particle } from './particle';
import { supabase } from './supabase';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gameState: GameState;
  private lastTime: number;
  private fps: number;
  private frameCount: number;
  private fpsUpdateTime: number;
  private isLoggedIn: boolean;
  private userRank: number | null = null;
  private totalPlayers: number | null = null;
  private rankMessage: string | null = null;
  private difficultyMessage: string | null = null;
  private difficultyMessageTimer: number = 0;
  private currentDifficulty: DifficultyLevel = DifficultyLevel.MEDIUM;
  private server: PlayerType = PlayerType.PLAYER;

  // Music
  private musicTracks: string[] = ['None', 'Retro Wave', 'Synth Pop', 'Arcade Fire'];
  private currentMusicIndex: number = 0;

  // Game configuration
  public config: GameConfig;

  // Game entities
  private court: Court;
  public player: Player;
  private opponent: Player;
  public ball: Ball;
  private ai: AI;
  public audio: AudioManager;

  // Scores
  public playerScore: number = 0;
  public aiScore: number = 0;
  public lastHitBy: PlayerType | null = null;
  public powerShot: boolean = false;

  private particles: Particle[] = [];
  private screenShake: number = 0; // Screen shake intensity
  private screenShakeDecay: number = 0.9; // How quickly shake diminishes

  constructor(canvas: HTMLCanvasElement, isLoggedIn: boolean = false) {
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
    this.isLoggedIn = isLoggedIn;

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

    // Initialize game entities (True POV: from player's eye level)
    this.court = new Court(this);
    // Player at very near end (large, close to camera)
    this.player = new Player(this, canvas.width / 2 - 20, canvas.height - 260, true);
    // AI opponent at far end (small, far away) - positioned at far edge
    this.opponent = new Player(this, canvas.width / 2 - 20, 305, false);
    this.ball = new Ball(this);
    this.ai = new AI(this, this.opponent, this.ball);
    this.audio = new AudioManager();

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

      // Power shot
      if (e.key === ' ') {
        this.powerShot = true;
      }

      // Cycle difficulty (only for logged in users)
      if ((e.key === 'D' || e.key === 'd') && this.isLoggedIn) {
        this.cycleDifficulty();
      }

      // Cycle music
      if (e.key === 'm' || e.key === 'M') {
        this.cycleMusic();
      }

      // Pause game
      if (e.key === 'p' || e.key === 'P') {
        if (this.gameState === GameState.PLAYING) {
          this.gameState = GameState.PAUSED;
        } else if (this.gameState === GameState.PAUSED) {
          this.gameState = GameState.PLAYING;
        }
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

      // Power shot
      if (e.key === ' ') {
        this.powerShot = false;
      }
    });

    // Mouse/click to start
    this.canvas.addEventListener('click', () => {
      if (this.audio.audioContext.state === 'suspended') {
        this.audio.audioContext.resume();
      }
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
    this.lastHitBy = this.server;
    setTimeout(() => {
      this.gameState = GameState.PLAYING;
      const direction = this.server === PlayerType.PLAYER ? -1 : 1;
      this.ball.serve(direction);
    }, 1000); // 1 second delay before serving
  }

  private reset(): void {
    this.playerScore = 0;
    this.aiScore = 0;
    this.gameState = GameState.START;
    this.ball.reset();
    this.player.reset();
    this.opponent.reset();
    this.server = PlayerType.PLAYER;
  }

  public createParticles(x: number, y: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y));
    }
  }

  public start(): void {
    this.lastTime = performance.now();
    this.gameLoop(this.lastTime);

    // Set initial AI difficulty
    this.applyDifficulty();

    // Fetch rank once at start if logged in
    if (this.isLoggedIn) {
      this.fetchRank();
    }
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
    if (this.difficultyMessageTimer > 0) {
      this.difficultyMessageTimer -= deltaTime;
      if (this.difficultyMessageTimer <= 0) {
        this.difficultyMessage = null;
      }
    }

    if (this.gameState === GameState.PLAYING) {
      // Update particles
      this.particles = this.particles.filter(p => p.lifespan > 0);
      this.particles.forEach(p => p.update(deltaTime));

      // Update player
      this.player.update(deltaTime);

      // Update AI
      this.ai.update(deltaTime);
      this.opponent.update(deltaTime);

      // Update ball
      this.ball.update(deltaTime);

      // Update screen shake
      if (this.screenShake > 0) {
        this.screenShake *= this.screenShakeDecay;
        if (this.screenShake < 0.1) {
          this.screenShake = 0;
        }
      }

      // Check for scoring
      this.checkScoring();
    }
  }

  private checkScoring(): void {
    const ballY = this.ball.position.y;
    const ballX = this.ball.position.x;
    const ballSize = this.config.ballSize;

    // Double bounce check
    if (this.ball.bounces >= 2) {
      if (this.ball.lastBounceSide === PlayerType.PLAYER) {
        this.aiScore++; // Ball bounced twice on player's side
        this.onPointScored(PlayerType.AI);
      } else {
        this.playerScore++; // Ball bounced twice on AI's side
        this.onPointScored(PlayerType.PLAYER);
      }
      return;
    }

    // Out of bounds check
    const courtTop = 300;
    const courtBottom = this.canvas.height - 200;
    const courtDepth = courtBottom - courtTop;
    const ballProgress = (ballY - courtTop) / courtDepth;
    const farWidth = 180;
    const nearWidth = 650;
    const courtWidth = farWidth + (nearWidth - farWidth) * ballProgress;
    const centerX = this.canvas.width / 2;
    const courtLeft = centerX - courtWidth / 2;
    const courtRight = centerX + courtWidth / 2;

    const outMargin = 50; // 50 pixels of grace
    const isOutOfBounds = ballY < courtTop - outMargin || ballY + ballSize > courtBottom + outMargin || ballX < courtLeft || ballX + ballSize > courtRight;

    if (isOutOfBounds) {
      let winner: PlayerType;
      // If ball is out after one bounce, the receiving side is at fault.
      if (this.ball.bounces === 1) {
        if (this.ball.lastBounceSide === PlayerType.PLAYER) {
          this.aiScore++; // Player failed to return a ball that landed on their side
          winner = PlayerType.AI;
        } else {
          this.playerScore++; // AI failed to return a ball that landed on its side
          winner = PlayerType.PLAYER;
        }
      } else {
        // If ball is out on the fly (0 bounces), the last person to hit it is at fault.
        if (this.lastHitBy === PlayerType.PLAYER) {
          this.aiScore++;
          winner = PlayerType.AI;
        } else {
          this.playerScore++;
          winner = PlayerType.PLAYER;
        }
      }
      this.onPointScored(winner);
      return;
    }
  }

  private onPointScored(winner: PlayerType): void {
    this.server = winner;
    this.gameState = GameState.POINT_WON;
    this.audio.playPointScored();

    // Check for game over
    if (this.playerScore >= this.config.winningScore || this.aiScore >= this.config.winningScore) {
      // Check win by 2 rule
      if (Math.abs(this.playerScore - this.aiScore) >= 2) {
        this.gameState = GameState.GAME_OVER;
        if (this.playerScore > this.aiScore) {
          this.audio.playWin();
          if (this.isLoggedIn) {
            this.saveScore();
          }
        } else {
          this.audio.playLose();
        }

        // Fetch rank at the end of the game if logged in
        if (this.isLoggedIn) {
          this.fetchRank();
        }
        return;
      }
    }

    // Continue playing - serve next ball
    setTimeout(() => {
      this.serveBall();
    }, 1500);
  }

  private async saveScore(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('scores').insert({ user_id: user.id, score: this.playerScore });
      if (error) {
        console.error('Error saving score:', error);
      }
    }
  }

  private async fetchRank(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('scores').select('score, user_id').order('score', { ascending: false });
      if (error) {
        console.error('Error fetching scores:', error);
        this.rankMessage = 'Rank unavailable';
        this.userRank = null;
        this.totalPlayers = null;
        return;
      }

      const rank = data.findIndex(s => s.user_id === user.id) + 1;
      if (rank > 0) {
        this.userRank = rank;
        this.totalPlayers = data.length;
        this.rankMessage = null;
      } else {
        // User has no scores yet
        this.userRank = null;
        this.totalPlayers = data.length;
        this.rankMessage = 'Play and win to get ranked!';
      }
    }
  }

  private render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply screen shake
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake;
      const shakeY = (Math.random() - 0.5) * this.screenShake;
      this.ctx.save();
      this.ctx.translate(shakeX, shakeY);
    }

    // Draw court
    this.court.render(this.ctx);

    // Draw players
    this.player.render(this.ctx);
    this.opponent.render(this.ctx);

    // Draw ball
    this.ball.render(this.ctx);

    // Draw particles
    this.particles.forEach(p => p.render(this.ctx));

    // Draw score
    this.drawScore();

    // Draw game state messages
    this.drawGameStateMessage();

    // Draw FPS counter (for debugging)
    this.drawFPS();

    // Draw music selection
    this.drawMusicSelection();

    // Draw rank
    if (this.isLoggedIn) {
      this.drawRank();
    }

    this.drawDifficultyMessage();

    // Draw controls guide
    this.drawControlsGuide();

    // Restore context if screen shake was applied
    if (this.screenShake > 0) {
      this.ctx.restore();
    }
  }

  private drawScore(): void {
    // Add neon glow effect
    this.ctx.shadowBlur = 20;
    this.ctx.shadowColor = '#FFD700';

    this.ctx.fillStyle = '#FFD700';
    this.ctx.font = 'bold 32px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `PLAYER: ${this.playerScore} - AI: ${this.aiScore}`,
      this.canvas.width / 2,
      40
    );

    // Add outer glow
    this.ctx.shadowBlur = 30;
    this.ctx.shadowColor = '#FFA500';
    this.ctx.fillText(
      `PLAYER: ${this.playerScore} - AI: ${this.aiScore}`,
      this.canvas.width / 2,
      40
    );

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  private drawGameStateMessage(): void {
    this.ctx.font = 'bold 24px monospace';
    this.ctx.textAlign = 'center';

    if (this.gameState === GameState.START) {
      // Add neon glow
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#00FFFF';
      this.ctx.fillStyle = '#00FFFF';
      this.ctx.fillText('PRESS SPACE OR CLICK TO START', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState === GameState.SERVING) {
      this.ctx.shadowBlur = 15;
      this.ctx.shadowColor = '#00FF00';
      this.ctx.fillStyle = '#00FF00';
      this.ctx.fillText('GET READY...', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState === GameState.PAUSED) {
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = '#FFA500';
      this.ctx.fillStyle = '#FFA500';
      this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
    } else if (this.gameState === GameState.GAME_OVER) {
      const winner = this.playerScore > this.aiScore ? 'PLAYER WINS!' : 'AI WINS!';
      const winColor = this.playerScore > this.aiScore ? '#00FF00' : '#FF0000';

      this.ctx.shadowBlur = 25;
      this.ctx.shadowColor = winColor;
      this.ctx.fillStyle = winColor;
      this.ctx.fillText(winner, this.canvas.width / 2, this.canvas.height / 2 - 30);

      this.ctx.font = '18px monospace';
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#FFFFFF';
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.fillText('PRESS SPACE OR CLICK TO PLAY AGAIN', this.canvas.width / 2, this.canvas.height / 2 + 30);
    }

    // Reset shadow
    this.ctx.shadowBlur = 0;
  }

  private drawFPS(): void {
    this.ctx.fillStyle = '#666';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 20);
  }

  private drawRank(): void {
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';

    if (this.userRank && this.totalPlayers) {
      // User has a rank - show it with glow effect
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = '#00FF00';
      this.ctx.fillStyle = '#00FF00';
      this.ctx.fillText(`RANK: ${this.userRank}/${this.totalPlayers}`, 10, 80);
      this.ctx.shadowBlur = 0;
    } else if (this.rankMessage) {
      // Show message when rank is unavailable
      this.ctx.fillStyle = '#FFD700';
      this.ctx.fillText(this.rankMessage, 10, 80);
    }

    // Draw difficulty level for logged in users
    if (this.isLoggedIn) {
      this.ctx.fillStyle = '#00FFFF';
      this.ctx.fillText(`DIFFICULTY: ${this.currentDifficulty}`, 10, 100);
    }
  }

  private drawMusicSelection(): void {
    this.ctx.fillStyle = '#00FFFF';
    this.ctx.fillText(`MUSIC: ${this.musicTracks[this.currentMusicIndex]}`, 10, 120);
  }

  private drawDifficultyMessage(): void {
    if (this.difficultyMessage) {
      this.ctx.font = 'bold 20px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = '#00FFFF';
      this.ctx.fillText(this.difficultyMessage, this.canvas.width / 2, this.canvas.height - 50);
    }
  }

  private drawControlsGuide(): void {
    this.ctx.font = '14px monospace';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.textAlign = 'center';

    const controls = '[←][→] Move   [SPACE] Power Shot   [M] Music   [P] Pause';
    this.ctx.fillText(controls, this.canvas.width / 2, this.canvas.height - 20);
  }

  public setDifficulty(difficulty: DifficultyLevel): void {
    this.currentDifficulty = difficulty;
    this.applyDifficulty();
  }

  private applyDifficulty(): void {
    let difficultyValue: number;
    switch (this.currentDifficulty) {
      case DifficultyLevel.EASY:
        difficultyValue = 0.1;
        break;
      case DifficultyLevel.MEDIUM:
        difficultyValue = 0.7;
        break;
      case DifficultyLevel.HARD:
        difficultyValue = 0.9;
        break;
      default:
        difficultyValue = 0.7;
    }
    this.ai.setDifficulty(difficultyValue);
  }

  public cycleDifficulty(): void {
    switch (this.currentDifficulty) {
      case DifficultyLevel.EASY:
        this.setDifficulty(DifficultyLevel.MEDIUM);
        break;
      case DifficultyLevel.MEDIUM:
        this.setDifficulty(DifficultyLevel.HARD);
        break;
      case DifficultyLevel.HARD:
        this.setDifficulty(DifficultyLevel.EASY);
        break;
    }
    this.difficultyMessage = `Difficulty set to ${this.currentDifficulty}`;
    this.difficultyMessageTimer = 2; // show for 2 seconds
  }

  private cycleMusic(): void {
    this.currentMusicIndex = (this.currentMusicIndex + 1) % this.musicTracks.length;
    this.audio.setMusic(this.currentMusicIndex);
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  public getState(): GameState {
    return this.gameState;
  }
}
