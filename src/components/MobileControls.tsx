// src/components/MobileControls.tsx

import React, { useState, useRef, useEffect } from "react";
import { Vector } from "../utils/vector";

interface MobileControlsProps {
  onDirectionChange: (direction: Vector) => void;
  onBoostChange: (boosting: boolean) => void;
  isVisible: boolean;
}

const MobileControls: React.FC<MobileControlsProps> = ({
  onDirectionChange,
  onBoostChange,
  isVisible,
}) => {
  // State for joystick position
  const [joystickPos, setJoystickPos] = useState<Vector>({ x: 0, y: 0 });
  const [isTouchingJoystick, setIsTouchingJoystick] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  // Refs for touch tracking
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickBaseRef = useRef<HTMLDivElement>(null);
  const joystickTouchId = useRef<number | null>(null);
  const boostTouchId = useRef<number | null>(null);

  // Joystick constants - make it smaller
  const JOYSTICK_MAX_DISTANCE = 40;

  // Prevent page scrolling when using controls
  useEffect(() => {
    const preventDefault = (e: TouchEvent) => {
      // Check if touch is in our control areas before preventing default
      if (joystickTouchId.current !== null || boostTouchId.current !== null) {
        e.preventDefault();
      }
    };

    // Add event listeners to prevent scrolling
    document.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventDefault);
    };
  }, []);

  // Handle joystick movement
  const updateJoystickPosition = (clientX: number, clientY: number) => {
    if (!joystickBaseRef.current) return;

    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;

    // Calculate distance from center
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Limit the joystick movement to max distance
    if (distance > JOYSTICK_MAX_DISTANCE) {
      const ratio = JOYSTICK_MAX_DISTANCE / distance;
      dx *= ratio;
      dy *= ratio;
    }

    setJoystickPos({ x: dx, y: dy });

    // Calculate normalized direction vector
    const direction = {
      x: distance > 0 ? dx / Math.max(distance, 5) : 0,
      y: distance > 0 ? dy / Math.max(distance, 5) : 0,
    };

    // Send direction update
    onDirectionChange(direction);
  };

  // Handle joystick touch start
  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    // Only handle if not already tracking a touch
    if (joystickTouchId.current === null) {
      const touch = e.touches[0];
      joystickTouchId.current = touch.identifier;
      setIsTouchingJoystick(true);
      updateJoystickPosition(touch.clientX, touch.clientY);

      // Prevent default behavior
      e.preventDefault();
    }
  };

  // Handle joystick touch move
  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    if (joystickTouchId.current !== null) {
      // Find the touch we're tracking
      for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        if (touch.identifier === joystickTouchId.current) {
          updateJoystickPosition(touch.clientX, touch.clientY);
          e.preventDefault();
          break;
        }
      }
    }
  };

  // Handle joystick touch end
  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    // Check if our touch is ending
    let touchFound = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchId.current) {
        touchFound = true;
        break;
      }
    }

    if (touchFound) {
      // Reset joystick
      joystickTouchId.current = null;
      setJoystickPos({ x: 0, y: 0 });
      setIsTouchingJoystick(false);
      onDirectionChange({ x: 0, y: 0 });
      e.preventDefault();
    }
  };

  // Handle boost button press - ensure it consistently calls onBoostChange(true)
  const handleBoostTouchStart = (e: React.TouchEvent) => {
    if (boostTouchId.current === null) {
      boostTouchId.current = e.touches[0].identifier;
      setIsBoosting(true);
      onBoostChange(true); // Start boosting
      e.preventDefault();
    }
  };

  // Handle boost button release - ALWAYS stop boosting on release
  const handleBoostTouchEnd = (e: React.TouchEvent) => {
    // Check if our touch is ending
    let touchFound = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === boostTouchId.current) {
        touchFound = true;
        break;
      }
    }

    if (touchFound) {
      boostTouchId.current = null;
      setIsBoosting(false);
      onBoostChange(false); // Stop boosting
      e.preventDefault();
    }
  };

  // Add touchcancel to handle cases where the touch is interrupted
  const handleBoostTouchCancel = (e: React.TouchEvent) => {
    if (boostTouchId.current !== null) {
      boostTouchId.current = null;
      setIsBoosting(false);
      onBoostChange(false); // Stop boosting
      e.preventDefault();
    }
  };

  // Also monitor document touches to ensure we catch all touch ends
  // This handles cases where touches may not end directly on our elements
  useEffect(() => {
    const handleDocumentTouchEnd = (e: TouchEvent) => {
      // Check for boost touch ending
      if (boostTouchId.current !== null) {
        let boostTouchFound = false;

        // Look through remaining touches to see if our boost touch is still active
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === boostTouchId.current) {
            boostTouchFound = true;
            break;
          }
        }

        // If boost touch is no longer in the active touches, consider it ended
        if (!boostTouchFound) {
          boostTouchId.current = null;
          setIsBoosting(false);
          onBoostChange(false); // Stop boosting
        }
      }
    };

    document.addEventListener("touchend", handleDocumentTouchEnd);

    return () => {
      document.removeEventListener("touchend", handleDocumentTouchEnd);
    };
  }, [onBoostChange]);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "120px",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      {/* Joystick Base - moved closer to corner and smaller */}
      <div
        ref={joystickBaseRef}
        style={{
          position: "absolute",
          left: "20px", // Closer to left edge
          bottom: "20px", // Closer to bottom edge
          width: "60px", // Smaller size
          height: "60px", // Smaller size
          borderRadius: "50%",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "2px solid rgba(255, 255, 255, 0.3)",
          pointerEvents: "auto",
        }}
        onTouchStart={handleJoystickTouchStart}
        onTouchMove={handleJoystickTouchMove}
        onTouchEnd={handleJoystickTouchEnd}
        onTouchCancel={handleJoystickTouchEnd}
      >
        {/* Joystick Knob - smaller */}
        <div
          ref={joystickRef}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "30px", // Smaller size
            height: "30px", // Smaller size
            borderRadius: "50%",
            backgroundColor: isTouchingJoystick
              ? "rgba(0, 200, 0, 0.7)"
              : "rgba(0, 150, 0, 0.5)",
            border: "2px solid rgba(255, 255, 255, 0.5)",
            transform: `translate(calc(-50% + ${joystickPos.x}px), calc(-50% + ${joystickPos.y}px))`,
            transition: isTouchingJoystick ? "none" : "transform 0.2s ease-out",
          }}
        />
      </div>

      {/* Lightning Boost Button - moved closer to corner and smaller */}
      <div
        style={{
          position: "absolute",
          right: "20px", // Closer to right edge
          bottom: "20px", // Closer to bottom edge
          width: "60px", // Smaller size
          height: "60px", // Smaller size
          borderRadius: "50%",
          backgroundColor: isBoosting
            ? "rgba(255, 150, 0, 0.7)"
            : "rgba(200, 100, 0, 0.5)",
          border: "2px solid rgba(255, 255, 255, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          pointerEvents: "auto",
          boxShadow: isBoosting ? "0 0 15px rgba(255, 150, 0, 0.8)" : "none",
          transition: "background-color 0.1s, box-shadow 0.1s",
        }}
        onTouchStart={handleBoostTouchStart}
        onTouchEnd={handleBoostTouchEnd}
        onTouchCancel={handleBoostTouchCancel}
      >
        {/* Lightning SVG Icon */}
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 2L4.09 12.2C3.74 12.61 3.56 12.81 3.56 13.04C3.56 13.27 3.66 13.49 3.83 13.62C4 13.76 4.3 13.76 4.9 13.76H11V22L19.91 11.8C20.26 11.39 20.44 11.19 20.44 10.96C20.44 10.73 20.34 10.51 20.17 10.38C20 10.24 19.7 10.24 19.1 10.24H13V2Z"
            fill="white"
            stroke="white"
            strokeWidth="1"
          />
        </svg>
      </div>
    </div>
  );
};

export default MobileControls;
