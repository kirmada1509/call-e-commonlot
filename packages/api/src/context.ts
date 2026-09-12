import type { createAuth } from "@krishna-starter-kit/auth";
import type { Database } from "@krishna-starter-kit/db";

export interface Context {
  auth: null;
  db: Database;
  session: Awaited<
    ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>
  >;
}
