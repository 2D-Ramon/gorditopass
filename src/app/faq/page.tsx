import Link from "next/link";

export const metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "Do I need a membership to browse?",
    a: "No. Browse free. Membership is required to redeem deals and to post or reply in the city feed.",
  },
  {
    q: "How much does it cost?",
    a: "$7 monthly ($7/mo), $36 for 6 months ($6/mo), or $60 annual ($5/mo). All plans work in every city we launch. Family / friends seats up to 6, priced per person.",
  },
  {
    q: "What is your refund policy?",
    a: "Refunds are handled case by case. Generally, if you have redeemed more than once, a refund is less likely unless our team verifies a bad experience claim. Cancel anytime; you keep access until your paid term ends.",
  },
  {
    q: "Do restaurants pay to list?",
    a: "No. Free to join after approval. Optional paid marketing packages later.",
  },
  {
    q: "How do I redeem a deal?",
    a: "Open the deal, show a rotating QR/code. Staff confirms in their dashboard. Codes expire quickly so screenshots don’t work for long.",
  },
  {
    q: "Can % off cover the whole table?",
    a: "Default rule: % applies to the member’s items only—not the whole party. Alcohol may be excluded by law.",
  },
  {
    q: "Is there delivery?",
    a: "Online ordering (cart + checkout) is in the product. Delivery comes later via third-party or the restaurant; you pay delivery then.",
  },
  {
    q: "What about under 18?",
    a: "Accounts are 18+. Younger diners can be added as family / friends plan seats.",
  },
  {
    q: "Who can post in the city feed?",
    a: "Only active members and partner restaurants can create posts or replies. Guests can read.",
  },
  {
    q: "How do rewards work?",
    a: "You earn custom points for actions (redeem, review, feed post, favorite, order, join). Default: +10 redeem, +25 first redeem, +15 review, +10 feed post, +5 favorite, +10 order, +50 join. Every 100 points unlocks a free-item reward on your Account page. Point values can be changed by the platform.",
  },
  {
    q: "What are badges?",
    a: "Badges are achievements you unlock as you use the app — first redeem, multiple reviews, city feed posts, savings milestones, and more. See them on your Account page.",
  },
  {
    q: "How does multi-person membership signup work?",
    a: "Pick a plan and seats, then fill an intake form for each person (name, email, phone, birthday, home address). Each seat creates an account. Favorite restaurant and food type can be set later in profile.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="gp-page-title">FAQ</h1>
      <p className="gp-page-sub">
        Quick answers. More detail on{" "}
        <Link href="/membership" className="text-brand underline">
          membership
        </Link>{" "}
        and{" "}
        <Link href="/for-restaurants" className="text-brand underline">
          for restaurants
        </Link>
        .
      </p>
      <dl className="mt-8 space-y-4">
        {FAQS.map((f) => (
          <div key={f.q} className="gp-card gp-card-static p-5">
            <dt className="font-semibold tracking-tight">{f.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-muted">{f.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
