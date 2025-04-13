// src/models/Food.ts

import { gameConfig } from "../config/gameConfig";
import { EntityType, FoodType } from "../utils/constants";
import { Vector } from "../utils/vector";

/**
 * Food class to represent food items in the game
 */
export class Food {
  id: string;
  position: Vector;
  type: FoodType;
  value: number;
  points: number;
  radius: number;
  age: number;
  pulseRate: number;
  entityType: EntityType;

  constructor(id: string, position: Vector, type: FoodType = FoodType.REGULAR) {
    this.id = id;
    this.position = position;
    this.type = type;
    this.entityType = EntityType.FOOD;
    this.age = 0;
    this.pulseRate = 1 + Math.random() * 0.5; // Random pulse rate for visual effect

    // Set properties based on food type
    if (type === FoodType.REGULAR) {
      this.value = gameConfig.food.regularValue;
      this.points = gameConfig.food.regularPoints;
      this.radius = 5;
    } else if (type === FoodType.INVINCIBLE_BOOST) {
      this.value = gameConfig.food.regularValue;
      this.points = gameConfig.food.regularPoints * 3;
      this.radius = 8;
    } else {
      // Default values
      this.value = 1;
      this.points = 10;
      this.radius = 5;
    }
  }

  /**
   * Update food item (e.g., animations)
   */
  update(deltaTime: number): void {
    this.age += deltaTime;
  }

  /**
   * Get the current radius with pulsing effect
   */
  getCurrentRadius(): number {
    // Pulse effect
    const pulseAmount = Math.sin(this.age * this.pulseRate * Math.PI) * 0.2 + 1;
    return this.radius * pulseAmount;
  }

  /**
   * Create a regular food item at a random position
   */
  static createRegularFood(id: string, position: Vector): Food {
    return new Food(id, position, FoodType.REGULAR);
  }

  /**
   * Create an invincible boost food item at a random position
   */
  static createInvincibleBoostFood(id: string, position: Vector): Food {
    return new Food(id, position, FoodType.INVINCIBLE_BOOST);
  }

  /**
   * Generate food at random positions, avoiding snakes
   */
  static generateRandomFood(
    count: number,
    canvasWidth: number,
    canvasHeight: number,
    snakes: Array<{ segments: Array<{ position: Vector }> }>,
    existingFood: Food[],
    powerUpChance: number = gameConfig.invincibleBoost.chance
  ): Food[] {
    const newFood: Food[] = [];
    const margin = 30; // Margin from canvas edges

    let attempts = 0;
    const maxAttempts = count * 10; // Limit attempts to avoid infinite loops

    while (newFood.length < count && attempts < maxAttempts) {
      attempts++;

      // Generate random position
      const position: Vector = {
        x: margin + Math.random() * (canvasWidth - margin * 2),
        y: margin + Math.random() * (canvasHeight - margin * 2),
      };

      // Check if position is too close to any snake
      let tooCloseToSnake = false;
      for (const snake of snakes) {
        for (const segment of snake.segments) {
          const dx = position.x - segment.position.x;
          const dy = position.y - segment.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 30) {
            // Minimum distance from snake
            tooCloseToSnake = true;
            break;
          }
        }
        if (tooCloseToSnake) break;
      }

      // Check if position is too close to existing food
      let tooCloseToFood = false;
      for (const food of existingFood.concat(newFood)) {
        const dx = position.x - food.position.x;
        const dy = position.y - food.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 20) {
          // Minimum distance between food items
          tooCloseToFood = true;
          break;
        }
      }

      // If position is valid, create food
      if (!tooCloseToSnake && !tooCloseToFood) {
        // Determine food type
        const foodType =
          Math.random() < powerUpChance
            ? FoodType.INVINCIBLE_BOOST
            : FoodType.REGULAR;

        newFood.push(
          new Food(`food_${Date.now()}_${newFood.length}`, position, foodType)
        );
      }
    }

    return newFood;
  }

  /**
   * Generate food from a dead snake
   */
  static generateFoodFromDeadSnake(
    deadSnake: { segments: Array<{ position: Vector }> },
    dropRatio: number = gameConfig.food.aiDropRatio
  ): Food[] {
    const newFood: Food[] = [];
    const segments = deadSnake.segments;

    // Determine how many food items to drop
    const foodCount = Math.floor(segments.length * dropRatio);

    // Generate food from segment positions
    for (let i = 0; i < foodCount; i++) {
      // Use position from random segments
      const segmentIndex = Math.floor(Math.random() * segments.length);
      const position = { ...segments[segmentIndex].position };

      // Add slight randomness to position
      position.x += (Math.random() - 0.5) * 20;
      position.y += (Math.random() - 0.5) * 20;

      newFood.push(
        new Food(`food_drop_${Date.now()}_${i}`, position, FoodType.REGULAR)
      );
    }

    return newFood;
  }
}
