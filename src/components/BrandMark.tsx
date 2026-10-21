
/**
 * GorditoPass mark: a glossy porcelain plate with a bite out of the upper right
 * and an orange G in the well. Raster assets live in public/brand/.
 */
export function BrandMark({
  size = "md",
  alt = "",
}: {
  size?: "sm" | "md";
  /** Leave empty when the wordmark text sits next to it; pass "GorditoPass" when the mark stands alone. */
  alt?: string;
}) {
  const px = size === "sm" ? 28 : 36;
  const base = `/brand/plate-logo-${px}`;
  return (
    <span
      className={`gp-mark ${size === "sm" ? "gp-mark-sm" : ""}`}
      aria-hidden={alt ? undefined : true}
    >
      <picture>
        <source
          type="image/webp"
          srcSet={`${base}.webp 1x, ${base}@2x.webp 2x, ${base}@3x.webp 3x`}
        />
        <img
          src={`${base}.png`}
          srcSet={`${base}.png 1x, ${base}@2x.png 2x, ${base}@3x.png 3x`}
          width={px}
          height={px}
          alt={alt}
          decoding="async"
          style={{ display: "block", width: "100%", height: "100%" }}
        />
      </picture>
    </span>
  );
}
