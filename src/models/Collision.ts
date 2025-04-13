// src/models/Collision.ts

import { EntityType } from "../utils/constants";
import { Vector, distance, pointToLineDistance } from "../utils/vector";
import { Snake, SnakeSegment } from "./Snake";
import { Food } from "./Food";
import { gameConfig } from "../config/gameConfig";

/**
 * Collision result interface
 */
export interface CollisionResult {
  collided: boolean;
  entity1: any;
  entity2: any;
  type: CollisionType;
}

/**
 * Types of collisions
 */
export enum CollisionType {
  NONE = "none",
  PLAYER_FOOD = "playerFood",
  PLAYER_WALL = "playerWall",
  PLAYER_AI_HEAD = "playerAIHead",
  AI_PLAYER_HEAD = "AIPlayerHead",
  PLAYER_AI_BODY = "playerAIBody",
  AI_PLAYER_BODY = "AIPlayerBody",
  PLAYER_SELF = "playerSelf",
  AI_FOOD = "AIFood",
  AI_WALL = "AIWall",
  AI_SELF = "AISelf",
  AI_AI = "AIAI",
}

/**
 * Collision detection utility class
 */
export class CollisionDetection {
  /**
   * Check for collisions between a snake head and food
   */
  static checkSnakeFoodCollision(snake: Snake, foods: Food[]): Food | null {
    const head = snake.segments[0];
    const headPos = head.position;

    // Safely get head radius with fallback
    const headRadius =
      typeof snake.getSegmentRadius === "function"
        ? snake.getSegmentRadius(0)
        : head.width / 2;

    for (const food of foods) {
      const foodRadius = food.getCurrentRadius
        ? food.getCurrentRadius()
        : food.radius;
      const dist = distance(headPos, food.position);

      if (dist < headRadius + foodRadius) {
        return food;
      }
    }

    return null;
  }

  /**
   * Check for collisions between a snake and the walls
   */
  static checkSnakeWallCollision(
    snake: Snake,
    canvasWidth: number,
    canvasHeight: number
  ): boolean {
    const head = snake.segments[0];
    const headPos = head.position;

    // Safely get head radius with fallback
    const headRadius =
      typeof snake.getSegmentRadius === "function"
        ? snake.getSegmentRadius(0)
        : head.width / 2;

    // Check if head is outside the canvas bounds
    return (
      headPos.x - headRadius <= 0 ||
      headPos.x + headRadius >= canvasWidth ||
      headPos.y - headRadius <= 0 ||
      headPos.y + headRadius >= canvasHeight
    );
  }

  /**
   * Check for collisions between a snake head and another snake's body
   */
  static checkSnakeSnakeCollision(
    snake1: Snake,
    snake2: Snake,
    isSelfCollision: boolean = false
  ): { collided: boolean; segmentIndex: number } {
    // Get head of snake1
    const head1 = snake1.segments[0];
    const headPos1 = head1.position;

    // Safely get head radius with fallback
    const headRadius1 =
      typeof snake1.getSegmentRadius === "function"
        ? snake1.getSegmentRadius(0)
        : head1.width / 2;

    // Start checking from different segments depending on type of collision
    const startSegment = isSelfCollision
      ? snake2.headImmunitySegments ||
        gameConfig.playerSnake.headImmunitySegments // Skip immune segments for self-collision
      : 0; // Check all segments for snake-snake collision

    // Check collision with each segment of snake2
    for (let i = startSegment; i < snake2.segments.length; i++) {
      // Check if segment has immunity
      const isImmune =
        typeof snake2.isSegmentImmune === "function"
          ? snake2.isSegmentImmune(i)
          : i < gameConfig.playerSnake.headImmunitySegments ||
            (snake2.segments[i].immunityTimeLeft ?? 0) > 0;

      if (isImmune) {
        continue;
      }

      const segment = snake2.segments[i];
      const segmentPos = segment.position;

      // Safely get segment radius with fallback
      const segmentRadius =
        typeof snake2.getSegmentRadius === "function"
          ? snake2.getSegmentRadius(i)
          : segment.width / 2;

      // Coarse collision detection using circle-circle intersection
      const dist = distance(headPos1, segmentPos);
      if (dist < headRadius1 + segmentRadius) {
        // For higher precision, we could do polygon-based collision here
        // But circle-circle is sufficient for most cases
        return { collided: true, segmentIndex: i };
      }
    }

    return { collided: false, segmentIndex: -1 };
  }

  /**
   * Check for collisions between two specific snake segments
   */
  static checkSegmentSegmentCollision(
    snake1: Snake,
    segmentIndex1: number,
    snake2: Snake,
    segmentIndex2: number
  ): boolean {
    // Skip if either segment is immune
    if (
      snake1.isSegmentImmune(segmentIndex1) ||
      snake2.isSegmentImmune(segmentIndex2)
    ) {
      return false;
    }

    const segment1 = snake1.segments[segmentIndex1];
    const segment2 = snake2.segments[segmentIndex2];

    const pos1 = segment1.position;
    const pos2 = segment2.position;

    const radius1 = snake1.getSegmentRadius(segmentIndex1);
    const radius2 = snake2.getSegmentRadius(segmentIndex2);

    const dist = distance(pos1, pos2);
    return dist < radius1 + radius2;
  }

