import { RequireLogin } from "@/components/gp-legal/RequireLogin";
import { PreCheckoutReview } from "@/components/gp-legal/PreCheckoutReview";
import { MEMBERSHIP_PLANS } from "@/lib/pricing";
import type { MembershipPlanId } from "@/lib/types";

export const metadata = { title: "Review your membership (DRAFT)" };

export default async function JoinReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; resume?: string }>;
}) {
  const { plan, resume } = await searchParams;
  const initial = (MEMBERSHIP_PLANS.find((p) => p.id === plan)?.id ?? "annual") as MembershipPlanId;
  return (
    <RequireLogin>
      <PreCheckoutReview initialPlan={initial} mode={resume === "1" ? "resume" : "checkout"} />
    </RequireLogin>
  );
}
