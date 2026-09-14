import { cn } from "@call-e-commonlot/ui/lib/utils";
import {
  CalendarClock,
  Check,
  CircleAlert,
  FlaskConical,
  IndianRupee,
  LockKeyhole,
  Mic2,
  Phone,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import styles from "./about.module.css";
import type { AboutScreenshot, AboutSlideId } from "./about-data";

const CARTON_ASSETS = {
  cluster: "/about/carton-cluster.png",
  pallet: "/about/carton-pallet.png",
  single: "/about/carton-single.png",
} as const;

const cropClasses: Record<AboutScreenshot["crop"], string> = {
  calls: styles.cropCalls,
  order: styles.cropOrder,
  proposal: styles.cropProposal,
  readiness: styles.cropReadiness,
};

interface ProductFrameProps extends AboutScreenshot {
  className?: string;
  label?: string;
  priority?: boolean;
}

function ProductFrame({
  alt,
  className,
  crop,
  label,
  priority = false,
  src,
}: ProductFrameProps) {
  return (
    <figure className={cn(styles.productFrame, className)}>
      <div aria-hidden="true" className={styles.windowBar}>
        <span className={styles.windowDot} />
        <span className={styles.windowDot} />
        <span className={styles.windowDot} />
        <span className={styles.windowTitle}>CommonLot · Demo workspace</span>
      </div>
      <div className={cn(styles.productViewport, cropClasses[crop])}>
        <Image
          alt={alt}
          className={styles.productImage}
          fill
          priority={priority}
          sizes="(max-width: 700px) 94vw, (max-width: 1100px) 72vw, 62vw"
          src={src}
        />
      </div>
      <figcaption className={styles.productCaption}>
        <span>{label ?? "Actual CommonLot interface"}</span>
        <span>Illustrative demo data</span>
      </figcaption>
    </figure>
  );
}

function CoordinationThread({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn(styles.coordinationThread, className)}
      preserveAspectRatio="none"
      viewBox="0 0 1000 300"
    >
      <path
        className={styles.threadHalo}
        d="M18 238C158 238 168 62 338 62c167 0 180 172 344 172 148 0 166-132 300-132"
        pathLength="1"
      />
      <path
        className={styles.threadCore}
        d="M18 238C158 238 168 62 338 62c167 0 180 172 344 172 148 0 166-132 300-132"
        pathLength="1"
      />
    </svg>
  );
}

const buyers = [
  { id: "A", quantity: 12, tone: "blue" },
  { id: "B", quantity: 10, tone: "amber" },
  { id: "C", quantity: 8, tone: "sage" },
] as const;

const buyerToneClasses = {
  amber: styles.buyerMarkAmber,
  blue: styles.buyerMarkBlue,
  sage: styles.buyerMarkSage,
} as const;

function BuyerGroup({ id, quantity, tone }: (typeof buyers)[number]) {
  return (
    <div className={styles.buyerGroup}>
      <div className={styles.buyerIdentity}>
        <span className={cn(styles.buyerMark, buyerToneClasses[tone])}>
          {id}
        </span>
        <div>
          <small>Buyer {id}</small>
          <strong>{quantity} cartons</strong>
        </div>
      </div>
      <Image
        alt=""
        aria-hidden="true"
        className={styles.clusterAsset}
        height={619}
        priority={id === "A"}
        src={CARTON_ASSETS.cluster}
        width={1100}
      />
    </div>
  );
}

function MinimumsScene() {
  return (
    <div className={cn(styles.scene, styles.minimumsScene)}>
      <div aria-hidden="true" className={styles.studioLight} />
      <div className={styles.buyerGroups}>
        {buyers.map((buyer) => (
          <BuyerGroup key={buyer.id} {...buyer} />
        ))}
      </div>
      <div className={styles.supplierGate}>
        <span className={styles.gateEyebrow}>Supplier tier</span>
        <strong>30</strong>
        <span>carton minimum</span>
        <div aria-hidden="true" className={styles.gateLine} />
      </div>
      <div className={styles.distanceLabel}>
        <span>Each buyer alone</span>
        <span aria-hidden="true">→</span>
        <strong>Wholesale out of reach</strong>
      </div>
    </div>
  );
}

