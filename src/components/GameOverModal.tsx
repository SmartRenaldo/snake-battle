// src/components/GameOverModal.tsx

import React from "react";

interface GameOverModalProps {
  score: number;
  highScore: number;
  onRestart: () => void;
  onClose: () => void;
}

const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  highScore,
  onRestart,
  onClose,
}) => {
  return (
    <div
      // 直接在背景层添加点击处理
      onClick={onClose}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          padding: "2rem",
          borderRadius: "10px",
          boxShadow: "0 0 20px rgba(255, 0, 0, 0.5)",
          color: "white",
          textAlign: "center",
          minWidth: "300px",
        }}
      >
        <h2
          style={{ color: "#FF0000", fontSize: "2rem", marginBottom: "1rem" }}
        >
          GAME OVER
        </h2>

        <div style={{ margin: "1.5rem 0" }}>
          <p style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Score: <span style={{ color: "#FFFF00" }}>{score}</span>
          </p>
          <p style={{ fontSize: "1.5rem" }}>
            High Score: <span style={{ color: "#FFFF00" }}>{highScore}</span>
          </p>
        </div>

        <div style={{ margin: "1.5rem 0" }}>
          {score === highScore && score > 0 && (
            <p style={{ color: "#00FF00", fontSize: "1.2rem" }}>
              New High Score!
            </p>
          )}
        </div>

        <button
          onClick={onRestart}
          style={{
            backgroundColor: "#00AA00",
            color: "white",
            border: "none",
            padding: "0.8rem 1.5rem",
            fontSize: "1.2rem",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "background-color 0.2s",
            marginTop: "1rem",
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = "#00CC00";
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = "#00AA00";
          }}
        >
          Play Again
        </button>

        <div
          style={{ marginTop: "1.5rem", fontSize: "0.9rem", color: "#888888" }}
        >
          <p>Press ESC or click outside to close</p>
        </div>
      </div>
    </div>
  );
};

export default GameOverModal;
