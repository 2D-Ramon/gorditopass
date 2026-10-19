import Image from "next/image";
import { FOOD_IMAGES, type FoodKey } from "./content";
import s from "./home.module.css";

/** Food illustration tile. `sample` adds the visible "Sample" pill. */
export function FoodTile({
  food,
  sample = false,
  sizes = "300px",
  className = "",
  decorative = false,
  priority = false,
}: {
  food: FoodKey;
  sample?: boolean;
  sizes?: string;
  className?: string;
  decorative?: boolean;
  priority?: boolean;
}) {
  const img = FOOD_IMAGES[food];
  return (
    <div className={`${s.tile} ${className}`}>
      <Image
        src={img.src}
        alt={decorative ? "" : img.alt}
        fill
        sizes={sizes}
        priority={priority}
      />
      {sample && <span className={s.pillSample}>Sample</span>}
    </div>
  );
}
