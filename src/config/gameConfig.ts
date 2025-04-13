// src/config/gameConfig.ts

/**
 * Game configuration parameters
 * These values control the game mechanics and can be adjusted for balancing
 */
export const gameConfig = {
  // Canvas dimensions
  canvas: {
    width: 1200,
    height: 800,
  },

  // Player snake settings
  playerSnake: {
    initialLength: 15,
    baseSpeed: 100, // pixels per second
    boostSpeed: 200, // pixels per second when boosting
    boostCostPerSecond: 1, // length segments lost per second when boosting
    minLengthForBoost: 2, // minimum length required to boost
    maxTurnAngle: Math.PI / 20, // maximum turn angle per frame (for smooth turning)
    baseWidth: 4, // base width in pixels
    widthGrowthInterval: 20, // add width every X length segments
    widthIncrement: 2, // pixels to add to width at each interval
    maxWidth: 20, // maximum width in pixels
    selfCollisionImmunityTime: 0.3, // seconds of transparency after self collision
    headImmunitySegments: 5, // number of segments behind head immune to collision
  },

  // AI snake settings
  aiSnake: {
    initialCount: 3,
    initialLength: 10,
    baseSpeed: 90, // slightly slower than player
    boostSpeed: 180,
    chaseBoostProbability: 0.5, // probability to boost when chasing player
    fleeBoostProbability: 0.3, // probability to boost when fleeing from player
    minLengthBeforeBoost: 5, // AI won't boost if length is below this
    newAIInterval: 50, // add new AI every X player length increase
    lengthRatio: 0.8, // new AI length = player length * this ratio
  },

  // Food settings
  food: {
    regularValue: 1, // length segments added
    regularPoints: 10, // score points
    initialCount: 20, // number of regular food items at start
    minFoodCount: 15, // minimum food count to maintain
    aiDropRatio: 0.5, // percentage of AI length dropped as food when killed
  },

  // Special power-up
  invincibleBoost: {
    duration: 5, // seconds
    chance: 0.05, // chance of spawning this instead of regular food
  },

  // Visual effects
  effects: {
    boostParticleRate: 10, // particles per second
    tailFlashFrequency: 2, // flashes per second when boosting
  },
};

// Skin configurations
export const skins = {
  default: {
    id: "default",
    name: "Default",
    description: "Green gradient with deeper edges when width increases",
    headColor: "#00AA00",
    bodyColor: "#008800",
    bodyGradient: true,
    boostColor: "#00FF00",
  },
  mechanical: {
    id: "mechanical",
    name: "Mechanical Scales",
    description:
      "Metallic texture with additional mechanical joints at greater widths",
    headColor: "#AAAAAA",
    bodyColor: "#888888",
    bodyGradient: false,
    boostColor: "#DDDDDD",
  },
  biological: {
    id: "biological",
    name: "Biological Ripple",
    description:
      "Semi-transparent material with muscle contraction effects during width changes",
    headColor: "rgba(170, 70, 200, 0.8)",
    bodyColor: "rgba(140, 50, 170, 0.6)",
    bodyGradient: true,
    boostColor: "rgba(200, 100, 230, 0.9)",
  },
};

export type SkinType = keyof typeof skins;
