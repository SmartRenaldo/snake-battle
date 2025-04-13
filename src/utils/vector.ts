// src/utils/vector.ts

/**
 * Vector type for 2D coordinates and directions
 */
export interface Vector {
  x: number;
  y: number;
}

/**
 * Create a new vector
 */
export const createVector = (x: number, y: number): Vector => ({ x, y });

/**
 * Calculate the magnitude (length) of a vector
 */
export const magnitude = (v: Vector): number =>
  Math.sqrt(v.x * v.x + v.y * v.y);

/**
 * Normalize a vector to unit length
 */
export const normalize = (v: Vector): Vector => {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return { x: v.x / mag, y: v.y / mag };
};

/**
 * Scale a vector by a scalar value
 */
export const scale = (v: Vector, scalar: number): Vector => ({
  x: v.x * scalar,
  y: v.y * scalar,
});

/**
 * Add two vectors
 */
export const add = (v1: Vector, v2: Vector): Vector => ({
  x: v1.x + v2.x,
  y: v1.y + v2.y,
});

/**
 * Subtract second vector from first vector
 */
export const subtract = (v1: Vector, v2: Vector): Vector => ({
  x: v1.x - v2.x,
  y: v1.y - v2.y,
});

/**
 * Calculate the distance between two vectors
 */
export const distance = (v1: Vector, v2: Vector): number => {
  const dx = v2.x - v1.x;
  const dy = v2.y - v1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Calculate the dot product of two vectors
 */
export const dot = (v1: Vector, v2: Vector): number =>
  v1.x * v2.x + v1.y * v2.y;

/**
 * Calculate the angle between two vectors in radians
 */
export const angleBetween = (v1: Vector, v2: Vector): number => {
  const dot1 = dot(normalize(v1), normalize(v2));
  // Clamp to avoid floating point errors
  const clampedDot = Math.max(-1, Math.min(1, dot1));
  return Math.acos(clampedDot);
};

/**
 * Calculate the angle of a vector in radians
 */
export const angle = (v: Vector): number => Math.atan2(v.y, v.x);

/**
 * Limit the maximum angle between two directions
 * Returns a new direction with the angle limited
 */
export const limitAngle = (
  currentDir: Vector,
  targetDir: Vector,
  maxAngle: number
): Vector => {
  const currentAngle = angle(currentDir);
  const targetAngle = angle(targetDir);

  // Calculate the angle difference
  let angleDiff = targetAngle - currentAngle;

  // Normalize to [-PI, PI]
  while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
  while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

  // Limit the angle change
  const limitedAngleDiff = Math.max(-maxAngle, Math.min(maxAngle, angleDiff));
  const newAngle = currentAngle + limitedAngleDiff;

  // Create new direction vector
  return {
    x: Math.cos(newAngle),
    y: Math.sin(newAngle),
  };
};

/**
 * Rotate a vector by an angle in radians
 */
export const rotate = (v: Vector, angle: number): Vector => {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: v.x * cos - v.y * sin,
    y: v.x * sin + v.y * cos,
  };
};

/**
 * Create a vector from an angle
 */
export const fromAngle = (angle: number): Vector => ({
  x: Math.cos(angle),
  y: Math.sin(angle),
});

/**
 * Check if a point is within a certain distance of a line segment
 * Used for accurate collision detection
 */
export const pointToLineDistance = (
  point: Vector,
  lineStart: Vector,
  lineEnd: Vector
): number => {
  const L2 = Math.pow(distance(lineStart, lineEnd), 2);
  if (L2 === 0) return distance(point, lineStart);

  // Projection proportion along the line
  let t =
    ((point.x - lineStart.x) * (lineEnd.x - lineStart.x) +
      (point.y - lineStart.y) * (lineEnd.y - lineStart.y)) /
    L2;

  // Clamp to segment
  t = Math.max(0, Math.min(1, t));

  // Compute projection
  const projection: Vector = {
    x: lineStart.x + t * (lineEnd.x - lineStart.x),
    y: lineStart.y + t * (lineEnd.y - lineStart.y),
  };

  // Return distance
  return distance(point, projection);
};
