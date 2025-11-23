import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { clientsRouter } from "./routers/clients";
import { z } from "zod";
import { predictRanking, getBettingSignals } from "./prediction_wrapper";
import { subscriptionRouter, apiKeyRouter } from "./routers/subscription";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  clients: clientsRouter,
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
        try {
          const predictions = await predictRanking(input);
          return predictions;
        } catch (error) {
          console.error("Prediction error:", error);
          return {
            error: "Prediction failed",
            predictions: []
          };
        }
      }),
    
    bettingSignals: publicProcedure
      .input(z.object({
        predictions: z.object({
          success: z.boolean().optional(),
          predictions: z.array(z.object({
            horse_name: z.string(),
            ranking_score: z.number(),
            rank: z.number(),
            confidence: z.number().optional(),
          })),
        }),
        confidenceThreshold: z.number().optional().default(0.65),
      }))
      .query(async ({ input }) => {
        try {
          const signals = await getBettingSignals(input.predictions, input.confidenceThreshold);
          return signals;
        } catch (error) {
          console.error("Betting signals error:", error);
          return {
            error: "Failed to generate betting signals",
            signals: [],
            recommendation: "HOLD"
          };
        }
      }),
  }),

  subscription: subscriptionRouter,
  apiKey: apiKeyRouter,
});

export type AppRouter = typeof appRouter;
