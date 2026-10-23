"use client";

import { useEffect, useRef, useState } from "react";
import s from "./home.module.css";

const SCREENS = [
  {
    id: "profile",
    title: "Restaurant profile",
    body: "Open any card for the full spot — deals, plates, and story.",
    label: "Restaurant profile",
    src: "/home-demo/slide-01-profile.png",
  },
  {
    id: "badges",
    title: "Badges",
    body: "Earn achievement badges as you redeem, review, and explore.",
    label: "Account · Badges",
    src: "/home-demo/slide-02-badges.png",
  },
  {
    id: "passports",
    title: "Passports",
    body: "Stamp cuisine passports by visiting every partner in a category.",
    label: "Account · Passports",
    src: "/home-demo/slide-03-passports.png",
  },
  {
    id: "feed",
    title: "City feed",
    body: "Posts and reply threads from members in your city.",
    label: "City feed",
    src: "/home-demo/slide-04-feed.png",
  },
  {
    id: "events",
    title: "Events",
    body: "Upcoming partner nights — reserve, get directions, share.",
    label: "Events",
    src: "/home-demo/slide-05-events.png",
  },
  {
    id: "want",
    title: "Want to try",
    body: "Swipe right to save a spot, left to skip.",
    label: "On the Menu · Want to try",
    src: "/home-demo/slide-06-want-to-try.png",
  },
  {
    id: "possibilities",
    title: "Possibilities",
    body: "Spin the slots when you can’t decide where to eat.",
    label: "On the Menu · Possibilities",
    src: "/home-demo/slide-07-possibilities.png",
  },
] as const;

/** Phone demo under How it works. Real page captures scroll sideways; nothing auto-advances. */
export function HomeDemo() {
  const [index, setIndex] = useState(0);
  const reelRef = useRef<HTMLDivElement>(null);

  function go(i: number) {
    const el = reelRef.current;
    if (!el) return;
    const w = el.clientWidth;
    el.scrollTo({ left: i * w, behavior: "smooth" });
    setIndex(i);
  }

  function onReelScroll() {
    const el = reelRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const i = Math.round(el.scrollLeft / w);
    if (i !== index && i >= 0 && i < SCREENS.length) setIndex(i);
  }

  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const onResize = () => {
      const w = el.clientWidth;
      el.scrollLeft = index * w;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [index]);

  const caption = SCREENS[index] ?? SCREENS[0];

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
          {SCREENS.map((screen) => (
            <div
              key={screen.id}
              className={`${s.screen} ${s.screenShot}`}
              id={`home-scr-${screen.id}`}
            >
              <span className={s.demoLabel}>
                <i />
                {screen.label}
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={s.screenImg}
                src={screen.src}
                alt={screen.title}
                width={390}
                height={844}
                draggable={false}
              />
            </div>
          ))}
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
            aria-current={index === i ? "true" : undefined}
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
