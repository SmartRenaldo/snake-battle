// src/models/AISnake.ts

import { gameConfig } from "../config/gameConfig";
import { EntityType, AIBehavior } from "../utils/constants";
import {
  Vector,
  createVector,
  add,
  subtract,
  scale,
  normalize,
  distance,
  angle,
  rotate,
} from "../utils/vector";
import { Snake } from "./Snake";

/**
 * AI Snake class that extends the base Snake with AI-specific behaviors
 */
export class AISnake extends Snake {
  behavior: AIBehavior;
  targetPosition: Vector | null;
  decisionTimer: number;
  boostTimer: number;
  wanderAngle: number;

  constructor(
    id: string,
    startPosition: Vector,
    initialLength: number = gameConfig.aiSnake.initialLength
  ) {
    // Initialize with AI-specific properties
    super(id, startPosition, initialLength, "default", EntityType.AI_SNAKE);

    // Override speed settings with AI values
    this.baseSpeed = gameConfig.aiSnake.baseSpeed;
    this.boostSpeed = gameConfig.aiSnake.boostSpeed;
    this.speed = this.baseSpeed;

    // AI behavior properties
    this.behavior = AIBehavior.WANDER;
    this.targetPosition = null;
    this.decisionTimer = 0;
    this.boostTimer = 0;
    this.wanderAngle = Math.random() * Math.PI * 2; // Random initial direction
  }

  /**
   * Update AI behavior based on player position and other entities
   */
  updateBehavior(
    playerSnake: Snake,
    foods: Array<{ position: Vector }>,
    canvasWidth: number,
    canvasHeight: number,
    deltaTime: number
  ): void {
    if (!this.alive) return;

    // Decrement timers
    this.decisionTimer -= deltaTime;
    this.boostTimer -= deltaTime;

    // Make new decisions periodically
    if (this.decisionTimer <= 0) {
      // Random decision interval between 0.5 and 1.5 seconds
      this.decisionTimer = 0.5 + Math.random() * 1.0;

      // Decide behavior based on player and AI snake state
      if (this.shouldChasePlayer(playerSnake)) {
        this.behavior = AIBehavior.CHASE;
        this.targetPosition = { ...playerSnake.headPosition };
      } else if (this.shouldFleeFromPlayer(playerSnake)) {
        this.behavior = AIBehavior.FLEE;
        this.targetPosition = { ...playerSnake.headPosition };
      } else if (foods.length > 0 && Math.random() < 0.7) {
        this.behavior = AIBehavior.SEEK_FOOD;
        // Find closest food
        const closestFood = this.findClosestFood(foods);
        if (closestFood) {
          this.targetPosition = { ...closestFood.position };
        }
      } else {
        this.behavior = AIBehavior.WANDER;
        // Update wander angle
        this.wanderAngle += (Math.random() - 0.5) * Math.PI * 0.5;
      }

      // Decide whether to boost
      this.decideBoost(playerSnake);
    }

    // Update target position based on behavior
    this.updateTargetPosition(playerSnake, canvasWidth, canvasHeight);

    // Stop boosting if timer expired
    if (this.boostTimer <= 0 && this.boosting) {
      this.stopBoost();
    }

    // Update direction to move toward target
    if (this.targetPosition) {
      this.updateDirection(this.targetPosition);
    }
  }

  /**
   * Decide whether to boost based on current situation
   */
  private decideBoost(playerSnake: Snake): void {
    // Don't boost if length is too short
    if (this.segments.length <= gameConfig.aiSnake.minLengthBeforeBoost) {
      if (this.boosting) {
        this.stopBoost();
      }
      return;
    }

    // Set boost probability based on behavior
    let boostProbability = 0;

    if (this.behavior === AIBehavior.CHASE) {
      boostProbability = gameConfig.aiSnake.chaseBoostProbability;
    } else if (this.behavior === AIBehavior.FLEE) {
      boostProbability = gameConfig.aiSnake.fleeBoostProbability;
    } else {
      boostProbability = 0.1; // Low chance to boost in other states
    }

    // Random decision to boost
    if (Math.random() < boostProbability) {
      this.startBoost();
      // Boost for a random duration between 1-3 seconds
      this.boostTimer = 1 + Math.random() * 2;
    } else if (this.boosting) {
      this.stopBoost();
    }
  }

