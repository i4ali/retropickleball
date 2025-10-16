// Core game types and interfaces

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number; // height above ground
}

export interface Dimensions {
  width: number;
  height: number;
}

export enum GameState {
  START,
  SERVING,
  PLAYING,
  PAUSED,
  POINT_WON,
  GAME_OVER
}

export enum PlayerType {
  PLAYER,
  AI
}

export enum DifficultyLevel {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  courtWidth: number;
  courtHeight: number;
  paddleWidth: number;
  paddleHeight: number;
  ballSize: number;
  winningScore: number;
}
