import type { Metadata } from "next";

export const SITE_URL = "https://guimmia.com";
export const SITE_NAME = "Guimmia";
export const SITE_DESCRIPTION =
  "Guimmia è l’agenzia immobiliare digitale che semplifica vendita e affitto: annunci, documenti, visite, negoziazione e contratti in un unico percorso.";

const DEFAULT_SOCIAL_IMAGE = {
  url: `${SITE_URL}/opengraph-image`,
  width: 1200,
  height: 630,
  alt: "Guimmia, l’agenzia immobiliare digitale",
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
