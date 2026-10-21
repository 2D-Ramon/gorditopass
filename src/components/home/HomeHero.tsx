import { PLATFORM } from "@/lib/pricing";
import { Icon } from "./Icon";
import s from "./home.module.css";

export function HomeHero() {
  return (
    <section className={s.hero} id="home-hero" aria-labelledby="home-h1">
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
              {PLATFORM.name} is a members only community for all food lovers to
              access exclusive deals and finding the best gems in town!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
