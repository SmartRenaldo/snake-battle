// src/utils/snakeHelpers.ts

import { Snake } from "../models/Snake";
import { AISnake } from "../models/AISnake";

/**
 * Ensures a snake object has its methods intact
 */
export function ensureSnakeMethods(snake: Snake): Snake {
  // Check if the object already has its methods
  if (
    typeof snake.update === "function" &&
    typeof snake.updateDirection === "function"
  ) {
    return snake; // Methods are intact, return original
  }

  // Methods are missing, create a new instance
  const newSnake = new Snake(
    snake.id || "reconstructed",
    snake.segments[0]?.position || { x: 0, y: 0 },
    snake.segments.length,
    snake.skin,
    snake.entityType
  );

  // Copy essential properties to maintain state
  Object.assign(newSnake, {
    segments: [...snake.segments],
    direction: { ...snake.direction },
    targetDirection: { ...snake.targetDirection },
    speed: snake.speed,
    boosting: snake.boosting,
    alive: snake.alive,
  });

  return newSnake;
}

/**
 * Ensures an AI snake object has its methods intact
 */
export function ensureAISnakeMethods(aiSnake: AISnake): AISnake {
  // Check if methods are present
  if (
    typeof aiSnake.update === "function" &&
    typeof aiSnake.updateBehavior === "function"
  ) {
    return aiSnake; // Methods are intact, return original
  }

  // Methods are missing, create a new instance
  const newAISnake = new AISnake(
    aiSnake.id,
    aiSnake.segments[0].position,
    aiSnake.segments.length // Use actual length
  );

  // If we've already initialized segments, replace them
  if (aiSnake.segments.length > 0) {
    newAISnake.segments = [...aiSnake.segments];
  }

  // Copy other important properties
  newAISnake.direction = { ...aiSnake.direction };
  newAISnake.targetDirection = { ...aiSnake.targetDirection };
  newAISnake.behavior = aiSnake.behavior;
  newAISnake.speed = aiSnake.speed;
  newAISnake.boosting = aiSnake.boosting;
  newAISnake.alive = aiSnake.alive;

  return newAISnake;
}

/**
 * Type-safe way to update state by preserving methods
 */
export function preserveMethods<T>(obj: T): T {
  // Create a shallow copy that preserves methods
  return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}
