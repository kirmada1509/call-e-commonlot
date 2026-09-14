import { createAuth as createConfiguredAuth } from "@call-e-commonlot/auth";
import { createCalleClient } from "@call-e-commonlot/calle";
import { createDb, type Database } from "@call-e-commonlot/db";

import { env } from "./env.server";

const db = createDb(env);

export function getDb(): Database {
  return db;
}
export const auth = createConfiguredAuth(env, db);

export const calle = env.CALLE_API_KEY
  ? createCalleClient({ apiKey: env.CALLE_API_KEY })
  : null;
