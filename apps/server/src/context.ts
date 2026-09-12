import type { Context as ApiContext } from "@krishna-starter-kit/api/context";
import type { Context as ElysiaContext } from "elysia";
import { auth, calle, getDb } from "./services";

export interface CreateContextOptions {
  context: ElysiaContext;
}

export async function createContext({
  context,
}: CreateContextOptions): Promise<ApiContext> {
  const db = await getDb();
  const session = await auth.api.getSession({
    headers: context.request.headers,
  });
  return {
    auth: null,
    calle,
    db,
    session,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
