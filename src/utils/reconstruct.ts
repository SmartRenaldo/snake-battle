// src/utils/reconstruct.ts

import { Snake } from "../models/Snake";
import { AISnake } from "../models/AISnake";
import { EntityType } from "./constants";

/**
 * Helper function to safely reconstruct a Snake object from state
 * This ensures all methods are available even if they were lost in React state updates
 */
export function reconstructSnake(snakeData: any): Snake | null {
  if (!snakeData) return null;

  // Check if the object already has its methods intact
  if (
    typeof snakeData.update === "function" &&
    typeof snakeData.updateDirection === "function" &&
    typeof snakeData.isSegmentImmune === "function"
  ) {
    // Methods are intact, no need to reconstruct
    return snakeData;
  }

  try {
    // Create a new Snake instance
    const snake = new Snake(
      snakeData.id || "reconstructed",
      snakeData.segments[0].position,
      0, // We'll set segments manually
      snakeData.skin || "default",
      snakeData.entityType || EntityType.PLAYER
    );

    // Copy all properties
    Object.assign(snake, {
      segments: snakeData.segments || [],
      direction: snakeData.direction || { x: 1, y: 0 },
      targetDirection: snakeData.targetDirection || { x: 1, y: 0 },
      speed: snakeData.speed || 100,
      baseSpeed: snakeData.baseSpeed || 100,
      boostSpeed: snakeData.boostSpeed || 200,
      boosting: snakeData.boosting || false,
      boostTimeLeft: snakeData.boostTimeLeft || 0,
      invincibleBoost: snakeData.invincibleBoost || false,
      lastBoostCostTime: snakeData.lastBoostCostTime || 0,
      points: snakeData.points || 0,
      alive: snakeData.alive !== undefined ? snakeData.alive : true,
      segmentDistance: snakeData.segmentDistance || 4,
      lastUpdateTime: snakeData.lastUpdateTime || 0,
    });

    return snake;
  } catch (error) {
    console.error("Failed to reconstruct Snake object:", error);
    return snakeData; // Return original if reconstruction fails
  }
}

/**
 * Helper function to safely reconstruct an AISnake object from state
 */
export function reconstructAISnake(aiSnakeData: any): AISnake | null {
  if (!aiSnakeData) return null;

  // Check if the object already has its methods intact
  if (
    typeof aiSnakeData.update === "function" &&
    typeof aiSnakeData.updateDirection === "function" &&
    typeof aiSnakeData.updateBehavior === "function"
  ) {
    // Methods are intact, no need to reconstruct
    return aiSnakeData;
  }

  try {
    // Create a new AISnake instance
    const aiSnake = new AISnake(
      aiSnakeData.id || "ai_reconstructed",
      aiSnakeData.segments[0].position,
      0 // We'll set segments manually
    );

    // Copy all properties
    Object.assign(aiSnake, {
      segments: aiSnakeData.segments || [],
      direction: aiSnakeData.direction || { x: 1, y: 0 },
      targetDirection: aiSnakeData.targetDirection || { x: 1, y: 0 },
      speed: aiSnakeData.speed || 90,
      baseSpeed: aiSnakeData.baseSpeed || 90,
      boostSpeed: aiSnakeData.boostSpeed || 180,
      boosting: aiSnakeData.boosting || false,
      boostTimeLeft: aiSnakeData.boostTimeLeft || 0,
      invincibleBoost: aiSnakeData.invincibleBoost || false,
      lastBoostCostTime: aiSnakeData.lastBoostCostTime || 0,
      points: aiSnakeData.points || 0,
      alive: aiSnakeData.alive !== undefined ? aiSnakeData.alive : true,
      segmentDistance: aiSnakeData.segmentDistance || 4,
      lastUpdateTime: aiSnakeData.lastUpdateTime || 0,

      // AI specific properties
      behavior: aiSnakeData.behavior || "wander",
      targetPosition: aiSnakeData.targetPosition || null,
      decisionTimer: aiSnakeData.decisionTimer || 0,
      boostTimer: aiSnakeData.boostTimer || 0,
      wanderAngle: aiSnakeData.wanderAngle || Math.random() * Math.PI * 2,
    });

    return aiSnake;
  } catch (error) {
    console.error("Failed to reconstruct AISnake object:", error);
    return aiSnakeData; // Return original if reconstruction fails
  }
}
