import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  prediction: router({
    predictRanking: publicProcedure
      .input(z.array(z.object({
        horse_name: z.string(),
        distance: z.number(),
        days_since_last_race: z.number(),
        PREV_RACE_WON: z.number(),
        WIN_STREAK: z.number(),
        IMPLIED_PROBABILITY: z.number(),
        NORMALIZED_VOLUME: z.number(),
        MARKET_ACTIVITY_WINDOW_HOURS: z.number(),
      })))
      .mutation(async ({ input }) => {
        return {
          predictions: input.map((horse, idx) => ({
            horse_name: horse.horse_name,
            ranking_score: Math.random(),
            rank: idx + 1,
          })),
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
