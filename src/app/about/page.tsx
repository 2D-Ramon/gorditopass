import { PLATFORM } from "@/lib/pricing";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="gp-page-title">About {PLATFORM.name}</h1>
      <p className="mt-4 text-lg text-stone-200">{PLATFORM.mission}</p>
      <p className="mt-4 text-muted">
        Too many food apps win by charging restaurants until it hurts. We’re
        building the opposite: membership-funded discovery that brings hungry
        locals through the door—and lets kitchens keep more of every dollar.
      </p>
      <p className="mt-4 text-muted">
        First city: <strong>Dallas</strong>. Later: Kansas City, Tulsa, Oklahoma
        City, and more.
      </p>
      <p className="mt-4 text-sm text-muted">
        Contact:{" "}
        <a href={`mailto:${PLATFORM.supportEmail}`} className="text-brand underline">
          {PLATFORM.supportEmail}
        </a>
      </p>
    </div>
  );
}
