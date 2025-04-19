// src/components/ScoreBoard.tsx

import React, { useState, useEffect } from "react";
import { Snake } from "../models/Snake";
import { gameConfig } from "../config/gameConfig";

interface ScoreBoardProps {
  playerSnake: Snake | null;
  score: number;
  highScore: number;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({
  playerSnake,
  score,
  highScore,
}) => {
  // State to track if screen is large enough to show scoreboard
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1200);

  // Effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1200);
    };

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Clean up
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // If screen is not large enough, don't render anything
  if (!isLargeScreen) {
    return null;
  }

  // Calculate boost percentage
  const getBoostPercentage = () => {
    if (!playerSnake) return 0;

    const length = playerSnake.segments.length;
    const minLength = gameConfig.playerSnake.minLengthForBoost;

    if (length <= minLength) return 0;

    // Simple linear scale for now
    return Math.min(100, ((length - minLength) / 20) * 100);
  };

  // Get boost status text
  const getBoostStatusText = () => {
    if (!playerSnake) return "Not available";

    const length = playerSnake.segments.length;
    const minLength = gameConfig.playerSnake.minLengthForBoost;

    if (length <= minLength) {
      return "Not enough length";
    }

    if (playerSnake.boosting) {
      return playerSnake.invincibleBoost ? "INVINCIBLE BOOST!" : "BOOSTING";
    }

    return "Ready (Hold LMB)";
  };

  // Get color for boost status
  const getBoostStatusColor = () => {
    if (!playerSnake) return "#888888";

    const length = playerSnake.segments.length;
    const minLength = gameConfig.playerSnake.minLengthForBoost;

    if (length <= minLength) {
      return "#FF0000";
    }

    if (playerSnake.boosting) {
      return playerSnake.invincibleBoost ? "#FF00FF" : "#FFAA00";
    }

    return "#00AA00";
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        padding: "10px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        fontFamily: "Arial, sans-serif",
        borderRadius: "0 0 10px 0",
        zIndex: 100,
      }}
    >
      {/* Score Display */}
      <div style={{ marginBottom: "15px" }}>
        <h2 style={{ margin: "0 0 5px 0", fontSize: "1.2rem" }}>Score</h2>
        <div
          style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#FFFF00" }}
        >
          {score}
        </div>
        <div style={{ fontSize: "0.8rem", color: "#AAAAAA" }}>
          High Score: {highScore}
        </div>
      </div>

      {/* Snake Length */}
      {playerSnake && (
        <div style={{ marginBottom: "15px" }}>
          <h2 style={{ margin: "0 0 5px 0", fontSize: "1.2rem" }}>Length</h2>
          <div style={{ fontSize: "1.3rem", fontWeight: "bold" }}>
            {playerSnake.segments.length}
          </div>

          {/* Length Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#333333",
              marginTop: "5px",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(playerSnake.segments.length, 100)}%`,
                height: "100%",
                backgroundColor: "#00AA00",
              }}
            />
          </div>
        </div>
      )}

      {/* Boost Status */}
      {playerSnake && (
        <div>
          <h2 style={{ margin: "0 0 5px 0", fontSize: "1.2rem" }}>Boost</h2>
          <div
            style={{
              fontSize: "1rem",
              fontWeight: "bold",
              color: getBoostStatusColor(),
            }}
          >
            {getBoostStatusText()}
          </div>

          {/* Boost Progress Bar */}
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#333333",
              marginTop: "5px",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${getBoostPercentage()}%`,
                height: "100%",
                backgroundColor: getBoostStatusColor(),
                transition: "width 0.3s ease-out",
              }}
            />
          </div>

          {/* Warning for low length */}
          {playerSnake.boosting &&
            !playerSnake.invincibleBoost &&
            playerSnake.segments.length <= 5 && (
              <div
                style={{
                  color: "#FF0000",
                  fontSize: "0.9rem",
                  marginTop: "5px",
                  fontWeight: "bold",
                  animation: "blink 1s infinite",
                }}
              >
                LOW LENGTH WARNING!
              </div>
            )}

          {/* Invincible boost timer */}
          {playerSnake.invincibleBoost && (
            <div
              style={{
                color: "#FF00FF",
                fontSize: "0.9rem",
                marginTop: "5px",
              }}
            >
              Time: {playerSnake.boostTimeLeft.toFixed(1)}s
            </div>
          )}
        </div>
      )}

      {/* Keyframe animation for blinking effect */}
      <style>
        {`
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default ScoreBoard;
