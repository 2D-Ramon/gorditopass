export const metadata = { title: "Community guidelines" };

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Community guidelines</h1>
      <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-stone-300">
        <li>Be kind. Support local. No harassment.</li>
        <li>
          <strong>Nothing political</strong> in posts, replies, or reviews.
        </li>
        <li>No spam, fake deals, or review brigading.</li>
        <li>Photos/videos should be food- and venue-relevant.</li>
        <li>Report abuse — admins can remove content and ban accounts.</li>
      </ul>
    </div>
  );
}
