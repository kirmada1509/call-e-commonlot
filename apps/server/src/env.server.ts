import "varlock/auto-load";

// biome-ignore lint/performance/noBarrelFile: re-exports the varlock-generated ./env after loading its auto-load side effect
export { ENV as env } from "./env";
