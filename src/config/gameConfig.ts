// src/config/gameConfig.ts

/**
 * Game configuration parameters
 * These values control the game mechanics and can be adjusted for balancing
 */
export const gameConfig = {
  // Canvas dimensions
  canvas: {
    width: 800,
    height: 500,
  },

  // Player snake settings
  playerSnake: {
    initialLength: 15,
    baseSpeed: 200, // pixels per second
    boostSpeed: 400, // pixels per second when boosting
    boostCostPerSecond: 1, // length segments lost per second when boosting
    minLengthForBoost: 2, // minimum length required to boost
    maxTurnAngle: Math.PI / 20, // maximum turn angle per frame (for smooth turning)
    baseWidth: 25, // base width in pixels
    widthGrowthInterval: 4, // add width every X length segments
    widthIncrement: 1, // pixels to add to width at each interval
    maxWidth: 60, // maximum width in pixels
    selfCollisionImmunityTime: 0.3, // seconds of transparency after self collision
    headImmunitySegments: 5, // number of segments behind head immune to collision
  },

  // AI snake settings
  aiSnake: {
    initialCount: 3,
    initialLength: 10,
    baseSpeed: 160, // slightly slower than player
    boostSpeed: 320,
    chaseBoostProbability: 0.5,
    fleeBoostProbability: 0.3,
    minLengthBeforeBoost: 5,
    newAIInterval: 50,
    lengthRatio: 0.8, // Start at 80% of player length
    minRespawnDelay: 1000, // ms to wait before spawning a new snake
    maxRespawnDelay: 3000, // maximum delay
    respawnDistance: 300, // minimum distance from player when spawning
  },

  // Food settings
  food: {
    regularValue: 1, // length segments added
    regularPoints: 10, // score points
    initialCount: 100, // number of regular food items at start
    minFoodCount: 100, // minimum food count to maintain
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
    headColor: "rgba(200, 151, 215, 0.9)",
    bodyColor: "rgba(180, 64, 218, 0.9)",
    bodyGradient: true,
    boostColor: "rgba(199, 86, 234, 0.95)",
  },
};

export type SkinType = keyof typeof skins;
