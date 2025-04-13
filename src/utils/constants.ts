// src/utils/constants.ts

/**
 * Game states
 */
export enum GameState {
  START = "start",
  PLAYING = "playing",
  PAUSED = "paused",
  GAME_OVER = "gameOver",
}

/**
 * Entity types for collision detection
 */
export enum EntityType {
  PLAYER = "player",
  AI_SNAKE = "aiSnake",
  FOOD = "food",
  POWER_UP = "powerUp",
  WALL = "wall",
}

/**
 * Food types
 */
export enum FoodType {
  REGULAR = "regular",
  INVINCIBLE_BOOST = "invincibleBoost",
}

/**
 * Direction constants
 */
export enum Direction {
  UP = "up",
  DOWN = "down",
  LEFT = "left",
  RIGHT = "right",
}

/**
 * AI behavior states
 */
export enum AIBehavior {
  CHASE = "chase",
  FLEE = "flee",
  WANDER = "wander",
  SEEK_FOOD = "seekFood",
}

/**
 * Key codes for keyboard controls
 */
export const KEYS = {
  SPACE: " ",
  ESC: "Escape",
  P: "p",
  R: "r",
};

/**
 * Z-index for different game elements
 */
export const Z_INDEX = {
  BACKGROUND: 0,
  FOOD: 10,
  SNAKE_BODY: 20,
  SNAKE_HEAD: 30,
  PARTICLES: 40,
  UI: 100,
};

/**
 * Sound effects references
 */
export const SOUNDS = {
  EAT: "eat",
  BOOST_START: "boostStart",
  BOOST_LOOP: "boostLoop",
  BOOST_END: "boostEnd",
  COLLISION: "collision",
  DEATH: "death",
  POWER_UP: "powerUp",
  LENGTH_WARNING: "lengthWarning",
  BACKGROUND: "background",
};

/**
 * Collision layers for different elements
 */
export const COLLISION_LAYERS = {
  PLAYER: 0b0001,
  AI_SNAKE: 0b0010,
  FOOD: 0b0100,
  POWER_UP: 0b1000,
  ALL: 0b1111,
};

/**
 * Snake segment type
 */
export enum SegmentType {
  HEAD = "head",
  BODY = "body",
  TAIL = "tail",
}
