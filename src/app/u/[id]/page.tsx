"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { FEED_POSTS, getDemoMember } from "@/lib/data";
import { useStore } from "@/lib/store";

/** Public member profile — no billing, address, or private contact. */
export default function PublicProfilePage() {
  const params = useParams();
  const id = String(params.id);
  const {
    accounts,
    user,
    createDmChat,
    followMember,
    unfollowMember,
    isFollowingMember,
    requestTasteBud,
    removeTasteBud,
    tasteBudIds,
    tasteBudRequests,
    respondTasteBud,
  } = useStore();
  const [msg, setMsg] = useState("");

  const profile = useMemo(() => {
    const byId = accounts.find((a) => a.id === id);
    if (byId) {
      return {
        id: byId.id,
        name: byId.name,
        firstName: byId.firstName,
        lastName: byId.lastName,
        email: byId.email,
        role: byId.role,
        city: byId.city,
        isMember: byId.isMember,
        avatarDataUrl: byId.avatarDataUrl,
        favoriteFoodType: byId.favoriteFoodType,
        favoriteRestaurant: byId.favoriteRestaurant,
        badges: byId.badges,
        completedPassports: byId.completedPassports,
        rewardPointsLifetime: byId.rewardPointsLifetime,
      };
    }
    const demo = getDemoMember(id);
    if (demo) {
      return {
        id: demo.id,
        name: demo.name,
        firstName: demo.name,
        lastName: "",
        email: "",
        role: "diner" as const,
        city: demo.city,
        isMember: demo.isMember,
        avatarDataUrl: undefined as string | undefined,
        favoriteFoodType: demo.favoriteFoodType,
        favoriteRestaurant: demo.favoriteRestaurant,
        badges: [] as string[],
        completedPassports: [] as string[],
        rewardPointsLifetime: 0,
      };
    }
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

  const recentPosts = useMemo(
    () =>
      FEED_POSTS.filter((p) => p.authorId === id || p.author === profile?.name),
    [id, profile?.name],
  );

  if (!profile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Profile not found</h1>
        <p className="mt-2 text-sm text-muted">
          Public profiles appear for members who have signed up or demo feed
          authors.
        </p>
        <Link href="/feed" className="mt-4 inline-block text-brand underline">
          Back to feed
        </Link>
      </div>
    );
  }

  const passports = profile.completedPassports ?? [];
  const badges = (profile.badges ?? []).filter(
    (b) => !b.startsWith("passport_"),
  );
  const isSelf = Boolean(user && user.id === profile.id);
  const following = isFollowingMember(profile.id);
  const isTasteBud = tasteBudIds.includes(profile.id);
  const pendingOut = tasteBudRequests.find(
    (r) =>
      r.status === "pending" &&
      r.fromUserId === user?.id &&
      r.toUserId === profile.id,
  );
  const pendingIn = tasteBudRequests.find(
    (r) =>
      r.status === "pending" &&
      r.toUserId === user?.id &&
      r.fromUserId === profile.id,
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
          {isTasteBud && (
            <p className="mt-1 text-xs font-semibold text-brand">
              🌿 Taste Bud
            </p>
          )}
        </div>
      </div>

      {!isSelf && user && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className={`gp-btn text-sm ${
              following ? "gp-btn-secondary" : "gp-btn-primary"
            }`}
            onClick={() => {
              if (following) {
                unfollowMember(profile.id);
                setMsg("Unfollowed.");
              } else {
                followMember(profile.id);
                setMsg("Following — you’ll see their movements.");
              }
            }}
          >
            {following ? "Following" : "Follow"}
          </button>

          {isTasteBud ? (
            <button
              type="button"
              className="gp-btn gp-btn-secondary text-sm"
              onClick={() => {
                removeTasteBud(profile.id);
                setMsg("Removed from Taste Buds.");
              }}
            >
              Taste Buds ✓
            </button>
          ) : pendingOut ? (
            <span className="gp-btn gp-btn-ghost pointer-events-none text-sm opacity-70">
              Taste Buds request sent
            </span>
          ) : pendingIn ? (
            <>
              <button
                type="button"
                className="gp-btn gp-btn-primary text-sm"
                onClick={() => {
                  const res = respondTasteBud(pendingIn.id, true);
                  setMsg(
                    res.ok
                      ? "You’re Taste Buds!"
                      : res.error ?? "Could not accept",
                  );
                }}
              >
                Accept Taste Buds
              </button>
              <button
                type="button"
                className="gp-btn gp-btn-ghost text-sm"
                onClick={() => respondTasteBud(pendingIn.id, false)}
              >
                Decline
              </button>
            </>
          ) : (
            <button
              type="button"
              className="gp-btn gp-btn-secondary text-sm"
              onClick={() => {
                const res = requestTasteBud(profile.id);
                setMsg(
                  res.ok
                    ? profile.id.startsWith("mem-")
                      ? "You’re Taste Buds!"
                      : "Taste Buds request sent."
                    : res.error ?? "Could not send request",
                );
              }}
            >
              Request Taste Buds
            </button>
          )}

          {profile.role === "diner" && !profile.id.startsWith("mem-") && (
            <button
              type="button"
              className="gp-btn gp-btn-ghost text-sm"
              onClick={() => {
                createDmChat(profile.id, profile.name);
                window.location.href = "/chat";
              }}
            >
              Message
            </button>
          )}
        </div>
      )}

      {!user && (
        <p className="mt-4 text-sm text-muted">
          <Link href="/login" className="text-brand underline">
            Sign in
          </Link>{" "}
          to follow or request Taste Buds.
        </p>
      )}

      {msg && <p className="mt-3 text-sm text-success">{msg}</p>}

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

      {recentPosts.length > 0 && (
        <div className="mt-4 gp-card gp-card-static p-5">
          <p className="gp-section-label">Recent movements</p>
          <ul className="mt-3 space-y-2 text-sm">
            {recentPosts.map((p) => (
              <li key={p.id}>
                <Link href={`/feed#${p.id}`} className="text-brand hover:underline">
                  {p.title}
                </Link>
                <span className="ml-2 text-xs text-muted">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/feed" className="mt-6 block text-sm text-brand underline">
        ← City feed
      </Link>
    </div>
  );
}
