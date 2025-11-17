/**
 * Oracle Engine tRPC Router
 * 
 * Exposes all Oracle Engine system metrics, progress tracking, and health monitoring
 * through tRPC procedures. All endpoints require admin role for security.
 */

import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { oracleEngineOrchestrator } from "../agents/oracleEngineOrchestrator";
import { continuousPredictionAgent } from "../agents/continuousPredictionAgent";
import { resultCollector } from "../agents/resultCollector";
import { autoRetrainingEngine } from "../agents/autoRetrainingEngine";
import { progressTracker } from "../agents/progressTracker";

/**
 * Helper function to check admin role
 */
function requireAdmin(userRole?: string) {
  if (userRole !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  }
}

export const oracleRouter = router({
  /**
   * Get overall system status
   */
  status: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return oracleEngineOrchestrator.getStatus();
  }),

  /**
   * Get detailed system report with all metrics
   */
  metrics: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return oracleEngineOrchestrator.getDetailedReport();
  }),

  /**
   * Get progress tracking data and statistics
   */
  progress: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return oracleEngineOrchestrator.getProgressMetrics();
  }),

  /**
   * Get continuous prediction agent metrics
   */
  predictionMetrics: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return continuousPredictionAgent.getMetrics();
  }),

  /**
   * Get result collector metrics
   */
  resultMetrics: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return resultCollector.getMetrics();
  }),

  /**
   * Get auto-retraining engine metrics
   */
  retrainingMetrics: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return autoRetrainingEngine.getMetrics();
  }),

  /**
   * Get progress statistics (7-day history)
   */
  progressStatistics: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return progressTracker.getProgressStatistics();
  }),

  /**
   * Get latest progress snapshot
   */
  latestSnapshot: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return progressTracker.getLatestSnapshot();
  }),

  /**
   * Get all progress snapshots (7-day history)
   */
  snapshots: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return progressTracker.getSnapshots();
  }),

  /**
   * Get accuracy trend data for charting
   */
  accuracyTrend: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    const snapshots = progressTracker.getSnapshots();
    
    return snapshots.map((snapshot) => ({
      timestamp: snapshot.timestamp,
      accuracy: snapshot.accuracy,
      predictions: snapshot.totalPredictions,
      results: snapshot.totalResults,
    }));
  }),

  /**
   * Get prediction rate trend data
   */
  predictionRateTrend: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    const snapshots = progressTracker.getSnapshots();
    
    return snapshots.map((snapshot) => ({
      timestamp: snapshot.timestamp,
      predictionsPerHour: snapshot.predictionsPerHour,
      resultsPerHour: snapshot.resultsPerHour,
    }));
  }),

  /**
   * Get system health status
   */
  health: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    const status = oracleEngineOrchestrator.getStatus();
    
    const health = {
      isHealthy: status.isRunning && status.agentStatus.predictionAgent,
      status: status.isRunning ? "healthy" : "unhealthy" as const,
      uptime: status.uptime,
      components: {
        predictionAgent: status.agentStatus.predictionAgent,
        resultCollector: status.agentStatus.resultCollector,
        retrainingEngine: status.agentStatus.retrainingEngine,
        progressTracker: status.agentStatus.progressTracker,
      },
      metrics: {
        totalPredictions: status.metrics.totalPredictions,
        totalResults: status.metrics.totalResults,
        systemAccuracy: status.metrics.systemAccuracy,
        predictionRate: status.metrics.predictionRate,
      },
    };

    return health;
  }),

  /**
   * Get model version history
   */
  modelVersions: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    const retrainingMetrics = autoRetrainingEngine.getMetrics();
    return {
      currentVersion: retrainingMetrics.modelVersion,
      lastRetrainingTime: retrainingMetrics.lastRetrainingTime,
      modelVersionHistory: retrainingMetrics.modelVersionHistory || [],
    };
  }),

  /**
   * Get accuracy by track
   */
  accuracyByTrack: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return resultCollector.getAccuracyByTrack();
  }),

  /**
   * Export all metrics as JSON
   */
  export: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    return JSON.parse(oracleEngineOrchestrator.exportMetrics());
  }),

  /**
   * Get system summary for dashboard
   */
  summary: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    const status = oracleEngineOrchestrator.getStatus();
    const progress = progressTracker.getProgressStatistics();
    const latest = progressTracker.getLatestSnapshot();

    return {
      systemStatus: status.isRunning ? "Running" : "Stopped",
      uptime: status.uptime,
      totalPredictions: status.metrics.totalPredictions,
      totalResults: status.metrics.totalResults,
      currentAccuracy: status.metrics.systemAccuracy,
      averageAccuracy7d: progress.averageAccuracy,
      bestAccuracy7d: progress.bestAccuracy,
      worstAccuracy7d: progress.worstAccuracy,
      predictionRate: status.metrics.predictionRate,
      lastSnapshot: latest,
      allComponentsHealthy:
        status.agentStatus.predictionAgent &&
        status.agentStatus.resultCollector &&
        status.agentStatus.progressTracker,
    };
  }),

  /**
   * Get dashboard overview data
   */
  dashboard: protectedProcedure.query(({ ctx }) => {
    requireAdmin(ctx.user?.role);
    const status = oracleEngineOrchestrator.getStatus();
    const progress = progressTracker.getProgressStatistics();
    const snapshots = progressTracker.getSnapshots();

    return {
      // System Status
      system: {
        isRunning: status.isRunning,
        uptime: status.uptime,
        startTime: status.startTime,
      },

      // Key Metrics
      metrics: {
        totalPredictions: status.metrics.totalPredictions,
        totalResults: status.metrics.totalResults,
        currentAccuracy: status.metrics.systemAccuracy,
        predictionRate: status.metrics.predictionRate,
      },

      // Progress Stats
      progress: {
        averageAccuracy: progress.averageAccuracy,
        bestAccuracy: progress.bestAccuracy,
        worstAccuracy: progress.worstAccuracy,
        totalSnapshots: progress.totalSnapshots,
      },

      // Component Status
      components: {
        predictionAgent: status.agentStatus.predictionAgent,
        resultCollector: status.agentStatus.resultCollector,
        retrainingEngine: status.agentStatus.retrainingEngine,
        progressTracker: status.agentStatus.progressTracker,
      },

      // Chart Data
      charts: {
        accuracyTrend: snapshots.map((s) => ({
          time: new Date(s.timestamp).toLocaleTimeString(),
          accuracy: s.accuracy,
        })),
        predictionRate: snapshots.map((s) => ({
          time: new Date(s.timestamp).toLocaleTimeString(),
          rate: s.predictionsPerHour,
        })),
      },

      // Latest Snapshot
      latest: progressTracker.getLatestSnapshot(),
    };
  }),
});