function ConversationsScene({ screenshot }: { screenshot: AboutScreenshot }) {
  return (
    <div className={cn(styles.scene, styles.conversationsScene)}>
      <CoordinationThread className={styles.callsThread} />
      <ProductFrame
        {...screenshot}
        className={styles.callsFrame}
        label="Real Calls workspace"
        priority
      />
      <div className={cn(styles.conditionChip, styles.quantityChip)}>
        <Phone aria-hidden="true" />
        <span>Quantity</span>
        <strong>12 cartons</strong>
      </div>
      <div className={cn(styles.conditionChip, styles.priceChip)}>
        <IndianRupee aria-hidden="true" />
        <span>Ceiling</span>
        <strong>₹11,400</strong>
      </div>
      <div className={cn(styles.conditionChip, styles.timingChip)}>
        <CalendarClock aria-hidden="true" />
        <span>Timing</span>
        <strong>This week</strong>
      </div>
      <div className={styles.structuredBadge}>
        <ShieldCheck aria-hidden="true" />
        Structured, private, reviewable
      </div>
    </div>
  );
}

function ThresholdScene() {
  return (
    <div className={cn(styles.scene, styles.thresholdScene)}>
      <div
        aria-label="12 plus 10 plus 8 equals 30"
        className={styles.poolEquation}
        role="img"
      >
        <span>12</span>
        <i>+</i>
        <span>10</span>
        <i>+</i>
        <span>8</span>
        <i>=</i>
        <strong>30</strong>
      </div>
      <div aria-hidden="true" className={styles.sourceLots}>
        {buyers.map((buyer) => (
          <Image
            alt=""
            className={styles.sourceLot}
            height={619}
            key={buyer.id}
            src={CARTON_ASSETS.cluster}
            width={1100}
          />
        ))}
      </div>
      <div className={styles.pooledLot}>
        <div className={styles.unlockedChip}>
          <LockKeyhole aria-hidden="true" />
          Supplier tier unlocked
        </div>
        <Image
          alt="A pooled pallet representing the combined 30-carton CommonLot proposal"
          className={styles.palletAsset}
          height={733}
          priority
          src={CARTON_ASSETS.pallet}
          width={1100}
        />
      </div>
      <div className={styles.priceResult}>
        <div>
          <small>Individual baseline</small>
          <s>₹1,200</s>
        </div>
        <span aria-hidden="true">→</span>
        <div>
          <small>All-in group price</small>
          <strong>₹950</strong>
        </div>
      </div>
      <div className={styles.savingsResult}>
        <span>Potential savings</span>
        <strong>₹7,500</strong>
        <small>Illustrative · not realized</small>
      </div>
    </div>
  );
}

function ProposalScene({ screenshot }: { screenshot: AboutScreenshot }) {
  return (
    <div className={cn(styles.scene, styles.proposalScene)}>
      <ProductFrame
        {...screenshot}
        className={styles.proposalFrame}
        label="Feasible proposal · actual product state"
        priority
      />
      <div className={cn(styles.annotationPin, styles.quantityPin)}>
        <span>1</span>
        <div>
          <small>Combined quantity</small>
          <strong>30 cartons</strong>
        </div>
      </div>
      <div className={cn(styles.annotationPin, styles.savingsPin)}>
        <span>2</span>
        <div>
          <small>Potential savings</small>
          <strong>₹7,500</strong>
        </div>
      </div>
      <div className={styles.organizerControl}>
        <ShieldCheck aria-hidden="true" />
        <span>Proposal, not an order</span>
      </div>
    </div>
  );
}

function ShortfallScene({ screenshot }: { screenshot: AboutScreenshot }) {
  return (
    <div className={cn(styles.scene, styles.shortfallScene)}>
      <ProductFrame
        {...screenshot}
        className={styles.shortfallFrame}
        label="Updated immediately · actual product state"
        priority
      />
      <div className={styles.changeChip}>
        <span className={styles.buyerMonogram}>C</span>
        <div>
          <small>Buyer C changed</small>
          <strong>8 → 6 cartons</strong>
        </div>
      </div>
      <div aria-hidden="true" className={styles.departingBoxes}>
        <Image
          alt=""
          className={styles.departingBoxOne}
          height={733}
          src={CARTON_ASSETS.single}
          width={1100}
        />
        <Image
          alt=""
          className={styles.departingBoxTwo}
          height={733}
          src={CARTON_ASSETS.single}
          width={1100}
        />
      </div>
      <div className={styles.shortfallResult}>
        <CircleAlert aria-hidden="true" />
        <div>
          <strong>28 / 30</strong>
          <span>2 cartons short</span>
        </div>
      </div>
    </div>
  );
}

