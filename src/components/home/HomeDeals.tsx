"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CITIES } from "@/lib/data";
import { useStore } from "@/lib/store";
import { FoodTile } from "./FoodTile";
import { Icon } from "./Icon";
import { SAMPLE_DEALS } from "./content";
import { useJoin } from "./HomeJoin";
import s from "./home.module.css";

/** "Deals this week": one set of sample deal tickets in a scroll-snap row. */
export function HomeDeals() {
  const { city } = useStore();
  const { openJoin } = useJoin();
  const current = CITIES.find((c) => c.id === city);
  const cityName = current?.name ?? "Dallas";
  const carRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = useCallback(() => {
    const car = carRef.current;
    if (!car) return;
    setAtStart(car.scrollLeft < 4);
    setAtEnd(car.scrollLeft + car.clientWidth >= car.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const car = carRef.current;
    if (!car) return;
    const raf = requestAnimationFrame(update);
    car.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(raf);
      car.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  function scrollByCard(dir: 1 | -1) {
    const car = carRef.current;
    if (!car) return;
    const card = car.firstElementChild as HTMLElement | null;
    const step = card ? card.getBoundingClientRect().width + 16 : 300;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    car.scrollBy({ left: dir * step, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <section className={s.section} id="deals" aria-labelledby="home-deals-h">
      <div className={s.container}>
        <div className={s.dealsHead}>
          <div className={s.sHead}>
            <span className={`gp-section-label ${s.kicker}`}>Sample deals</span>
            <h2 id="home-deals-h">Deals this week in {cityName}</h2>
            <p>Browse free. Redeem with a membership.</p>
          </div>
          <div className={s.arrows}>
            <button
              type="button"
              className={s.arrowBtn}
              aria-label="Previous deals"
              disabled={atStart}
              onClick={() => scrollByCard(-1)}
            >
              <Icon name="left" />
            </button>
            <button
              type="button"
              className={s.arrowBtn}
              aria-label="Next deals"
              disabled={atEnd}
              onClick={() => scrollByCard(1)}
            >
              <Icon name="right" />
            </button>
          </div>
        </div>
        <p className={s.sampleLine}>
          <span className={s.pillStatic}>Sample</span>
          <span>
            {city === "dallas"
              ? "Every restaurant and deal below is a sample. Real deals replace them as restaurants join."
              : current?.live
                ? `Every restaurant and deal below is a Dallas-style sample. Real ${cityName} deals replace them as restaurants join.`
                : `${cityName} is coming soon. Every restaurant and deal below is a Dallas-style sample.`}
          </span>
        </p>
        <div
          ref={carRef}
          className={s.carousel}
          tabIndex={0}
          role="region"
          aria-label="Sample deals this week, scroll sideways"
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget) return;
            if (e.key === "ArrowRight") {
              e.preventDefault();
              scrollByCard(1);
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              scrollByCard(-1);
            }
          }}
        >
          {SAMPLE_DEALS.map((d) => (
            <div key={d.restaurant} className={s.tkWrap}>
              <article className={s.ticket}>
                <FoodTile food={d.food} sample sizes="(min-width: 600px) 300px, 78vw" />
                <span className={s.lock} title="Join to redeem">
                  <Icon name="lock" size={15} strokeWidth={2.4} />
                  <span className={s.srOnly}>Members only</span>
                </span>
                <div className={s.tkBody}>
                  <span className={s.type} data-type={d.type}>
                    {d.typeLabel}
                  </span>
                  <div className={s.tkDeal}>{d.deal}</div>
                  <div className={s.tkRest}>{d.restaurant}</div>
                  <div className={s.tkHood}>{d.hood}</div>
                </div>
                <div className={s.tkStub}>
                  <span>Redeem in store</span>
                  <button type="button" className={s.stubBtn} onClick={openJoin}>
                    <Icon name="lock" size={16} />
                    Join to redeem
                  </button>
                </div>
              </article>
            </div>
          ))}
        </div>
        <p className={s.sampleFoot}>
          <span>
            % off applies to the member&apos;s own items, not the whole table.
            Alcohol excluded where required by law.
          </span>
        </p>
      </div>
    </section>
  );
}
