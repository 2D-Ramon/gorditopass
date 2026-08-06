/** Pre-loaded sticker-style GIFs (SVG data URLs) for the city feed GIF picker. */

function sticker(emoji: string, bg: string, label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="#18181b"/>
    </linearGradient>
  </defs>
  <rect width="160" height="160" rx="28" fill="url(#g)"/>
  <text x="80" y="96" font-size="72" text-anchor="middle">${emoji}</text>
  <animateTransform attributeName="transform" type="scale" values="1;1.06;1" dur="1.2s" repeatCount="indefinite" additive="sum"/>
</svg>`;
  return {
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    value: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
  };
}

export const PRESET_GIFS = [
  sticker("🔥", "#ea580c", "Fire"),
  sticker("😍", "#db2777", "Love it"),
  sticker("🌮", "#f97316", "Taco"),
  sticker("🍕", "#dc2626", "Pizza"),
  sticker("👏", "#ca8a04", "Clap"),
  sticker("🙌", "#16a34a", "Yay"),
  sticker("😋", "#d97706", "Yum"),
  sticker("💯", "#2563eb", "100"),
  sticker("🎉", "#7c3aed", "Party"),
  sticker("🤤", "#e11d48", "Drool"),
  sticker("⭐", "#fbbf24", "Star"),
  sticker("❤️", "#ef4444", "Heart"),
];
