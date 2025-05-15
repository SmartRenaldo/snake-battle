import { render, screen, fireEvent } from "@testing-library/react";
import ControlsInfo, { shouldResumeGame } from "./ControlsInfo";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import userEvent from "@testing-library/user-event";
import { GameState } from "../utils/constants";

describe("ControlsInfo Component", () => {
  it("renders title and close button", () => {
    render(<ControlsInfo onClose={vi.fn()} />);
    expect(screen.getByText("Game Controls & Rules")).toBeInTheDocument();
    expect(screen.getByTestId("close-button")).toBeInTheDocument();
  });

  it("calls onClose when 'Got it!' button is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<ControlsInfo onClose={onClose} />);

    await user.click(screen.getByTestId("close-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onResume if game is paused when 'Got it!' is clicked", async () => {
    const onClose = vi.fn();
    const onResume = vi.fn();
    const user = userEvent.setup();

    render(
      <ControlsInfo
        onClose={onClose}
        onResume={onResume}
        gameState={GameState.PAUSED}
      />
    );

    await user.click(screen.getByTestId("close-button"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("does NOT call onResume if game is running", async () => {
    const onClose = vi.fn();
    const onResume = vi.fn();
    const user = userEvent.setup();

    render(
      <ControlsInfo
        onClose={onClose}
        onResume={onResume}
        gameState={GameState.PLAYING}
      />
    );

    await user.click(screen.getByTestId("close-button"));
    expect(onClose).toHaveBeenCalled();
    expect(onResume).not.toHaveBeenCalled();
  });

  it("closes the modal when clicking outside the content box", () => {
    const onClose = vi.fn();

    render(<ControlsInfo onClose={onClose} />);
    fireEvent.mouseDown(screen.getByTestId("modal-overlay"));

    expect(onClose).toHaveBeenCalled();
  });
});

describe("shouldResumeGame", () => {
  it("returns true when game is paused", () => {
    expect(shouldResumeGame(GameState.PAUSED)).toBe(true);
  });

  it("returns false when game is running", () => {
    expect(shouldResumeGame(GameState.PLAYING)).toBe(false);
  });

  it("returns false when game state is undefined", () => {
    expect(shouldResumeGame(undefined)).toBe(false);
  });
});
