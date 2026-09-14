"use client";

import { Button, buttonVariants } from "@call-e-commonlot/ui/components/button";
import { cn } from "@call-e-commonlot/ui/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Expand,
  ExternalLink,
  RotateCcw,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import styles from "./about.module.css";
import { aboutSlides, clampSlideNumber } from "./about-data";
import { SlideVisual } from "./about-illustrations";

const CONTROLS_IDLE_DELAY_MS = 2500;
const SWIPE_THRESHOLD_PX = 55;

const updateUrl = (
  slide: number,
  presenting: boolean,
  mode: "push" | "replace"
) => {
  const url = new URL(window.location.href);
  url.searchParams.set("slide", String(slide));
  if (presenting) {
    url.searchParams.set("present", "1");
  } else {
    url.searchParams.delete("present");
  }
  window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", url);
};

interface CarouselStageProps {
  controlsVisible: boolean;
  currentSlide: number;
  onExitPresent: () => void;
  onNavigate: (slide: number) => void;
  onPresent: () => void;
  onReplay: () => void;
  onWakeControls: () => void;
  presenting: boolean;
  replayKey: number;
}

function CarouselStage({
  controlsVisible,
  currentSlide,
  onExitPresent,
  onNavigate,
  onPresent,
  onReplay,
  onWakeControls,
  presenting,
  replayKey,
}: CarouselStageProps) {
  const slide = aboutSlides[currentSlide - 1] ?? aboutSlides[0];
  const goPrevious = () => onNavigate(currentSlide - 1);
  const goNext = () => onNavigate(currentSlide + 1);

  return (
    <section
      aria-label="How CommonLot turns conversations into a workable shared purchase"
      aria-roledescription="carousel"
      className={styles.stage}
      data-carousel-stage
      data-presenting={presenting ? "true" : "false"}
      onPointerMove={onWakeControls}
    >
      <article
        aria-label={`Slide ${currentSlide} of ${aboutSlides.length}`}
        aria-roledescription="slide"
        className={styles.slide}
        data-accent={slide.accent}
        data-composition={slide.composition}
        key={`${slide.id}-${replayKey}-${presenting ? "present" : "page"}`}
      >
        <div aria-hidden="true" className={styles.paperGlow} />
        <div className={styles.slideGrid}>
          <header className={styles.copy}>
            <p className={styles.eyebrow}>
              <span className={styles.slideNumber}>
                {String(currentSlide).padStart(2, "0")}
              </span>
              {slide.eyebrow}
            </p>
            <h1 className={styles.title}>{slide.title}</h1>
            <p className={styles.description}>{slide.description}</p>
            <p className={styles.takeaway}>{slide.takeaway}</p>
            {slide.id === "accountability" ? (
              <div className={styles.finalActions}>
                <Button onClick={() => onNavigate(1)}>
                  <RotateCcw aria-hidden="true" data-icon="inline-start" />
                  Replay story
                </Button>
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href="/login?mode=sign-up"
                >
                  Create account
                </Link>
                <Link
                  className={buttonVariants({ variant: "ghost" })}
                  href="/dashboard"
                >
                  Open CommonLot
                  <ExternalLink aria-hidden="true" data-icon="inline-end" />
                </Link>
              </div>
            ) : null}
          </header>
          <div className={styles.visual}>
            <SlideVisual id={slide.id} screenshots={slide.screenshots} />
          </div>
        </div>

        <nav
          aria-label="Carousel controls"
          className={cn(
            styles.controls,
            presenting && !controlsVisible && styles.controlsHidden
          )}
        >
          <Button
            aria-label="Previous slide"
            disabled={currentSlide === 1}
            onClick={goPrevious}
            size="icon-lg"
            variant="ghost"
          >
            <ArrowLeft aria-hidden="true" />
          </Button>
          <span className={styles.progress}>
            <strong>{String(currentSlide).padStart(2, "0")}</strong>
            <span aria-hidden="true">/</span>
            {String(aboutSlides.length).padStart(2, "0")}
          </span>
          <fieldset className={styles.dots}>
            <legend className="sr-only">Choose a slide</legend>
            {aboutSlides.map((item, index) => {
              const slideNumber = index + 1;
              return (
                <button
                  aria-current={
                    slideNumber === currentSlide ? "step" : undefined
                  }
                  aria-label={`Go to slide ${slideNumber}: ${item.title}`}
                  className={cn(
                    styles.dot,
                    slideNumber === currentSlide && styles.dotActive
                  )}
                  key={item.id}
                  onClick={() => onNavigate(slideNumber)}
                  type="button"
                />
              );
            })}
          </fieldset>
          <Button
            aria-keyshortcuts="R"
            aria-label="Replay this scene"
            onClick={onReplay}
            size="icon-lg"
            variant="ghost"
          >
            <RotateCcw aria-hidden="true" />
          </Button>
          <Button
            aria-label={
              presenting ? "Exit presentation" : "Present full screen"
            }
            className={styles.presentButton}
            onClick={presenting ? onExitPresent : onPresent}
            size="sm"
            variant="ghost"
          >
            {presenting ? (
              <X aria-hidden="true" data-icon="inline-start" />
            ) : (
              <Expand aria-hidden="true" data-icon="inline-start" />
            )}
            <span>{presenting ? "Exit" : "Present"}</span>
          </Button>
          <Button
            aria-label="Next slide"
            disabled={currentSlide === aboutSlides.length}
            onClick={goNext}
            size="icon-lg"
            variant="ghost"
          >
            <ArrowRight aria-hidden="true" />
          </Button>
        </nav>
      </article>
    </section>
  );
}

