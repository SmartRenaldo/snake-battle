// src/Game.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import { gameConfig } from "./config/gameConfig";
import { GameState, EntityType, FoodType, KEYS } from "./utils/constants";
import { Vector, createVector, distance } from "./utils/vector";
import { Snake } from "./models/Snake";
import { AISnake } from "./models/AISnake";
import { Food } from "./models/Food";
import { CollisionDetection, CollisionType } from "./models/Collision";
import { ensureSnakeMethods, ensureAISnakeMethods } from "./utils/snakeHelpers";
import GameCanvas from "./components/GameCanvas";
import ScoreBoard from "./components/ScoreBoard";
import GameOverModal from "./components/GameOverModal";
import ControlsInfo from "./components/ControlsInfo";
import { useGameLoop } from "./hooks/useGameLoop";
import { useMouseControl } from "./hooks/useMouseControl";
import { SkinType } from "./config/gameConfig";
import { preserveMethods } from "./utils/snakeHelpers";
import MobileControls from "./components/MobileControls";

interface GameProps {
  selectedSkin?: SkinType;
}

const Game: React.FC<GameProps> = ({ selectedSkin = "default" }) => {
  // Game state
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  // Player snake
  const [playerSnake, setPlayerSnake] = useState<Snake | null>(null);
  // AI snakes
  const [aiSnakes, setAISnakes] = useState<AISnake[]>([]);
  // Food
  const [foods, setFoods] = useState<Food[]>([]);
  // Score
  const [score, setScore] = useState<number>(0);
  // High score
  const [highScore, setHighScore] = useState<number>(0);
  // Show controls info
  const [showControls, setShowControls] = useState<boolean>(false);
  // Add state for mobile detection
  const [isMobile, setIsMobile] = useState<boolean>(false);
  // Mobile direction from virtual joystick
  const [mobileDirection, setMobileDirection] = useState<Vector | null>(null);
  const aiGenerationQueue = useRef<number>(0);
  const isGeneratingAI = useRef<boolean>(false);
  const recentlyRemovedSnakes = useRef<Set<string>>(new Set());

  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mouse control hook
  const { mousePosition, leftButtonPressed, mouseInCanvas } = useMouseControl(
    canvasRef,
    gameState
  );

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
          userAgent
        );
      const isTouchScreen =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
      setIsMobile(
        isMobileDevice || (isTouchScreen && window.innerWidth <= 1024)
      );
    };

    checkMobile();

    // Recheck on resize
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  // Handle direction updates from mobile joystick
  const handleMobileDirectionChange = useCallback((direction: Vector) => {
    setMobileDirection(direction);
  }, []);

  // Handle boost button state
  const handleMobileBoostChange = useCallback(
    (boosting: boolean) => {
      if (!playerSnake) return;

      // Ensure snake has methods
      const activePlayerSnake = ensureSnakeMethods(playerSnake);

      if (boosting) {
        if (typeof activePlayerSnake.startBoost === "function") {
          activePlayerSnake.startBoost();
        }
      } else {
        if (typeof activePlayerSnake.stopBoost === "function") {
          activePlayerSnake.stopBoost();
        }
      }

      // Only update state if we had to recreate the snake
      if (activePlayerSnake !== playerSnake) {
        setPlayerSnake(activePlayerSnake);
      }
    },
    [playerSnake]
  );

  // Initialize game
  const initGame = useCallback(() => {
    console.log("Initializing game...");

    // Canvas dimensions
    const canvasWidth = gameConfig.canvas.width;
    const canvasHeight = gameConfig.canvas.height;

    // Create player snake at center of canvas
    const playerStartPos = createVector(canvasWidth / 2, canvasHeight / 2);
    const newPlayerSnake = new Snake(
      "player",
      playerStartPos,
      gameConfig.playerSnake.initialLength,
      selectedSkin,
      EntityType.PLAYER
    );

    console.log("Player snake created:", newPlayerSnake);
    console.log("Methods check:", {
      update: typeof newPlayerSnake.update === "function",
      updateDirection: typeof newPlayerSnake.updateDirection === "function",
      startBoost: typeof newPlayerSnake.startBoost === "function",
      stopBoost: typeof newPlayerSnake.stopBoost === "function",
      isSegmentImmune: typeof newPlayerSnake.isSegmentImmune === "function",
    });

    // Create initial AI snakes
    const newAISnakes: AISnake[] = [];
    for (let i = 0; i < gameConfig.aiSnake.initialCount; i++) {
      // Random position away from player
      let aiPos: Vector;
      do {
        aiPos = createVector(
          Math.random() * (canvasWidth - 100) + 50,
          Math.random() * (canvasHeight - 100) + 50
        );
      } while (distance(aiPos, playerStartPos) < 200);

      // Create and verify the AI snake
      const aiSnake = new AISnake(
        `ai_${i}`,
        aiPos,
        gameConfig.aiSnake.initialLength
      );

      console.log(
        "gameConfig.aiSnake.initialLength",
        gameConfig.aiSnake.initialLength
      );
      // Debug verification
      console.log(
        `AI Snake ${i} created with ${aiSnake.segments.length} segments`
      );

      // Only add if properly initialized
      if (aiSnake.segments && aiSnake.segments.length > 0) {
        newAISnakes.push(aiSnake);
      } else {
        console.error(`Failed to initialize AI Snake ${i}`);
        // Try again with a different position
        i--;
      }
    }

    // Create initial food
    const initialSnakes = [newPlayerSnake, ...newAISnakes];
    const newFoods = Food.generateRandomFood(
      gameConfig.food.initialCount,
      canvasWidth,
      canvasHeight,
      initialSnakes,
      []
    );

    // First set all other state
    // Don't use spread operator on objects with methods
    setPlayerSnake(newPlayerSnake);
    setAISnakes(newAISnakes);
    setFoods(newFoods);
    setScore(0);

    // Verify all components are ready
    const allSnakesReady =
      newPlayerSnake &&
      newAISnakes.every((snake) => snake.segments && snake.segments.length > 0);

    // Set game state last to ensure all other state is ready
    if (allSnakesReady) {
      console.log("All snakes initialized successfully, starting game");
      setTimeout(() => {
        setGameState(GameState.PLAYING);
        console.log("Game state set to PLAYING");
      }, 100); // Small delay to ensure all React state updates have been processed
    } else {
      console.error("Failed to initialize game components");
      // Handle initialization failure
    }

    // Set game state last to ensure all other state is ready
    setTimeout(() => {
      setGameState(GameState.PLAYING);
      console.log("Game state set to PLAYING");
    }, 0);
  }, []);

  // Reset game
  const resetGame = useCallback(() => {
    initGame();
  }, [initGame]);

  // End game
  const endGame = useCallback(() => {
    // Update high score if necessary
    if (score > highScore) {
      setHighScore(score);
      // Could save to localStorage here if needed
    }

    setGameState(GameState.GAME_OVER);
  }, [score, highScore]);

  // Add this helper function at component level
  const getAliveAISnakeCount = useCallback(() => {
    return aiSnakes.filter((snake) => snake.alive).length;
  }, [aiSnakes]);

  // Then update the generateNewAISnake function
  const generateNewAISnake = useCallback(() => {
    // Get current alive count using our consistent helper
    const currentAliveAICount = getAliveAISnakeCount();

    // Calculate maximum allowed based on player length
    const maxAllowedAISnakes = Math.min(
      3 + Math.floor((playerSnake?.segments.length || 0) / 30),
      8 // Hard cap at 8 AI snakes
    );

    console.log(
      `AI Snake Status - Alive: ${currentAliveAICount}, Max: ${maxAllowedAISnakes}, Queue: ${aiGenerationQueue.current}`
    );

    // Check if we've reached the maximum
    if (currentAliveAICount >= maxAllowedAISnakes) {
      console.log(
        `Maximum AI snake limit (${maxAllowedAISnakes}) reached. Clearing queue.`
      );
      aiGenerationQueue.current = 0;
      return;
    }

    // If already generating, queue and return
    if (isGeneratingAI.current) {
      const remainingSlots = maxAllowedAISnakes - currentAliveAICount;
      if (remainingSlots > aiGenerationQueue.current) {
        aiGenerationQueue.current += 1;
        console.log(
          `AI snake generation queued. Queue: ${aiGenerationQueue.current}, Slots: ${remainingSlots}`
        );
      }
      return;
    }

    // Set generating flag
    isGeneratingAI.current = true;

    try {
      if (!playerSnake) {
        console.warn("Cannot generate AI snake: player snake does not exist");
        isGeneratingAI.current = false;
        return;
      }

      console.log(
        `Generating new AI snake (Player length: ${playerSnake.segments.length})`
      );

      const canvasWidth = gameConfig.canvas.width;
      const canvasHeight = gameConfig.canvas.height;

      // Find a valid position for the new AI snake
      let aiPos: Vector;
      let validPosition = false;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        attempts++;

        // Generate position with margin from edges
        const edgeMargin = 100;
        aiPos = createVector(
          edgeMargin + Math.random() * (canvasWidth - edgeMargin * 2),
          edgeMargin + Math.random() * (canvasHeight - edgeMargin * 2)
        );

        // Check distance from player
        const distanceFromPlayer = playerSnake.headPosition
          ? distance(aiPos, playerSnake.headPosition)
          : 1000; // Default if player position is undefined

        // Check distance from other AI snakes
        const tooCloseToOtherAI = aiSnakes.some((snake) => {
          return (
            snake.alive &&
            snake.headPosition &&
            distance(aiPos, snake.headPosition) < 150
          );
        });

        // Check distance from food
        const tooCloseToFood = foods.some((food) => {
          return distance(aiPos, food.position) < 30;
        });

        validPosition =
          distanceFromPlayer > 300 && !tooCloseToOtherAI && !tooCloseToFood;
      } while (!validPosition && attempts < maxAttempts);

      // Fallback position if we couldn't find a valid one
      if (!validPosition) {
        console.log("Could not find valid position, using fallback position");
        aiPos = createVector(
          canvasWidth / 2 + (Math.random() - 0.5) * 400,
          canvasHeight / 2 + (Math.random() - 0.5) * 400
        );
      }

      // Calculate AI length based on player length
      const playerLength = playerSnake.segments.length;
      let aiLength = Math.max(
        gameConfig.aiSnake.initialLength,
        Math.floor(playerLength * gameConfig.aiSnake.lengthRatio)
      );

      // Add randomness (-10% to +10%)
      const randomFactor = 0.9 + Math.random() * 0.2;
      aiLength = Math.floor(aiLength * randomFactor);

      console.log(`New AI snake will have length: ${aiLength}`);

      // Create the AI snake with unique ID
      const uniqueId = `ai_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const newAI = new AISnake(uniqueId, aiPos, aiLength);

      // Debug log to track snake creation
      console.log(`Created AI snake ${uniqueId} with ${aiLength} segments`);

      // Ensure initialization
      if (!newAI.segments || newAI.segments.length === 0) {
        if (typeof newAI.initializeSegments === "function") {
          newAI.initializeSegments(aiPos, aiLength);
          console.log(`Forced initialization of AI snake ${uniqueId}`);
        }
      }

      // IMPORTANT: Only add alive snakes without filtering existing ones
      setAISnakes((prev) => {
        // DO NOT filter here - only add the new snake
        const newCount = prev.length + 1;
        console.log(
          `Adding new AI snake ${uniqueId} to state. Current count: ${prev.length}, New count: ${newCount}`
        );
        return [...prev, newAI];
      });
    } catch (error) {
      console.error("Error generating AI snake:", error);
    } finally {
      // Process queue after delay
      setTimeout(() => {
        isGeneratingAI.current = false;

        // Check if more snakes needed
        if (aiGenerationQueue.current > 0) {
          const updatedAliveCount = getAliveAISnakeCount();
          if (updatedAliveCount < maxAllowedAISnakes) {
            console.log(
              `Processing next AI snake from queue (${aiGenerationQueue.current} remaining)`
            );
            aiGenerationQueue.current -= 1;
            generateNewAISnake();
          } else {
            console.log(
              `Maximum AI snakes reached (${updatedAliveCount}/${maxAllowedAISnakes}). Clearing queue.`
            );
            aiGenerationQueue.current = 0;
          }
        }
      }, 500);
    }
  }, [playerSnake, aiSnakes, foods, getAliveAISnakeCount]);

  // Handle collisions
  const handleCollisions = useCallback(
    (
      collisions: any[],
      activePlayerSnake?: Snake | null,
      activeAISnakes: AISnake[] = []
    ) => {
      // Use the provided reconstructed snake or the one from state
      const snake = activePlayerSnake || playerSnake;
      if (!snake) return;

      // Process each collision
      collisions.forEach((collision) => {
        switch (collision.type) {
          case CollisionType.PLAYER_FOOD:
            {
              const food = collision.entity2;

              // Add points
              setScore((prev) => prev + food.points);

              // Grow snake - safely check if method exists
              if (typeof snake.grow === "function") {
                snake.grow(food.value);
              }

              // Apply power-up if applicable
              if (
                food.type === FoodType.INVINCIBLE_BOOST &&
                typeof snake.applyInvincibleBoost === "function"
              ) {
                snake.applyInvincibleBoost();
              }

              // Remove food
              setFoods((prev) => prev.filter((f) => f.id !== food.id));
            }
            break;

          case CollisionType.PLAYER_WALL:
            // Player hits wall = game over
            if (typeof snake.kill === "function") {
              snake.kill();
            } else {
              // Fallback if method is missing
              snake.alive = false;
            }
            break;

          case CollisionType.PLAYER_SELF:
            {
              // Player self-collision - apply temporary immunity
              const segmentIndex = collision.entity2.segmentIndex;
              if (
                typeof CollisionDetection.applyCollisionImmunity === "function"
              ) {
                CollisionDetection.applyCollisionImmunity(
                  snake,
                  segmentIndex,
                  gameConfig.playerSnake.selfCollisionImmunityTime
                );
              } else if (snake.segments[segmentIndex]) {
                // Fallback implementation
                snake.segments[segmentIndex].immunityTimeLeft =
                  gameConfig.playerSnake.selfCollisionImmunityTime;
              }
            }
            break;

          case CollisionType.PLAYER_AI_BODY:
            {
              // Player head collides with AI snake body

              if (typeof snake.kill === "function") {
                snake.kill();
              } else {
                // Backup if method is missing
                snake.alive = false;
              }

              // End game immediately
              endGame();
            }
            break;

          case CollisionType.AI_PLAYER_BODY:
            {
              // AI head hits player body - AI DIES
              const aiSnakeId = collision.entity1.id;

              // Find the actual AI snake instance
              const aiSnake =
                activeAISnakes.find((ai) => ai.id === aiSnakeId) ||
                aiSnakes.find((ai) => ai.id === aiSnakeId);

              if (
                !aiSnake ||
                !aiSnake.alive ||
                recentlyRemovedSnakes.current.has(aiSnakeId)
              ) {
                return;
              }

              // Fallback if method is missing
              aiSnake.alive = false;

              // Add score - INCREASED POINTS
              setScore((prev) => prev + 200);

              // Generate more food from dead AI
              const newFoods = Food.generateFoodFromDeadSnake(
                aiSnake,
                gameConfig.food.aiDropRatio
              );
              setFoods((prev) => [...prev, ...newFoods]);

              // Use safe remove function
              safeRemoveAISnake(aiSnakeId);

              // Avoid duplicate generation
              const randomDelay = 800 + Math.random() * 400; // 800-1200ms
              console.log(`安排在 ${randomDelay.toFixed(0)}ms 后生成新的AI蛇`);
              setTimeout(() => generateNewAISnake(), randomDelay);
            }
            break;

          case CollisionType.AI_FOOD:
            {
              const aiSnakeId = collision.entity1.id;
              const food = collision.entity2;

              // Find the actual AI snake instance
              const aiSnake =
                activeAISnakes.find((ai) => ai.id === aiSnakeId) ||
                aiSnakes.find((ai) => ai.id === aiSnakeId);

              if (!aiSnake) return;

              // Grow AI snake - safely check if method exists
              if (typeof aiSnake.grow === "function") {
                aiSnake.grow(food.value);
              }

              // Apply power-up if applicable
              if (
                food.type === FoodType.INVINCIBLE_BOOST &&
                typeof aiSnake.applyInvincibleBoost === "function"
              ) {
                aiSnake.applyInvincibleBoost();
              }

              // Remove food
              setFoods((prev) => prev.filter((f) => f.id !== food.id));
            }
            break;

          case CollisionType.AI_WALL:
            {
              // AI hits wall
              const aiSnakeId = collision.entity1.id;

              // Find the actual AI snake instance
              const aiSnake =
                activeAISnakes.find((ai) => ai.id === aiSnakeId) ||
                aiSnakes.find((ai) => ai.id === aiSnakeId);

              if (!aiSnake) return;

              // Kill AI snake - safely check if method exists
              if (typeof aiSnake.kill === "function") {
                aiSnake.kill();
              } else {
                // Fallback if method is missing
                aiSnake.alive = false;
              }

              // Generate food from dead AI
              const newFoods = Food.generateFoodFromDeadSnake(
                aiSnake,
                gameConfig.food.aiDropRatio
              );
              setFoods((prev) => [...prev, ...newFoods]);

              // Use safe remove function
              safeRemoveAISnake(aiSnake.id);

              // Use random delay to generate new AI snake
              const randomDelay = 800 + Math.random() * 400; // 800-1200ms
              setTimeout(() => generateNewAISnake(), randomDelay);
            }
            break;

          case CollisionType.AI_AI:
            {
              // AI collision with another AI
              const aiSnake1Id = collision.entity1.id;
              const aiSnake2Id = collision.entity2.snake.id;

              // Find the actual AI snake instances
              const aiSnake1 =
                activeAISnakes.find((ai) => ai.id === aiSnake1Id) ||
                aiSnakes.find((ai) => ai.id === aiSnake1Id);
              const aiSnake2 =
                activeAISnakes.find((ai) => ai.id === aiSnake2Id) ||
                aiSnakes.find((ai) => ai.id === aiSnake2Id);

              if (!aiSnake1 || !aiSnake2) return;

              // Determine which one dies (the smaller one)
              if (aiSnake1.segments.length >= aiSnake2.segments.length) {
                // Kill AI snake 2 - safely check if method exists
                if (typeof aiSnake2.kill === "function") {
                  aiSnake2.kill();
                } else {
                  // Fallback if method is missing
                  aiSnake2.alive = false;
                }

                // Generate food from dead AI
                const newFoods = Food.generateFoodFromDeadSnake(
                  aiSnake2,
                  gameConfig.food.aiDropRatio
                );
                setFoods((prev) => [...prev, ...newFoods]);

                // Use safe remove function
                safeRemoveAISnake(aiSnake2.id);

                // Use random delay to generate new AI snake
                const randomDelay = 800 + Math.random() * 400;
                setTimeout(() => generateNewAISnake(), randomDelay);
              } else {
                // Kill AI snake 1 - safely check if method exists
                if (typeof aiSnake1.kill === "function") {
                  aiSnake1.kill();
                } else {
                  // Fallback if method is missing
                  aiSnake1.alive = false;
                }

                // Generate food from dead AI
                const newFoods = Food.generateFoodFromDeadSnake(
                  aiSnake1,
                  gameConfig.food.aiDropRatio
                );
                setFoods((prev) => [...prev, ...newFoods]);

                // Remove dead AI
                safeRemoveAISnake(aiSnake1.id);

                // Use random delay to generate new AI snake
                const randomDelay = 800 + Math.random() * 400;
                setTimeout(() => generateNewAISnake(), randomDelay);
              }
            }
            break;
        }
      });
    },
    [playerSnake, aiSnakes]
  );

  // Process game logic updates
  const updateGame = useCallback(
    (deltaTime: number, time: number) => {
      if (gameState !== GameState.PLAYING || !playerSnake) return;

      const canvasWidth = gameConfig.canvas.width;
      const canvasHeight = gameConfig.canvas.height;

      // Ensure player snake has methods
      const activePlayerSnake = ensureSnakeMethods(playerSnake);

      // Ensure AI snakes have methods - use type assertions to satisfy TypeScript
      const activeAISnakes = aiSnakes.map((aiSnake) =>
        ensureAISnakeMethods(aiSnake)
      );

      // Update player snake
      if (typeof activePlayerSnake.update === "function") {
        activePlayerSnake.update(deltaTime, time);
      }

      // Update AI snakes
      activeAISnakes.forEach((aiSnake) => {
        if (typeof aiSnake.update === "function") {
          aiSnake.update(
            deltaTime,
            time,
            activePlayerSnake,
            foods,
            canvasWidth,
            canvasHeight
          );
        }
      });

      // Update food
      foods.forEach((food) => {
        if (typeof food.update === "function") {
          food.update(deltaTime);
        }
      });

      // Check collisions - use type assertion to resolve TypeScript error
      const collisions = CollisionDetection.detectCollisions(
        activePlayerSnake,
        // Type assertion to resolve incompatibility between AISnake[] and Snake[]
        activeAISnakes as unknown as Snake[],
        foods,
        canvasWidth,
        canvasHeight
      );

      // Handle collisions
      if (collisions.length > 0) {
        handleCollisions(collisions, activePlayerSnake, activeAISnakes);
      }

      // Check if player is still alive
      if (!activePlayerSnake.alive) {
        endGame();
        return;
      }

      // Maintain minimum food count
      if (foods.length < gameConfig.food.minFoodCount) {
        const newFoods = Food.generateRandomFood(
          gameConfig.food.minFoodCount - foods.length,
          canvasWidth,
          canvasHeight,
          // Combine player and AI snakes into a single array, with type assertion
          [activePlayerSnake, ...activeAISnakes] as Snake[],
          foods
        );
        if (newFoods.length > 0) {
          setFoods((prev) => [...prev, ...newFoods]);
        }
      }

      // Check if we need to add a new AI snake
      const playerLength = activePlayerSnake.segments.length;
      const aiAddThreshold = gameConfig.aiSnake.newAIInterval;

      if (
        playerLength > 0 &&
        playerLength % aiAddThreshold === 0 &&
        playerLength / aiAddThreshold > activeAISnakes.length
      ) {
        generateNewAISnake();
      }

      // Update player snake state without losing methods
      // We can use a different approach than spread operator to avoid losing methods
      if (activePlayerSnake !== playerSnake) {
        // When we had to recreate the snake, use the new instance
        setPlayerSnake(activePlayerSnake);
      } else {
        // Use the preserveMethods utility to create a state-friendly copy while maintaining methods
        setPlayerSnake(preserveMethods(activePlayerSnake));
      }

      // Update AI snakes state
      setAISnakes((prevSnakes) => {
        // Find all snakes that should remain in the game
        const updatedSnakes = prevSnakes
          .filter((snake) => snake.alive) // Only keep alive snakes
          .map((snake) => {
            // Find the matching active snake to get updated positions
            const activeSnake = activeAISnakes.find(
              (active) => active.id === snake.id
            );
            if (activeSnake) {
              // Preserve methods on the updated snake
              return preserveMethods(activeSnake);
            }
            // If no matching active snake (shouldn't happen), keep the original
            return snake;
          });

        const aliveCount = updatedSnakes.length;
        console.log(`Game loop update: AI snakes alive: ${aliveCount}`);
        return updatedSnakes;
      });
    },
    [
      gameState,
      playerSnake,
      aiSnakes,
      foods,
      endGame,
      generateNewAISnake,
      handleCollisions,
    ]
  );

  // Add a new function to safely remove AI snakes
  const safeRemoveAISnake = useCallback(
    (aiSnakeId: string) => {
      // Check if snake is in recently removed list
      if (recentlyRemovedSnakes.current.has(aiSnakeId)) {
        console.log(`AI snake ${aiSnakeId} already removed, skipping`);
        return;
      }

      // Add to recently removed list
      recentlyRemovedSnakes.current.add(aiSnakeId);

      // Find the snake first
      const snakeToRemove = aiSnakes.find((snake) => snake.id === aiSnakeId);
      if (!snakeToRemove) {
        console.log(`AI snake ${aiSnakeId} not found, can't remove`);
        return;
      }

      // Mark as dead without changing the instance type
      if (snakeToRemove.alive) {
        // Update properly by calling the method on the instance
        if (typeof snakeToRemove.kill === "function") {
          snakeToRemove.kill();
          console.log(`Killed AI snake ${aiSnakeId} using kill() method`);
        } else {
          // Direct property access as fallback (should maintain the type)
          setAISnakes((prev) =>
            prev.map((snake) => {
              if (snake.id === aiSnakeId) {
                // Create a new snake using the proper constructor
                const deadSnake = new AISnake(
                  snake.id,
                  snake.headPosition,
                  snake.segments.length
                );
                // Copy over important properties
                Object.assign(deadSnake, snake);
                // Mark as dead
                deadSnake.alive = false;
                return deadSnake;
              }
              return snake;
            })
          );
          console.log(`Marked AI snake ${aiSnakeId} as dead using assignment`);
        }
      }

      // After delay, actually remove from array
      setTimeout(() => {
        setAISnakes((prev) => {
          const beforeCount = prev.length;
          const filtered = prev.filter((snake) => snake.id !== aiSnakeId);
          const afterCount = filtered.length;
          console.log(
            `Removing dead AI snake ${aiSnakeId} from state. Before: ${beforeCount}, After: ${afterCount}`
          );
          return filtered;
        });

        // Remove from recently removed list after a delay
        setTimeout(() => {
          recentlyRemovedSnakes.current.delete(aiSnakeId);
        }, 2000);
      }, 100);
    },
    [aiSnakes]
  );

  // Handle player input from mouse
  useEffect(() => {
    if (gameState !== GameState.PLAYING || !playerSnake) return;

    // Ensure snake has methods
    const activePlayerSnake = ensureSnakeMethods(playerSnake);

    // For mobile, use virtual joystick direction
    if (isMobile && mobileDirection) {
      if (typeof activePlayerSnake.updateDirection === "function") {
        // Convert joystick direction to a position relative to the snake head
        const headPos = activePlayerSnake.headPosition;
        const targetPos = {
          x: headPos.x + mobileDirection.x * 100, // Amplify the direction
          y: headPos.y + mobileDirection.y * 100,
        };

        activePlayerSnake.updateDirection(targetPos);
      }
    }
    // For desktop, use mouse position as before
    else if (
      !isMobile &&
      mouseInCanvas &&
      typeof activePlayerSnake.updateDirection === "function"
    ) {
      activePlayerSnake.updateDirection(mousePosition);

      // Handle boost (this is now handled separately for mobile)
      if (leftButtonPressed) {
        if (typeof activePlayerSnake.startBoost === "function") {
          activePlayerSnake.startBoost();
        }
      } else {
        if (typeof activePlayerSnake.stopBoost === "function") {
          activePlayerSnake.stopBoost();
        }
      }
    }

    // Only update state if we had to recreate the snake
    if (activePlayerSnake !== playerSnake) {
      setPlayerSnake(activePlayerSnake);
    }
  }, [
    gameState,
    playerSnake,
    mousePosition,
    leftButtonPressed,
    mouseInCanvas,
    isMobile,
    mobileDirection,
  ]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case KEYS.P:
          // Toggle pause
          if (gameState === GameState.PLAYING) {
            setGameState(GameState.PAUSED);
          } else if (gameState === GameState.PAUSED) {
            setGameState(GameState.PLAYING);
          }
          break;

        case KEYS.ESC:
          // Close controls or go to start screen
          if (showControls) {
            setShowControls(false);
          } else if (gameState === GameState.GAME_OVER) {
            setGameState(GameState.START);
          } else if (gameState === GameState.PAUSED) {
            setGameState(GameState.PLAYING);
          }
          break;

        case KEYS.R:
          // Restart game
          if (
            gameState === GameState.PLAYING ||
            gameState === GameState.PAUSED ||
            gameState === GameState.GAME_OVER
          ) {
            resetGame();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [gameState, resetGame, showControls]);

  // Handle canvas click for start/restart
  const handleCanvasClick = useCallback(() => {
    if (gameState === GameState.START) {
      initGame();
    } else if (gameState === GameState.GAME_OVER) {
      resetGame();
    }
  }, [gameState, initGame, resetGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("click", handleCanvasClick);

    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [handleCanvasClick]);

  // Adjust canvas size on window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const container = canvas.parentElement;
      if (!container) return;

      const containerWidth = container.clientWidth;

      // Calculate scale factor
      const scaleFactor = Math.min(1, containerWidth / gameConfig.canvas.width);

      // Adjust canvas size
      canvas.style.transformOrigin = "top left";
      canvas.style.transform = `scale(${scaleFactor})`;

      container.style.height = `${gameConfig.canvas.height * scaleFactor}px`;
    };

    // Initial resize
    handleResize();

    // Listen for window resize events
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (playerSnake && selectedSkin && playerSnake.skin !== selectedSkin) {
      // Update player snake skin
      setPlayerSnake((prevSnake) => {
        if (!prevSnake) return null;

        // Create a new snake instance with the same properties
        const updatedSnake = preserveMethods(prevSnake);
        updatedSnake.skin = selectedSkin;

        return updatedSnake;
      });
    }
  }, [selectedSkin, playerSnake]);

  // Use game loop hook
  useGameLoop(updateGame, 60, gameState);

  // Show controls button
  const renderControlsButton = () => (
    <button
      onClick={() => {
        // If game is not paused, pause it
        if (gameState === GameState.PLAYING) {
          setGameState(GameState.PAUSED);
        }

        setShowControls(true);
      }}
      style={{
        position: "absolute",
        top: "10px",
        right: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        border: "1px solid #444",
        padding: "8px 15px",
        fontSize: "14px",
        borderRadius: "5px",
        cursor: "pointer",
        zIndex: 100,
      }}
    >
      Controls & Rules
    </button>
  );

  const handleCloseGameOver = useCallback(() => {
    setGameState(GameState.START);
  }, []);

  const togglePlayPause = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      setGameState(GameState.PAUSED);
    } else if (gameState === GameState.PAUSED) {
      setGameState(GameState.PLAYING);
    }
  }, [gameState]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Game Canvas */}
      <GameCanvas
        width={gameConfig.canvas.width}
        height={gameConfig.canvas.height}
        playerSnake={playerSnake}
        aiSnakes={aiSnakes}
        foods={foods}
        gameState={gameState}
        score={score}
        highScore={highScore}
        canvasRef={canvasRef}
        onTogglePlayPause={togglePlayPause}
      />

      {/* Mobile Controls - only show on mobile and during gameplay */}
      {isMobile && gameState === GameState.PLAYING && (
        <MobileControls
          onDirectionChange={handleMobileDirectionChange}
          onBoostChange={handleMobileBoostChange}
          isVisible={true}
        />
      )}

      {/* Score Board (only shown during gameplay) */}
      {gameState === GameState.PLAYING && playerSnake && (
        <ScoreBoard
          playerSnake={playerSnake}
          score={score}
          highScore={highScore}
        />
      )}

      {/* Game Over Modal */}
      {gameState === GameState.GAME_OVER && (
        <GameOverModal
          score={score}
          highScore={highScore}
          onRestart={resetGame}
          onClose={handleCloseGameOver}
        />
      )}

      {/* Controls Button (shown at start or during gameplay) */}
      {(gameState === GameState.START || gameState === GameState.PLAYING) &&
        renderControlsButton()}

      {/* Controls Info Modal */}
      {showControls && <ControlsInfo onClose={() => setShowControls(false)} />}
    </div>
  );
};

export default Game;
