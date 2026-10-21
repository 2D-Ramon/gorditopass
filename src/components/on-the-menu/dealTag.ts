import type { DealType } from "@/lib/types";

/** Home page tag kinds (see SampleDeal["type"] in components/home/content.ts). */
export type DealTagKind = "free" | "off" | "bogo";

/** The same labels the home page deal tickets show. Types with no home tag get none. */
export function dealTag(type: DealType): { kind: DealTagKind; label: string } | null {
  switch (type) {
    case "free_item":
      return { kind: "free", label: "Free item" };
    case "percent_off":
    case "percent_off_total":
      return { kind: "off", label: "% off" };
    case "bogo":
      return { kind: "bogo", label: "Buy one, get one" };
    default:
      return null;
  }
}
