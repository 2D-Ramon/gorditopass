export function estimateDealValue(deal: {
  type?: string | null;
  value?: number | null;
  regular_price_usd?: number | null;
  regularPriceUsd?: number | null;
}): { savingsUsd: number; revenueUsd: number } {
  const type = deal.type || "free_item";
  const value = deal.value == null ? null : Number(deal.value);
  const reg = Number(deal.regular_price_usd ?? deal.regularPriceUsd ?? 0);
  if (reg > 0) {
    if (type === "free_item") return { savingsUsd: reg, revenueUsd: reg };
    if (type === "bogo") return { savingsUsd: reg, revenueUsd: reg * 2 };
    if ((type === "percent_off" || type === "percent_off_total") && value) {
      return {
        savingsUsd: Math.round(reg * (value / 100) * 100) / 100,
        revenueUsd: reg,
      };
    }
    if (type === "fixed_price" && value != null) {
      return {
        savingsUsd: Math.max(0, Math.round((reg - value) * 100) / 100),
        revenueUsd: reg,
      };
    }
    return { savingsUsd: Math.round(reg * 0.2 * 100) / 100, revenueUsd: reg };
  }
  if (type === "free_item") return { savingsUsd: 6, revenueUsd: 12 };
  if (type === "bogo") return { savingsUsd: 12, revenueUsd: 24 };
  if ((type === "percent_off" || type === "percent_off_total") && value) {
    const base = type === "percent_off_total" ? 40 : 12;
    return {
      savingsUsd: Math.round(((base * value) / 100) * 100) / 100,
      revenueUsd: base,
    };
  }
  return { savingsUsd: 5, revenueUsd: 10 };
}
