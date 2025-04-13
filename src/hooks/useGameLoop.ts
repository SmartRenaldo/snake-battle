// src/hooks/useGameLoop.ts

import { useRef, useEffect, useState, useCallback } from "react";
import { GameState } from "../utils/constants";

/**
 * Hook for managing the game loop and timing
 */
export const useGameLoop = (
  onUpdate: (deltaTime: number, time: number) => void,
  fps: number = 60,
  gameState: GameState
) => {
  // Reference to store the last frame time
  const lastFrameTimeRef = useRef<number>(0);
  // Reference to the animation frame ID for cleanup
  const frameIdRef = useRef<number>(0);
  // Accumulated time for fixed timestep
  const accumulatedTimeRef = useRef<number>(0);
  // Game time (elapsed since start)
  const [gameTime, setGameTime] = useState<number>(0);

  // Calculate the time step based on target FPS
  const timeStep = 1 / fps;

  // Game loop function
  const gameLoop = useCallback(
    (currentTime: number) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = currentTime;
      }

      // Calculate delta time in seconds
      const deltaTime = (currentTime - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = currentTime;

      // Use ref to check current game state to avoid closure issues
      const currentGameState = gameState;

      if (currentGameState === GameState.PLAYING) {
        // Fixed time step accumulation
        accumulatedTimeRef.current += deltaTime;

        // Update game with fixed time steps
        let updatesApplied = 0;
        while (accumulatedTimeRef.current >= timeStep && updatesApplied < 3) {
          // Limit max updates per frame
          console.log(
            `Game update: time=${gameTime.toFixed(2)}, step=${timeStep.toFixed(
              3
            )}`
          );
          onUpdate(timeStep, gameTime);
          accumulatedTimeRef.current -= timeStep;
          setGameTime((prevTime) => prevTime + timeStep);
          updatesApplied++;
        }
      }

      // Request next frame
      frameIdRef.current = requestAnimationFrame(gameLoop);
    },
    [onUpdate, timeStep, gameState, gameTime]
  );

  // Start and stop the game loop
  useEffect(() => {
    // Reset time when game state changes to PLAYING
    if (gameState === GameState.PLAYING) {
      console.log("Game state changed to PLAYING");
      lastFrameTimeRef.current = 0;
      accumulatedTimeRef.current = 0;
    }

    // Start the game loop
    frameIdRef.current = requestAnimationFrame(gameLoop);

    // Cleanup function to cancel animation frame
    return () => {
      cancelAnimationFrame(frameIdRef.current);
    };
  }, [gameLoop, gameState]);

  // Reset game time
  const resetGameTime = useCallback(() => {
    setGameTime(0);
    lastFrameTimeRef.current = 0;
    accumulatedTimeRef.current = 0;
  }, []);

  return {
    gameTime,
    resetGameTime,
  };
};
