"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";

export type FrameSequenceStep = {
  from: number;
  to: number;
  color: string;
  num: string;
  total: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  label: string;
};

export type FrameSequenceHeroProps = {
  frameCount: number;
  framePath: (i: number) => string;
  eagerCount?: number;
  scrollHeight?: string;
  brand?: React.ReactNode;
  navLinks?: { label: string; href: string }[];
  ctaLabel?: string;
  ctaHref?: string;
  title: React.ReactNode;
  subtitle?: string;
  steps: FrameSequenceStep[];
  className?: string;
};

const cx = (...c: (string | false | null | undefined)[]) =>
  c.filter(Boolean).join(" ");

/*
 * Performance notes:
 * - Frames are preloaded and decoded (img.decode()) before they are shown; the visible <img>
 *   only ever switches to a frame that is ready, falling back to the nearest ready frame, so
 *   fast scrolling never waits on the network or shows a blank frame.
 * - Scroll only records where the page is; one requestAnimationFrame loop does all the work,
 *   and the frame is set by writing img.src directly, not through React state.
 * - Per-frame values (progress bar, step ticks) are written straight to the DOM, not React
 *   state; state changes only when the active step, loader or header threshold changes.
 * - The progress bar and ticks move with transform: scaleX(), never width.
 * - Layout (the scroll distance) is measured on resize, not on every scroll event.
 * - Easing towards the target frame is time-based, so it feels the same at 60 Hz and 120 Hz.
 */
