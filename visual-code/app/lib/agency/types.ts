export type Operation = "sale" | "rent";
export type ListingMarket = "buy" | "rent" | "holiday";

export type AgencyListing = {
  id: string;
  slug: string;
  operation: Operation;
  property_type: string;
  title: string;
  description: string;
  price_cents: number;
  rent_period: string | null;
  city: string;
  province: string | null;
  zone: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  rooms: number | null;
  surface_sqm: number | null;
  floor: string | null;
  elevator: boolean | null;
  energy_class: string | null;
  features: string[];
  cover_image_url: string | null;
  visibility_tier: "standard" | "top";
  featured: boolean;
  published_at: string | null;
};
