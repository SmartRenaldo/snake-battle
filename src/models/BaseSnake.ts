// src/models/BaseSnake.ts
import { Vector } from "../utils/vector";
import { EntityType, SegmentType } from "../utils/constants";
import { gameConfig } from "../config/gameConfig";
import { SkinType } from "../config/gameConfig";

export interface SnakeSegment {
  position: Vector;
  width: number;
  type: SegmentType;
  immunityTimeLeft?: number;
  boosting: boolean;
}

// Base class with common functionality
export abstract class BaseSnake {
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
    entityType: EntityType
  ) {
    this.id = id;
    this.segments = [];
    this.direction = { x: 1, y: 0 };
    this.targetDirection = { x: 1, y: 0 };
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

    // Initialize segments
    this.initializeSegments(startPosition, initialLength);
  }

  // Common methods
  protected initializeSegments(startPosition: Vector, length: number): void {
    // Implementation
  }

  updateDirection(targetPosition: Vector): void {
    // Implementation
  }

  startBoost(): void {
    // Implementation
  }

  stopBoost(): void {
    // Implementation
  }

  grow(amount: number = 1): void {
    // Implementation
  }

  shrink(amount: number = 1): void {
    // Implementation
  }

  kill(): void {
    this.alive = false;
    this.boosting = false;
    this.speed = 0;
  }

  isSegmentImmune(segmentIndex: number): boolean {
    // Implementation
    return false;
  }

  getSegmentRadius(segmentIndex: number): number {
    // Implementation
    return 0;
  }

  // Abstract method to be implemented by subclasses with their own signatures
  abstract update(...args: any[]): void;

  get length(): number {
    return this.segments.length;
  }

  get headPosition(): Vector {
    return this.segments[0].position;
  }

  get tailPosition(): Vector {
    return this.segments[this.segments.length - 1].position;
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
}
