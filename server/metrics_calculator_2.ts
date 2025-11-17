/**
 * Accuracy Metrics Calculator
 * Calculates comprehensive performance metrics for predictions
 */

import { Prediction, RaceResult } from "@/drizzle/schema";

export interface PredictionMatch {
  predictionId: number;
  raceId: string;
  prediction: {
    horse1st: string;
    horse2nd: string;
    horse3rd: string;
    horse4th: string;
    confidence1st: number;
    confidence2nd: number;
    confidence3rd: number;
    confidence4th: number;
  };
  result: {
    winner: string;
    second: string;
    third: string;
    fourth: string;
    winningOdds: number;
    secondOdds: number;
    thirdOdds: number;
    fourthOdds: number;
  };
}

export interface AccuracyMetrics {
  totalPredictions: number;
  top1Accuracy: number;
  top3HitRate: number;
  top4HitRate: number;
  roi: number;
  totalStaked: number;
  totalReturns: number;
  calibrationScore: number;
  marketBeatRate: number;
  ndcg4: number;
  averageConfidence: number;
  winPlaceShowAccuracy: {
    winRate: number;
    placeRate: number;
    showRate: number;
  };
}

export class MetricsCalculator {
  /**
   * Normalize horse name for matching
   */
  private static normalizeHorseName(name: string): string {
    return name.trim().toUpperCase();
  }

  /**
   * Calculate if prediction matches result
   */
  static calculateMatch(match: PredictionMatch): {
    top1Hit: boolean;
    top2Hit: boolean;
    top3Hit: boolean;
    top4Hit: boolean;
    exactaHit: boolean;
    trifectaHit: boolean;
    winHit: boolean;
    placeHit: boolean;
    showHit: boolean;
  } {
    const pred = {
      first: this.normalizeHorseName(match.prediction.horse1st),
      second: this.normalizeHorseName(match.prediction.horse2nd),
      third: this.normalizeHorseName(match.prediction.horse3rd),
      fourth: this.normalizeHorseName(match.prediction.horse4th),
    };

    const result = {
      first: this.normalizeHorseName(match.result.winner),
      second: this.normalizeHorseName(match.result.second),
      third: this.normalizeHorseName(match.result.third),
      fourth: this.normalizeHorseName(match.result.fourth),
    };

    const resultHorses = [result.first, result.second, result.third, result.fourth];

    return {
      top1Hit: pred.first === result.first,
      top2Hit: pred.first === result.first && pred.second === result.second,
      top3Hit:
        pred.first === result.first &&
        pred.second === result.second &&
        pred.third === result.third,
      top4Hit:
        pred.first === result.first &&
        pred.second === result.second &&
        pred.third === result.third &&
        pred.fourth === result.fourth,
      exactaHit: pred.first === result.first && pred.second === result.second,
      trifectaHit:
        pred.first === result.first &&
        pred.second === result.second &&
        pred.third === result.third,
      winHit: pred.first === result.first,
      placeHit: resultHorses.includes(pred.first),
      showHit: resultHorses.includes(pred.first),
    };
  }

  /**
   * Calculate ROI for a single prediction
   */
  static calculatePredictionROI(
    match: PredictionMatch,
    stakePerPrediction: number = 10
  ): {
    staked: number;
    returns: number;
    roi: number;
  } {
    const matchResult = this.calculateMatch(match);
    const odds = match.result.winningOdds;

    let returns = 0;

    if (matchResult.winHit) {
      // Win bet returns stake * odds
      returns = stakePerPrediction * odds;
    } else if (matchResult.placeHit) {
      // Place bet returns approximately stake * (odds - 1) / 4
      returns = stakePerPrediction * ((odds - 1) / 4 + 1);
    } else if (matchResult.showHit) {
      // Show bet returns approximately stake * (odds - 1) / 8
      returns = stakePerPrediction * ((odds - 1) / 8 + 1);
    }

    return {
      staked: stakePerPrediction,
      returns: returns,
      roi: (returns - stakePerPrediction) / stakePerPrediction,
    };
  }

  /**
   * Calculate NDCG@4 (Normalized Discounted Cumulative Gain)
   * Measures ranking quality
   */
  static calculateNDCG4(matches: PredictionMatch[]): number {
    if (matches.length === 0) return 0;

    let totalNDCG = 0;

    for (const match of matches) {
      const predArray = [
        this.normalizeHorseName(match.prediction.horse1st),
        this.normalizeHorseName(match.prediction.horse2nd),
        this.normalizeHorseName(match.prediction.horse3rd),
        this.normalizeHorseName(match.prediction.horse4th),
      ];

      const resultArray = [
        this.normalizeHorseName(match.result.winner),
        this.normalizeHorseName(match.result.second),
        this.normalizeHorseName(match.result.third),
        this.normalizeHorseName(match.result.fourth),
      ];

      // Calculate DCG
      let dcg = 0;
      for (let i = 0; i < predArray.length; i++) {
        if (resultArray.includes(predArray[i])) {
          const resultPosition = resultArray.indexOf(predArray[i]);
          // Discount by position: log2(position + 2)
          dcg += (4 - resultPosition) / Math.log2(i + 2);
        }
      }

      // Calculate ideal DCG (perfect ranking)
      const idealDCG = 4 / Math.log2(2) + 3 / Math.log2(3) + 2 / Math.log2(4) + 1 / Math.log2(5);

      // NDCG = DCG / Ideal DCG
      const ndcg = dcg / idealDCG;
      totalNDCG += ndcg;
    }

    return totalNDCG / matches.length;
  }

