import type { Metadata } from "next";
import { HomeDeals } from "@/components/home/HomeDeals";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeJoinProvider } from "@/components/home/HomeJoin";
import { HomePlans } from "@/components/home/HomePlans";
import {
  HomeFaq,
  HomeHow,
  HomePillars,
  HomeShare,
} from "@/components/home/HomeSections";
import s from "@/components/home/home.module.css";
import { PLATFORM } from "@/lib/pricing";

export const metadata: Metadata = {
  title: {
    absolute: `${PLATFORM.name} | Eat local. Pay less. Try something new.`,
  },
};

export default function HomePage() {
  return (
    <div className={s.page}>
      <HomeJoinProvider>
        <HomeHero />
        <HomePillars />
        <HomeHow />
        <HomeDeals />
        <HomePlans />
        <HomeShare />
        <HomeFaq />
      </HomeJoinProvider>
    </div>
  );
}
