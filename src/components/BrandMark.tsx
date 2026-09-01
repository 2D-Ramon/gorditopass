export function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={`gp-mark ${size === "sm" ? "gp-mark-sm" : ""}`}
      aria-hidden
    >
      G
    </span>
  );
}
