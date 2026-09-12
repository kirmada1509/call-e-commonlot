import { cors } from "@elysiajs/cors";
import { appRouter } from "@krishna-starter-kit/api/routers/index";
import { handleChatStream } from "@mastra/ai-sdk";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIReferencePlugin } from "@orpc/openapi/plugins";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4";
import { createUIMessageStreamResponse, type UIMessage } from "ai";
import { Elysia } from "elysia";
import { initLogger } from "evlog";
import {
  type BetterAuthInstance,
  createAuthMiddleware,
} from "evlog/better-auth";
import { evlog } from "evlog/elysia";
import { createFsDrain } from "evlog/fs";

import { createContext } from "./context";
import { env } from "./env.server";
import { mastra } from "./mastra";
import { auth } from "./services";

const rpcHandler = new RPCHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
});
const apiHandler = new OpenAPIHandler(appRouter, {
  interceptors: [
    onError((error) => {
      console.error(error);
    }),
  ],
  plugins: [
    new OpenAPIReferencePlugin({
      schemaConverters: [new ZodToJsonSchemaConverter()],
    }),
  ],
});

initLogger({
  env: { service: "krishna-starter-kit-server" },
});

const identifyUser = createAuthMiddleware(auth as BetterAuthInstance, {
  exclude: ["/api/auth/**"],
  maskEmail: true,
});

const app = new Elysia()
  .use(
    evlog({
      drain:
        process.env.NODE_ENV === "production" ? undefined : createFsDrain(),
    })
  )
  .derive(async ({ request, log }) => {
    await identifyUser(log, request.headers, new URL(request.url).pathname);
    return {};
  })
  .use(
    cors({
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
      methods: ["GET", "POST", "OPTIONS"],
      origin: env.CORS_ORIGIN,
    })
  )
  // biome-ignore lint/suspicious/useAwait: Elysia route handlers must return a Promise consistently across this chain
  .all("/api/auth/*", async (context) => {
    const { request, status } = context;
    if (["POST", "GET"].includes(request.method)) {
      return auth.handler(request);
    }
    return status(405);
  })
  .all(
    "/rpc*",
    async (context) => {
      const { response } = await rpcHandler.handle(context.request, {
        context: await createContext({ context }),
        prefix: "/rpc",
      });
      return response ?? new Response("Not Found", { status: 404 });
    },
    {
      parse: "none",
    }
  )
  .all(
    "/api-reference*",
    async (context) => {
      const { response } = await apiHandler.handle(context.request, {
        context: await createContext({ context }),
        prefix: "/api-reference",
      });
      return response ?? new Response("Not Found", { status: 404 });
    },
    {
      parse: "none",
    }
  )
  .post("/ai", async (context) => {
    const body = (await context.request.json()) as { messages?: UIMessage[] };
    const uiMessages = body.messages || [];

    const session = await auth.api.getSession({
      headers: context.request.headers,
    });
    const resourceId = session?.user?.id ?? "anonymous";
    const threadId =
      context.request.headers.get("x-chat-thread-id") ?? resourceId;

    const stream = await handleChatStream({
      agentId: "chatAgent",
      mastra,
      params: {
        memory: { resource: resourceId, thread: threadId },
        // @mastra/ai-sdk vendors its own copy of the AI SDK v5 UIMessage
        // type; structurally identical to the one from "ai" but not
        // nominally assignable across the two packages' bundled types.
        messages: uiMessages as never,
      },
      version: "v5",
    });

    // Same vendored-type mismatch as above, on the way back out.
    return createUIMessageStreamResponse({ stream: stream as never });
  })
  .get("/", () => "OK");

export default app;

// Elysia's default export is not auto-served by Bun or Node, so start a local
// server outside Vercel while still exporting the app for Vercel functions.
if (!process.env.VERCEL) {
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}
