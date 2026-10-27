/**
 * Line icons for the home page (no emoji). Paths come from the Concept 1b
 * mockup sprite and render with `currentColor`.
 */
const PATHS = {
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  arrow: <path d="M4 12h15M13 6l6 6-6 6" />,
  taco: (
    <>
      <path d="M3 18a9 9 0 0118 0z" />
      <path d="M6.5 14.5l1.5-1.8 1.5 1.8 1.5-1.8 1.5 1.8 1.5-1.8 1.5 1.8" />
      <path d="M8 9.5c1-1.4 2.4-2.1 4-2.1" />
    </>
  ),
  store: (
    <>
      <path d="M4 10l1.6-5h12.8L20 10" />
      <path d="M4 10a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0 2.7 2.7 0 005.3 0" />
      <path d="M5 12.5V20h14v-7.5M10 20v-5h4v5" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4z" />
      <path d="M14.5 7v2M14.5 11v2M14.5 15v2" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.6 8.4l-2 5.2-5.2 2 2-5.2z" />
    </>
  ),
  gift: (
    <>
      <path d="M4 11h16v9H4zM3 7.5h18V11H3zM12 7.5V20" />
      <path d="M12 7.5C10 7.5 7.5 6.6 7.5 5s2.6-1.8 4.5 2.5zM12 7.5c2 0 4.5-.9 4.5-2.5s-2.6-1.8-4.5 2.5z" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10.5h18M7 15h4" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2.5" />
      <path d="M11 18h2" />
    </>
  ),
  scan: (
    <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16" />
  ),
  replay: (
    <>
      <path d="M4 12a8 8 0 108-8H8" />
      <path d="M11 1.5L7.5 4 11 6.5" />
    </>
  ),
  heart: (
    <path d="M12 20s-8-4.8-8-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.2 12 20 12 20z" />
  ),
  dollar: (
    <>
      <path d="M12 2v20" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </>
  ),
  handHeart: (
    <>
      <path d="M11 14h2a2 2 0 100-4h-3c-.6 0-1.1.2-1.4.6L3 16" />
      <path d="M7 20l1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 00-2.75-2.91l-4.2 3.9" />
      <path d="M2 15l6 6" />
      <path d="M19.5 8.5c.7-.7 1.5-1.6 1.5-2.7A2.73 2.73 0 0016 4a2.78 2.78 0 00-5 1.8c0 1.2.8 2 1.5 2.8L16 12z" />
    </>
  ),
  x: <path d="M7 7l10 10M17 7L7 17" />,
  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2h-2zM18 14h2v2M14 18h2v2M18 18h2v2" />
    </>
  ),
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 2,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: "none" }}
      aria-hidden
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
