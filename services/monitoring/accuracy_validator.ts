

import { db } from '@/db';
import { predictions, raceResults, predictionAccuracy } from '@/db/schema/monitoring';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export class AccuracyValidator {
  
  /**
   * Validate all predictions for a given race once results are available
   */
  static async validatePrediction(raceId: string): Promise<void> {
    try {
      // Get all predictions for this race
      const racePredictions = await db
        .select()
        .from(predictions)
        .where(eq(predictions.raceId, raceId));
      
      if (racePredictions.length === 0) {
        console.log(`No predictions found for race ${raceId}`);
        return;
      }
      
      // Get actual result
      const [result] = await db
        .select()
        .from(raceResults)
        .where(eq(raceResults.raceId, raceId));
      
      if (!result) {
        console.log(`No result found for race ${raceId}`);
        return;
      }
      
      // Validate each prediction
      for (const prediction of racePredictions) {
        await this.calculateAccuracy(prediction, result);
      }
      
    } catch (error) {
      console.error(`Failed to validate predictions for race ${raceId}:`, error);
      // Still log the error so we can alert on validation failures
      await PredictionLogger.logError({
        errorType: 'accuracy_validation_failure',
        errorMessage: (error as Error).message,
        stackTrace: (error as Error).stack,
        severity: 'high',
        raceId,
        metadata: { raceId },
      });
    }
  }
  
  /**
   * Calculate accuracy metrics for a single prediction
   */
  private static async calculateAccuracy(
    prediction: any,
    result: any
  ): Promise<void> {
    const predictedRankings = prediction.predictedRankings as Array<{ horse: string; rank: number; score: number }>;
    const actualRankings = result.actualRankings as Array<{ horse: string; position: number; odds: number }>;
    
    // Build rank maps
    const predictedRanks = new Map(predictedRankings.map(p => [p.horse, p.rank]));
    const actualRanks = new Map(actualRankings.map(a => [a.horse, a.position]));
    
    // Find common horses (in case of scratches or incomplete data)
    const commonHorses = predictedRankings
      .map(p => p.horse)
      .filter(h => actualRanks.has(h));
    
    if (commonHorses.length === 0) {
      // Edge case – nothing to compare
      return;
    }
    
    // 1. Top pick correctness
    const topPickCorrect = prediction.topPick === result.winner;
    const topPickPosition = actualRanks.get(prediction.topPick) ?? null;
    
    // 2. Top 3 accuracy
    const predictedTop3 = predictedRankings.slice(0, 3).map(r => r.horse);
    const top3Accuracy = predictedTop3.includes(result.winner);
    
    // 3. Rank correlation (Spearman)
    const rankCorrelation = this.calculateSpearmanCorrelation(commonHorses, predictedRanks, actualRanks);
    
    // 4. Confidence calibration error
    const confidenceError = topPickCorrect
      ? Math.abs(prediction.topPickConfidence - 1.0)
      : Math.abs(prediction.topPickConfidence - 0.0);
    
    // 5. Hypothetical betting outcome
    let bettingOutcome: 'win' | 'loss' | 'no_bet' = 'no_bet';
    let profitLoss = 0;
    
    if (prediction.bettingSignal && prediction.bettingSignal !== 'avoid') {
      const stake = 10; // fixed hypothetical stake
      if (topPickCorrect) {
        const winnerOdds = actualRankings.find(r => r.horse === prediction.topPick)?.odds ?? 1;
        profitLoss = stake * (winnerOdds - 1);
        bettingOutcome = 'win';
      } else {
        profitLoss = -stake;
        bettingOutcome = 'loss';
      }
    }
    
    // Store accuracy record
    await db.insert(predictionAccuracy).values({
      id: uuidv4(),
      predictionId: prediction.id,
      raceResultId: result.id,
      
      topPickCorrect,
      topPickPosition,
      top3Accuracy,
      rankCorrelation,
      confidenceError,
      
      bettingOutcome,
      profitLoss,
    });
  }
  
  /**
   * Spearman rank correlation coefficient (simple version assuming no ties)
   */
  private static calculateSpearmanCorrelation(
    horses: string[],
    predictedRanks: Map<string, number>,
    actualRanks: Map<string, number>
  ): number {
    const n = horses.length;
    
    if (n < 2) return 0;
    
    let sumDSquared = 0;
    
    for (const horse of horses) {
      const pr = predictedRanks.get(horse)!;
      const ar = actualRanks.get(horse)!;
      const d = pr - ar;
      sumDSquared += d * d;
    }
    
    const rho = 1 - (6 * sumDSquared) / (n * (n * n - 1));
    
    // Clamp to [-1, 1] in case of floating-point weirdness
    return Math.max(-1, Math.min(1, rho));
  }
}

// Re-export for convenience if needed elsewhere
export default AccuracyValidator;