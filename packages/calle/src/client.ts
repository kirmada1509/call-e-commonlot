import { CalleClient } from "@call-e/calle";

export type { Call, JsonObject } from "@call-e/calle";
// biome-ignore lint/performance/noBarrelFile: re-exports the SDK's client class for consumers of this package
export { CalleClient } from "@call-e/calle";

export interface CalleConfig {
  apiKey: string;
  baseUrl?: string;
}

export function createCalleClient(config: CalleConfig): CalleClient {
  return new CalleClient({ apiKey: config.apiKey, baseUrl: config.baseUrl });
}
