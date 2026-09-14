"use client";

import { GlassSurface } from "@call-e-commonlot/ui/components/ui/glass/surface";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import SignInForm from "@/components/sign-in-form";
import SignUpForm from "@/components/sign-up-form";
import { authClient } from "@/lib/auth-client";

export default function LoginView({ mode }: { mode: "sign-in" | "sign-up" }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isSignUp = mode === "sign-up";
  useEffect(() => {
    if (session?.user) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  return (
    <div className="grid min-h-[calc(100svh-4rem)] place-items-center px-4 py-12">
      <div className="w-full min-w-0 max-w-md">
        <div className="mb-5 text-center">
          <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </span>
          <p className="mt-4 text-muted-foreground text-sm">
            Organizer workspace
          </p>
        </div>
        <GlassSurface
          className="min-w-0 rounded-[24px] p-2 shadow-2xl"
          strength="strong"
        >
          <div className="rounded-[18px] border bg-card p-6 sm:p-8">
            {isSignUp ? (
              <SignUpForm
                onSwitchToSignIn={() => router.replace("/login?mode=sign-in")}
              />
            ) : (
              <SignInForm
                onSwitchToSignUp={() => router.replace("/login?mode=sign-up")}
              />
            )}
          </div>
        </GlassSurface>
        <p className="mt-5 text-center text-muted-foreground text-xs">
          Your buyer limits remain private to your organizer account.
        </p>
      </div>
    </div>
  );
}
