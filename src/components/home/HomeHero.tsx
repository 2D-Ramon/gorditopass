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
              <span className={s.line}>Get your</span>{" "}
              <span className={s.line}>
                <span className={s.hot}>Gordito</span> on.
              </span>
            </h1>
            <p className={s.sub}>
              <span className={s.subLine}>
                <Icon name="pin" className={s.subIcon} />
                Discover
              </span>{" "}
              <span className={s.subLine}>
                <Icon name="dollar" className={s.subIcon} />
                save
              </span>{" "}
              <span className={s.subLine}>
                <Icon name="handHeart" className={s.subIcon} />
                support local
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