export function AboutCarousel({
  initialPresenting,
  initialSlide,
}: {
  initialPresenting: boolean;
  initialSlide: number;
}) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide);
  const [presenting, setPresenting] = useState(initialPresenting);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wakeControls = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(controlsTimer.current ?? undefined);
    if (presenting) {
      controlsTimer.current = setTimeout(
        () => setControlsVisible(false),
        CONTROLS_IDLE_DELAY_MS
      );
    }
  }, [presenting]);

  const replayScene = useCallback(() => {
    setReplayKey((value) => value + 1);
    wakeControls();
  }, [wakeControls]);

  const navigate = useCallback(
    (requestedSlide: number) => {
      const nextSlide = Math.min(
        aboutSlides.length,
        Math.max(1, requestedSlide)
      );
      if (nextSlide === currentSlide) {
        wakeControls();
        return;
      }
      setCurrentSlide(nextSlide);
      setReplayKey(0);
      updateUrl(nextSlide, presenting, "push");
      wakeControls();
    },
    [currentSlide, presenting, wakeControls]
  );

  const exitPresentation = useCallback(() => {
    dialogRef.current?.close();
    setPresenting(false);
    setControlsVisible(true);
    updateUrl(currentSlide, false, "replace");
  }, [currentSlide]);

  useEffect(() => {
    const onPopState = () => {
      const url = new URL(window.location.href);
      setCurrentSlide(clampSlideNumber(url.searchParams.get("slide")));
      setPresenting(url.searchParams.get("present") === "1");
      setReplayKey(0);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!(presenting && dialog)) {
      return;
    }
    if (!dialog.open) {
      dialog.showModal();
    }
    wakeControls();
  }, [presenting, wakeControls]);

  useEffect(
    () => () => {
      clearTimeout(controlsTimer.current ?? undefined);
    },
    []
  );

  useEffect(() => {
    const isWithinCarousel = (target: EventTarget | null) =>
      target instanceof Element && target.closest("[data-carousel-stage]");

    const handleKeyDown = (event: KeyboardEvent) => {
      const { target } = event;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      ) {
        return;
      }
      wakeControls();
      const navigationByKey: Record<string, number> = {
        ArrowLeft: currentSlide - 1,
        ArrowRight: currentSlide + 1,
        End: aboutSlides.length,
        Home: 1,
        PageDown: currentSlide + 1,
        PageUp: currentSlide - 1,
      };
      const requestedSlide = navigationByKey[event.key];
      if (requestedSlide !== undefined) {
        event.preventDefault();
        navigate(requestedSlide);
        return;
      }
      if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        replayScene();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (isWithinCarousel(event.target)) {
        pointerStart.current = event.clientX;
        wakeControls();
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      const start = pointerStart.current;
      pointerStart.current = null;
      if (start === null || !isWithinCarousel(event.target)) {
        return;
      }
      const distance = event.clientX - start;
      if (Math.abs(distance) >= SWIPE_THRESHOLD_PX) {
        navigate(currentSlide + (distance < 0 ? 1 : -1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [currentSlide, navigate, replayScene, wakeControls]);

  const enterPresentation = () => {
    setPresenting(true);
    updateUrl(currentSlide, true, "push");
  };

  const stageProps = {
    controlsVisible,
    currentSlide,
    onExitPresent: exitPresentation,
    onNavigate: navigate,
    onPresent: enterPresentation,
    onReplay: replayScene,
    onWakeControls: wakeControls,
    replayKey,
  };

  return (
    <main className={styles.aboutPage}>
      <p aria-live="polite" className="sr-only">
        Slide {currentSlide} of {aboutSlides.length}:{" "}
        {aboutSlides[currentSlide - 1]?.title}
      </p>
      <div className={styles.pageStage}>
        {presenting ? (
          <div aria-hidden="true" className={styles.stagePlaceholder} />
        ) : (
          <CarouselStage {...stageProps} presenting={false} />
        )}
      </div>
      {presenting ? (
        <dialog
          aria-label="CommonLot presentation"
          className={styles.presentDialog}
          onCancel={(event) => {
            event.preventDefault();
            exitPresentation();
          }}
          onClose={() => {
            if (presenting) {
              setPresenting(false);
              updateUrl(currentSlide, false, "replace");
            }
          }}
          ref={dialogRef}
        >
          <CarouselStage {...stageProps} presenting />
        </dialog>
      ) : null}
    </main>
  );
}
