/**
 * Prediction Service
 * Handles horse race predictions using simplified feature engineering
 * Based on the original Python backend but adapted for web deployment
 */

interface RaceInput {
  horseName: string;
  track: string;
  raceType: string;
  distance: number;
  raceDate: string;
  daysSinceLastRace?: number;
  winningStreak?: number;
  losingStreak?: number;
  details?: string;
  stakes?: string;
}

interface PredictionResult {
  horseName: string;
  lightgbmProbability: number;
  xgboostProbability?: number;
  randomForestProbability?: number;
  ensembleProbability: number;
  confidence: string;
}

/**
 * Extract race class score from race details and stakes
 */
function extractRaceClass(details: string = "", stakes: string = ""): number {
  const detailsStakes = (details + " " + stakes).toLowerCase();

  if (
    detailsStakes.includes("group 1") ||
    detailsStakes.includes("grp 1") ||
    detailsStakes.includes("g1")
  ) {
    return 5;
  }
  if (
    detailsStakes.includes("group 2") ||
    detailsStakes.includes("grp 2") ||
    detailsStakes.includes("g2")
  ) {
    return 4;
  }
  if (
    detailsStakes.includes("group 3") ||
    detailsStakes.includes("grp 3") ||
    detailsStakes.includes("g3")
  ) {
    return 3;
  }
  if (detailsStakes.includes("listed")) {
    return 2;
  }

  const keywords = ["cup", "classic", "guineas", "stakes", "trophy"];
  if (keywords.some((keyword) => detailsStakes.includes(keyword))) {
    return 1;
  }

  return 0;
}

/**
 * Calculate ensemble prediction from multiple model probabilities
 */
function calculateEnsemble(probabilities: number[]): number {
  if (probabilities.length === 0) return 0;
  const sum = probabilities.reduce((a, b) => a + b, 0);
  return sum / probabilities.length;
}

/**
 * Determine confidence level based on probability
 */
function getConfidence(probability: number): string {
  if (probability >= 0.7) return "Very High";
  if (probability >= 0.6) return "High";
  if (probability >= 0.5) return "Medium";
  if (probability >= 0.4) return "Low";
  return "Very Low";
}

/**
 * Simplified prediction algorithm
 * In production, this would use trained ML models
 * For now, uses heuristic-based scoring
 */
export function makePrediction(input: RaceInput, tier: string): PredictionResult {
  // Extract features
  const raceClass = extractRaceClass(input.details, input.stakes);
  const daysSince = input.daysSinceLastRace ?? 14;
  const winStreak = input.winningStreak ?? 0;
  const loseStreak = input.losingStreak ?? 0;

  // Base probability calculation (simplified heuristic)
  let baseProb = 0.3; // Base 30% chance

  // Race class bonus (higher class = better horses)
  baseProb += raceClass * 0.05;

  // Winning streak bonus
  baseProb += Math.min(winStreak * 0.08, 0.25);

  // Losing streak penalty
  baseProb -= Math.min(loseStreak * 0.05, 0.15);

  // Days since last race (optimal is 7-21 days)
  if (daysSince >= 7 && daysSince <= 21) {
    baseProb += 0.1;
  } else if (daysSince < 7) {
    baseProb -= 0.05; // Too soon
  } else if (daysSince > 30) {
    baseProb -= 0.1; // Too long
  }

  // Distance factor (shorter races favor form)
  if (input.distance < 1400) {
    baseProb += winStreak * 0.02;
  }

  // Clamp probability between 0.1 and 0.9
  baseProb = Math.max(0.1, Math.min(0.9, baseProb));

  // Add slight variance for different "models"
  const lightgbmProb = Math.max(0.05, Math.min(0.95, baseProb + (Math.random() - 0.5) * 0.05));

  let xgboostProb: number | undefined;
  let randomForestProb: number | undefined;
  const probabilities = [lightgbmProb];

  // Premium tiers get ensemble predictions
  if (tier === "premium" || tier === "elite") {
    xgboostProb = Math.max(0.05, Math.min(0.95, baseProb + (Math.random() - 0.5) * 0.06));
    randomForestProb = Math.max(0.05, Math.min(0.95, baseProb + (Math.random() - 0.5) * 0.04));
    probabilities.push(xgboostProb, randomForestProb);
  }

  const ensembleProb = calculateEnsemble(probabilities);
  const confidence = getConfidence(ensembleProb);

  return {
    horseName: input.horseName,
    lightgbmProbability: Math.round(lightgbmProb * 10000), // Store as 0-10000
    xgboostProbability: xgboostProb ? Math.round(xgboostProb * 10000) : undefined,
    randomForestProbability: randomForestProb ? Math.round(randomForestProb * 10000) : undefined,
    ensembleProbability: Math.round(ensembleProb * 10000),
    confidence,
  };
}

/**
 * Validate prediction input
 */
export function validatePredictionInput(input: any): string | null {
  if (!input.horseName || typeof input.horseName !== "string") {
    return "Horse name is required";
  }
  if (!input.track || typeof input.track !== "string") {
    return "Track is required";
  }
  if (!input.raceType || typeof input.raceType !== "string") {
    return "Race type is required";
  }
  if (!input.distance || typeof input.distance !== "number" || input.distance <= 0) {
    return "Valid distance is required";
  }
  if (!input.raceDate || typeof input.raceDate !== "string") {
    return "Race date is required";
  }
  return null;
}
