import { invalidateRouter } from "./router/invalidate";
import { pageRouter } from "./router/page";
import { releasesRouter } from "./router/releases";
import { userRouter } from "./router/user";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  page: pageRouter,
  user: userRouter,
  invalidate: invalidateRouter,
  releases: releasesRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
