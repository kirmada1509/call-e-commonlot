import { createAuth as createConfiguredAuth } from "@krishna-starter-kit/auth";
import { createDb, type Database } from "@krishna-starter-kit/db";

import { env } from "./env.server";

const db = createDb(env);

export function getDb(): Database {
  return db;
}
export const auth = createConfiguredAuth(env, db);
