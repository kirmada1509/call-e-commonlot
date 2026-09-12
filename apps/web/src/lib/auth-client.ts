import { createAuthClient } from "better-auth/react";

import { ENV as env } from "../env";
import { getServerUrl } from "../utils/get-server-url";

export const authClient = createAuthClient({
  // better-auth derives its route-matching base from this URL's path, so the
  // public auth path must equal the server-side mount (/api/auth everywhere)
  baseURL: new URL(
    "/api/auth",
    getServerUrl(env.NEXT_PUBLIC_SERVER_URL)
  ).toString(),
});
