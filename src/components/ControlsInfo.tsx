// src/components/ControlsInfo.tsx

import React from "react";

interface ControlsInfoProps {
  onClose: () => void;
}

const ControlsInfo: React.FC<ControlsInfoProps> = ({ onClose }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        padding: "2rem",
        borderRadius: "10px",
        boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
        color: "white",
        zIndex: 1000,
        maxWidth: "600px",
        width: "80%",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontSize: "1.8rem",
          marginBottom: "1.5rem",
          color: "#88FF88",
        }}
      >
        Game Controls & Rules
      </h2>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ color: "#FFAA00", marginBottom: "0.5rem" }}>
          Movement Controls
        </h3>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>
            <strong>Mouse Movement:</strong> The snake head follows your cursor
            direction.
          </li>
          <li>
            <strong>Left Mouse Button:</strong> Hold to activate boost mode (2x
            speed).
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ color: "#FFAA00", marginBottom: "0.5rem" }}>
          Boost Mechanics
        </h3>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>
            <strong>Cost:</strong> Boosting consumes 1 length segment per
            second.
          </li>
          <li>
            <strong>Minimum Length:</strong> You need at least 2 segments to
            boost.
          </li>
          <li>
            <strong>Visual Feedback:</strong> Snake glows brighter with particle
            effects while boosting.
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ color: "#FFAA00", marginBottom: "0.5rem" }}>
          Dynamic Width
        </h3>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>
            <strong>Base Width:</strong> 4 pixels when length ≤ 10.
          </li>
          <li>
            <strong>Growth:</strong> +2 pixels for every 20 length segments
            (max: 20 pixels).
          </li>
          <li>
            <strong>Boosting:</strong> Width remains constant while boosting.
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ color: "#FFAA00", marginBottom: "0.5rem" }}>Scoring</h3>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>
            <strong>Regular Food:</strong> +10 points, +1 length segment.
          </li>
          <li>
            <strong>Kill AI Snake:</strong> +200 points + food drops (50% of AI
            length).
          </li>
          <li>
            <strong>Power-up:</strong> Pink glowing food grants 5 seconds of
            invincible boost (boost without length cost).
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ color: "#FFAA00", marginBottom: "0.5rem" }}>Game Rules</h3>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>
            <strong>Death Conditions:</strong> Hitting walls or being eaten by
            an AI snake.
          </li>
          <li>
            <strong>Self-Collisions:</strong> Your snake can pass through itself
            (becomes transparent).
          </li>
          <li>
            <strong>AI Behavior:</strong> AI snakes will chase you if they're
            larger, flee if they're smaller.
          </li>
          <li>
            <strong>Difficulty:</strong> AI snakes get longer as you grow.
          </li>
        </ul>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ color: "#FFAA00", marginBottom: "0.5rem" }}>
          Keyboard Shortcuts
        </h3>
        <ul style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
          <li>
            <strong>P:</strong> Pause game
          </li>
          <li>
            <strong>Esc:</strong> Close dialogs / Return to menu
          </li>
          <li>
            <strong>R:</strong> Restart game
          </li>
        </ul>
      </div>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button
          onClick={onClose}
          style={{
            backgroundColor: "#00AA00",
            color: "white",
            border: "none",
            padding: "0.8rem 1.5rem",
            fontSize: "1rem",
            borderRadius: "5px",
            cursor: "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = "#00CC00";
          }}
          onMouseOut={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = "#00AA00";
          }}
        >
          Got it!
        </button>
      </div>
    </div>
  );
};

export default ControlsInfo;
