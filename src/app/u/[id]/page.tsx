"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useStore } from "@/lib/store";

/** Public member profile — no billing, address, or private contact. */
export default function PublicProfilePage() {
  const params = useParams();
  const id = String(params.id);
  const { accounts, user, createDmChat } = useStore();

  const profile = useMemo(() => {
    const byId = accounts.find((a) => a.id === id);
    if (byId) return byId;
    if (user && (user.id === id || user.email === id)) {
      return {
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        city: user.city,
        isMember: user.isMember,
        avatarDataUrl: user.avatarDataUrl,
        favoriteFoodType: user.favoriteFoodType,
        favoriteRestaurant: user.favoriteRestaurant,
        badges: user.badges,
        completedPassports: user.completedPassports,
        rewardPointsLifetime: user.rewardPointsLifetime,
      };
    }
    return null;
  }, [accounts, user, id]);

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="mt-2 text-sm text-muted">
          Public profiles appear for members who have signed up on this device
          (demo).
        </p>
        <Link href="/chat" className="mt-4 inline-block text-brand underline">
          Back to chat
        </Link>
      </div>
    );
  }

  const passports = profile.completedPassports ?? [];
  const badges = (profile.badges ?? []).filter(
    (b) => !b.startsWith("passport_"),
  );

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-border bg-elevated text-2xl ring-2 ring-brand/20">
          {profile.avatarDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarDataUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            profile.name.slice(0, 1)
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <p className="text-sm text-muted capitalize">
            {profile.role}
            {profile.isMember ? " · Member" : ""} · {profile.city}
          </p>
        </div>
      </div>

      <div className="mt-6 gp-card gp-card-static space-y-2 p-5 text-sm">
        {profile.favoriteFoodType && (
          <p>
            <span className="text-muted">Favorite food:</span>{" "}
            {profile.favoriteFoodType}
          </p>
        )}
        {profile.favoriteRestaurant && (
          <p>
            <span className="text-muted">Favorite spot:</span>{" "}
            {profile.favoriteRestaurant}
          </p>
        )}
        <p>
          <span className="text-muted">Lifetime points:</span>{" "}
          {profile.rewardPointsLifetime ?? 0}
        </p>
        <p className="text-xs text-muted">
          Private fields (email, phone, address, billing) are never shown here.
        </p>
      </div>

      {(badges.length > 0 || passports.length > 0) && (
        <div className="mt-4 gp-card gp-card-static p-5">
          <p className="gp-section-label">Badges & passports</p>
          <p className="mt-2 text-sm text-muted">
            {badges.length} badges · {passports.length} passports
          </p>
        </div>
      )}

      {user && user.id !== profile.id && profile.role === "diner" && (
        <button
          type="button"
          className="gp-btn gp-btn-primary mt-6"
          onClick={() => {
            const chatId = createDmChat(profile.id, profile.name);
            window.location.href = `/chat`;
            void chatId;
          }}
        >
          Message {profile.firstName || profile.name}
        </button>
      )}

      <Link href="/chat" className="mt-4 block text-sm text-brand underline">
        Community chat →
      </Link>
    </div>
  );
}
