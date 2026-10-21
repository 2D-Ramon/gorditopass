"use client";

import { Icon } from "./Icon";
import { HOME_PLANS, MAX_SEATS } from "./content";
import { JoinButton, useJoin } from "./HomeJoin";
import s from "./home.module.css";

/** Plan cards. Prices come from MEMBERSHIP_PLANS via HOME_PLANS. */
export function HomePlans() {
  const { plan, setPlan } = useJoin();
  return (
    <section className={`${s.section} ${s.onDark}`} id="plans" aria-labelledby="home-plans-h">
      <div className={s.container}>
        <div className={s.sHead}>
          <span className={`gp-section-label ${s.kicker}`}>Plans</span>
          <h2 id="home-plans-h">Pick a plan. Cancel anytime.</h2>
        </div>
        <fieldset className={s.plans}>
          <legend className={s.srOnly}>Choose a plan</legend>
          {HOME_PLANS.map((p) => (
            <label key={p.id} className={s.plan}>
              <input
                type="radio"
                name="home-plan"
                value={p.id}
                checked={plan === p.id}
                onChange={() => setPlan(p.id)}
              />
              <div className={s.planIn}>
                <div className={s.planName}>
                  {p.label}
                </div>
                <div className={s.planPrice}>
                  {p.price}
                  <small>{p.unit}</small>
                </div>
                <div className={s.planSub}>{p.sub}</div>
                <ul className={s.planList}>
                  {p.bullets.map((b) => (
                    <li key={b}>
                      <Icon name="check" size={18} strokeWidth={2.6} />
                      {b}
                    </li>
                  ))}
                </ul>
                <div className={s.planSel}>
                  <Icon name="check" size={16} />
                  Selected
                </div>
              </div>
            </label>
          ))}
        </fieldset>
        <div className={s.planCta}>
          <JoinButton />
          <a className={s.link} href="#deals">
            Browse deals free
          </a>
        </div>
        <div className={s.fineBox}>
          <h3 className="gp-section-label">How the fine print works</h3>
          <ul>
            {[
              "Cancel anytime. You keep access until the end of your paid term.",
              `You must be 18+ to own an account. Under 18 can be added to a plan. Up to ${MAX_SEATS} people per plan.`,
              "Redeem in store. % off applies to the member's items, not the whole table, and alcohol is excluded where required by law.",
            ].map((t) => (
              <li key={t}>
                <Icon name="check" size={18} strokeWidth={2.6} />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
