/**
 * Metrics Calculator & Performance Monitoring Service
 * Tracks model performance, calibration, and betting ROI
 */

export interface PredictionMetrics {
  timestamp: Date;
  race_id: string;
  model_name: string;
  top1_accuracy: boolean;
  top3_hit: boolean;
  top4_hit: boolean;
  confidence_score: number;
  actual_winner: string;
  predicted_winner: string;
  calibration_error: number;
  roi_if_bet: number;
}

export interface ModelPerformance {
  model_name: string;
  total_predictions: number;
  top1_accuracy_rate: number;
  top3_hit_rate: number;
  top4_hit_rate: number;
  average_confidence: number;
  calibration_score: number;
  total_roi: number;
  average_roi_per_bet: number;
  sharpe_ratio: number;
  win_rate: number;
}

export interface EnsembleMetrics {
  ensemble_top1_accuracy: number;
  ensemble_top3_hit_rate: number;
  ensemble_top4_hit_rate: number;
  model_agreement_avg: number;
  confidence_calibration: number;
  total_ensemble_roi: number;
  predictions_count: number;
  high_confidence_accuracy: number;
  low_confidence_accuracy: number;
}

/**
 * Metrics Calculator for tracking model and ensemble performance
 */
export class MetricsCalculator {
  private predictions: PredictionMetrics[] = [];
  private modelMetrics: Map<string, PredictionMetrics[]> = new Map();

  /**
   * Record a prediction result after race outcome is known
   */
  recordPrediction(metrics: PredictionMetrics): void {
    this.predictions.push(metrics);

    if (!this.modelMetrics.has(metrics.model_name)) {
      this.modelMetrics.set(metrics.model_name, []);
    }
    this.modelMetrics.get(metrics.model_name)!.push(metrics);
  }

  /**
   * Calculate performance metrics for a specific model
   */
  getModelPerformance(modelName: string): ModelPerformance {
    const modelPreds = this.modelMetrics.get(modelName) || [];

    if (modelPreds.length === 0) {
      return {
        model_name: modelName,
        total_predictions: 0,
        top1_accuracy_rate: 0,
        top3_hit_rate: 0,
        top4_hit_rate: 0,
        average_confidence: 0,
        calibration_score: 0,
        total_roi: 0,
        average_roi_per_bet: 0,
        sharpe_ratio: 0,
        win_rate: 0,
      };
    }

    const top1Hits = modelPreds.filter((p) => p.top1_accuracy).length;
    const top3Hits = modelPreds.filter((p) => p.top3_hit).length;
    const top4Hits = modelPreds.filter((p) => p.top4_hit).length;
    const totalROI = modelPreds.reduce((sum, p) => sum + p.roi_if_bet, 0);
    const avgConfidence =
      modelPreds.reduce((sum, p) => sum + p.confidence_score, 0) /
      modelPreds.length;
    const calibrationError =
      modelPreds.reduce((sum, p) => sum + Math.abs(p.calibration_error), 0) /
      modelPreds.length;

    // Calculate Sharpe ratio (ROI volatility-adjusted)
    const roiValues = modelPreds.map((p) => p.roi_if_bet);
    const roiMean = roiValues.reduce((a, b) => a + b) / roiValues.length;
    const roiStdDev = Math.sqrt(
      roiValues.reduce((sum, val) => sum + Math.pow(val - roiMean, 2), 0) /
        roiValues.length
    );
    const sharpeRatio = roiStdDev > 0 ? roiMean / roiStdDev : 0;

    return {
      model_name: modelName,
      total_predictions: modelPreds.length,
      top1_accuracy_rate: top1Hits / modelPreds.length,
      top3_hit_rate: top3Hits / modelPreds.length,
      top4_hit_rate: top4Hits / modelPreds.length,
      average_confidence: avgConfidence,
      calibration_score: 1 - calibrationError,
      total_roi: totalROI,
      average_roi_per_bet: totalROI / modelPreds.length,
      sharpe_ratio: sharpeRatio,
      win_rate: top1Hits / modelPreds.length,
    };
  }

