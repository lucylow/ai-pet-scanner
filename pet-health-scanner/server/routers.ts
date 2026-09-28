import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { visionInputSchema } from "./pet-scanner-contract";
import { mediaUploadInputSchema } from "../shared/pet-scanner-contracts";
import { analyzePetImages } from "./pet-scanner-analysis";
import { storagePreparePut } from "./storage";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  media: router({
    prepare: protectedProcedure.input(mediaUploadInputSchema).mutation(async ({ ctx, input }) => { const prepared = await storagePreparePut(`pet-scans/${ctx.user.id}/${input.fileName}`, input.mimeType); return { ...prepared, maxBytes: input.byteLength }; }),
  }),
  subscription: router({
    refresh: protectedProcedure.query(() => ({ plan: "free" as const, entitlements: [] as const, source: "server" as const })),
  }),
  analysis: router({
    request: protectedProcedure.input(visionInputSchema).mutation(({ input }) => analyzePetImages(input)),
  }),
});

export type AppRouter = typeof appRouter;