export function FrameSequenceHero({
  frameCount,
  framePath,
  eagerCount = 140,
  scrollHeight = "600vh",
  brand,
  navLinks = [],
  ctaLabel,
  ctaHref = "#",
  title,
  subtitle,
  steps,
  className,
}: FrameSequenceHeroProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const progressRef = useRef<HTMLSpanElement | null>(null);
  const ticksRef = useRef<HTMLSpanElement[][]>([]);

  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(frameCount).fill(null));
  const readyRef = useRef<boolean[]>(new Array(frameCount).fill(false));
  const totalRef = useRef(1);
  const targetRef = useRef(0);
  const displayRef = useRef(0);
  const drawnRef = useRef(-1);
  const activeRef = useRef(-1);
  const localRef = useRef(-1);
  const rafRef = useRef(0);
  const lastTimeRef = useRef(0);
  const flagsRef = useRef({ nav: false, sub: false });

  const [loadPct, setLoadPct] = useState(0);
  const [loaderDone, setLoaderDone] = useState(false);
  const [navScrolled, setNavScrolled] = useState(false);
  const [subHidden, setSubHidden] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  /** Shows frame i, or the nearest frame that has finished decoding. */
  const draw = (i: number) => {
    const view = imgRef.current;
    if (!view) return;
    let j = i;
    if (!readyRef.current[i]) {
      j = -1;
      for (let d = 1; d < frameCount; d++) {
        if (i - d >= 0 && readyRef.current[i - d]) { j = i - d; break; }
        if (i + d < frameCount && readyRef.current[i + d]) { j = i + d; break; }
      }
      if (j < 0) return;
    }
    if (j === drawnRef.current) return;
    const img = imagesRef.current[j];
    if (!img) return;
    view.src = img.src;
    drawnRef.current = j;
  };

  /** Everything that follows the scroll position, once per animation frame. */
  const update = (p: number) => {
    if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`;
    let idx = -1;
    let local = 0;
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      if (p >= s.from && p < s.to) {
        idx = i;
        local = Math.max(0, Math.min(1, (p - s.from) / (s.to - s.from)));
        break;
      }
    }
    const stepChanged = idx !== activeRef.current;
    if (stepChanged) {
      activeRef.current = idx;
      setActiveIdx(idx);
    }
    if (stepChanged || Math.abs(local - localRef.current) > 0.002) {
      localRef.current = local;
      for (const ticks of ticksRef.current) {
        ticks?.forEach((t, j) => {
          if (!t) return;
          const v = j < idx ? 1 : j === idx ? local : 0;
          t.style.transform = `scaleX(${v})`;
        });
      }
    }
  };

  const tick = (now: number) => {
    const dt = Math.min(64, now - (lastTimeRef.current || now));
    lastTimeRef.current = now;
    const diff = targetRef.current - displayRef.current;
    if (Math.abs(diff) < 0.05) displayRef.current = targetRef.current;
    else displayRef.current += diff * (1 - Math.pow(1 - 0.2, dt / 16.67));
    const idx = Math.max(0, Math.min(frameCount - 1, Math.round(displayRef.current)));
    draw(idx);
    update(displayRef.current / Math.max(1, frameCount - 1));
    if (displayRef.current !== targetRef.current) rafRef.current = requestAnimationFrame(tick);
    else rafRef.current = 0;
  };

  const kick = () => {
    if (rafRef.current) return;
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
  };

  // Load: the first `eagerCount` frames before the loader clears, the rest a few at a time.
  useEffect(() => {
    let cancelled = false;
    let settled = 0;
    const eager = Math.min(eagerCount, frameCount);
    const loadOne = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image();
        img.decoding = "async";
        img.src = framePath(i + 1);
        imagesRef.current[i] = img;
        img
          .decode()
          .then(() => {
            if (cancelled) return;
            readyRef.current[i] = true;
            if (Math.abs(i - Math.round(displayRef.current)) <= 2) {
              drawnRef.current = -1;
              draw(Math.round(displayRef.current));
            }
          })
          .catch(() => {})
          .finally(() => {
            if (cancelled) return resolve();
            settled += 1;
            const pct = Math.round((settled / frameCount) * 100);
            setLoadPct((old) => (old === pct ? old : pct));
            if (settled === eager) setLoaderDone(true);
            resolve();
          });
      });
    const queue = (from: number, to: number, parallel: number) => {
      let next = from;
      const worker = async (): Promise<void> => {
        while (!cancelled && next < to) await loadOne(next++);
      };
      return Promise.all(Array.from({ length: parallel }, worker));
    };
    queue(0, eager, 8).then(() => queue(eager, frameCount, 4));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, eagerCount]);

  useEffect(() => {
    const root = rootRef.current;
    let idle = 0;
    const measure = () => {
      const spacer = spacerRef.current;
      if (spacer) totalRef.current = Math.max(1, spacer.offsetHeight - window.innerHeight);
    };
    const onScroll = () => {
      const y = window.scrollY;
      const p = Math.max(0, Math.min(1, y / totalRef.current));
      targetRef.current = p * (frameCount - 1);
      const nav = y > 4;
      const sub = y > 8;
      if (nav !== flagsRef.current.nav) { flagsRef.current.nav = nav; setNavScrolled(nav); }
      if (sub !== flagsRef.current.sub) { flagsRef.current.sub = sub; setSubHidden(sub); }
      // Pause decorative CSS animation while the page is moving.
      root?.classList.add("fsh-scrolling");
      window.clearTimeout(idle);
      idle = window.setTimeout(() => root?.classList.remove("fsh-scrolling"), 160);
      kick();
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    measure();
    onScroll();
    displayRef.current = targetRef.current;
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.clearTimeout(idle);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps, frameCount]);

  return (
    <div ref={rootRef} className={cx("fsh-root", className)}>
      <div aria-hidden className={cx("fsh-loader", loaderDone && "fsh-loader-done")}>
        <div className="fsh-loader-text">
          {loadPct < 100 ? `Loading · ${loadPct}%` : "Ready"}
        </div>
        <div className="fsh-loader-track">
          <span className="fsh-loader-fill" style={{ transform: `scaleX(${loadPct / 100})` }} />
        </div>
      </div>

      <nav className={cx("fsh-nav", navScrolled && "fsh-nav-scrolled")}>
        <div className="fsh-brand">{brand}</div>
        {navLinks.length > 0 && (
          <div className="fsh-nav-links">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href}>{l.label}</a>
            ))}
          </div>
        )}
        {ctaLabel && (
          <a href={ctaHref} className="fsh-cta">{ctaLabel}</a>
        )}
      </nav>

      {/* Pinned stage — always full viewport */}
      <div className="fsh-stage">
        <div className="fsh-canvas-wrap">
          <img
            ref={imgRef}
            src={framePath(1)}
            alt=""
            className="fsh-canvas"
            draggable={false}
            decoding="sync"
          />
        </div>

        <div className="fsh-copy">
          <h1 className="fsh-title">{title}</h1>
          {subtitle && (
            <p className={cx("fsh-sub", subHidden && "fsh-sub-hidden")}>{subtitle}</p>
          )}
        </div>

        <div className="fsh-cards">
          {steps.map((s, i) => {
            const isActive = activeIdx === i;
            const isPrev = activeIdx >= 0 && i < activeIdx;
            return (
              <article
                key={i}
                style={{ ["--c" as any]: s.color }}
                className={cx(
                  "fsh-card",
                  isActive && "fsh-card-active",
                  isPrev && "fsh-card-prev"
                )}
              >
                <div className="fsh-card-inner">
                  <span aria-hidden className="fsh-card-glow" />
                  <div className="fsh-card-head">
                    <span className="fsh-card-num">
                      <strong>{s.num}</strong> / {s.total}
                    </span>
                    <span aria-hidden className="fsh-card-icon">
                      {s.icon ?? "✦"}
                    </span>
                  </div>
                  <h3 className="fsh-card-title">{s.title}</h3>
                  <p className="fsh-card-desc">{s.description}</p>
                  <div className="fsh-card-foot">
                    <div className="fsh-ticks">
                      {steps.map((_, j) => (
                        <i key={j} className="fsh-tick">
                          <span
                            ref={(el) => {
                              (ticksRef.current[i] ??= [])[j] = el as HTMLSpanElement;
                            }}
                            style={{ transform: "scaleX(0)" }}
                          />
                        </i>
                      ))}
                    </div>
                    <span className="fsh-card-label">{s.label}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="fsh-progress">
          <span ref={progressRef} className="fsh-progress-fill" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>

      {/* Empty scroll spacer: gives the page its scroll distance */}
      <div ref={spacerRef} className="fsh-spacer" style={{ height: scrollHeight }} />
    </div>
  );
}