  /**
   * Calculate ensemble performance metrics
   */
  getEnsembleMetrics(): EnsembleMetrics {
    if (this.predictions.length === 0) {
      return {
        ensemble_top1_accuracy: 0,
        ensemble_top3_hit_rate: 0,
        ensemble_top4_hit_rate: 0,
        model_agreement_avg: 0,
        confidence_calibration: 0,
        total_ensemble_roi: 0,
        predictions_count: 0,
        high_confidence_accuracy: 0,
        low_confidence_accuracy: 0,
      };
    }

    const top1Hits = this.predictions.filter((p) => p.top1_accuracy).length;
    const top3Hits = this.predictions.filter((p) => p.top3_hit).length;
    const top4Hits = this.predictions.filter((p) => p.top4_hit).length;
    const totalROI = this.predictions.reduce((sum, p) => sum + p.roi_if_bet, 0);
    const avgConfidence =
      this.predictions.reduce((sum, p) => sum + p.confidence_score, 0) /
      this.predictions.length;

    // Calibration: compare confidence to actual accuracy
    const calibrationError =
      this.predictions.reduce((sum, p) => sum + Math.abs(p.calibration_error), 0) /
      this.predictions.length;

    // Split by confidence level
    const highConfidence = this.predictions.filter((p) => p.confidence_score >= 0.7);
    const lowConfidence = this.predictions.filter((p) => p.confidence_score < 0.7);

    const highConfidenceAccuracy =
      highConfidence.length > 0
        ? highConfidence.filter((p) => p.top1_accuracy).length /
          highConfidence.length
        : 0;

    const lowConfidenceAccuracy =
      lowConfidence.length > 0
        ? lowConfidence.filter((p) => p.top1_accuracy).length /
          lowConfidence.length
        : 0;

    return {
      ensemble_top1_accuracy: top1Hits / this.predictions.length,
      ensemble_top3_hit_rate: top3Hits / this.predictions.length,
      ensemble_top4_hit_rate: top4Hits / this.predictions.length,
      model_agreement_avg: avgConfidence,
      confidence_calibration: 1 - calibrationError,
      total_ensemble_roi: totalROI,
      predictions_count: this.predictions.length,
      high_confidence_accuracy: highConfidenceAccuracy,
      low_confidence_accuracy: lowConfidenceAccuracy,
    };
  }

  /**
   * Get performance comparison across all models
   */
  getAllModelPerformance(): ModelPerformance[] {
    const models = Array.from(this.modelMetrics.keys());
    return models.map((model) => this.getModelPerformance(model));
  }

  /**
   * Calculate optimal model weights based on performance
   */
  calculateOptimalWeights(): Record<string, number> {
    const performances = this.getAllModelPerformance();

    if (performances.length === 0) {
      return {};
    }

    // Weight by Sharpe ratio (risk-adjusted returns)
    const totalSharpe = performances.reduce((sum, p) => sum + p.sharpe_ratio, 0);

    const weights: Record<string, number> = {};
    performances.forEach((p) => {
      weights[p.model_name] = totalSharpe > 0 ? p.sharpe_ratio / totalSharpe : 1 / performances.length;
    });

    return weights;
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const ensembleMetrics = this.getEnsembleMetrics();
    const allModels = this.getAllModelPerformance();

    let report = `
=== EQUINE ORACLE PERFORMANCE REPORT ===
Generated: ${new Date().toISOString()}

ENSEMBLE PERFORMANCE:
- Top-1 Accuracy: ${(ensembleMetrics.ensemble_top1_accuracy * 100).toFixed(2)}%
- Top-3 Hit Rate: ${(ensembleMetrics.ensemble_top3_hit_rate * 100).toFixed(2)}%
- Top-4 Hit Rate: ${(ensembleMetrics.ensemble_top4_hit_rate * 100).toFixed(2)}%
- Total ROI: ${ensembleMetrics.total_ensemble_roi.toFixed(2)}%
- Confidence Calibration: ${(ensembleMetrics.confidence_calibration * 100).toFixed(2)}%
- Predictions Analyzed: ${ensembleMetrics.predictions_count}

CONFIDENCE-BASED ACCURACY:
- High Confidence (≥70%): ${(ensembleMetrics.high_confidence_accuracy * 100).toFixed(2)}%
- Low Confidence (<70%): ${(ensembleMetrics.low_confidence_accuracy * 100).toFixed(2)}%

INDIVIDUAL MODEL PERFORMANCE:
`;

    allModels.forEach((model) => {
      report += `
${model.model_name}:
  - Top-1 Accuracy: ${(model.top1_accuracy_rate * 100).toFixed(2)}%
  - Average ROI: ${model.average_roi_per_bet.toFixed(2)}%
  - Sharpe Ratio: ${model.sharpe_ratio.toFixed(3)}
  - Predictions: ${model.total_predictions}
`;
    });

    return report;
  }
}

export const metricsCalculator = new MetricsCalculator();
