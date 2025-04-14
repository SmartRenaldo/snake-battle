// src/components/GameCanvas.tsx

import React, { useRef, useEffect } from "react";
import {
  EntityType,
  GameState,
  FoodType,
  SegmentType,
} from "../utils/constants";
import { gameConfig, SkinType, skins } from "../config/gameConfig";
import { Food } from "../models/Food";
import { AnySnake } from "../types";
import { SnakeSegment } from "../models/BaseSnake";
import { Vector } from "../utils/vector";

interface GameCanvasProps {
  width: number;
  height: number;
  playerSnake: AnySnake | null;
  aiSnakes: AnySnake[]; // Accept any snake type
  foods: Food[];
  gameState: GameState;
  score: number;
  highScore: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  width,
  height,
  playerSnake,
  aiSnakes,
  foods,
  gameState,
  score,
  highScore,
  canvasRef,
}) => {
  // Reference to the canvas context
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

  // Set up canvas on component mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;

    // Get the context
    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    // Initial clear
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
    }
  }, [canvasRef, width, height]);

  // Draw game elements when they change
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    drawBackground(ctx);

    // Draw game elements based on game state
    if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
      // Draw food
      foods.forEach((food) => drawFood(ctx, food));

      // Draw AI snakes
      aiSnakes
        .filter((snake) => snake.alive)
        .forEach((snake) => drawSnake(ctx, snake));

      // Draw player snake
      if (playerSnake) {
        drawSnake(ctx, playerSnake);
      }

      // Draw UI elements
      drawUI(ctx, score, highScore, playerSnake);

      // Draw pause overlay if paused
      if (gameState === GameState.PAUSED) {
        drawPauseOverlay(ctx);
      }
    } else if (gameState === GameState.START) {
      drawStartScreen(ctx);
    } else if (gameState === GameState.GAME_OVER) {
      drawGameOverScreen(ctx, score, highScore);
    }
  }, [
    gameState,
    playerSnake,
    aiSnakes,
    foods,
    score,
    highScore,
    width,
    height,
  ]);

  // Draw background
  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, width, height);

    // Add grid pattern
    ctx.strokeStyle = "#222222";
    ctx.lineWidth = 1;

    // Draw vertical grid lines
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Draw a snake
  const drawSnake = (ctx: CanvasRenderingContext2D, snake: AnySnake) => {
    // Add defensive check to prevent errors on undefined segments
    if (!snake || !snake.segments || snake.segments.length === 0) {
      console.warn("Attempted to draw invalid snake");
      return;
    }

    const segments = snake.segments;

    // Draw segments from tail to head (so head appears on top)
    for (let i = segments.length - 1; i >= 0; i--) {
      const segment = segments[i];

      // Skip rendering if dead
      if (!snake.alive) continue;

      // Set color based on segment type and snake properties
      let color = "#888888"; // Default for AI

      if (snake.entityType === "player") {
        const skin = skins[snake.skin as SkinType];

        if (segment.type === SegmentType.HEAD) {
          color = skin.headColor;
        } else {
          // Use boost color if boosting
          color = segment.boosting ? skin.boostColor : skin.bodyColor;
        }
      }

      // Check if the segment should be immune
      // Safe check if the method exists (it might not after spread operator)
      const isImmune =
        typeof snake.isSegmentImmune === "function"
          ? snake.isSegmentImmune(i)
          : i < gameConfig.playerSnake.headImmunitySegments ||
            (segment.immunityTimeLeft ?? 0) > 0;

      const alpha = isImmune ? 0.4 : 1.0;

      // Set alpha
      ctx.globalAlpha = alpha;

      // Draw segment
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(
        segment.position.x,
        segment.position.y,
        segment.width / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw segment border
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Reset alpha
      ctx.globalAlpha = 1.0;

      // Draw eyes on the head
      if (i === 0) {
        drawSnakeEyes(ctx, segment, snake.direction, segment.width);
      }

      // Draw boost particles if boosting
      if (segment.boosting && i === segments.length - 1) {
        drawBoostParticles(ctx, segment.position, snake.direction);
      }
    }

    // Draw length indicator above the snake
    if (snake.entityType === EntityType.PLAYER) {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";
      const headPos = snake.segments[0].position;
      ctx.fillText(
        `Length: ${snake.segments.length}`,
        headPos.x,
        headPos.y - 20
      );
    }

    if (snake.entityType === EntityType.AI_SNAKE) {
      // Check if this is a newly spawned AI snake
      const timeSinceSpawn = Date.now() - (snake.spawnTime || 0);
      if (timeSinceSpawn < 1000) {
        // 1 second spawn animation
        const pulseSize = 30 + Math.sin(timeSinceSpawn / 100) * 15;
        drawSpawnEffect(ctx, snake.segments[0].position, pulseSize);
      }
    }
  };

  // Draw snake eyes
  const drawSnakeEyes = (
    ctx: CanvasRenderingContext2D,
    segment: SnakeSegment,
    direction: { x: number; y: number },
    width: number
  ) => {
    const eyeOffset = width * 0.3;
    const eyeRadius = width * 0.15;

    // Calculate eye positions based on direction
    const rightEyeX = segment.position.x + direction.y * eyeOffset;
    const rightEyeY = segment.position.y - direction.x * eyeOffset;
    const leftEyeX = segment.position.x - direction.y * eyeOffset;
    const leftEyeY = segment.position.y + direction.x * eyeOffset;

    // Draw eye whites
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw pupils
    ctx.fillStyle = "#000000";
    const pupilOffset = eyeRadius * 0.5;
    ctx.beginPath();
    ctx.arc(
      rightEyeX + direction.x * pupilOffset,
      rightEyeY + direction.y * pupilOffset,
      eyeRadius * 0.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.beginPath();
    ctx.arc(
      leftEyeX + direction.x * pupilOffset,
      leftEyeY + direction.y * pupilOffset,
      eyeRadius * 0.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
  };

  // Draw boost particles
  const drawBoostParticles = (
    ctx: CanvasRenderingContext2D,
    position: { x: number; y: number },
    direction: { x: number; y: number }
  ) => {
    const particleCount = 5;
    const particleSize = 3;

    // Reverse direction for particles
    const particleDir = { x: -direction.x, y: -direction.y };

    // Draw particles
    ctx.fillStyle = "#FFAA00";

    for (let i = 0; i < particleCount; i++) {
      const distance = 5 + Math.random() * 15;
      const offset = {
        x: particleDir.x * distance + (Math.random() - 0.5) * 10,
        y: particleDir.y * distance + (Math.random() - 0.5) * 10,
      };

      const particleX = position.x + offset.x;
      const particleY = position.y + offset.y;

      ctx.beginPath();
      ctx.arc(
        particleX,
        particleY,
        particleSize * Math.random(),
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  };

  // Draw food
  const drawFood = (ctx: CanvasRenderingContext2D, food: Food) => {
    const radius = food.getCurrentRadius();

    // Set color based on food type
    switch (food.type) {
      case FoodType.REGULAR:
        ctx.fillStyle = "#88FF88";
        break;
      case FoodType.INVINCIBLE_BOOST:
        ctx.fillStyle = "#FF88FF";
        // Add glow effect for power-ups
        ctx.shadowColor = "#FF00FF";
        ctx.shadowBlur = 15;
        break;
      default:
        ctx.fillStyle = "#FFFFFF";
        break;
    }

    // Draw food circle
    ctx.beginPath();
    ctx.arc(food.position.x, food.position.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw inner circle for power-ups
    if (food.type === FoodType.INVINCIBLE_BOOST) {
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(food.position.x, food.position.y, radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Reset shadow
    ctx.shadowBlur = 0;
  };

  // Draw UI elements
  const drawUI = (
    ctx: CanvasRenderingContext2D,
    score: number,
    highScore: number,
    playerSnake: AnySnake | null
  ) => {
    // Score display
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "18px Arial";
    ctx.textAlign = "left";
    ctx.fillText(`Score: ${score}`, 20, 30);
    ctx.fillText(`High Score: ${highScore}`, 20, 60);

    // Length display and booster bar
    if (playerSnake) {
      const length = playerSnake.segments.length;
      const boostAvailable = length > gameConfig.playerSnake.minLengthForBoost;

      // Draw length bar
      const barWidth = 150;
      const barHeight = 10;
      const barX = width - barWidth - 20;
      const barY = 25;

      // Background
      ctx.fillStyle = "#333333";
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Fill based on length relative to some maximum (e.g., 100)
      const maxLength = 100;
      const fillWidth = Math.min(length / maxLength, 1) * barWidth;

      // Color based on boost availability
      ctx.fillStyle = boostAvailable ? "#00AA00" : "#AA0000";
      ctx.fillRect(barX, barY, fillWidth, barHeight);

      // Border
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      // Length text
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "right";
      ctx.fillText(`Length: ${length}`, width - 20, 20);

      // Boost status
      const boostText = playerSnake.boosting
        ? playerSnake.invincibleBoost
          ? "INVINCIBLE BOOST!"
          : "BOOSTING"
        : boostAvailable
        ? "Hold LMB to Boost"
        : "Need more length to boost";

      ctx.fillText(boostText, width - 20, 60);

      // Warning for low length while boosting
      if (playerSnake.boosting && !playerSnake.invincibleBoost && length <= 5) {
        ctx.fillStyle = "#FF0000";
        ctx.font = "bold 16px Arial";
        ctx.fillText("LOW LENGTH WARNING!", width - 20, 90);
      }

      // Invincible boost timer
      if (playerSnake.invincibleBoost) {
        ctx.fillStyle = "#FF00FF";
        ctx.fillText(
          `Invincible Boost: ${playerSnake.boostTimeLeft.toFixed(1)}s`,
          width - 20,
          90
        );
      }
    }
  };

  // Draw pause overlay
  const drawPauseOverlay = (ctx: CanvasRenderingContext2D) => {
    // Semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, width, height);

    // Pause text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", width / 2, height / 2 - 20);

    ctx.font = "18px Arial";
    ctx.fillText("Press P to resume", width / 2, height / 2 + 20);
  };

  // Draw start screen
  const drawStartScreen = (ctx: CanvasRenderingContext2D) => {
    // Title
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("SNAKE BATTLE", width / 2, height / 2 - 100);

    // Instructions
    ctx.font = "24px Arial";
    ctx.fillText("Use mouse to control direction", width / 2, height / 2 - 30);
    ctx.fillText(
      "Hold left mouse button to boost (costs length)",
      width / 2,
      height / 2 + 10
    );
    ctx.fillText("Eat food to grow longer", width / 2, height / 2 + 50);
    ctx.fillText("Avoid walls and other snakes", width / 2, height / 2 + 90);

    // Start prompt
    ctx.fillStyle = "#88FF88";
    ctx.font = "bold 32px Arial";
    ctx.fillText("Click to Start", width / 2, height / 2 + 170);
  };

  // Draw game over screen
  const drawGameOverScreen = (
    ctx: CanvasRenderingContext2D,
    score: number,
    highScore: number
  ) => {
    // Semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, width, height);

    // Game over text
    ctx.fillStyle = "#FF0000";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", width / 2, height / 2 - 60);

    // Score
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "32px Arial";
    ctx.fillText(`Score: ${score}`, width / 2, height / 2);
    ctx.fillText(`High Score: ${highScore}`, width / 2, height / 2 + 50);

    // Restart prompt
    ctx.fillStyle = "#88FF88";
    ctx.font = "24px Arial";
    ctx.fillText("Click to Restart", width / 2, height / 2 + 120);
  };

  const drawSpawnEffect = (
    ctx: CanvasRenderingContext2D,
    position: Vector,
    radius: number
  ) => {
    // Create a pulsing circle effect
    ctx.beginPath();
    ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(position.x, position.y, radius * 0.7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(position.x, position.y, radius * 0.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fill();
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{
        border: "1px solid #333",
        backgroundColor: "#000",
        display: "block",
        margin: "0 auto",
      }}
    />
  );
};

export default GameCanvas;
