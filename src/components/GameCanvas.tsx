// src/components/GameCanvas.tsx

import React, { useRef, useEffect } from "react";
import { GameState, FoodType } from "../utils/constants";
import { gameConfig } from "../config/gameConfig";
import { Food } from "../models/Food";
import { AnySnake } from "../types";
import { Vector } from "../utils/vector";

interface GameCanvasProps {
  width: number;
  height: number;
  playerSnake: AnySnake | null;
  aiSnakes: AnySnake[];
  foods: Food[];
  gameState: GameState;
  score: number;
  highScore: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onTogglePlayPause?: () => void;
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
  onTogglePlayPause,
}) => {
  const buttonRegion = useRef({
    x: 20,
    y: 70,
    width: 40,
    height: 40,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onTogglePlayPause) return;

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if the click is within the button region
      const button = buttonRegion.current;
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        onTogglePlayPause();
      }
    };

    canvas.addEventListener("click", handleClick);

    return () => {
      canvas.removeEventListener("click", handleClick);
    };
  }, [canvasRef, onTogglePlayPause]);

  const drawPlayPauseButton = (ctx: CanvasRenderingContext2D) => {
    const button = buttonRegion.current;
    const isPlaying = gameState === GameState.PLAYING;

    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.beginPath();
    ctx.roundRect(button.x, button.y, button.width, button.height, 5);
    ctx.fill();

    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#FFFFFF";

    if (isPlaying) {
      ctx.fillRect(button.x + 12, button.y + 10, 5, 20);
      ctx.fillRect(button.x + 24, button.y + 10, 5, 20);
    } else {
      // Play icon (triangle)
      ctx.beginPath();
      ctx.moveTo(button.x + 14, button.y + 10);
      ctx.lineTo(button.x + 14, button.y + 30);
      ctx.lineTo(button.x + 30, button.y + 20);
      ctx.closePath();
      ctx.fill();
    }
  };

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
        drawPlayPauseButton(ctx);
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

  // Add default snake head drawing function
  const drawDefaultSnakeHead = (
    ctx: CanvasRenderingContext2D,
    position: Vector,
    direction: Vector,
    width: number,
    boosting: boolean
  ) => {
    const radius = width / 2;
    const eyeSize = radius * 0.4;
    const eyeOffset = radius * 0.3;

    // Save current state to rotate the head
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(Math.atan2(direction.y, direction.x));

    // Keep the head fully opaque
    ctx.globalAlpha = 1.0;

    ctx.fillStyle = boosting ? "#33CC33" : "#00AA00";
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Highlight effect
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(-radius * 0.2, -radius * 0.2, radius * 0.5, 0, Math.PI * 0.8);
    ctx.fill();

    // ===== eye =====
    // eye positions based on direction
    const rightEyeX = direction.y * eyeOffset;
    const rightEyeY = -direction.x * eyeOffset;
    const leftEyeX = -direction.y * eyeOffset;
    const leftEyeY = direction.x * eyeOffset;

    // eye whites
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(rightEyeX, rightEyeY, eyeSize, 0, Math.PI * 2);
    ctx.arc(leftEyeX, leftEyeY, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // eye pupils
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.arc(
      rightEyeX + radius * 0.15,
      rightEyeY,
      eyeSize * 0.5,
      0,
      Math.PI * 2
    );
    ctx.arc(leftEyeX + radius * 0.15, leftEyeY, eyeSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // ===== Butterfly ribbon =====
    ctx.save();

    // Scale down the size of the ribbon
    const ribbonColor = boosting ? "#FF6666" : "#FF9999";
    const ribbonSize = radius * 0.8;

    // Move the ribbon to the front of the head
    const ribbonX = -radius * 0.6;
    const ribbonY = -radius * 0.5;

    ctx.translate(ribbonX, ribbonY);
    ctx.rotate(-Math.PI / 6);

    // Left side butterfly wing
    ctx.fillStyle = ribbonColor;
    ctx.beginPath();
    ctx.ellipse(
      -ribbonSize * 0.4,
      0,
      ribbonSize * 0.5,
      ribbonSize * 0.3,
      Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Right side butterfly wing
    ctx.beginPath();
    ctx.ellipse(
      ribbonSize * 0.4,
      0,
      ribbonSize * 0.5,
      ribbonSize * 0.3,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Center of the bow
    ctx.fillStyle = boosting ? "#FF3333" : "#FF6666";
    ctx.beginPath();
    ctx.arc(0, 0, ribbonSize * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Add a shadow effect to the ribbon
    ctx.strokeStyle = "#AA0000";
    ctx.lineWidth = radius * 0.05;
    ctx.beginPath();
    ctx.ellipse(
      -ribbonSize * 0.4,
      0,
      ribbonSize * 0.5,
      ribbonSize * 0.3,
      Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(
      ribbonSize * 0.4,
      0,
      ribbonSize * 0.5,
      ribbonSize * 0.3,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, ribbonSize * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Restore the state of the ribbon
    ctx.restore();

    ctx.restore();
  };

  const drawMechanicalSnakeHead = (
    ctx: CanvasRenderingContext2D,
    position: Vector,
    direction: Vector,
    width: number,
    boosting: boolean
  ) => {
    const radius = width / 2;
    const scannerSize = radius * 0.3;

    ctx.save();

    // Move the canvas origin to the snake head position and rotate to match the direction
    ctx.translate(position.x, position.y);
    ctx.rotate(Math.atan2(direction.y, direction.x));

    // Head shape
    ctx.fillStyle = boosting ? "#444444" : "#333333";
    ctx.beginPath();
    // Draw a hexagon shape
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * radius * 1.1;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    // Metallic shine
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = radius * 0.1;
    ctx.stroke();

    // Add a gradient effect to the head
    ctx.fillStyle = "#777777";
    for (let i = 0; i < 6; i++) {
      const angle = ((i + 0.5) / 6) * Math.PI * 2;
      const x = Math.cos(angle) * radius * 0.8;
      const y = Math.sin(angle) * radius * 0.7;
      ctx.beginPath();
      ctx.arc(x, y, radius * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Scanner
    ctx.fillStyle = boosting ? "#FF4400" : "#00AAFF";
    ctx.beginPath();
    ctx.arc(radius * 0.5, -radius * 0.3, scannerSize, 0, Math.PI * 2);
    ctx.arc(radius * 0.5, radius * 0.3, scannerSize, 0, Math.PI * 2);
    ctx.fill();

    // Inner scanner
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(radius * 0.4, -radius * 0.3);
    ctx.lineTo(radius * 0.6, -radius * 0.3);
    ctx.moveTo(radius * 0.4, radius * 0.3);
    ctx.lineTo(radius * 0.6, radius * 0.3);
    ctx.stroke();

    // Add a glowing effect to the scanner
    if (boosting) {
      ctx.fillStyle = "rgba(255, 100, 0, 0.7)";
      ctx.beginPath();
      ctx.moveTo(-radius * 1.1, -radius * 0.5);
      ctx.lineTo(-radius * 2.0, 0);
      ctx.lineTo(-radius * 1.1, radius * 0.5);
      ctx.closePath();
      ctx.fill();
    }

    // Restore the canvas state
    ctx.restore();
  };

  const drawBiologicalSnakeHead = (
    ctx: CanvasRenderingContext2D,
    position: Vector,
    direction: Vector,
    width: number,
    boosting: boolean
  ) => {
    const radius = width / 2;

    // Save current state to rotate the head
    ctx.save();

    // Move the canvas origin to the snake head position and rotate to match the direction
    ctx.translate(position.x, position.y);
    ctx.rotate(Math.atan2(direction.y, direction.x));

    // Create a radial gradient for the head
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.3);
    if (boosting) {
      gradient.addColorStop(0, "rgba(255, 100, 255, 0.9)");
      gradient.addColorStop(0.6, "rgba(180, 50, 220, 0.6)");
      gradient.addColorStop(1, "rgba(100, 20, 180, 0.2)");
    } else {
      gradient.addColorStop(0, "rgba(170, 70, 200, 0.9)");
      gradient.addColorStop(0.6, "rgba(140, 50, 170, 0.6)");
      gradient.addColorStop(1, "rgba(100, 50, 150, 0.2)");
    }

    ctx.fillStyle = gradient;

    // Draw the head shape
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Add a glowing effect
    ctx.fillStyle = boosting
      ? "rgba(255, 230, 255, 0.6)"
      : "rgba(200, 220, 255, 0.6)";

    // Underline the head with a glow
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 + Math.sin(Date.now() / 1000) * 0.2;
      const distance = radius * (0.5 + Math.sin(Date.now() / 500 + i) * 0.2);
      const spotSize =
        radius * (0.2 + Math.sin(Date.now() / 700 + i * 2) * 0.1);

      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      ctx.beginPath();
      ctx.arc(x, y, spotSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Beard
    ctx.strokeStyle = boosting
      ? "rgba(255, 200, 255, 0.4)"
      : "rgba(170, 200, 240, 0.4)";
    ctx.lineWidth = radius * 0.1;

    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI / 3) * i + Math.sin(Date.now() / 800 + i) * 0.2;
      const length = radius * (1.5 + Math.sin(Date.now() / 600 + i) * 0.3);

      ctx.beginPath();
      ctx.moveTo(0, 0);

      // Calculate control points for the curve
      const cp1x = -Math.cos(angle) * length * 0.5;
      const cp1y = Math.sin(angle) * length * 0.5;
      const cp2x = -Math.cos(angle) * length * 0.8;
      const cp2y = Math.sin(angle) * length * 0.8;
      const endX = -Math.cos(angle) * length;
      const endY = Math.sin(angle) * length;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();
    }

    // Restore the canvas state
    ctx.restore();
  };
  const drawDefaultSnakeBody = (
    ctx: CanvasRenderingContext2D,
    position: Vector,
    angle: number,
    width: number,
    boosting: boolean
  ) => {
    // Save current state to rotate the body
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);

    const height = width;

    // Create a radial gradient for the body
    ctx.fillStyle = boosting ? "#33CC33" : "#00AA00";

    ctx.beginPath();
    ctx.ellipse(0, 0, height / 2, width / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Add a gradient effect to the body
    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.beginPath();
    ctx.ellipse(0, -width / 6, height / 2.2, width / 3, 0, 0, Math.PI);
    ctx.fill();

    // Add a shadow effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.beginPath();
    ctx.ellipse(0, width / 5, height / 2.5, width / 4, 0, Math.PI, Math.PI * 2);
    ctx.fill();

    // Restore the canvas state
    ctx.restore();
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
      const isImmune =
        typeof snake.isSegmentImmune === "function"
          ? snake.isSegmentImmune(i)
          : i < gameConfig.playerSnake.headImmunitySegments ||
            (segment.immunityTimeLeft ?? 0) > 0;

      // Keep the head fully opaque
      if (i === 0) {
        ctx.globalAlpha = 1.0;
      } else {
        const alpha = isImmune ? 0.8 : 1.0;
        ctx.globalAlpha = alpha;
      }

      // Confirm segment type
      if (i === 0) {
        // Head segment
        if (snake.entityType === "player") {
          if (snake.skin === "default") {
            drawDefaultSnakeHead(
              ctx,
              segment.position,
              snake.direction,
              segment.width,
              segment.boosting
            );
          } else if (snake.skin === "mechanical") {
            drawMechanicalSnakeHead(
              ctx,
              segment.position,
              snake.direction,
              segment.width,
              segment.boosting
            );
          } else if (snake.skin === "biological") {
            drawBiologicalSnakeHead(
              ctx,
              segment.position,
              snake.direction,
              segment.width,
              segment.boosting
            );
          } else {
            // Default head rendering
            drawDefaultSnakeHead(
              ctx,
              segment.position,
              snake.direction,
              segment.width,
              segment.boosting
            );
          }
        } else {
          // AI snake head - use a simple circle
          drawMechanicalSnakeHead(
            ctx,
            segment.position,
            snake.direction,
            segment.width,
            segment.boosting
          );
        }
      } else {
        // Body segment
        if (snake.entityType === "player") {
          if (snake.skin === "default") {
            // Calculate the direction angle based on the segment's position
            let directionAngle = 0;

            // Calculate the direction angle based on the segment's position
            if (i > 0 && i < segments.length - 1) {
              // Middle segment - use the average direction of the previous and next segments
              const prevSegment = segments[i - 1];
              const nextSegment = segments[i + 1];

              const dirToPrev = {
                x: prevSegment.position.x - segment.position.x,
                y: prevSegment.position.y - segment.position.y,
              };
              const dirToNext = {
                x: nextSegment.position.x - segment.position.x,
                y: nextSegment.position.y - segment.position.y,
              };

              // Average the two directions
              const avgDir = {
                x: (dirToPrev.x + dirToNext.x) / 2,
                y: (dirToPrev.y + dirToNext.y) / 2,
              };
              directionAngle = Math.atan2(avgDir.y, avgDir.x);
            } else if (i === segments.length - 1 && i > 0) {
              // Tail segment - use the direction to the previous segment
              const prevSegment = segments[i - 1];
              const dir = {
                x: segment.position.x - prevSegment.position.x,
                y: segment.position.y - prevSegment.position.y,
              };
              directionAngle = Math.atan2(dir.y, dir.x);
            } else {
              directionAngle = Math.atan2(snake.direction.y, snake.direction.x);
            }

            // Use the calculated direction angle for the body segment
            drawDefaultSnakeBody(
              ctx,
              segment.position,
              directionAngle,
              segment.width,
              segment.boosting
            );
          } else if (snake.skin === "mechanical") {
            // Mechanical style body segment
            const isFifthSegment = i % 5 === 0;

            // Body shape
            ctx.fillStyle = "#333333";
            ctx.beginPath();
            ctx.arc(
              segment.position.x,
              segment.position.y,
              segment.width / 2,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Pattern
            const energyColor = segment.boosting
              ? i % 3 === 0
                ? "#FF4400"
                : "#FFAA00"
              : "#00AAFF";

            ctx.strokeStyle = energyColor;
            ctx.lineWidth = segment.width * 0.2;
            ctx.beginPath();

            if (i < segments.length - 1) {
              const nextSegment = segments[i + 1];
              ctx.moveTo(segment.position.x, segment.position.y);
              ctx.lineTo(nextSegment.position.x, nextSegment.position.y);
            }

            ctx.stroke();

            // Add a small circle for the fifth segment
            if (isFifthSegment) {
              ctx.fillStyle = "#FFFFFF";
              ctx.beginPath();
              ctx.arc(
                segment.position.x,
                segment.position.y,
                segment.width * 0.2,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          } else if (snake.skin === "biological") {
            // Add a gradient effect for the body
            const gradient = ctx.createRadialGradient(
              segment.position.x,
              segment.position.y,
              0,
              segment.position.x,
              segment.position.y,
              segment.width
            );

            if (segment.boosting) {
              gradient.addColorStop(0, "rgba(200, 100, 230, 0.8)");
              gradient.addColorStop(1, "rgba(140, 50, 190, 0.2)");
            } else {
              gradient.addColorStop(0, "rgba(170, 70, 200, 0.7)");
              gradient.addColorStop(1, "rgba(100, 50, 150, 0.1)");
            }

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(
              segment.position.x,
              segment.position.y,
              segment.width / 2,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Add a shadow effect
            if (i % 3 === 0) {
              ctx.fillStyle = segment.boosting
                ? "rgba(255, 200, 255, 0.4)"
                : "rgba(200, 220, 255, 0.3)";

              ctx.beginPath();
              const pulseSize =
                segment.width *
                (0.2 + Math.sin(Date.now() / 500 + i / 5) * 0.1);
              ctx.arc(
                segment.position.x,
                segment.position.y,
                pulseSize,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
          }
        } else {
          // AI snake body segment - use a simple circle
          ctx.fillStyle = "#555555";
          ctx.beginPath();
          ctx.arc(
            segment.position.x,
            segment.position.y,
            segment.width / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();

          const energyColor = segment.boosting ? "#FF4400" : "#AAAAAA";

          ctx.strokeStyle = energyColor;
          ctx.lineWidth = segment.width * 0.2;
          ctx.beginPath();

          if (i < segments.length - 1) {
            const nextSegment = segments[i + 1];
            ctx.moveTo(segment.position.x, segment.position.y);
            ctx.lineTo(nextSegment.position.x, nextSegment.position.y);
          }

          ctx.stroke();
        }
      }
    }

    // Restore the canvas state
    ctx.globalAlpha = 1.0;

    // Create a shadow effect for the tail
    if (
      snake.entityType === "player" &&
      snake.boosting &&
      segments.length > 0
    ) {
      drawBoostParticles(
        ctx,
        segments[segments.length - 1].position,
        snake.direction
      );
    }
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

    if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
      drawPlayPauseButton(ctx);
    }

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
    ctx.fillText(
      "Press P or play button to resume",
      width / 2,
      height / 2 + 20
    );
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
