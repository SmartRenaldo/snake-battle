// src/components/ControlsInfo.tsx

import React, { useEffect, useRef } from "react";
import { GameState } from "../utils/constants";

interface ControlsInfoProps {
  onClose: () => void;
  gameState?: GameState;
  onResume?: () => void;
}

// Side-effect decision logic is separated for testing
export const shouldResumeGame = (state?: GameState): boolean =>
  state === GameState.PAUSED;

const ControlsInfo: React.FC<ControlsInfoProps> = ({
  onClose,
  gameState,
  onResume,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    onClose();

    // If resume function is provided and game is paused, resume game
    if (onResume && shouldResumeGame(gameState)) {
      onResume();
    }
  };

  // Set up click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        handleClose();
      }
    };

    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClose]);

  return (
    <div
      data-testid="modal-overlay"
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
        zIndex: 999,
      }}
    >
      <div
        ref={modalRef}
        data-testid="modal-content"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.9)",
          padding: "1rem",
          borderRadius: "10px",
          boxShadow: "0 0 20px rgba(0, 0, 0, 0.5)",
          color: "white",
          maxWidth: "600px",
          width: "80%",
          maxHeight: "80vh",
          overflow: "auto",
          zIndex: 1000,
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "1.4rem",
            marginBottom: "0.8rem",
            color: "#88FF88",
          }}
        >
          Game Controls & Rules
        </h2>

        {/* Left and right columns */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
          {/* Left column */}
          <div style={{ flex: "1 1 280px" }}>
            {/* Movement Controls */}
            <div style={{ marginBottom: "0.8rem" }}>
              <h3
                style={{
                  color: "#FFAA00",
                  marginBottom: "0.3rem",
                  fontSize: "1.1rem",
                }}
              >
                Movement Controls
              </h3>
              <ul
                style={{
                  paddingLeft: "15px",
                  lineHeight: "1.3",
                  fontSize: "0.9rem",
                  margin: "0.3rem 0",
                }}
              >
                <li>
                  <strong>Mouse Movement:</strong> Snake follows cursor
                </li>
                <li>
                  <strong>Left Mouse Button:</strong> Hold to boost (2x speed)
                </li>
              </ul>
            </div>

            <div style={{ marginBottom: "0.8rem" }}>
              <h3
                style={{
                  color: "#FFAA00",
                  marginBottom: "0.3rem",
                  fontSize: "1.1rem",
                }}
              >
                Boost Mechanics
              </h3>
              <ul
                style={{
                  paddingLeft: "15px",
                  lineHeight: "1.3",
                  fontSize: "0.9rem",
                  margin: "0.3rem 0",
                }}
              >
                <li>
                  <strong>Cost:</strong> -1 length segment/second
                </li>
                <li>
                  <strong>Minimum Length:</strong> Need 2+ segments
                </li>
                <li>
                  <strong>Effect:</strong> Glows brighter while boosting
                </li>
              </ul>
            </div>

            {/* Dynamic Width */}
            <div style={{ marginBottom: "0.8rem" }}>
              <h3
                style={{
                  color: "#FFAA00",
                  marginBottom: "0.3rem",
                  fontSize: "1.1rem",
                }}
              >
                Dynamic Width
              </h3>
              <ul
                style={{
                  paddingLeft: "15px",
                  lineHeight: "1.3",
                  fontSize: "0.9rem",
                  margin: "0.3rem 0",
                }}
              >
                <li>
                  <strong>Base:</strong> 4px when length ≤ 10
                </li>
                <li>
                  <strong>Growth:</strong> +2px per 20 segments (max 20px)
                </li>
              </ul>
            </div>
          </div>

          {/* Right column */}
          <div style={{ flex: "1 1 280px" }}>
            {/* Scoring */}
            <div style={{ marginBottom: "0.8rem" }}>
              <h3
                style={{
                  color: "#FFAA00",
                  marginBottom: "0.3rem",
                  fontSize: "1.1rem",
                }}
              >
                Scoring
              </h3>
              <ul
                style={{
                  paddingLeft: "15px",
                  lineHeight: "1.3",
                  fontSize: "0.9rem",
                  margin: "0.3rem 0",
                }}
              >
                <li>
                  <strong>Regular Food:</strong> +10 points, +1 length
                </li>
                <li>
                  <strong>Kill AI Snake:</strong> +200 points + food drops
                </li>
                <li>
                  <strong>Power-up:</strong> Pink food grants 5s invincible
                  boost
                </li>
              </ul>
            </div>

            {/* Game Rules */}
            <div style={{ marginBottom: "0.8rem" }}>
              <h3
                style={{
                  color: "#FFAA00",
                  marginBottom: "0.3rem",
                  fontSize: "1.1rem",
                }}
              >
                Game Rules
              </h3>
              <ul
                style={{
                  paddingLeft: "15px",
                  lineHeight: "1.3",
                  fontSize: "0.9rem",
                  margin: "0.3rem 0",
                }}
              >
                <li>
                  <strong>Death:</strong> Hitting walls or AI snake eats you
                </li>
                <li>
                  <strong>AI Behavior:</strong> Chase if larger, flee if smaller
                </li>
                <li>
                  <strong>Collisions:</strong> Your head hits AI body → you die
                </li>
                <li>
                  <strong>AI head hits your body → AI dies</strong>
                </li>
              </ul>
            </div>

            {/* Keyboard Shortcuts */}
            <div style={{ marginBottom: "0.8rem" }}>
              <h3
                style={{
                  color: "#FFAA00",
                  marginBottom: "0.3rem",
                  fontSize: "1.1rem",
                }}
              >
                Keyboard Shortcuts
              </h3>
              <ul
                style={{
                  paddingLeft: "15px",
                  lineHeight: "1.3",
                  fontSize: "0.9rem",
                  margin: "0.3rem 0",
                }}
              >
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
          </div>
        </div>

        {/* Close button */}
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <button
            data-testid="close-button"
            onClick={handleClose}
            style={{
              backgroundColor: "#00AA00",
              color: "white",
              border: "none",
              padding: "0.6rem 1.2rem",
              fontSize: "0.9rem",
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
    </div>
  );
};

export default ControlsInfo;
