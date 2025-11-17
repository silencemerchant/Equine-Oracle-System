/**
 * Simple Sync Scheduler - Manages automatic data synchronization
 * Uses native setInterval instead of node-cron for better compatibility
 */

import { syncLiveRacecardsEnhanced } from './data_ingestion_enhanced';

interface SyncJob {
  id: string;
  name: string;
  intervalMs: number;
  lastRun?: Date;
  status: 'idle' | 'running' | 'failed';
  errorCount: number;
  maxRetries: number;
}

class SimpleSyncScheduler {
  private jobs: Map<string, SyncJob> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeJobs();
  }

  /**
   * Initialize sync jobs
   */
  private initializeJobs(): void {
    // Job 1: Sync today's races every 30 minutes
    this.jobs.set('sync-today', {
      id: 'sync-today',
      name: 'Sync Today\'s Races',
      intervalMs: 30 * 60 * 1000, // 30 minutes
      status: 'idle',
      errorCount: 0,
      maxRetries: 3,
    });

    // Job 2: Sync tomorrow's races once daily (at 11 PM)
    this.jobs.set('sync-tomorrow', {
      id: 'sync-tomorrow',
      name: 'Sync Tomorrow\'s Races',
      intervalMs: 24 * 60 * 60 * 1000, // 24 hours
      status: 'idle',
      errorCount: 0,
      maxRetries: 3,
    });

    // Job 3: Health check every hour
    this.jobs.set('health-check', {
      id: 'health-check',
      name: 'Sync Health Check',
      intervalMs: 60 * 60 * 1000, // 1 hour
      status: 'idle',
      errorCount: 0,
      maxRetries: 1,
    });
  }

  /**
   * Start the scheduler
   */
  public async start(): Promise<void> {
    if (this.isInitialized) {
      console.log('[Sync Scheduler] Already initialized');
      return;
    }

    try {
      console.log('[Sync Scheduler] Starting scheduler...');

      // Schedule each job
      Array.from(this.jobs.values()).forEach(job => {
        this.scheduleJob(job);
      });

      this.isInitialized = true;
      console.log('[Sync Scheduler] Scheduler initialized successfully');
      console.log(`[Sync Scheduler] ${this.jobs.size} jobs scheduled`);

      // Run initial sync immediately
      this.executeJobImmediate('sync-today');
    } catch (error) {
      console.error('[Sync Scheduler] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Schedule a single job
   */
  private scheduleJob(job: SyncJob): void {
    try {
      // Execute job immediately on first run
      this.executeJobImmediate(job.id);

      // Then schedule recurring execution
      const timer = setInterval(() => {
        this.executeJob(job);
      }, job.intervalMs);

      this.timers.set(job.id, timer);
      console.log(`[Sync Scheduler] Job scheduled: ${job.name} (interval: ${job.intervalMs / 1000}s)`);
    } catch (error) {
      console.error(`[Sync Scheduler] Failed to schedule job ${job.name}:`, error);
    }
  }

  /**
   * Execute a job immediately (without waiting for interval)
   */
  private async executeJobImmediate(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    await this.executeJob(job);
  }

  /**
   * Execute a sync job
   */
  private async executeJob(job: SyncJob): Promise<void> {
    if (job.status === 'running') {
      console.log(`[Sync Scheduler] Job ${job.name} already running, skipping...`);
      return;
    }

    job.status = 'running';
    job.lastRun = new Date();

    try {
      switch (job.id) {
        case 'sync-today':
          await this.syncToday();
          job.errorCount = 0;
          break;

        case 'sync-tomorrow':
          await this.syncTomorrow();
          job.errorCount = 0;
          break;

        case 'health-check':
          await this.healthCheck();
          job.errorCount = 0;
          break;

        default:
          console.warn(`[Sync Scheduler] Unknown job: ${job.id}`);
      }

      job.status = 'idle';
      console.log(`[Sync Scheduler] Job completed: ${job.name}`);
    } catch (error) {
      job.errorCount++;
      console.error(
        `[Sync Scheduler] Job failed (${job.errorCount}/${job.maxRetries}): ${job.name}`,
        error
      );

      if (job.errorCount >= job.maxRetries) {
        job.status = 'failed';
        console.error(`[Sync Scheduler] Job ${job.name} exceeded max retries`);
      } else {
        job.status = 'idle';
      }
    }
  }

  /**
   * Sync today's races
   */
  private async syncToday(): Promise<void> {
    console.log('[Sync Scheduler] Syncing today\'s races...');
    const result = await syncLiveRacecardsEnhanced('today');

    if (result.success) {
      console.log(
        `[Sync Scheduler] Today's sync complete: ${result.racesCount} races, ${result.horsesCount} horses`
      );
    } else {
      throw new Error(result.error || 'Unknown sync error');
    }
  }

  /**
   * Sync tomorrow's races
   */
  private async syncTomorrow(): Promise<void> {
    console.log('[Sync Scheduler] Syncing tomorrow\'s races...');
    const result = await syncLiveRacecardsEnhanced('tomorrow');

    if (result.success) {
      console.log(
        `[Sync Scheduler] Tomorrow's sync complete: ${result.racesCount} races, ${result.horsesCount} horses`
      );
    } else {
      throw new Error(result.error || 'Unknown sync error');
    }
  }

  /**
   * Health check
   */
  private async healthCheck(): Promise<void> {
    const jobStats = {
      totalJobs: this.jobs.size,
      idleJobs: Array.from(this.jobs.values()).filter(j => j.status === 'idle').length,
      runningJobs: Array.from(this.jobs.values()).filter(j => j.status === 'running').length,
      failedJobs: Array.from(this.jobs.values()).filter(j => j.status === 'failed').length,
    };

    console.log('[Sync Scheduler] Health Check:', jobStats);

    if (jobStats.failedJobs > 0) {
      console.warn('[Sync Scheduler] WARNING: Some jobs have failed');
    }
  }

  /**
   * Get scheduler status
   */
  public getStatus(): {
    initialized: boolean;
    jobs: Array<{
      id: string;
      name: string;
      status: string;
      lastRun?: string;
      errorCount: number;
    }>;
  } {
    return {
      initialized: this.isInitialized,
      jobs: Array.from(this.jobs.values()).map((job) => ({
        id: job.id,
        name: job.name,
        status: job.status,
        lastRun: job.lastRun?.toISOString(),
        errorCount: job.errorCount,
      })),
    };
  }

  /**
   * Stop the scheduler
   */
  public stop(): void {
    console.log('[Sync Scheduler] Stopping scheduler...');

    Array.from(this.timers.entries()).forEach(([jobId, timer]) => {
      clearInterval(timer);
      console.log(`[Sync Scheduler] Cleared timer for job: ${jobId}`);
    });

    this.timers.clear();
    this.isInitialized = false;
    console.log('[Sync Scheduler] Scheduler stopped');
  }
}

// Export singleton instance
export const syncScheduler = new SimpleSyncScheduler();
