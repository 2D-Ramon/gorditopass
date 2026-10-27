import type { Metadata } from "next";
import { OnTheMenu } from "@/components/OnTheMenu";

export const metadata: Metadata = {
  title: "Swipe & Dine",
  description:
    "Swipe restaurants within a few miles and draw one place for tonight.",
};

export default function OnTheMenuPage() {
  return <OnTheMenu />;
}