  /**
   * Calculate calibration score
   * Measures if predicted confidence matches actual accuracy
   */
  static calculateCalibrationScore(matches: PredictionMatch[]): number {
    if (matches.length === 0) return 0;

    let totalError = 0;

    for (const match of matches) {
      const matchResult = this.calculateMatch(match);
      const avgConfidence =
        (match.prediction.confidence1st +
          match.prediction.confidence2nd +
          match.prediction.confidence3rd +
          match.prediction.confidence4th) /
        4;

      // Actual accuracy (1 if any hit, 0 otherwise)
      const actualAccuracy = matchResult.top1Hit ? 1 : 0;

      // Error between predicted confidence and actual accuracy
      totalError += Math.abs(avgConfidence - actualAccuracy);
    }

    // Return score from 0-1, where 1 is perfect calibration
    return 1 - totalError / matches.length;
  }

  /**
   * Calculate market beat rate
   * Percentage of predictions where model pick has better odds than favorite
   */
  static calculateMarketBeatRate(matches: PredictionMatch[]): number {
    if (matches.length === 0) return 0;

    let beatCount = 0;

    for (const match of matches) {
      const odds = match.result.winningOdds;
      const avgConfidence =
        (match.prediction.confidence1st +
          match.prediction.confidence2nd +
          match.prediction.confidence3rd +
          match.prediction.confidence4th) /
        4;

      // Implied probability from odds
      const impliedProb = 1 / odds;

      // If our confidence > implied probability, we beat the market
      if (avgConfidence > impliedProb) {
        beatCount++;
      }
    }

    return beatCount / matches.length;
  }

  /**
   * Calculate comprehensive metrics
   */
  static calculateMetrics(
    matches: PredictionMatch[],
    stakePerPrediction: number = 10
  ): AccuracyMetrics {
    if (matches.length === 0) {
      return {
        totalPredictions: 0,
        top1Accuracy: 0,
        top3HitRate: 0,
        top4HitRate: 0,
        roi: 0,
        totalStaked: 0,
        totalReturns: 0,
        calibrationScore: 0,
        marketBeatRate: 0,
        ndcg4: 0,
        averageConfidence: 0,
        winPlaceShowAccuracy: {
          winRate: 0,
          placeRate: 0,
          showRate: 0,
        },
      };
    }

    let top1Count = 0;
    let top3Count = 0;
    let top4Count = 0;
    let winCount = 0;
    let placeCount = 0;
    let showCount = 0;
    let totalStaked = 0;
    let totalReturns = 0;
    let totalConfidence = 0;

    for (const match of matches) {
      const matchResult = this.calculateMatch(match);
      const roi = this.calculatePredictionROI(match, stakePerPrediction);

      if (matchResult.top1Hit) top1Count++;
      if (matchResult.top3Hit) top3Count++;
      if (matchResult.top4Hit) top4Count++;
      if (matchResult.winHit) winCount++;
      if (matchResult.placeHit) placeCount++;
      if (matchResult.showHit) showCount++;

      totalStaked += roi.staked;
      totalReturns += roi.returns;

      totalConfidence +=
        (match.prediction.confidence1st +
          match.prediction.confidence2nd +
          match.prediction.confidence3rd +
          match.prediction.confidence4th) /
        4;
    }

    const totalROI = (totalReturns - totalStaked) / totalStaked;

    return {
      totalPredictions: matches.length,
      top1Accuracy: top1Count / matches.length,
      top3HitRate: top3Count / matches.length,
      top4HitRate: top4Count / matches.length,
      roi: totalROI,
      totalStaked: totalStaked,
      totalReturns: totalReturns,
      calibrationScore: this.calculateCalibrationScore(matches),
      marketBeatRate: this.calculateMarketBeatRate(matches),
      ndcg4: this.calculateNDCG4(matches),
      averageConfidence: totalConfidence / matches.length,
      winPlaceShowAccuracy: {
        winRate: winCount / matches.length,
        placeRate: placeCount / matches.length,
        showRate: showCount / matches.length,
      },
    };
  }
}
