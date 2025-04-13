// src/models/Snake.ts

import { gameConfig } from "../config/gameConfig";
import { EntityType, SegmentType } from "../utils/constants";
import {
  Vector,
  createVector,
  add,
  subtract,
  scale,
  normalize,
  distance,
  angle,
  limitAngle,
} from "../utils/vector";
import { SkinType } from "../config/gameConfig";

/**
 * Interface for a snake segment
 */
export interface SnakeSegment {
  position: Vector;
  width: number;
  type: SegmentType;
  immunityTimeLeft?: number;
  boosting: boolean;
}

/**
 * Main Snake class for player-controlled snake
 */
export class Snake {
  id: string;
  segments: SnakeSegment[];
  direction: Vector;
  targetDirection: Vector;
  speed: number;
  baseSpeed: number;
  boostSpeed: number;
  boosting: boolean;
  boostTimeLeft: number;
  invincibleBoost: boolean;
  lastBoostCostTime: number;
  points: number;
  alive: boolean;
  skin: SkinType;
  entityType: EntityType;
  segmentDistance: number;
  lastUpdateTime: number;

  constructor(
    id: string,
    startPosition: Vector,
    initialLength: number = gameConfig.playerSnake.initialLength,
    skin: SkinType = "default",
    entityType: EntityType = EntityType.PLAYER
  ) {
    this.id = id;
    this.segments = [];
    this.direction = createVector(1, 0); // Start moving right
    this.targetDirection = createVector(1, 0);
    this.baseSpeed = gameConfig.playerSnake.baseSpeed;
    this.boostSpeed = gameConfig.playerSnake.boostSpeed;
    this.speed = this.baseSpeed;
    this.boosting = false;
    this.boostTimeLeft = 0;
    this.invincibleBoost = false;
    this.lastBoostCostTime = 0;
    this.points = 0;
    this.alive = true;
    this.skin = skin;
    this.entityType = entityType;
    this.segmentDistance = gameConfig.playerSnake.baseWidth;
    this.lastUpdateTime = 0;

    // Initialize snake segments
    this.initializeSegments(startPosition, initialLength);
  }

  /**
   * Initialize segments for a new snake
   */
  private initializeSegments(startPosition: Vector, length: number): void {
    // Create head
    this.segments.push({
      position: { ...startPosition },
      width: gameConfig.playerSnake.baseWidth,
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
  }

  /**
   * Calculate the width of a segment based on its position and the snake's length
   */
  private calculateSegmentWidth(
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
   */
  private updateSegmentWidths(): void {
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
   * Update snake direction to move toward target position
   */
  updateDirection(targetPosition: Vector): void {
    if (!this.alive) return;

    // Calculate direction to target
    const headPosition = this.segments[0].position;
    const directionToTarget = subtract(targetPosition, headPosition);

    // Only update if there's a significant direction
    if (
      Math.abs(directionToTarget.x) > 0.01 ||
      Math.abs(directionToTarget.y) > 0.01
    ) {
      this.targetDirection = normalize(directionToTarget);
      console.log(
        `Updated target direction: (${this.targetDirection.x.toFixed(
          2
        )}, ${this.targetDirection.y.toFixed(2)})`
      );
    }
  }

  /**
   * Start boosting
   */
  startBoost(): void {
    if (!this.alive) return;

    // Check if snake is long enough to boost
    if (
      this.segments.length <= gameConfig.playerSnake.minLengthForBoost &&
      !this.invincibleBoost
    ) {
      return;
    }

    this.boosting = true;
    this.speed = this.boostSpeed;

    // Apply boosting state to all segments
    this.segments.forEach((segment) => {
      segment.boosting = true;
    });
  }

  /**
   * Stop boosting
   */
  stopBoost(): void {
    if (!this.alive) return;

    this.boosting = false;
    this.speed = this.baseSpeed;

    // Remove boosting state from all segments
    this.segments.forEach((segment) => {
      segment.boosting = false;
    });
  }

  /**
   * Apply the invincible boost power-up
   */
  applyInvincibleBoost(
    duration: number = gameConfig.invincibleBoost.duration
  ): void {
    this.invincibleBoost = true;
    this.boostTimeLeft = duration;
  }

  /**
   * Add length to the snake
   */
  grow(amount: number = 1): void {
    if (!this.alive || amount <= 0) return;

    const lastSegment = this.segments[this.segments.length - 1];

    for (let i = 0; i < amount; i++) {
      this.segments.push({
        position: { ...lastSegment.position },
        width: lastSegment.width,
        type: SegmentType.TAIL,
        boosting: this.boosting,
      });
    }

    // Update segment types and widths
    this.updateSegmentWidths();
  }

  /**
   * Remove length from the snake's tail
   */
  shrink(amount: number = 1): void {
    if (!this.alive || amount <= 0) return;

    // Ensure we don't shrink below minimum length
    const newLength = Math.max(1, this.segments.length - amount);

    // Remove segments from the tail
    this.segments = this.segments.slice(0, newLength);

    // Update segment types and widths
    this.updateSegmentWidths();
  }

  /**
   * Add points to the snake's score
   */
  addPoints(amount: number): void {
    this.points += amount;
  }

  /**
   * Kill the snake
   */
  kill(): void {
    this.alive = false;
    this.boosting = false;
    this.speed = 0;
  }

  /**
   * Apply temporary immunity to a segment
   */
  applyImmunity(segmentIndex: number, duration: number): void {
    if (segmentIndex >= 0 && segmentIndex < this.segments.length) {
      this.segments[segmentIndex].immunityTimeLeft = duration;
    }
  }

  /**
   * Get the snake's length
   */
  get length(): number {
    return this.segments.length;
  }

  /**
   * Get the snake's head position
   */
  get headPosition(): Vector {
    return this.segments[0].position;
  }

  /**
   * Get the snake's tail position
   */
  get tailPosition(): Vector {
    return this.segments[this.segments.length - 1].position;
  }

  /**
   * Main update method - called every frame
   */
  update(deltaTime: number, currentTime: number): void {
    if (!this.alive) return;

    // Debug log
    console.log(
      `Updating snake: direction=(${this.direction.x.toFixed(
        2
      )}, ${this.direction.y.toFixed(
        2
      )}), pos=(${this.segments[0].position.x.toFixed(
        2
      )}, ${this.segments[0].position.y.toFixed(2)})`
    );

    // Smooth direction change with limited angle
    this.direction = limitAngle(
      this.direction,
      this.targetDirection,
      gameConfig.playerSnake.maxTurnAngle
    );

    // Calculate distance to move based on speed and time
    const moveDistance = this.speed * deltaTime;
    console.log(`Move distance: ${moveDistance.toFixed(2)} pixels`);

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
          // Don't stop boosting here, just end invincibility
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

  /**
   * Check if a segment has active immunity
   */
  isSegmentImmune(segmentIndex: number): boolean {
    return (
      segmentIndex < gameConfig.playerSnake.headImmunitySegments ||
      (this.segments[segmentIndex]?.immunityTimeLeft ?? 0) > 0
    );
  }

  /**
   * Get bounding radius for a segment (for collision detection)
   */
  getSegmentRadius(segmentIndex: number): number {
    if (segmentIndex < 0 || segmentIndex >= this.segments.length) {
      return 0;
    }
    return this.segments[segmentIndex].width / 2;
  }
}
