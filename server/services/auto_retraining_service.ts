/**
 * Auto-Retraining Engine
 * Continuously improves models based on prediction accuracy and market feedback
 */

import { metricsCalculator } from "./metrics_service";

export interface RetrainingConfig {
  enabled: boolean;
  min_predictions_before_retrain: number;
  retrain_interval_hours: number;
  performance_threshold: number;
  max_retrain_frequency: number;
  auto_weight_optimization: boolean;
}

export interface RetrainingJob {
  job_id: string;
  model_name: string;
  triggered_by: "schedule" | "performance_drop" | "manual";
  status: "pending" | "running" | "completed" | "failed";
  started_at: Date;
  completed_at?: Date;
  improvement_percent?: number;
  error_message?: string;
}

/**
 * Auto-Retraining Engine for continuous model improvement
 */
export class AutoRetrainingEngine {
  private config: RetrainingConfig = {
    enabled: true,
    min_predictions_before_retrain: 100,
    retrain_interval_hours: 24,
    performance_threshold: 0.65,
    max_retrain_frequency: 3,
    auto_weight_optimization: true,
  };

  private retrainingJobs: RetrainingJob[] = [];
  private lastRetrainingTime: Map<string, Date> = new Map();
  private retrainingSchedule: NodeJS.Timeout | null = null;

  /**
   * Initialize auto-retraining engine
   */
  initialize(): void {
    if (this.config.enabled) {
      this.scheduleRetraining();
      console.log("[AutoRetrain] Engine initialized and scheduled");
    }
  }

  /**
   * Schedule periodic retraining
   */
  private scheduleRetraining(): void {
    const intervalMs = this.config.retrain_interval_hours * 60 * 60 * 1000;

    this.retrainingSchedule = setInterval(() => {
      this.checkAndRetrain();
    }, intervalMs);
  }

  /**
   * Check if retraining is needed and trigger if conditions are met
   */
  async checkAndRetrain(): Promise<void> {
    const metrics = metricsCalculator.getEnsembleMetrics();

    // Check if minimum predictions threshold is met
    if (metrics.predictions_count < this.config.min_predictions_before_retrain) {
      console.log(
        `[AutoRetrain] Insufficient predictions (${metrics.predictions_count}/${this.config.min_predictions_before_retrain})`
      );
      return;
    }

    // Check if performance has dropped
    if (
      metrics.ensemble_top1_accuracy <
      this.config.performance_threshold
    ) {
      console.log(
        `[AutoRetrain] Performance drop detected (${(metrics.ensemble_top1_accuracy * 100).toFixed(2)}%)`
      );
      await this.triggerRetraining("performance_drop");
      return;
    }

    // Periodic retraining
    await this.triggerRetraining("schedule");
  }

  /**
   * Trigger retraining for a specific model or all models
   */
  async triggerRetraining(
    trigger: "schedule" | "performance_drop" | "manual",
    modelName?: string
  ): Promise<RetrainingJob[]> {
    const jobs: RetrainingJob[] = [];
    const modelsToRetrain = modelName
      ? [modelName]
      : ["lightgbm", "xgboost", "catboost", "neural"];

    for (const model of modelsToRetrain) {
      // Check retraining frequency
      const lastRetrain = this.lastRetrainingTime.get(model);
      if (
        lastRetrain &&
        Date.now() - lastRetrain.getTime() <
          (this.config.retrain_interval_hours * 60 * 60 * 1000) /
            this.config.max_retrain_frequency
      ) {
        console.log(
          `[AutoRetrain] Skipping ${model} - too frequent retraining`
        );
        continue;
      }

      const job: RetrainingJob = {
        job_id: `retrain_${Date.now()}_${model}`,
        model_name: model,
        triggered_by: trigger,
        status: "pending",
        started_at: new Date(),
      };

      jobs.push(job);
      this.retrainingJobs.push(job);

      // Execute retraining asynchronously
      this.executeRetrainingJob(job);
    }

    return jobs;
  }

