export function PlateRating({
  value,
  size = "md",
  showNumber = true,
}: {
  value: number;
  size?: "sm" | "md";
  showNumber?: boolean;
}) {
  const full = Math.round(value);
  const dim = size === "sm" ? "w-2 h-2" : "w-2.5 h-2.5";
  return (
    <span className="inline-flex items-center gap-1.5" title={`${value} plates`}>
      <span className="plate-dots" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className={`plate-dot ${dim} ${i < full ? "filled" : ""}`}
          />
        ))}
      </span>
      {showNumber && (
        <span className="text-xs font-medium text-brand-gold">
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
}
