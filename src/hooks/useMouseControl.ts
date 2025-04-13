// src/hooks/useMouseControl.ts

import { useEffect, useState, useRef, useCallback } from "react";
import { GameState } from "../utils/constants";
import { Vector } from "../utils/vector";

/**
 * Hook for handling mouse controls in the game
 */
export const useMouseControl = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  gameState: GameState
) => {
  // Mouse position state
  const [mousePosition, setMousePosition] = useState<Vector>({ x: 0, y: 0 });
  // Mouse button states
  const [leftButtonPressed, setLeftButtonPressed] = useState<boolean>(false);
  // Track if mouse is within canvas
  const [mouseInCanvas, setMouseInCanvas] = useState<boolean>(false);

  // Handle mouse move events
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!canvasRef.current || gameState !== GameState.PLAYING) return;

      // Get canvas bounds
      const rect = canvasRef.current.getBoundingClientRect();

      // Calculate mouse position relative to canvas
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      setMousePosition({ x, y });
    },
    [canvasRef, gameState]
  );

  // Handle mouse down events
  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!canvasRef.current || gameState !== GameState.PLAYING) return;

      // Left mouse button
      if (event.button === 0) {
        setLeftButtonPressed(true);

        // Prevent default to avoid text selection
        event.preventDefault();
      }
    },
    [canvasRef, gameState]
  );

  // Handle mouse up events
  const handleMouseUp = useCallback(
    (event: MouseEvent) => {
      if (gameState !== GameState.PLAYING) return;

      // Left mouse button
      if (event.button === 0) {
        setLeftButtonPressed(false);
      }
    },
    [gameState]
  );

  // Handle mouse enter events
  const handleMouseEnter = useCallback(() => {
    setMouseInCanvas(true);
  }, []);

  // Handle mouse leave events
  const handleMouseLeave = useCallback(() => {
    setMouseInCanvas(false);
    setLeftButtonPressed(false);
  }, []);

  // Handle touch events for mobile support
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (!canvasRef.current || gameState !== GameState.PLAYING) return;

      // Get canvas bounds
      const rect = canvasRef.current.getBoundingClientRect();

      // Use the first touch point
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      setMousePosition({ x, y });
      setLeftButtonPressed(true);
      setMouseInCanvas(true);

      // Prevent scrolling
      event.preventDefault();
    },
    [canvasRef, gameState]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!canvasRef.current || gameState !== GameState.PLAYING) return;

      // Get canvas bounds
      const rect = canvasRef.current.getBoundingClientRect();

      // Use the first touch point
      const touch = event.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      setMousePosition({ x, y });

      // Prevent scrolling
      event.preventDefault();
    },
    [canvasRef, gameState]
  );

  const handleTouchEnd = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    setLeftButtonPressed(false);
  }, [gameState]);

  // Add and remove event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse events
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Touch events
    canvas.addEventListener("touchstart", handleTouchStart as EventListener);
    canvas.addEventListener("touchmove", handleTouchMove as EventListener);
    canvas.addEventListener("touchend", handleTouchEnd as EventListener);

    // Cleanup
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);

      canvas.removeEventListener(
        "touchstart",
        handleTouchStart as EventListener
      );
      canvas.removeEventListener("touchmove", handleTouchMove as EventListener);
      canvas.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, [
    canvasRef,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Reset controls when game state changes
  useEffect(() => {
    if (gameState !== GameState.PLAYING) {
      setLeftButtonPressed(false);
    }
  }, [gameState]);

  return {
    mousePosition,
    leftButtonPressed,
    mouseInCanvas,
  };
};
