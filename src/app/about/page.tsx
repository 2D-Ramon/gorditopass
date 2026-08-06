import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">About {PLATFORM.name}</h1>
      <p className="mt-4 text-lg text-stone-200">{PLATFORM.mission}</p>
      <p className="mt-4 text-muted">
        Too many “food apps” win by charging restaurants until it hurts. We’re
        building the opposite: membership-funded discovery that brings hungry
        locals through the door—and lets kitchens keep more of every dollar.
      </p>
      <p className="mt-4 text-muted">
        First city: <strong>Dallas</strong>. Later: Kansas City, Tulsa, Oklahoma
        City, and more. Working name (placeholder brand) while we finalize among
        GorditoPass, PlatterClub, and TreatTreaty.
      </p>
      <p className="mt-4 text-sm text-muted">
        Contact: {PLATFORM.supportEmail}
      </p>
    </div>
  );
}
