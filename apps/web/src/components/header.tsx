"use client";

import { Button, buttonVariants } from "@call-e-commonlot/ui/components/button";
import { Input } from "@call-e-commonlot/ui/components/input";
import { GlassSurface } from "@call-e-commonlot/ui/components/ui/glass/surface";
import { cn } from "@call-e-commonlot/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Command,
  LayoutDashboard,
  Menu,
  Network,
  PackageOpen,
  Plus,
  X,
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { orpc } from "@/utils/orpc";

import { Brand } from "./brand";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "./user-menu";

const navigation = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/rounds", icon: PackageOpen, label: "Rounds" },
  { href: "/setup", icon: Network, label: "Network" },
] as const;
const commandNavigation = [
  ...navigation,
  { href: "/rounds?new=1", icon: Plus, label: "Start a round" },
] as const;

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="grid gap-1">
      {navigation.map(({ href, icon: Icon, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-[background-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[.98]",
              active
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
            )}
            href={href}
            key={href}
            onClick={onNavigate}
          >
            <Icon aria-hidden="true" className="size-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function CommandMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rounds = useQuery({
    ...orpc.dashboard.overview.queryOptions(),
    enabled: open,
  });
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  if (!open) {
    return null;
  }
  const go = (href: Route) => {
    setOpen(false);
    setSearch("");
    router.push(href);
  };
  const matchingRounds =
    rounds.data?.rounds
      .filter((round) =>
        round.productName.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 5) ?? [];
  return (
    <div
      aria-label="Command navigation"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/25 px-4 pt-[18vh] backdrop-blur-sm"
      role="dialog"
    >
      <GlassSurface
        className="w-full max-w-lg rounded-2xl p-2 shadow-2xl"
        strength="strong"
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Command
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          <Input
            aria-label="Search commands and rounds"
            className="flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Go somewhere or find a round"
            value={search}
          />
          <Button
            aria-label="Close command menu"
            onClick={() => setOpen(false)}
            size="icon-sm"
            variant="ghost"
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
        <div className="grid gap-1 p-1">
          {commandNavigation.map(({ href, icon: Icon, label }) => (
            <button
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              key={href}
              onClick={() => go(href)}
              type="button"
            >
              <Icon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              {label}
            </button>
          ))}
          {matchingRounds.length ? (
            <p className="px-3 pt-3 pb-1 font-medium text-muted-foreground text-xs">
              Rounds
            </p>
          ) : null}
          {matchingRounds.map((round) => (
            <button
              className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              key={round.id}
              onClick={() => go(`/rounds/${round.id}` as Route)}
              type="button"
            >
              <PackageOpen className="size-4 text-muted-foreground" />
              <span className="min-w-0">
                <span className="block truncate">{round.productName}</span>
                <span className="block truncate text-muted-foreground text-xs">
                  {round.group} · {round.supplier}
                </span>
              </span>
            </button>
          ))}
        </div>
      </GlassSurface>
    </div>
  );
}

function PublicHeader() {
  const pathname = usePathname();
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-border/60 border-b bg-background/78 backdrop-blur-xl supports-[backdrop-filter]:bg-background/68">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Brand />
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            aria-current={pathname === "/about" ? "page" : undefined}
            className={buttonVariants({ variant: "ghost" })}
            href={"/about" as Route}
          >
            How it works
          </Link>
          <ModeToggle />
          <Link
            className={buttonVariants({
              className: "max-sm:hidden!",
              variant: "ghost",
            })}
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className={buttonVariants({ className: "max-sm:hidden!" })}
            href="/login?mode=sign-up"
          >
            Create account
          </Link>
        </div>
      </div>
    </header>
  );
}

function AppShell() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = navigation.find(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`)
  );
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-border/60 border-r bg-background/72 p-4 backdrop-blur-xl lg:flex lg:flex-col">
        <div className="px-2 pt-1 pb-7">
          <Brand />
        </div>
        <NavigationLinks />
        <div className="mt-auto grid gap-3">
          <button
            className="flex min-h-10 items-center justify-between rounded-xl border bg-background/55 px-3 text-muted-foreground text-xs hover:bg-background"
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              )
            }
            type="button"
          >
            <span className="flex items-center gap-2">
              <Command className="size-3.5" />
              Quick open
            </span>
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-sans">
              ⌘ K
            </kbd>
          </button>
          <div className="flex items-center justify-between gap-2">
            <ModeToggle />
            <UserMenu />
          </div>
        </div>
      </aside>
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-background/82 px-4 backdrop-blur-xl lg:left-64 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            aria-label="Open navigation"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            size="icon"
            variant="ghost"
          >
            <Menu className="size-5" />
          </Button>
          <div>
            <p className="text-muted-foreground text-xs">CommonLot</p>
            <p className="font-semibold text-sm">
              {current?.label ?? "Round workspace"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <ModeToggle />
          <UserMenu />
        </div>
      </header>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/30 lg:hidden">
          <GlassSurface
            className="h-full w-[min(86vw,320px)] rounded-none rounded-r-3xl p-4 shadow-2xl"
            strength="strong"
          >
            <div className="mb-7 flex items-center justify-between">
              <Brand />
              <Button
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
                size="icon"
                variant="ghost"
              >
                <X className="size-5" />
              </Button>
            </div>
            <NavigationLinks onNavigate={() => setMobileOpen(false)} />
          </GlassSurface>
        </div>
      ) : null}
      <CommandMenu />
    </>
  );
}

export default function Header() {
  const pathname = usePathname();
  const isPublicPage =
    pathname === "/" || pathname === "/about" || pathname === "/login";
  return isPublicPage ? <PublicHeader /> : <AppShell />;
}