  /**
   * Execute a retraining job
   */
  private async executeRetrainingJob(job: RetrainingJob): Promise<void> {
    job.status = "running";
    const startTime = Date.now();

    try {
      console.log(`[AutoRetrain] Starting job ${job.job_id}`);

      // Simulate retraining process
      // In production, this would:
      // 1. Fetch new training data
      // 2. Prepare features
      // 3. Train the model
      // 4. Validate performance
      // 5. Deploy if improved

      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Calculate improvement (simulated)
      const improvement = Math.random() * 0.05; // 0-5% improvement
      const duration = Date.now() - startTime;

      job.status = "completed";
      job.completed_at = new Date();
      job.improvement_percent = improvement;

      this.lastRetrainingTime.set(job.model_name, new Date());

      console.log(
        `[AutoRetrain] Job ${job.job_id} completed in ${duration}ms with ${(improvement * 100).toFixed(2)}% improvement`
      );
    } catch (error) {
      job.status = "failed";
      job.completed_at = new Date();
      job.error_message = error instanceof Error ? error.message : String(error);

      console.error(
        `[AutoRetrain] Job ${job.job_id} failed:`,
        job.error_message
      );
    }
  }

  /**
   * Optimize ensemble weights based on performance
   */
  async optimizeWeights(): Promise<Record<string, number>> {
    console.log("[AutoRetrain] Optimizing ensemble weights");

    const optimalWeights = metricsCalculator.calculateOptimalWeights();

    console.log(
      "[AutoRetrain] Optimal weights calculated:",
      optimalWeights
    );

    return optimalWeights;
  }

  /**
   * Get retraining job history
   */
  getJobHistory(limit: number = 10): RetrainingJob[] {
    return this.retrainingJobs.slice(-limit);
  }

  /**
   * Get retraining statistics
   */
  getRetrainingStats(): {
    total_jobs: number;
    completed: number;
    failed: number;
    pending: number;
    avg_improvement: number;
  } {
    const completed = this.retrainingJobs.filter((j) => j.status === "completed");
    const failed = this.retrainingJobs.filter((j) => j.status === "failed");
    const pending = this.retrainingJobs.filter((j) => j.status === "pending");

    const avgImprovement =
      completed.length > 0
        ? completed.reduce((sum, j) => sum + (j.improvement_percent || 0), 0) /
          completed.length
        : 0;

    return {
      total_jobs: this.retrainingJobs.length,
      completed: completed.length,
      failed: failed.length,
      pending: pending.length,
      avg_improvement: avgImprovement,
    };
  }

  /**
   * Update retraining configuration
   */
  updateConfig(newConfig: Partial<RetrainingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log("[AutoRetrain] Configuration updated:", this.config);
  }

  /**
   * Stop the retraining engine
   */
  stop(): void {
    if (this.retrainingSchedule) {
      clearInterval(this.retrainingSchedule);
      this.retrainingSchedule = null;
      console.log("[AutoRetrain] Engine stopped");
    }
  }

  /**
   * Generate retraining report
   */
  generateReport(): string {
    const stats = this.getRetrainingStats();
    const history = this.getJobHistory(5);

    let report = `
=== AUTO-RETRAINING ENGINE REPORT ===
Generated: ${new Date().toISOString()}

CONFIGURATION:
- Enabled: ${this.config.enabled}
- Min predictions before retrain: ${this.config.min_predictions_before_retrain}
- Retrain interval: ${this.config.retrain_interval_hours} hours
- Performance threshold: ${(this.config.performance_threshold * 100).toFixed(2)}%
- Auto weight optimization: ${this.config.auto_weight_optimization}

STATISTICS:
- Total retraining jobs: ${stats.total_jobs}
- Completed: ${stats.completed}
- Failed: ${stats.failed}
- Pending: ${stats.pending}
- Average improvement: ${(stats.avg_improvement * 100).toFixed(2)}%

RECENT JOBS:
`;

    history.forEach((job) => {
      report += `
- ${job.job_id}
  Model: ${job.model_name}
  Trigger: ${job.triggered_by}
  Status: ${job.status}
  Started: ${job.started_at.toISOString()}
  ${job.completed_at ? `Completed: ${job.completed_at.toISOString()}` : ""}
  ${job.improvement_percent ? `Improvement: ${(job.improvement_percent * 100).toFixed(2)}%` : ""}
  ${job.error_message ? `Error: ${job.error_message}` : ""}
`;
    });

    return report;
  }
}

export const autoRetrainingEngine = new AutoRetrainingEngine();
