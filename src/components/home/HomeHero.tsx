"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PLATFORM } from "@/lib/pricing";
import { FoodTile } from "./FoodTile";
import { Icon } from "./Icon";
import { SAMPLE_DISCOVER } from "./content";
import { HERO_CTA_ID, JoinButton, useJoin } from "./HomeJoin";
import s from "./home.module.css";

type Tab = "local" | "deals" | "new";
type DemoState = "ticket" | "qr" | "done";

const TABS: { id: Tab; label: string; icon: "pin" | "ticket" | "compass" }[] = [
  { id: "local", label: "Local", icon: "pin" },
  { id: "deals", label: "Deals", icon: "ticket" },
  { id: "new", label: "New foods", icon: "compass" },
];

const AUTO_SEQUENCE: Tab[] = ["deals", "new", "local"];
const AUTO_MS = 6000;
const QR_SECONDS = 30;

/* ---- QR-like pattern (illustrative, not scannable) ---- */
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

export function HomeHero() {
  const { celebrate, wantBar } = useJoin();
  const reduce = usePrefersReducedMotion();
  const [tab, setTab] = useState<Tab>("deals");
  const [demo, setDemo] = useState<DemoState>("ticket");
  const [seed, setSeed] = useState(1207);
  const [elapsed, setElapsed] = useState(0);
  const [flashKey, setFlashKey] = useState(0);
  const [doneAt, setDoneAt] = useState("");
  const [order, setOrder] = useState([0, 1, 2]);
  const [saved, setSaved] = useState(0);
  const [touched, setTouched] = useState(false);
  const [inView, setInView] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    local: null,
    deals: null,
    new: null,
  });

  const stopAuto = useCallback(() => setTouched(true), []);

  /* 30s refresh ring while the QR is showing */
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

  /* auto-advance the chips until the visitor touches the demo */
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduce || touched || !inView) return;
    if (tab === "deals" && demo !== "ticket") return;
    const id = window.setTimeout(() => {
      const i = AUTO_SEQUENCE.indexOf(tab);
      setTab(AUTO_SEQUENCE[(i + 1) % AUTO_SEQUENCE.length]);
    }, AUTO_MS);
    return () => window.clearTimeout(id);
  }, [reduce, touched, inView, tab, demo]);

  function startQr() {
    stopAuto();
    wantBar();
    setSeed((x) => x + 7);
    setElapsed(0);
    setDemo("qr");
  }

  function finish() {
    stopAuto();
    setDoneAt(
      new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
    );
    setDemo("done");
    celebrate();
  }

  function swipe(want: boolean) {
    stopAuto();
    if (want) setSaved((n) => n + 1);
    setOrder((o) => [...o.slice(1), o[0]]);
  }

  function selectTab(next: Tab, focus = false) {
    stopAuto();
    setTab(next);
    if (focus) tabRefs.current[next]?.focus();
  }

  function onTabKey(e: React.KeyboardEvent, i: number) {
    let n: number | null = null;
    if (e.key === "ArrowRight") n = (i + 1) % TABS.length;
    if (e.key === "ArrowLeft") n = (i + TABS.length - 1) % TABS.length;
    if (n !== null) {
      e.preventDefault();
      selectTab(TABS[n].id, true);
    }
  }

  const qr = useMemo(() => qrPath(seed), [seed]);
  const ui = tab === "deals" ? demo : tab;
  const caption = tab === "deals" ? (demo === "done" ? "done" : "deals") : tab;
  const secondsLeft = Math.max(1, Math.ceil(QR_SECONDS - elapsed));
  const stopEvents = {
    onPointerDown: stopAuto,
    onKeyDown: stopAuto,
    onTouchStart: stopAuto,
  };

  return (
    <section className={s.hero} aria-labelledby="home-h1">
      <div className={s.container}>
        <div className={s.heroGrid}>
          <div className={s.heroCopy}>
            <p className={`gp-badge ${s.eyebrow}`}>
              <Icon name="pin" size={13} />
              Member pass for neighborhood restaurants
            </p>
            <h1 id="home-h1" className={s.h1}>
              <span className={s.line}>Eat local.</span>{" "}
              <span className={`${s.line} ${s.hot}`}>Pay less.</span>{" "}
              <span className={s.line}>Try something new.</span>
            </h1>
            <p className={s.sub}>
              {PLATFORM.name} is a member pass for neighborhood restaurants:
              exclusive deals, no chains required.
            </p>
          </div>

          <div className={s.stage} ref={stageRef} data-ui={ui} {...stopEvents}>
            <div className={s.glow} aria-hidden />
            <div className={s.stTaco} aria-hidden>
              <Icon name="taco" size={36} strokeWidth={1.8} />
            </div>
            <div className={s.stPin} aria-hidden>
              <Icon name="pin" size={26} />
            </div>
            <div className={s.stTicket} aria-hidden>
              Free fries<small>Sample deal</small>
            </div>
            <div className={s.tryit} aria-hidden>
              <span>Try it</span>
              <svg viewBox="0 0 78 44">
                <path d="M4 6c14 -2 30 4 40 18 6 8 12 12 24 13" />
                <path d="M58 28l11 9-14 5" />
              </svg>
            </div>

            <div
              className={s.phone}
              role="group"
              aria-label="Interactive demo of the member pass on a phone, using a sample restaurant"
            >
              {/* Deals screen */}
              <div
                className={s.screen}
                id="home-scr-deals"
                role="tabpanel"
                aria-labelledby="home-tab-deals"
                hidden={tab !== "deals"}
              >
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
                      <div
                        key={flashKey}
                        className={`${s.qrBox} ${flashKey ? s.flash : ""}`}
                      >
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
                    <button
                      type="button"
                      className={s.phBtn}
                      onClick={() => setDemo("ticket")}
                    >
                      <Icon name="replay" size={16} />
                      Replay demo
                    </button>
                  </div>
                )}
              </div>

              {/* Local screen */}
              <div
                className={s.screen}
                id="home-scr-local"
                role="tabpanel"
                aria-labelledby="home-tab-local"
                hidden={tab !== "local"}
              >
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
                      Owner&apos;s story goes here: why they opened, what to order
                      first.
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

              {/* New foods screen */}
              <div
                className={s.screen}
                id="home-scr-new"
                role="tabpanel"
                aria-labelledby="home-tab-new"
                hidden={tab !== "new"}
              >
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

          <div className={s.heroCta}>
            <JoinButton id={HERO_CTA_ID} pulse />
            <div className={s.second}>
              <a className={s.link} href="#deals">
                Browse deals free
              </a>
            </div>
            <div className={s.facts} aria-label="Quick facts">
              <span>
                <Icon name="store" size={16} />
                Redeem in store
              </span>
              <span>
                <Icon name="check" size={16} />
                Cancel anytime
              </span>
              <span>
                <Icon name="check" size={16} />
                18+
              </span>
            </div>
          </div>

          <div className={s.pillars} {...stopEvents}>
            <div className={s.plLabel}>
              <Icon name="phone" size={16} />
              Three reasons to carry the pass. Tap one.
            </div>
            <div className={s.chips} role="tablist" aria-label="What the pass does">
              {TABS.map((t, i) => (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`home-tab-${t.id}`}
                  data-tab={t.id}
                  className={s.chip}
                  aria-selected={tab === t.id}
                  aria-controls={`home-scr-${t.id}`}
                  tabIndex={tab === t.id ? 0 : -1}
                  onClick={() => selectTab(t.id)}
                  onKeyDown={(e) => onTabKey(e, i)}
                >
                  <Icon name={t.icon} size={18} />
                  {t.label}
                </button>
              ))}
            </div>
            <div aria-live="polite">
              {caption === "local" && (
                <div className={s.caption}>
                  <h2>Support local</h2>
                  <p>
                    Restaurants join free. {PLATFORM.name} takes no cut of what you
                    spend there.
                  </p>
                </div>
              )}
              {caption === "deals" && (
                <div className={s.caption}>
                  <h2>Exclusive deals and savings</h2>
                  <p>Free items or 20%+ off, members only. Redeemed in store.</p>
                  <p className={s.fine}>
                    Demo with a sample restaurant. No account needed to try it.
                  </p>
                </div>
              )}
              {caption === "done" && (
                <div className={s.caption}>
                  <h2>That&apos;s the whole thing.</h2>
                  <p>Staff scans, you save. Ready for your own?</p>
                </div>
              )}
              {caption === "new" && (
                <div className={s.caption}>
                  <h2>Discover new foods</h2>
                  <p>
                    A new cuisine every week? Easy. Plate reviews and a city feed
                    point the way.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
