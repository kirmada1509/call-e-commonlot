import type { createAuth } from "@call-e-commonlot/auth";
import type { CalleClient } from "@call-e-commonlot/calle";
import type { Database } from "@call-e-commonlot/db";

export interface Context {
  auth: null;
  calle: CalleClient | null;
  db: Database;
  session: Awaited<
    ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>
  >;
}
