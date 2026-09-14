import type { Metadata } from "next";

import LoginView from "./login-view";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return <LoginView mode={mode === "sign-up" ? "sign-up" : "sign-in"} />;
}
