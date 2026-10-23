"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RestaurantProfileCard } from "@/components/RestaurantProfileCard";
import { CITIES } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Icon } from "./Icon";
import { SAMPLE_DEALS, sampleDealAsRestaurant } from "./content";
import { useJoin } from "./HomeJoin";
import s from "./home.module.css";

/** "Deals this week": sample restaurant profile cards in a scroll-snap row. */
export function HomeDeals() {
  const { city } = useStore();
  const { openJoin } = useJoin();
  // Home page shows a live city only; a "soon" or unknown city falls back to Dallas (launch city).
  const picked = CITIES.find((c) => c.id === city);
  const current = picked?.live ? picked : CITIES.find((c) => c.id === "dallas");
  const cityName = current?.name ?? "Dallas";
  const carRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const samples = useMemo(
    () => SAMPLE_DEALS.map((d) => ({ deal: d, restaurant: sampleDealAsRestaurant(d) })),
    [],
  );

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
            {cityName === "Dallas"
              ? "Every restaurant and deal below is a sample. Real deals replace them as restaurants join."
              : `Every restaurant and deal below is a Dallas-style sample. Real ${cityName} deals replace them as restaurants join.`}
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
          {samples.map(({ deal: d, restaurant }) => (
            <div key={d.restaurant} className={s.profileWrap}>
              <article className={`gp-card gp-card-static ${s.profileCard}`}>
                <span className={s.pillStatic} style={{ position: "absolute", top: 10, left: 10, zIndex: 3 }}>
                  Sample
                </span>
                <RestaurantProfileCard
                  restaurant={restaurant}
                  compact
                  headingLevel={3}
                />
                <div className={s.profileStub}>
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