function ReconfirmScene({
  after,
  before,
}: {
  after: AboutScreenshot;
  before: AboutScreenshot;
}) {
  return (
    <div className={cn(styles.scene, styles.reconfirmScene)}>
      <div className={styles.reconfirmScreens}>
        <ProductFrame
          {...before}
          className={cn(styles.reconfirmFrame, styles.beforeFrame)}
          label="Blocked · old authorization"
          priority
        />
        <ProductFrame
          {...after}
          className={cn(styles.reconfirmFrame, styles.afterFrame)}
          label="Ready · explicitly reconfirmed"
        />
      </div>
      <CoordinationThread className={styles.reconfirmThread} />
      <div className={styles.authorizationChip}>
        <span className={styles.buyerMonogram}>A</span>
        <div>
          <small>Explicit new ceiling</small>
          <strong>₹11,400 → ₹13,300</strong>
        </div>
        <Check aria-hidden="true" />
      </div>
      <div className={styles.reconfirmEquation}>
        <span>14</span>
        <i>+</i>
        <span>10</span>
        <i>+</i>
        <span>6</span>
        <i>=</i>
        <strong>30</strong>
        <em>Ready for review</em>
      </div>
    </div>
  );
}

const evidenceModes = [
  { icon: PhoneCall, label: "LIVE", note: "in progress", tone: "live" },
  { icon: Mic2, label: "RECORDED", note: "completed call", tone: "recorded" },
  {
    icon: FlaskConical,
    label: "SIMULATED",
    note: "demo result",
    tone: "simulated",
  },
] as const;

const evidenceToneClasses = {
  live: styles.evidenceIconLive,
  recorded: styles.evidenceIconRecorded,
  simulated: styles.evidenceIconSimulated,
} as const;

function AccountabilityScene({
  calls,
  order,
}: {
  calls: AboutScreenshot;
  order: AboutScreenshot;
}) {
  return (
    <div className={cn(styles.scene, styles.accountabilityScene)}>
      <ProductFrame
        {...calls}
        className={cn(styles.auditFrame, styles.auditCallsFrame)}
        label="Evidence and structured result"
        priority
      />
      <ProductFrame
        {...order}
        className={cn(styles.auditFrame, styles.auditOrderFrame)}
        label="Organizer-controlled order timeline"
      />
      <section aria-label="Evidence modes" className={styles.evidenceModes}>
        {evidenceModes.map(({ icon: Icon, label, note, tone }) => (
          <div className={styles.evidenceMode} key={label}>
            <Icon aria-hidden="true" className={evidenceToneClasses[tone]} />
            <div>
              <strong>{label}</strong>
              <span>{note}</span>
            </div>
          </div>
        ))}
      </section>
      <div className={styles.auditTakeaway}>
        <Sparkles aria-hidden="true" className={styles.auditTakeawayIcon} />
        One accountable path from call to order
      </div>
    </div>
  );
}

export function SlideVisual({
  id,
  screenshots = [],
}: {
  id: AboutSlideId;
  screenshots?: readonly AboutScreenshot[];
}) {
  switch (id) {
    case "minimums":
      return <MinimumsScene />;
    case "conversations":
      return screenshots[0] ? (
        <ConversationsScene screenshot={screenshots[0]} />
      ) : null;
    case "threshold":
      return <ThresholdScene />;
    case "proposal":
      return screenshots[0] ? (
        <ProposalScene screenshot={screenshots[0]} />
      ) : null;
    case "shortfall":
      return screenshots[0] ? (
        <ShortfallScene screenshot={screenshots[0]} />
      ) : null;
    case "reconfirm":
      return screenshots[0] && screenshots[1] ? (
        <ReconfirmScene after={screenshots[1]} before={screenshots[0]} />
      ) : null;
    case "accountability":
      return screenshots[0] && screenshots[1] ? (
        <AccountabilityScene calls={screenshots[0]} order={screenshots[1]} />
      ) : null;
    default:
      return null;
  }
}
