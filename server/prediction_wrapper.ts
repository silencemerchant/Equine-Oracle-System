/**
 * TypeScript wrapper for the Python LightGBM prediction engine
 * Communicates with the Python backend via subprocess and JSON
 */

import { execSync, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

interface Horse {
  horse_name: string;
  distance: number;
  days_since_last_race: number;
  PREV_RACE_WON: number;
  WIN_STREAK: number;
  IMPLIED_PROBABILITY: number;
  NORMALIZED_VOLUME: number;
  MARKET_ACTIVITY_WINDOW_HOURS: number;
}

interface PredictionResult {
  success?: boolean;
  error?: string;
  predictions: Array<{
    horse_name: string;
    ranking_score: number;
    rank: number;
    confidence?: number;
  }>;
  model_version?: string;
  feature_count?: number;
}

interface BettingSignal {
  horse_name: string;
  rank: number;
  confidence: number;
  signal: string;
  recommendation: string;
  confidence_level: string;
  expected_roi: string;
}

interface BettingSignalsResult {
  success?: boolean;
  error?: string;
  signals: BettingSignal[];
  overall_recommendation: string;
  confidence_threshold: number;
  top_horse?: string;
  top_confidence: number;
  race_difficulty: string;
}

class PredictionWrapper {
  private pythonScript: string;
  private pythonPath: string;

  constructor() {
    this.pythonScript = path.join(__dirname, 'prediction_engine.py');
    this.pythonPath = 'python3';
  }

  /**
   * Call the Python prediction engine with horse data
   */
  async predictRanking(horses: Horse[]): Promise<PredictionResult> {
    try {
      // Create a temporary file for input
      const tempDir = os.tmpdir();
      const inputFile = path.join(tempDir, `prediction_input_${Date.now()}.json`);
      const outputFile = path.join(tempDir, `prediction_output_${Date.now()}.json`);

      // Write input data
      fs.writeFileSync(inputFile, JSON.stringify({
        action: 'predict',
        horses: horses
      }));

      // Execute Python script
      const command = `${this.pythonPath} -c "
import json
import sys
sys.path.insert(0, '${__dirname}')
from prediction_engine import predict_ranking

with open('${inputFile}', 'r') as f:
    data = json.load(f)

result = predict_ranking(data['horses'])

with open('${outputFile}', 'w') as f:
    json.dump(result, f)
"`;

      execSync(command, { stdio: 'pipe' });

      // Read output
      const result = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

      // Cleanup
      fs.unlinkSync(inputFile);
      fs.unlinkSync(outputFile);

      return result;
    } catch (error) {
      console.error('Prediction wrapper error:', error);
      return {
        error: `Prediction failed: ${error instanceof Error ? error.message : String(error)}`,
        predictions: []
      };
    }
  }

  /**
   * Get betting signals based on predictions
   */
  async getBettingSignals(predictions: PredictionResult, confidenceThreshold: number = 0.65): Promise<BettingSignalsResult> {
    try {
      const tempDir = os.tmpdir();
      const inputFile = path.join(tempDir, `signals_input_${Date.now()}.json`);
      const outputFile = path.join(tempDir, `signals_output_${Date.now()}.json`);

      // Write input data
      fs.writeFileSync(inputFile, JSON.stringify({
        action: 'signals',
        predictions: predictions,
        confidence_threshold: confidenceThreshold
      }));

      // Execute Python script
      const command = `${this.pythonPath} -c "
import json
import sys
sys.path.insert(0, '${__dirname}')
from prediction_engine import get_betting_signals

with open('${inputFile}', 'r') as f:
    data = json.load(f)

result = get_betting_signals(data['predictions'], data['confidence_threshold'])

with open('${outputFile}', 'w') as f:
    json.dump(result, f)
"`;

      execSync(command, { stdio: 'pipe' });

      // Read output
      const result = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));

      // Cleanup
      fs.unlinkSync(inputFile);
      fs.unlinkSync(outputFile);

      return result;
    } catch (error) {
      console.error('Betting signals wrapper error:', error);
      return {
        error: `Betting signals failed: ${error instanceof Error ? error.message : String(error)}`,
        signals: [],
        overall_recommendation: 'HOLD',
        confidence_threshold: confidenceThreshold,
        top_confidence: 0,
        race_difficulty: 'UNKNOWN'
      };
    }
  }
}

// Global instance
let wrapper: PredictionWrapper | null = null;

export function getPredictionWrapper(): PredictionWrapper {
  if (!wrapper) {
    wrapper = new PredictionWrapper();
  }
  return wrapper;
}

export async function predictRanking(horses: Horse[]): Promise<PredictionResult> {
  const w = getPredictionWrapper();
  return w.predictRanking(horses);
}

export async function getBettingSignals(predictions: PredictionResult, confidenceThreshold: number = 0.65): Promise<BettingSignalsResult> {
  const w = getPredictionWrapper();
  return w.getBettingSignals(predictions, confidenceThreshold);
}
