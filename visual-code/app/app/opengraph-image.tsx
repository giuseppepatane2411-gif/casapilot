import { createSocialPreview } from "@/lib/seo/social-preview";

export const alt = "Guimmia, l’agenzia immobiliare digitale";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return createSocialPreview();
}
