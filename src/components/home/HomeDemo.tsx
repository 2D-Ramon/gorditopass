"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PLATFORM } from "@/lib/pricing";
import { FoodTile } from "./FoodTile";
import { Icon } from "./Icon";
import { SAMPLE_DISCOVER } from "./content";
import { useJoin } from "./HomeJoin";
import s from "./home.module.css";

type DemoState = "ticket" | "qr" | "done";

const QR_SECONDS = 30;

const SCREENS = [
  {
    id: "deals",
    title: "Exclusive deals and savings",
    body: "Free items or 20%+ off, members only. Redeemed in store.",
  },
  {
    id: "local",
    title: "Support local",
    body: `Restaurants join free. ${PLATFORM.name} takes no cut of what you spend there.`,
  },
  {
    id: "new",
    title: "Discover new foods",
    body: "A new cuisine every week? Easy. Plate reviews and a city feed point the way.",
  },
] as const;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function qrPath(seed: number) {
  const N = 25;
  const r = rng(seed);
  const g: boolean[][] = [];
  const inFinder = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= N - 8 && y < 8) || (x < 8 && y >= N - 8);
  for (let i = 0; i < N; i++) {
    g[i] = [];
    for (let j = 0; j < N; j++) g[i][j] = !inFinder(j, i) && r() > 0.52;
  }
  for (let i = 8; i < N - 8; i++) {
    g[6][i] = i % 2 === 0;
    g[i][6] = i % 2 === 0;
  }
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++)
      for (let x = 0; x < 7; x++)
        g[oy + y][ox + x] =
          x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
  };
  finder(0, 0);
  finder(N - 7, 0);
  finder(0, N - 7);
  for (let y = -2; y <= 2; y++)
    for (let x = -2; x <= 2; x++)
      g[N - 9 + y][N - 9 + x] = Math.max(Math.abs(x), Math.abs(y)) !== 1;
  let p = "";
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) if (g[i][j]) p += `M${j} ${i}h1v1h-1z`;
  return p;
}

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduce(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduce;
}

