import { PLATFORM } from "@/lib/pricing";
import { Icon } from "./Icon";
import { HERO_CTA_ID, JoinButton } from "./HomeJoin";
import s from "./home.module.css";

export function HomeHero() {
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
              {PLATFORM.name} is a members only community for all food lovers to
              access exclusive deals and finding the best gems in town!
            </p>
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
        </div>
      </div>
    </section>
  );
}
