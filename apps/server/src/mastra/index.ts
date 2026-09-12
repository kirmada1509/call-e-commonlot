import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { PostgresStore } from "@mastra/pg";

import { env } from "../env.server";
import { chatAgent } from "./agents/chat-agent";

export const mastra = new Mastra({
  agents: { chatAgent },
  logger: new PinoLogger({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    name: "krishna-starter-kit-mastra",
  }),
  storage: new PostgresStore({
    connectionString: env.DATABASE_URL,
    id: "main",
    schemaName: "mastra",
  }),
});