  /**
   * Determine if AI should chase the player
   */
  private shouldChasePlayer(playerSnake: Snake): boolean {
    // Chase if AI is larger than player
    return (
      this.segments.length >= playerSnake.segments.length &&
      distance(this.headPosition, playerSnake.headPosition) < 300
    );
  }

  /**
   * Determine if AI should flee from the player
   */
  private shouldFleeFromPlayer(playerSnake: Snake): boolean {
    // Flee if player is larger than AI
    return (
      this.segments.length < playerSnake.segments.length &&
      distance(this.headPosition, playerSnake.headPosition) < 250
    );
  }

  /**
   * Find the closest food item
   */
  private findClosestFood(
    foods: Array<{ position: Vector }>
  ): { position: Vector } | null {
    if (foods.length === 0) return null;

    let closestFood = foods[0];
    let closestDistance = distance(this.headPosition, foods[0].position);

    for (let i = 1; i < foods.length; i++) {
      const dist = distance(this.headPosition, foods[i].position);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestFood = foods[i];
      }
    }

    return closestFood;
  }

  /**
   * Update target position based on current behavior
   */
  private updateTargetPosition(
    playerSnake: Snake,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    switch (this.behavior) {
      case AIBehavior.CHASE:
        // Update target to chase player
        this.targetPosition = { ...playerSnake.headPosition };
        break;

      case AIBehavior.FLEE:
        // Flee in the opposite direction from player
        if (this.targetPosition) {
          const fleeDirection = normalize(
            subtract(this.headPosition, playerSnake.headPosition)
          );
          const fleeDistance = 200 + Math.random() * 100;
          this.targetPosition = add(
            this.headPosition,
            scale(fleeDirection, fleeDistance)
          );

          // Keep within canvas bounds
          this.targetPosition.x = Math.max(
            20,
            Math.min(canvasWidth - 20, this.targetPosition.x)
          );
          this.targetPosition.y = Math.max(
            20,
            Math.min(canvasHeight - 20, this.targetPosition.y)
          );
        }
        break;

      case AIBehavior.WANDER:
        // Wander in a somewhat random direction
        const wanderDirection = {
          x: Math.cos(this.wanderAngle),
          y: Math.sin(this.wanderAngle),
        };

        const wanderDistance = 100 + Math.random() * 100;
        this.targetPosition = add(
          this.headPosition,
          scale(wanderDirection, wanderDistance)
        );

        // Avoid canvas edges
        const margin = 50;
        if (
          this.targetPosition.x < margin ||
          this.targetPosition.x > canvasWidth - margin ||
          this.targetPosition.y < margin ||
          this.targetPosition.y > canvasHeight - margin
        ) {
          // Turn away from edges
          this.wanderAngle =
            angle(
              subtract(
                {
                  x: canvasWidth / 2,
                  y: canvasHeight / 2,
                },
                this.headPosition
              )
            ) +
            (Math.random() - 0.5) * Math.PI * 0.5;

          const newDirection = {
            x: Math.cos(this.wanderAngle),
            y: Math.sin(this.wanderAngle),
          };

          this.targetPosition = add(
            this.headPosition,
            scale(newDirection, wanderDistance)
          );
        }
        break;

      case AIBehavior.SEEK_FOOD:
        // Target position already set to closest food
        break;
    }
  }

  /**
   * Override update method to include AI-specific logic
   */
  update(
    deltaTime: number,
    currentTime: number,
    playerSnake: Snake,
    foods: Array<{ position: Vector }>,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (!this.alive) return;

    console.log(`Updating AI snake ID: ${this.id}, behavior: ${this.behavior}`);

    // Update AI behavior
    this.updateBehavior(
      playerSnake,
      foods,
      canvasWidth,
      canvasHeight,
      deltaTime
    );

    // If we have no target, set a default one to avoid freezing
    if (!this.targetPosition) {
      this.targetPosition = {
        x: canvasWidth / 2 + (Math.random() - 0.5) * 200,
        y: canvasHeight / 2 + (Math.random() - 0.5) * 200,
      };
      console.log(
        `No target, setting default: (${this.targetPosition.x.toFixed(
          2
        )}, ${this.targetPosition.y.toFixed(2)})`
      );
    }

    // Call parent update method
    super.update(deltaTime, currentTime);
  }
}
