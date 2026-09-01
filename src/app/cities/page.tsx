import Link from "next/link";
import { CITIES } from "@/lib/data";

export const metadata = { title: "Cities" };

export default function CitiesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Cities</h1>
      <p className="mt-2 text-muted">
        Launching city by city. Monthly & 6-month plans are home-city;
        annual unlocks every live city.
      </p>
      <ul className="mt-8 space-y-3">
        {CITIES.map((c) => (
          <li
            key={c.id}
            className="gp-card flex items-center justify-between p-4"
          >
            <div>
              <p className="font-semibold">
                {c.name}, {c.state}
              </p>
              <p className="text-sm text-muted">
                {c.live ? "Live — early access" : "Coming later"}
              </p>
            </div>
            {c.live ? (
              <Link href="/explore" className="gp-btn gp-btn-primary text-sm">
                Explore
              </Link>
            ) : (
              <span className="gp-badge">Soon</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