  /**
   * Check detailed collision between a point and a snake
   * Used for more precise collision detection when needed
   */
  static checkPointSnakeCollision(
    point: Vector,
    pointRadius: number,
    snake: Snake,
    skipHead: boolean = false
  ): { collided: boolean; segmentIndex: number } {
    // Start from head or first body segment
    const startSegment = skipHead ? 1 : 0;

    for (let i = startSegment; i < snake.segments.length; i++) {
      // Skip if segment has immunity
      if (snake.isSegmentImmune(i)) {
        continue;
      }

      const segment = snake.segments[i];
      const segmentPos = segment.position;
      const segmentRadius = snake.getSegmentRadius(i);

      const dist = distance(point, segmentPos);
      if (dist < pointRadius + segmentRadius) {
        return { collided: true, segmentIndex: i };
      }
    }

    return { collided: false, segmentIndex: -1 };
  }

  /**
   * Detect all collisions in the game
   */
  static detectCollisions(
    playerSnake: Snake,
    aiSnakes: Snake[],
    foods: Food[],
    canvasWidth: number,
    canvasHeight: number
  ): CollisionResult[] {
    const collisions: CollisionResult[] = [];

    // Skip collision detection if player is dead
    if (!playerSnake.alive) return collisions;

    // 1. Check player-food collisions
    const collidedFood = this.checkSnakeFoodCollision(playerSnake, foods);
    if (collidedFood) {
      collisions.push({
        collided: true,
        entity1: playerSnake,
        entity2: collidedFood,
        type: CollisionType.PLAYER_FOOD,
      });
    }

    // 2. Check player-wall collisions
    const playerWallCollision = this.checkSnakeWallCollision(
      playerSnake,
      canvasWidth,
      canvasHeight
    );
    if (playerWallCollision) {
      collisions.push({
        collided: true,
        entity1: playerSnake,
        entity2: null,
        type: CollisionType.PLAYER_WALL,
      });
    }

    // 3. Check player self-collision (with special rules)
    const playerSelfCollision = this.checkSnakeSnakeCollision(
      playerSnake,
      playerSnake,
      true // indicates self-collision
    );
    if (playerSelfCollision.collided) {
      collisions.push({
        collided: true,
        entity1: playerSnake,
        entity2: { segmentIndex: playerSelfCollision.segmentIndex },
        type: CollisionType.PLAYER_SELF,
      });
    }

    // 4. Check player-AI collisions
    for (const aiSnake of aiSnakes) {
      if (!aiSnake.alive) continue;

      // 4a. Check player head with AI body
      const playerHeadAICollision = this.checkSnakeSnakeCollision(
        playerSnake,
        aiSnake,
        false
      );
      if (playerHeadAICollision.collided) {
        collisions.push({
          collided: true,
          entity1: playerSnake,
          entity2: {
            snake: aiSnake,
            segmentIndex: playerHeadAICollision.segmentIndex,
          },
          type: CollisionType.PLAYER_AI_BODY,
        });
      }

      // 4b. Check AI head with player body
      const aiHeadPlayerCollision = this.checkSnakeSnakeCollision(
        aiSnake,
        playerSnake,
        false
      );
      if (aiHeadPlayerCollision.collided) {
        collisions.push({
          collided: true,
          entity1: aiSnake,
          entity2: {
            snake: playerSnake,
            segmentIndex: aiHeadPlayerCollision.segmentIndex,
          },
          type: CollisionType.AI_PLAYER_BODY,
        });
      }

      // 5. Check AI-food collisions
      const aiFood = this.checkSnakeFoodCollision(aiSnake, foods);
      if (aiFood) {
        collisions.push({
          collided: true,
          entity1: aiSnake,
          entity2: aiFood,
          type: CollisionType.AI_FOOD,
        });
      }

      // 6. Check AI-wall collisions
      const aiWallCollision = this.checkSnakeWallCollision(
        aiSnake,
        canvasWidth,
        canvasHeight
      );
      if (aiWallCollision) {
        collisions.push({
          collided: true,
          entity1: aiSnake,
          entity2: null,
          type: CollisionType.AI_WALL,
        });
      }

      // 7. Check AI-AI collisions (between different AI snakes)
      for (const otherAI of aiSnakes) {
        if (aiSnake === otherAI || !otherAI.alive) continue;

        const aiAICollision = this.checkSnakeSnakeCollision(
          aiSnake,
          otherAI,
          false
        );
        if (aiAICollision.collided) {
          collisions.push({
            collided: true,
            entity1: aiSnake,
            entity2: {
              snake: otherAI,
              segmentIndex: aiAICollision.segmentIndex,
            },
            type: CollisionType.AI_AI,
          });
        }
      }
    }

    return collisions;
  }

  /**
   * Apply immunity to the collided segment
   */
  static applyCollisionImmunity(
    snake: Snake,
    segmentIndex: number,
    immunityDuration: number = gameConfig.playerSnake.selfCollisionImmunityTime
  ): void {
    snake.applyImmunity(segmentIndex, immunityDuration);
  }
}
