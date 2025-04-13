// src/Game.tsx

import React, { useState, useRef, useEffect, useCallback } from "react";
import { gameConfig } from "./config/gameConfig";
import { GameState, EntityType, FoodType, KEYS } from "./utils/constants";
import { Vector, createVector, distance } from "./utils/vector";
import { reconstructSnake, reconstructAISnake } from "./utils/reconstruct";
import { Snake } from "./models/Snake";
import { AISnake } from "./models/AISnake";
import { Food } from "./models/Food";
import { CollisionDetection, CollisionType } from "./models/Collision";
import GameCanvas from "./components/GameCanvas";
import ScoreBoard from "./components/ScoreBoard";
import GameOverModal from "./components/GameOverModal";
import ControlsInfo from "./components/ControlsInfo";
import { useGameLoop } from "./hooks/useGameLoop";
import { useMouseControl } from "./hooks/useMouseControl";

const Game: React.FC = () => {
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

  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Mouse control hook
  const { mousePosition, leftButtonPressed, mouseInCanvas } = useMouseControl(
    canvasRef,
    gameState
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
      "default",
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

      const aiSnake = new AISnake(
        `ai_${i}`,
        aiPos,
        gameConfig.aiSnake.initialLength
      );

      newAISnakes.push(aiSnake);
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

  // Generate new AI snake
  const generateNewAISnake = useCallback(() => {
    if (!playerSnake) return;

    const canvasWidth = gameConfig.canvas.width;
    const canvasHeight = gameConfig.canvas.height;

    // Random position away from player
    let aiPos: Vector;
    do {
      aiPos = createVector(
        Math.random() * (canvasWidth - 100) + 50,
        Math.random() * (canvasHeight - 100) + 50
      );
    } while (distance(aiPos, playerSnake.headPosition) < 300);

    // Calculate AI length based on player length
    const aiLength = Math.max(
      gameConfig.aiSnake.initialLength,
      Math.floor(playerSnake.segments.length * gameConfig.aiSnake.lengthRatio)
    );

    // Create new AI snake
    const newAI = new AISnake(`ai_${Date.now()}`, aiPos, aiLength);

    // Add to state
    setAISnakes((prev) => [...prev, newAI]);
  }, [playerSnake]);

  // Handle collisions
  const handleCollisions = useCallback(
    (
      collisions: any[],
      activePlayerSnake: Snake = null,
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
              // Player head hits AI body
              const aiSnakeId = collision.entity2.snake.id;
              const segmentIndex = collision.entity2.segmentIndex;

              // Find the actual AI snake instance (either from activeAISnakes or state)
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

              // Add score
              setScore((prev) => prev + 200);

              // Generate food from dead AI
              const newFoods = Food.generateFoodFromDeadSnake(
                aiSnake,
                gameConfig.food.aiDropRatio
              );
              setFoods((prev) => [...prev, ...newFoods]);

              // Remove dead AI
              setAISnakes((prev) => prev.filter((ai) => ai.id !== aiSnake.id));
            }
            break;

          case CollisionType.AI_PLAYER_BODY:
            {
              // AI head hits player body = game over
              if (typeof snake.kill === "function") {
                snake.kill();
              } else {
                // Fallback if method is missing
                snake.alive = false;
              }
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

              // Remove dead AI
              setAISnakes((prev) => prev.filter((ai) => ai.id !== aiSnake.id));
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

                // Remove dead AI
                setAISnakes((prev) =>
                  prev.filter((ai) => ai.id !== aiSnake2.id)
                );
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
                setAISnakes((prev) =>
                  prev.filter((ai) => ai.id !== aiSnake1.id)
                );
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

      // Create a reference to track if changes were made that need a state update
      let needsPlayerUpdate = false;
      let needsAIUpdate = false;
      let needsFoodUpdate = false;

      // Important: Reconstruct objects to ensure methods are available
      // Get a properly constructed player snake with all methods
      const activePlayerSnake = reconstructSnake(playerSnake);

      // Reconstruct all AI snakes to ensure methods are available
      const activeAISnakes = aiSnakes.map((aiSnake) =>
        reconstructAISnake(aiSnake)
      );

      // Update player snake
      if (activePlayerSnake && typeof activePlayerSnake.update === "function") {
        activePlayerSnake.update(deltaTime, time);
        needsPlayerUpdate = true;
      } else {
        console.error("playerSnake or its update method is undefined");
      }

      // 2. Update AI snakes
      if (activeAISnakes.length > 0) {
        // Update each AI snake in place
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
            needsAIUpdate = true;
          } else {
            console.error("AI Snake update method is undefined");
          }
        });
      }

      // 3. Update food
      if (foods.length > 0) {
        foods.forEach((food) => {
          if (typeof food.update === "function") {
            food.update(deltaTime);
            needsFoodUpdate = true;
          }
        });
      }

      // 4. Check collisions
      const collisions = CollisionDetection.detectCollisions(
        activePlayerSnake,
        activeAISnakes,
        foods,
        canvasWidth,
        canvasHeight
      );

      // 5. Handle collisions
      if (collisions.length > 0) {
        // Pass the reconstructed objects to ensure methods are available
        handleCollisions(collisions, activePlayerSnake, activeAISnakes);
      }

      // 6. Check if player is still alive
      if (activePlayerSnake && !activePlayerSnake.alive) {
        endGame();
        return;
      }

      // 7. Maintain minimum food count
      if (foods.length < gameConfig.food.minFoodCount) {
        const newFoods = Food.generateRandomFood(
          gameConfig.food.minFoodCount - foods.length,
          canvasWidth,
          canvasHeight,
          [activePlayerSnake, ...activeAISnakes],
          foods
        );
        if (newFoods.length > 0) {
          setFoods((prev) => [...prev, ...newFoods]);
        }
      }

      // 8. Check if we need to add a new AI snake
      if (activePlayerSnake) {
        const playerLength = activePlayerSnake.segments.length;
        const aiAddThreshold = gameConfig.aiSnake.newAIInterval;

        if (
          playerLength > 0 &&
          playerLength % aiAddThreshold === 0 &&
          playerLength / aiAddThreshold > activeAISnakes.length
        ) {
          generateNewAISnake();
        }
      }

      // Trigger state updates only if needed
      if (needsPlayerUpdate) {
        // Store the updated player snake state (will lose methods, but we'll reconstruct next frame)
        setPlayerSnake({ ...activePlayerSnake });
      }

      if (needsAIUpdate) {
        // Store the updated AI snakes state
        setAISnakes([...activeAISnakes]);
      }

      if (needsFoodUpdate) {
        // Force a re-render with a new array reference
        setFoods((prevFoods) => [...prevFoods]);
      }
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

  // Handle player input from mouse
  useEffect(() => {
    if (gameState !== GameState.PLAYING || !playerSnake) return;

    // Reconstruct player snake to ensure methods are available
    const activePlayerSnake = reconstructSnake(playerSnake);

    // Only update direction when mouse is in canvas
    if (activePlayerSnake && mouseInCanvas) {
      // Only update if the direction method exists
      if (typeof activePlayerSnake.updateDirection === "function") {
        // This mutates the snake object directly - we'll store it in state at the end
        activePlayerSnake.updateDirection(mousePosition);
      } else {
        console.error("updateDirection method is missing on playerSnake");
      }
    }

    // Handle boost - check if methods exist
    if (leftButtonPressed) {
      if (
        typeof activePlayerSnake.startBoost === "function" &&
        !activePlayerSnake.boosting
      ) {
        // Only log when state changes
        console.log("Activating boost");
        activePlayerSnake.startBoost();
      }
    } else {
      if (
        activePlayerSnake.boosting &&
        typeof activePlayerSnake.stopBoost === "function"
      ) {
        console.log("Deactivating boost");
        activePlayerSnake.stopBoost();
      }
    }

    // Update the playerSnake state with the modified object
    // IMPORTANT: No need to force an update here - the game loop will handle it
  }, [gameState, playerSnake, mousePosition, leftButtonPressed, mouseInCanvas]);

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
      console.log("Starting game...");
      initGame();
    } else if (gameState === GameState.GAME_OVER) {
      console.log("Restarting game...");
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

  // Use game loop hook
  const { gameTime } = useGameLoop(updateGame, 60, gameState);

  // Show controls button
  const renderControlsButton = () => (
    <button
      onClick={() => setShowControls(true)}
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
      />

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
