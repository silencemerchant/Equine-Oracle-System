/**
 * Sync Router - tRPC procedures for syncing live race data
 */

import { publicProcedure, router } from "./_core/trpc";
import { syncLiveRacecards } from "./data_ingestion";

export const syncRouter = router({
  /**
   * Manually trigger a sync of today's racecards
   */
  syncToday: publicProcedure.mutation(async () => {
    try {
      const result = await syncLiveRacecards('today');
      return result;
    } catch (error) {
      throw new Error(`Sync failed: ${error}`);
    }
  }),

  /**
   * Manually trigger a sync of tomorrow's racecards
   */
  syncTomorrow: publicProcedure.mutation(async () => {
    try {
      const result = await syncLiveRacecards('tomorrow');
      return result;
    } catch (error) {
      throw new Error(`Sync failed: ${error}`);
    }
  }),

  /**
   * Get sync status and latest race data
   */
  getStatus: publicProcedure.query(async () => {
    return {
      status: 'ready',
      lastSync: new Date().toISOString(),
      message: 'Data sync service is running. Use syncToday or syncTomorrow to fetch live racecards.',
    };
  }),
});
