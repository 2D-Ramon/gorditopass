import Link from "next/link";
import { PLATFORM } from "@/lib/pricing";
import { FoodTile } from "./FoodTile";
import { Icon } from "./Icon";
import { MAX_SEATS, MONTHLY_PER_MONTH, planWhereAnswer } from "./content";
import { JoinButton } from "./HomeJoin";
import s from "./home.module.css";

/** One pass, three reasons. */
export function HomePillars() {
  return (
    <section className={s.section} id="why" aria-labelledby="home-why-h">
      <div className={s.container}>
        <div className={s.sHead}>
          <span className={`gp-section-label ${s.kicker}`}>One pass, three reasons</span>
          <h2 id="home-why-h">Good for your wallet. Better for your city.</h2>
          <p>Everything {PLATFORM.name} does comes back to three ideas.</p>
        </div>
        <div className={s.pgrid}>
          <article className={s.pcard}>
            <div className={s.pcTop}>
              <div className={s.pcIc}>
                <Icon name="store" size={24} />
              </div>
              <span className={s.pcNum}>01</span>
            </div>
            <h3>Support Local</h3>
            <p>
              Restaurants join free, and {PLATFORM.name} takes no cut of in-store
              sales. What you spend at the counter stays with the neighborhood spot.
            </p>
            <div className={s.pcVis}>
              <div className={s.flow} aria-label="Your bill goes to the restaurant">
                <div className={s.node}>
                  <Icon name="card" size={22} />
                  Your bill
                </div>
                <span className={s.flowArrow}>
                  <Icon name="arrow" size={30} />
                </span>
                <div className={s.node}>
                  <Icon name="store" size={22} />
                  The restaurant
                </div>
              </div>
              <p className={s.flowNote}>
                <Icon name="check" size={18} />
                No platform cut of in-store sales. No listing fee. Every restaurant
                is approved before it goes live.
              </p>
            </div>
          </article>

          <article className={`${s.pcard} ${s.pcDeals}`}>
            <div className={s.pcTop}>
              <div className={s.pcIc}>
                <Icon name="ticket" size={24} />
              </div>
              <span className={s.pcNum}>02</span>
            </div>
            <h3>Exclusive Deals and Savings</h3>
            <p>
              Members-only deals at neighborhood restaurants: a free item or 20%+
              off, set by the restaurant. Show your live QR in store and staff does
              the rest.
            </p>
            <div className={s.pcVis}>
              <div
                className={s.miniTickets}
                aria-label="Examples of the kinds of deals members see"
              >
                {["Free fries", "25% off", "Buy one, get one"].map((t) => (
                  <div key={t} className={s.mt}>
                    {t}
                    <small>Example</small>
                  </div>
                ))}
              </div>
              <p className={s.fineInline}>
                % off applies to your own items, not the whole table. Alcohol
                excluded where required by law.
              </p>
            </div>
          </article>

          <article className={`${s.pcard} ${s.pcNew}`}>
            <div className={s.pcTop}>
              <div className={s.pcIc}>
                <Icon name="compass" size={24} />
              </div>
              <span className={s.pcNum}>03</span>
            </div>
            <h3>Discover New Foods</h3>
            <p>
              Try places and cuisines you haven&apos;t. Save spots to your
              want-to-try list, read plate reviews (1 to 5 plates), and see what
              your city is eating.
            </p>
            <div className={s.pcVis}>
              <div className={s.tiles3} aria-label="Sample cuisines">
                <FoodTile food="ramen" sizes="68px" />
                <FoodTile food="tacos" sizes="68px" />
                <FoodTile food="bbq" sizes="68px" />
              </div>
              <div className={s.tags}>
                <span>Cuisine tags</span>
                <span>Plate reviews</span>
                <span>City feed</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

/** SURF / SUBSCRIBE / SAVOR. */
export function HomeHow() {
  return (
    <section className={`${s.section} ${s.onDark}`} id="how" aria-labelledby="home-how-h">
      <div className={s.container}>
        <div className={s.sHead}>
          <span className={`gp-section-label ${s.kicker}`}>How it works</span>
          <h2 id="home-how-h">Browse. Join. Show your phone.</h2>
          <p>Three steps, and the last one takes about five seconds at the counter.</p>
        </div>
        <ol className={s.steps}>
          <li className={s.step}>
            <div className={s.stepLabel}>Surf</div>
            <h3>Browse free</h3>
            <p>See restaurants and deal teasers before you pay anything.</p>
            <div className={s.mini} aria-hidden>
              <svg viewBox="0 0 220 116">
                <rect className={s.mHl} x="26" y="14" width="168" height="26" rx="8" fill="var(--brand-gold)" opacity=".95" />
                <g className={s.mLine}>
                  <rect x="26" y="14" width="168" height="26" rx="8" />
                  <rect x="26" y="44" width="168" height="26" rx="8" />
                  <rect x="26" y="74" width="168" height="26" rx="8" />
                </g>
                <g fill="var(--bg)">
                  <rect x="36" y="23" width="60" height="8" rx="4" />
                </g>
                <g className={s.mFill}>
                  <circle cx="40" cy="57" r="5" />
                  <rect x="52" y="53" width="70" height="8" rx="4" />
                  <circle cx="40" cy="87" r="5" />
                  <rect x="52" y="83" width="54" height="8" rx="4" />
                </g>
              </svg>
            </div>
          </li>
          <li className={s.step}>
            <div className={s.stepLabel}>Subscribe</div>
            <h3>Pick a plan</h3>
            <p>
              From {MONTHLY_PER_MONTH}. Cancel anytime. Up to {MAX_SEATS} people per
              plan.
            </p>
            <div className={s.mini} aria-hidden>
              <svg viewBox="0 0 220 116">
                <g className={s.mSel}>
                  <rect x="14" y="20" width="56" height="52" rx="10" fill="var(--brand-gold)" />
                </g>
                <g className={s.mLine}>
                  <rect x="14" y="20" width="56" height="52" rx="10" />
                  <rect x="80" y="20" width="56" height="52" rx="10" />
                  <rect x="146" y="20" width="56" height="52" rx="10" />
                </g>
                <g className={s.mFill}>
                  <rect x="26" y="34" width="32" height="8" rx="4" opacity=".85" />
                  <rect x="92" y="34" width="32" height="8" rx="4" />
                  <rect x="158" y="34" width="32" height="8" rx="4" />
                  <rect x="26" y="52" width="20" height="6" rx="3" opacity=".6" />
                  <rect x="92" y="52" width="20" height="6" rx="3" opacity=".6" />
                  <rect x="158" y="52" width="20" height="6" rx="3" opacity=".6" />
                </g>
                <rect x="52" y="86" width="116" height="20" rx="10" fill="var(--brand)" />
                <rect x="82" y="94" width="56" height="4" rx="2" fill="#fff" />
              </svg>
            </div>
          </li>
          <li className={s.step}>
            <div className={s.stepLabel}>Savor</div>
            <h3>Show your QR, eat</h3>
            <p>At the counter, show your live QR. Staff scans it, you get the deal.</p>
            <div className={s.mini} aria-hidden>
              <svg viewBox="0 0 220 116">
                <rect className={s.mLine} x="62" y="10" width="64" height="96" rx="12" />
                <g className={s.mFill}>
                  <rect x="76" y="24" width="14" height="14" rx="2" />
                  <rect x="98" y="24" width="14" height="14" rx="2" />
                  <rect x="76" y="46" width="14" height="14" rx="2" />
                  <rect x="98" y="50" width="6" height="6" />
                  <rect x="106" y="58" width="6" height="6" />
                  <rect x="76" y="68" width="6" height="6" />
                  <rect x="90" y="72" width="10" height="10" />
                </g>
                <g className={s.mScan}>
                  <rect x="70" y="26" width="48" height="4" rx="2" fill="var(--brand-gold)" />
                </g>
                <g className={s.mCk}>
                  <circle cx="150" cy="74" r="20" fill="var(--brand-mint)" />
                  <path d="M141 74l7 7 12-14" fill="none" stroke="#09090b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </div>
          </li>
        </ol>
      </div>
    </section>
  );
}

/** Gift + tell-a-restaurant cards. */
export function HomeShare() {
  return (
    <section className={s.section} id="share" aria-labelledby="home-share-h">
      <div className={s.container}>
        <div className={s.sHead}>
          <span className={`gp-section-label ${s.kicker}`}>Share the love</span>
          <h2 id="home-share-h">Good food is better passed around.</h2>
        </div>
        <div className={s.shareGrid}>
          <article className={s.sc}>
            <div className={s.scIc}>
              <Icon name="gift" size={24} />
            </div>
            <span className={s.soonPill}>Coming soon</span>
            <h3>Gift a membership</h3>
            <p>
              Give someone a season of neighborhood dinners. We&apos;re building
              gifting now.
            </p>
            <span className={s.corner} aria-hidden />
          </article>
          <article className={`${s.sc} ${s.scSpot}`}>
            <div className={s.scIc}>
              <Icon name="store" size={24} />
            </div>
            <h3>Know a great spot? Tell them to join free.</h3>
            <p>
              Restaurants join {PLATFORM.name} free, with no listing fee and no cut
              of in-store sales.
            </p>
            <span className={s.corner} aria-hidden />
          </article>
        </div>
        <p className={s.quiet}>
          Own a restaurant?
          <Link href="/for-restaurants">For restaurants</Link>
        </p>
      </div>
    </section>
  );
}

const FAQ = [
  {
    q: "How do I redeem a deal?",
    a: "Open your pass, tap Redeem on a deal, and show the live QR at the counter. Staff scans it and you see a green check with your first name, the deal and the time. Redemption happens in store, not online.",
  },
  {
    q: "What does \u201c% off\u201d cover?",
    a: "A % off deal applies to the member's own items, not the whole table. Alcohol is excluded where the law requires it. Free-item deals are set by each restaurant.",
  },
  {
    q: "Can I cancel anytime?",
    a: `Yes. Cancel anytime and keep access until the end of your paid term. There's no free trial, so the monthly plan is the low-commitment way to start. Accounts are for people 18+, and a plan can cover up to ${MAX_SEATS} people.`,
  },
  { q: "Which plan works where?", a: planWhereAnswer() },
];

/** FAQ accordion + "Ready to try it?" card. */
export function HomeFaq() {
  return (
    <section className={s.section} id="faq" aria-labelledby="home-faq-h" style={{ paddingTop: 0 }}>
      <div className={s.container}>
        <div className={s.faqWrap}>
          <div>
            <div className={s.sHead} style={{ marginBottom: 20 }}>
              <span className={`gp-section-label ${s.kicker}`}>FAQ</span>
              <h2 id="home-faq-h">Good questions</h2>
            </div>
            <div className={s.faq}>
              {FAQ.map((f, i) => (
                <details key={f.q} name="home-faq" open={i === 0}>
                  <summary>
                    {f.q}
                    <span className={s.pm} aria-hidden>
                      <Icon name="plus" size={16} />
                    </span>
                  </summary>
                  <div className={s.ans}>{f.a}</div>
                </details>
              ))}
            </div>
          </div>
          <aside className={s.faqSide}>
            <h3>Ready to try it?</h3>
            <p>Browse free any time. Join when you&apos;re ready to redeem.</p>
            <JoinButton />
          </aside>
        </div>
      </div>
    </section>
  );
}
