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
  stateVersion: number = 0;
  spawnTime: number;

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
    this.spawnTime = Date.now();

    // Initialize segments
    this.initializeSegments(startPosition, initialLength);
  }

  // Common methods
  protected initializeSegments(_startPosition: Vector, _length: number): void {
    // Implementation
  }

  updateDirection(_targetPosition: Vector): void {
    // Implementation
  }

  startBoost(): void {
    // Implementation
  }

  stopBoost(): void {
    // Implementation
  }

  grow(_amount: number = 1): void {
    // Implementation
  }

  shrink(_amount: number = 1): void {
    // Implementation
  }

  kill(): void {
    this.alive = false;
    this.boosting = false;
    this.speed = 0;
  }

  isSegmentImmune(_segmentIndex: number): boolean {
    // Implementation
    return false;
  }

  getSegmentRadius(_segmentIndex: number): number {
    // Implementation
    return 0;
  }

  // Abstract method to be implemented by subclasses with their own signatures
  abstract update(...args: any[]): void;

  get length(): number {
    return this.segments.length;
  }

  get headPosition(): Vector {
    // Defensive check to ensure segments array is not empty
    if (!this.segments || this.segments.length === 0) {
      console.warn(`No segments found for snake with ID: ${this.id}`);
      return { x: 0, y: 0 }; // Return a default position
    }
    return this.segments[0].position;
  }

  get tailPosition(): Vector {
    if (!this.segments || this.segments.length === 0) {
      console.warn(`No segments found for snake with ID: ${this.id}`);
      return { x: 0, y: 0 }; // Return a default position
    }
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
