// src/types.ts

import { BaseSnake } from "./models/BaseSnake";
import { Snake } from "./models/Snake";
import { AISnake } from "./models/AISnake";
import { Vector } from "./utils/vector";

// Common base interface for all snake types
export interface SnakeBase {
  id: string;
  segments: any[];
  direction: Vector;
  targetDirection: Vector;
  speed: number;
  alive: boolean;
  update: (...args: any[]) => void;
  updateDirection: (target: Vector) => void;
  getSegmentRadius: (index: number) => number;
  // Add other common methods and properties
}

// Use this in places that need to accept both Snake and AISnake
export type AnySnake = BaseSnake;

// Type guards for more specific handling
export function isPlayerSnake(snake: AnySnake): snake is Snake {
  return snake.entityType === "player";
}

export function isAISnake(snake: AnySnake): snake is AISnake {
  return snake.entityType === "aiSnake";
}

// Canvas props with proper null handling
export interface CanvasRefProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
}