/** Phone demo under How it works. Screens scroll sideways; nothing auto-advances. */
export function HomeDemo() {
  const { celebrate, wantBar } = useJoin();
  const reduce = usePrefersReducedMotion();
  const [demo, setDemo] = useState<DemoState>("ticket");
  const [seed, setSeed] = useState(1207);
  const [elapsed, setElapsed] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [doneAt, setDoneAt] = useState("");
  const [order, setOrder] = useState([0, 1, 2]);
  const [saved, setSaved] = useState(0);
  const [index, setIndex] = useState(0);
  const reelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reel = reelRef.current;
    if (!reel) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atStart = reel.scrollLeft <= 0 && e.deltaY < 0;
      const atEnd =
        reel.scrollLeft + reel.clientWidth >= reel.scrollWidth - 1 && e.deltaY > 0;
      if (atStart || atEnd) return;
      e.preventDefault();
      reel.scrollLeft += e.deltaY;
    };
    reel.addEventListener("wheel", onWheel, { passive: false });
    return () => reel.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    if (demo !== "qr") return;
    let start = Date.now();
    const id = window.setInterval(() => {
      let el = (Date.now() - start) / 1000;
      if (el >= QR_SECONDS) {
        setSeed((x) => x + 13);
        setFlashKey((k) => k + 1);
        start = Date.now();
        el = 0;
      }
      setElapsed(el);
    }, 200);
    return () => window.clearInterval(id);
  }, [demo]);

  function startQr() {
    wantBar();
    setSeed((x) => x + 7);
    setElapsed(0);
    setDemo("qr");
  }

  function finish() {
    setDoneAt(
      new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    );
    setDemo("done");
    celebrate();
  }

  function swipe(want: boolean) {
    if (want) setSaved((n) => n + 1);
    setOrder((o) => [...o.slice(1), o[0]]);
  }

  function onReelScroll() {
    const reel = reelRef.current;
    if (!reel) return;
    const width = reel.clientWidth || 1;
    const next = Math.round(reel.scrollLeft / width);
    setIndex(Math.max(0, Math.min(SCREENS.length - 1, next)));
  }

  function go(next: number) {
    const reel = reelRef.current;
    if (!reel) return;
    reel.scrollTo({
      left: next * reel.clientWidth,
      behavior: reduce ? "auto" : "smooth",
    });
  }

  const qr = useMemo(() => qrPath(seed), [seed]);
  const secondsLeft = Math.max(1, Math.ceil(QR_SECONDS - elapsed));
  const caption = demo === "done" && index === 0
    ? {
        title: "That's the whole thing.",
        body: "Staff scans, you save. Ready for your own?",
      }
    : SCREENS[index];

  return (
    <div className={s.demoBlock}>
      <p className={s.demoHint}>Scroll sideways to see each screen.</p>
      <div
        className={`${s.phone} ${s.demoPhone}`}
        role="region"
        aria-label="Sample screens of the member pass. Scroll sideways."
      >
        <div
          className={s.reel}
          ref={reelRef}
          onScroll={onReelScroll}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              go(Math.min(SCREENS.length - 1, index + 1));
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              go(Math.max(0, index - 1));
            }
          }}
        >
          <div className={s.screen} id="home-scr-deals">
            <span className={s.demoLabel}>
              <i />
              Demo with a sample restaurant
            </span>
            {demo === "ticket" && (
              <div className={s.ds}>
                <div className={s.pt}>
                  <FoodTile food="burger" sample sizes="290px" priority />
                  <div className={s.ptBody}>
                    <div className={s.ptMeta}>Corner Burger Co. · Deep Ellum</div>
                    <div className={s.ptDeal}>Free fries with any entrée</div>
                    <div className={s.ptFine}>
                      <Icon name="store" size={14} />
                      Redeem in store
                    </div>
                  </div>
                </div>
                <button type="button" className={s.redeem} onClick={startQr}>
                  <Icon name="qr" />
                  Tap to redeem
                </button>
              </div>
            )}
            {demo === "qr" && (
              <div className={s.ds}>
                <div className={s.qrWrap}>
                  <svg className={s.ringSvg} viewBox="0 0 196 196" aria-hidden>
                    <rect className={s.ringTrack} x="3" y="3" width="190" height="190" rx="24" />
                    <rect
                      className={s.ringProg}
                      x="3"
                      y="3"
                      width="190"
                      height="190"
                      rx="24"
                      pathLength={100}
                      strokeDasharray="100"
                      strokeDashoffset={((elapsed / QR_SECONDS) * 100).toFixed(1)}
                    />
                  </svg>
                  <div key={flashKey} className={`${s.qrBox} ${flashKey ? s.flash : ""}`}>
                    <svg
                      viewBox="0 0 25 25"
                      shapeRendering="crispEdges"
                      role="img"
                      aria-label="Sample QR code, not scannable"
                    >
                      <path d={qr} fill="#09090b" />
                    </svg>
                  </div>
                </div>
                <div className={s.qrTitle}>Show this at the counter</div>
                <div className={s.qrSub}>Staff scans it with their phone.</div>
                <div className={s.qrTimer}>New code in {secondsLeft}s</div>
                <button type="button" className={s.phBtn} onClick={finish}>
                  <Icon name="scan" size={16} />
                  Simulate staff scan
                </button>
              </div>
            )}
            {demo === "done" && (
              <div className={s.ds}>
                <div className={s.checkCircle}>
                  <Icon name="check" size={56} strokeWidth={3} />
                </div>
                <div className={s.doneTitle}>Redeemed</div>
                <div className={s.doneLine}>
                  <span>Maya · Free fries · {doneAt}</span>
                  <small>Sample member. This is the green check staff sees.</small>
                </div>
                <div className={s.doneNote}>Staff rings up your meal as usual.</div>
                <button type="button" className={s.phBtn} onClick={() => setDemo("ticket")}>
                  <Icon name="replay" size={16} />
                  Replay demo
                </button>
              </div>
            )}
          </div>

          <div className={s.screen} id="home-scr-local">
            <span className={s.demoLabel}>
              <i />
              Sample restaurant profile
            </span>
            <div className={s.prof}>
              <FoodTile food="tacos" sample sizes="290px" />
              <div className={s.profIn}>
                <span className={s.tagMint}>Neighborhood spot</span>
                <h3>Casa Lupita</h3>
                <div className={s.where}>Tacos · Bishop Arts</div>
                <p className={s.story}>
                  Owner&apos;s story goes here: why they opened, what to order first.
                </p>
                <ul className={s.profList}>
                  <li>
                    <Icon name="check" size={16} strokeWidth={2.6} />
                    Joined free
                  </li>
                  <li>
                    <Icon name="check" size={16} strokeWidth={2.6} />
                    No cut of in-store sales
                  </li>
                </ul>
              </div>
            </div>
            <p className={s.phNote}>You pay the restaurant at the register, as usual.</p>
          </div>

          <div className={s.screen} id="home-scr-new">
            <span className={s.demoLabel}>
              <i />
              Want to try (samples)
            </span>
            <div className={s.stack}>
              {SAMPLE_DISCOVER.map((d, ci) => {
                const pos = order.indexOf(ci);
                return (
                  <div key={d.name} className={s.dcard} data-pos={pos} aria-hidden={pos !== 0}>
                    <FoodTile food={d.food} sample sizes="290px" />
                    <div className={s.dcIn}>
                      <div className={s.cuisine}>{d.cuisine}</div>
                      <h3>{d.name}</h3>
                      <div
                        className="plate-dots mt-2"
                        role="img"
                        aria-label={`${d.plates} out of 5 plates, sample rating`}
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <span
                            key={n}
                            className={`plate-dot ${n <= d.plates ? "filled" : ""}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={s.swipeActions}>
              <button type="button" className={s.swSkip} onClick={() => swipe(false)}>
                <Icon name="x" size={16} />
                Skip
              </button>
              <button type="button" className={s.swWant} onClick={() => swipe(true)}>
                <Icon name="heart" size={16} />
                Want to try
              </button>
            </div>
            <div className={s.wantCount} aria-live="polite">
              Saved to want-to-try: {saved}
            </div>
          </div>
        </div>
      </div>
      <div className={s.demoDots} role="tablist" aria-label="Phone screens">
        {SCREENS.map((screen, i) => (
          <button
            key={screen.id}
            type="button"
            className={s.demoDot}
            role="tab"
            aria-label={screen.title}
            aria-selected={index === i}
            onClick={() => go(i)}
          />
        ))}
      </div>
      <div className={s.demoCaption} aria-live="polite">
        <h3>{caption.title}</h3>
        <p>{caption.body}</p>
      </div>
    </div>
  );
}
