import type { RouterClient } from "@orpc/server";

import { publicProcedure } from "../index";
import { dashboardRouter } from "./dashboard";
import { groupsRouter } from "./groups";
import { roundsRouter } from "./rounds";
import { suppliersRouter } from "./suppliers";

export const appRouter = {
  dashboard: dashboardRouter,
  groups: groupsRouter,
  healthCheck: publicProcedure.handler(() => "OK"),
  rounds: roundsRouter,
  suppliers: suppliersRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
