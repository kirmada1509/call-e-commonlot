import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "../index";
import { groupsRouter } from "./groups";
import { roundsRouter } from "./rounds";
import { suppliersRouter } from "./suppliers";

export const appRouter = {
  groups: groupsRouter,
  healthCheck: publicProcedure.handler(() => "OK"),
  privateData: protectedProcedure.handler(({ context }) => ({
    message: "This is private",
    user: context.session?.user,
  })),
  rounds: roundsRouter,
  suppliers: suppliersRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
