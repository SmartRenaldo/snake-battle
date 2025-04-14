// src/models/AISnake.ts

import { gameConfig } from "../config/gameConfig";
import { EntityType, AIBehavior, SegmentType } from "../utils/constants";
import {
  Vector,
  distance,
  subtract,
  normalize,
  scale,
  angle,
  add,
  limitAngle, // Added missing import
} from "../utils/vector";
import { BaseSnake } from "./BaseSnake";
import { Snake } from "./Snake";

export class AISnake extends BaseSnake {
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

  protected initializeSegments(startPosition: Vector, length: number): void {
    // Clear any existing segments
    this.segments = [];

    // Create head
    this.segments.push({
      position: { ...startPosition },
      width: gameConfig.aiSnake.baseWidth || gameConfig.playerSnake.baseWidth,
      type: SegmentType.HEAD,
      boosting: false,
    });

    // Create body segments (in reverse direction of initial movement)
    for (let i = 1; i < length; i++) {
      this.segments.push({
        position: {
          x: startPosition.x - i * this.segmentDistance,
          y: startPosition.y,
        },
        width: this.calculateSegmentWidth(i, length),
        type: i === length - 1 ? SegmentType.TAIL : SegmentType.BODY,
        boosting: false,
      });
    }

    console.log(
      `AI Snake initialized with ${length} segments at (${startPosition.x.toFixed(
        2
      )}, ${startPosition.y.toFixed(2)})`
    );
  }

  /**
   * Calculate the width of a segment based on its position and the snake's length
   * (Implementing method that was missing)
   */
  protected calculateSegmentWidth(
    segmentIndex: number,
    totalLength: number
  ): number {
    const baseWidth = gameConfig.playerSnake.baseWidth;

    // If length is less than or equal to 10, use base width
    if (totalLength <= 10) {
      return baseWidth;
    }

    // Calculate additional width based on length
    const additionalWidth =
      Math.floor(
        (totalLength - 10) / gameConfig.playerSnake.widthGrowthInterval
      ) * gameConfig.playerSnake.widthIncrement;

    // Cap at maximum width
    const calculatedWidth = Math.min(
      baseWidth + additionalWidth,
      gameConfig.playerSnake.maxWidth
    );

    // If boosting, don't change width
    if (this.boosting) {
      return this.segments[segmentIndex]?.width || calculatedWidth;
    }

    return calculatedWidth;
  }

  /**
   * Update snake's segments to match current length and state
   * (Implementing method that was missing)
   */
  protected updateSegmentWidths(): void {
    const length = this.segments.length;

    this.segments.forEach((segment, index) => {
      if (!this.boosting) {
        segment.width = this.calculateSegmentWidth(index, length);
      }

      // Update segment types
      if (index === 0) {
        segment.type = SegmentType.HEAD;
      } else if (index === length - 1) {
        segment.type = SegmentType.TAIL;
      } else {
        segment.type = SegmentType.BODY;
      }

      // Update boosting state
      segment.boosting = this.boosting;
    });
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
   * Parameter is renamed with underscore to avoid TypeScript warning
   */
  private decideBoost(_playerSnake: Snake): void {
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
    // Safety check for segments
    if (
      !this.segments ||
      this.segments.length === 0 ||
      !playerSnake.segments ||
      playerSnake.segments.length === 0
    ) {
      return false;
    }

    // Original logic
    return (
      this.segments.length >= playerSnake.segments.length &&
      distance(this.headPosition, playerSnake.headPosition) < 300
    );
  }

  /**
   * Determine if AI should flee from the player
   */
  private shouldFleeFromPlayer(playerSnake: Snake): boolean {
    // Safety check for segments
    if (
      !this.segments ||
      this.segments.length === 0 ||
      !playerSnake.segments ||
      playerSnake.segments.length === 0
    ) {
      return false;
    }

    // Original logic
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
   * Override update method with AI-specific implementation
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

    // Smooth direction change with limited angle
    this.direction = limitAngle(
      this.direction,
      this.targetDirection,
      gameConfig.playerSnake.maxTurnAngle
    );

    // Calculate distance to move based on speed and time
    const moveDistance = this.speed * deltaTime;

    // Store old head position
    const oldHeadPos = { ...this.segments[0].position };

    // Move head in current direction
    this.segments[0].position = add(
      oldHeadPos,
      scale(this.direction, moveDistance)
    );

    // Move rest of body (follow the leader)
    for (let i = 1; i < this.segments.length; i++) {
      const oldPos = { ...this.segments[i].position };

      // Find direction to previous segment
      const dirToPrev = subtract(this.segments[i - 1].position, oldPos);
      const distToPrev = distance(oldPos, this.segments[i - 1].position);

      // Move toward previous segment to maintain consistent spacing
      if (distToPrev > this.segmentDistance) {
        const moveAmount = distToPrev - this.segmentDistance;
        const moveDir = normalize(dirToPrev);
        this.segments[i].position = add(oldPos, scale(moveDir, moveAmount));
      }
    }

    // Handle boosting and length consumption
    if (this.boosting) {
      // If invincible boost is active, decrement timer
      if (this.invincibleBoost) {
        this.boostTimeLeft -= deltaTime;

        if (this.boostTimeLeft <= 0) {
          this.invincibleBoost = false;
        }
      }
      // Regular boost consumes length
      else {
        // Check if we need to consume length
        const timeSinceLastCost = currentTime - this.lastBoostCostTime;
        if (timeSinceLastCost >= 1.0) {
          // Every second
          // Consume 1 length
          this.shrink(gameConfig.playerSnake.boostCostPerSecond);
          this.lastBoostCostTime = currentTime;

          // If not enough length, stop boosting
          if (
            this.segments.length <= gameConfig.playerSnake.minLengthForBoost
          ) {
            this.stopBoost();
          }
        }
      }
    }

    // Update segment immunity timers
    this.segments.forEach((segment) => {
      if (segment.immunityTimeLeft && segment.immunityTimeLeft > 0) {
        segment.immunityTimeLeft -= deltaTime;
      }
    });

    // Update segment widths periodically
    if (Math.abs(currentTime - this.lastUpdateTime) > 0.5) {
      this.updateSegmentWidths();
      this.lastUpdateTime = currentTime;
    }
  }
}
