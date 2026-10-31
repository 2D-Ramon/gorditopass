import { RequireLogin } from "@/components/gp-legal/RequireLogin";

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return <RequireLogin>{children}</RequireLogin>;
}
