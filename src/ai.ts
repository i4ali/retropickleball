import { Game } from './game';
import { Player } from './player';
import { Ball } from './ball';

export class AI {
  private game: Game;
  private paddle: Player;
  private ball: Ball;
  private reactionDelay: number = 0.1; // seconds
  private reactionTimer: number = 0;
  private targetY: number = 0;
  private difficulty: number = 0.85; // 0-1, higher = better AI

  constructor(game: Game, paddle: Player, ball: Ball) {
    this.game = game;
    this.paddle = paddle;
    this.ball = ball;
    this.targetY = paddle.position.y;
  }

  public update(deltaTime: number): void {
    // Update reaction timer
    this.reactionTimer += deltaTime;

    // Only update target if enough time has passed (simulates reaction time)
    if (this.reactionTimer >= this.reactionDelay) {
      this.reactionTimer = 0;
      this.updateTarget();
    }

    // Move paddle toward target
    this.movePaddle(deltaTime);
  }

  private updateTarget(): void {
    const ballCenter = this.ball.getCenter();
    const paddleCenter = this.paddle.getCenter();
    const paddleWidth = 40;

    // Predict where the ball will be (horizontal X position)
    let targetX = ballCenter.x;

    // Only track ball if it's moving toward AI (upward)
    if (this.ball.velocity.y < 0) {
      // Add prediction based on ball velocity
      const timeToReach = Math.abs((this.paddle.position.y - ballCenter.y) / this.ball.velocity.y);
      targetX = ballCenter.x + this.ball.velocity.x * timeToReach;

      // Clamp to court bounds
      const canvas = this.game.getCanvas();
      const courtLeft = 50;
      const courtRight = canvas.width - 50;
      targetX = Math.max(courtLeft + paddleWidth / 2, Math.min(courtRight - paddleWidth / 2, targetX));

      // Add some randomness based on difficulty (lower difficulty = more error)
      const error = (1 - this.difficulty) * 100;
      targetX += (Math.random() * error * 2) - error;
    } else {
      // Return to center when ball is moving away
      targetX = this.game.getCanvas().width / 2;
    }

    this.targetY = targetX - paddleWidth / 2; // Reusing targetY variable for X position
  }

  private movePaddle(deltaTime: number): void {
    const paddleCenter = this.paddle.getCenter().x;
    const targetCenter = this.targetY + 20; // Reusing targetY for X position
    const threshold = 5; // pixels

    // Move toward target (left/right movement)
    if (Math.abs(targetCenter - paddleCenter) > threshold) {
      if (targetCenter > paddleCenter) {
        this.paddle.moveRight = true;
        this.paddle.moveLeft = false;
      } else {
        this.paddle.moveLeft = true;
        this.paddle.moveRight = false;
      }
    } else {
      // Stop when close enough
      this.paddle.moveLeft = false;
      this.paddle.moveRight = false;
    }

    // Add some imperfection - occasionally fail to move
    if (Math.random() > this.difficulty) {
      this.paddle.moveLeft = false;
      this.paddle.moveRight = false;
    }
  }

  public setDifficulty(difficulty: number): void {
    this.difficulty = Math.max(0, Math.min(1, difficulty));

    // Adjust reaction delay based on difficulty
    // Easy: 0.14s, Medium: 0.08s, Hard: 0.04s
    this.reactionDelay = 0.02 + (1 - this.difficulty) * 0.2;
  }
}
