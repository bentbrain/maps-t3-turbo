import type { TRPCRouterRecord } from "@trpc/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";

import { publicProcedure } from "../trpc";

export const invalidateRouter = {
  tag: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ input }) => {
      revalidateTag(input.id);
    }),
} satisfies TRPCRouterRecord;
