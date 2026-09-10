import type { Metadata } from "next";

// URL canonico scelto per il rilascio. Il redirect del dominio è una
// configurazione di hosting separata e va verificata dopo la pubblicazione.
export const SITE_URL = "https://www.guimmia.com";
export const SITE_NAME = "Guimmia";
export const SITE_DESCRIPTION =
  "La tua guida immobiliare intelligente. La chat italiana per domande, documenti, annunci, bozze, valutazioni, vendita e affitti a lungo termine, studenti e turistici.";

const DEFAULT_SOCIAL_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "Guimmia, la tua guida immobiliare intelligente.",
};

type PublicMetadataInput = {
  title: string;
  description: string;
  path: string;
  absoluteTitle?: boolean;
  noIndex?: boolean;
};

export function absoluteUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.startsWith("/") ? value : `/${value}`, SITE_URL).toString();
}

export function createPublicMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  noIndex = false,
}: PublicMetadataInput): Metadata {
  const socialTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "it_IT",
      url: path,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [`${SITE_URL}/twitter-image`],
    },
    robots: noIndex
      ? { index: false, follow: true }
      : { index: true, follow: true },
  };
}
