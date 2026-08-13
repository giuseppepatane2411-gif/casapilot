export type RegulatoryClass = "standard" | "review_required" | "excluded_initially";

export type MarketplaceService = {
  id: string;
  slug: string;
  label: string;
  regulatory_class: RegulatoryClass;
  marketplace_macro_categories?: { label: string; slug: string } | { label: string; slug: string }[] | null;
};
