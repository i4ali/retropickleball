// Core game types and interfaces

export interface Vector2D {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export enum GameState {
  START,
  SERVING,
  PLAYING,
  POINT_WON,
  GAME_OVER
}

export enum PlayerType {
  PLAYER,
  AI
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
