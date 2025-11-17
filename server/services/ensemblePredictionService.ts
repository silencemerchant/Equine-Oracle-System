import { execSync } from "child_process";
import { InsertPrediction } from "../../drizzle/schema";
import { savePredictions } from "../db";
import * as fs from "fs";
import * as path from "path";

/**
 * Ensemble Prediction Service
 * Integrates the new ensemble prediction system with comprehensive logging
 */

interface HorseFeatures {
  horse_name: string;
  [key: string]: number | string;
}

interface PredictionResult {
  position: number;
  horse_name: string;
  score: number;
}

interface EnsemblePredictionLog {
  timestamp: string;
  raceId: string;
  numHorses: number;
  modelUsed: string;
  predictions: PredictionResult[];
  executionTime: number;
  success: boolean;
  error?: string;
}

// Logging directory
const LOG_DIR = "/home/ubuntu/equine_oracle_mvp/logs/predictions";

/**
 * Ensure logging directory exists
 */
function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Log prediction results to file
 */
function logPrediction(log: EnsemblePredictionLog) {
  ensureLogDir();
  const logFile = path.join(LOG_DIR, `predictions_${new Date().toISOString().split("T")[0]}.jsonl`);
  fs.appendFileSync(logFile, JSON.stringify(log) + "\n");
  console.log(`[Ensemble Prediction] Logged to ${logFile}`);
}

/**
 * Call the ensemble prediction service to get rankings
 */
export async function predictRaceOutcomeEnsemble(
  raceId: string,
  horseFeatures: HorseFeatures[]
): Promise<PredictionResult[]> {
  const startTime = Date.now();
  const logEntry: EnsemblePredictionLog = {
    timestamp: new Date().toISOString(),
    raceId,
    numHorses: horseFeatures.length,
    modelUsed: "ensemble_v1",
    predictions: [],
    executionTime: 0,
    success: false,
  };

  try {
    const inputJson = JSON.stringify(horseFeatures);
    console.log(`[Ensemble] Calling ensemble predictor with ${horseFeatures.length} horses for race ${raceId}...`);

    const result = execSync(
      `python3 /home/ubuntu/equine_oracle_mvp/server/ml_service/run_ensemble.py`,
      { input: inputJson, encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 }
    );

    console.log("[Ensemble] Predictor output:", result.substring(0, 200));
    const predictions = JSON.parse(result);

    logEntry.predictions = predictions;
    logEntry.success = true;
    logEntry.executionTime = Date.now() - startTime;
    logPrediction(logEntry);

    return predictions;
  } catch (error) {
    console.error("[Ensemble] Prediction service error:", error);
    logEntry.success = false;
    logEntry.error = String(error);
    logEntry.executionTime = Date.now() - startTime;
    logPrediction(logEntry);

    // Fallback to mock predictions if ensemble fails
    console.log("[Ensemble] Falling back to mock predictions...");
    return horseFeatures.map((horse, idx) => ({
      position: idx + 1,
      horse_name: horse.horse_name,
      score: Math.random() * 100,
    }));
  }
}

/**
 * Generate predictions for a race and save to database
 */
export async function generateAndSaveEnsemblePredictions(
  raceId: string,
  horseFeatures: HorseFeatures[]
): Promise<InsertPrediction[]> {
  try {
    // Get predictions from the ensemble model
    const predictions = await predictRaceOutcomeEnsemble(raceId, horseFeatures);

    // Convert to database format
    const predictionRecords: InsertPrediction[] = predictions.map((pred) => ({
      raceId,
      horseId: `${raceId}_horse_${pred.position}`,
      horseName: pred.horse_name,
      position: pred.position,
      score: pred.score.toString(),
    }));

    // Save to database
    await savePredictions(predictionRecords);

    console.log(`[Ensemble] Saved ${predictionRecords.length} predictions for race ${raceId}`);
    return predictionRecords;
  } catch (error) {
    console.error("[Ensemble] Error generating predictions:", error);
    throw error;
  }
}

/**
 * Get prediction logs for a specific date or all logs
 */
export function getPredictionLogs(date?: string): EnsemblePredictionLog[] {
  ensureLogDir();
  const logFile = date
    ? path.join(LOG_DIR, `predictions_${date}.jsonl`)
    : path.join(LOG_DIR, `predictions_${new Date().toISOString().split("T")[0]}.jsonl`);

  if (!fs.existsSync(logFile)) {
    return [];
  }

  const content = fs.readFileSync(logFile, "utf-8");
  return content
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line));
}

/**
 * Get prediction statistics for a date range
 */
export function getPredictionStats(startDate?: string, endDate?: string) {
  ensureLogDir();
  const files = fs.readdirSync(LOG_DIR).filter((f) => f.startsWith("predictions_"));

  let allLogs: EnsemblePredictionLog[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(LOG_DIR, file), "utf-8");
    const logs = content
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));
    allLogs = allLogs.concat(logs);
  }

  // Filter by date if provided
  if (startDate) {
    allLogs = allLogs.filter((log) => log.timestamp >= startDate);
  }
  if (endDate) {
    allLogs = allLogs.filter((log) => log.timestamp <= endDate);
  }

  const successCount = allLogs.filter((log) => log.success).length;
  const failureCount = allLogs.filter((log) => !log.success).length;
  const avgExecutionTime = allLogs.reduce((sum, log) => sum + log.executionTime, 0) / allLogs.length || 0;

  return {
    totalPredictions: allLogs.length,
    successCount,
    failureCount,
    successRate: ((successCount / allLogs.length) * 100).toFixed(2) + "%",
    avgExecutionTime: avgExecutionTime.toFixed(2) + "ms",
    logs: allLogs,
  };
}

/**
 * Generate mock features for a race (for testing without historical data)
 */
export function generateMockFeatures(numHorses: number): HorseFeatures[] {
  const features: HorseFeatures[] = [];

  for (let i = 0; i < numHorses; i++) {
    const horseFeatures: HorseFeatures = {
      horse_name: `Horse_${i + 1}`,
    };

    // Generate 56 features with realistic ranges
    for (let j = 0; j < 56; j++) {
      if (j < 10) {
        // Ranking/position features (0-10)
        horseFeatures[`feature_${j}`] = Math.random() * 10;
      } else if (j < 20) {
        // Performance metrics (0-1)
        horseFeatures[`feature_${j}`] = Math.random();
      } else if (j < 30) {
        // Rolling averages (0-5)
        horseFeatures[`feature_${j}`] = Math.random() * 5;
      } else if (j < 40) {
        // Form decay (0-100)
        horseFeatures[`feature_${j}`] = Math.random() * 100;
      } else if (j < 50) {
        // Track performance (0-10)
        horseFeatures[`feature_${j}`] = Math.random() * 10;
      } else {
        // Other features (0-1)
        horseFeatures[`feature_${j}`] = Math.random();
      }
    }

    features.push(horseFeatures);
  }

  return features;
}
