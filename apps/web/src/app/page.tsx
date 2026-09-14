import { buttonVariants } from "@call-e-commonlot/ui/components/button";
import { GlassSurface } from "@call-e-commonlot/ui/components/ui/glass/surface";
import {
  ArrowRight,
  Check,
  LockKeyhole,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: "01",
    text: "Call each buyer privately to capture quantity, price limits, and flexibility.",
    title: "Collect conditions",
  },
  {
    number: "02",
    text: "CommonLot combines compatible requests against the supplier’s price breaks.",
    title: "Assemble the proposal",
  },
  {
    number: "03",
    text: "When terms move, affected buyers confirm again before you place anything.",
    title: "Reconfirm changes",
  },
] as const;

export default function Home() {
  return (
    <div className="overflow-hidden">
      <section className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.08fr_.92fr] lg:py-28">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1.5 text-muted-foreground text-sm shadow-sm">
            <Sparkles className="size-4 text-primary" />
            Purchasing coordination, without the spreadsheet chase
          </div>
          <h1 className="max-w-3xl font-semibold text-5xl tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            One workable order from many private limits.
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg text-muted-foreground leading-8 sm:text-xl">
            CommonLot helps organizers assemble feasible shared purchases
            through phone conversations—then keeps every change visible and
            reconfirmed.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className={buttonVariants({ className: "h-12 px-6 text-base" })}
              href="/login?mode=sign-up"
            >
              Create account <ArrowRight className="size-4" />
            </Link>
            <Link
              className={buttonVariants({
                className: "h-12 px-6 text-base",
                variant: "outline",
              })}
              href="/login"
            >
              Sign in
            </Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-muted-foreground text-sm">
            <ShieldCheck className="size-4 text-success" />
            You remain in control. Proposals are never orders.
          </p>
        </div>
        <GlassSurface
          className="rounded-[28px] p-4 shadow-2xl"
          strength="strong"
        >
          <div className="rounded-2xl border bg-card p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-muted-foreground text-sm">
                  Shared order · takeaway cartons
                </p>
                <h2 className="mt-1 font-semibold text-2xl tracking-tight">
                  30 cartons pooled
                </h2>
              </div>
              <span className="rounded-full bg-success/12 px-3 py-1 font-medium text-success text-xs">
                Threshold met
              </span>
            </div>
            <div className="my-8 grid gap-3">
              {[
                { name: "Asha Stores", qty: 12, width: "40%" },
                { name: "Corner Market", qty: 10, width: "33.333%" },
                { name: "Nila Foods", qty: 8, width: "26.667%" },
              ].map(({ name, qty, width }) => (
                <div key={name}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span>{name}</span>
                    <span className="font-medium text-tabular">{qty}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-muted/65 p-4 text-center">
              <div>
                <p className="font-semibold text-tabular text-xl">30</p>
                <p className="text-muted-foreground text-xs">combined</p>
              </div>
              <div>
                <p className="font-semibold text-tabular text-xl">30</p>
                <p className="text-muted-foreground text-xs">tier starts</p>
              </div>
              <div>
                <p className="font-semibold text-success text-tabular text-xl">
                  ₹1,800
                </p>
                <p className="text-muted-foreground text-xs">
                  potential saving
                </p>
              </div>
            </div>
          </div>
        </GlassSurface>
      </section>
      <section className="border-y bg-card/55">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="mb-3 font-medium text-primary text-sm">
            A calmer workflow
          </p>
          <h2 className="max-w-2xl font-semibold text-3xl tracking-tight sm:text-4xl">
            From individual constraints to collective confidence.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((step) => (
              <article
                className="rounded-2xl border bg-card p-6 shadow-sm"
                key={step.number}
              >
                <p className="font-semibold text-primary text-sm">
                  {step.number}
                </p>
                <h3 className="mt-7 font-semibold text-xl">{step.title}</h3>
                <p className="mt-2 text-muted-foreground text-sm leading-6">
                  {step.text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2">
        <div>
          <LockKeyhole className="size-8 text-primary" />
          <h2 className="mt-6 font-semibold text-3xl tracking-tight">
            Private limits stay private.
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground leading-7">
            Buyers share their caps with the organizer, not the whole group.
            CommonLot exposes the operational result—not everyone’s negotiating
            position.
          </p>
        </div>
        <div className="grid gap-4">
          {[
            "The organizer reviews every proposal.",
            "Changes requiring consent are called out clearly.",
            "Order status moves only when the organizer records it.",
          ].map((item) => (
            <div
              className="flex items-center gap-3 rounded-2xl border bg-card p-4"
              key={item}
            >
              <span className="grid size-8 place-items-center rounded-full bg-success/12 text-success">
                <Check className="size-4" />
              </span>
              <p className="font-medium text-sm">{item}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-4 mb-8 rounded-[28px] bg-foreground px-6 py-14 text-center text-background sm:mx-6">
        <MessagesSquare className="mx-auto size-9 opacity-80" />
        <h2 className="mt-5 font-semibold text-3xl tracking-tight">
          Bring the next order together.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-background/70">
          Set up your network, start a round, and let every participant know
          exactly where things stand.
        </p>
        <Link
          className={buttonVariants({
            className:
              "mt-7 bg-background text-foreground hover:bg-background/90",
          })}
          href="/login?mode=sign-up"
        >
          Get started
        </Link>
      </section>
    </div>
  );
}
