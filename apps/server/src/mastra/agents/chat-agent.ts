import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";

export const chatAgent = new Agent({
  id: "chatAgent",
  instructions:
    "You are a helpful AI assistant for the krishna-starter-kit app. Be concise and friendly.",
  memory: new Memory(),
  model: google("gemini-2.5-flash"),
  name: "Chat Agent",
});
