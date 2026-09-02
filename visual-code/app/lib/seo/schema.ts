import type { AgencyListing } from "@/lib/agency/types";
import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo/metadata";

const organizationId = `${SITE_URL}/#organization`;
const websiteId = `${SITE_URL}/#website`;

export function siteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/icon.svg`,
          contentUrl: `${SITE_URL}/icon.svg`,
          width: 512,
          height: 512,
        },
        description: SITE_DESCRIPTION,
        areaServed: {
          "@type": "Country",
          name: "Italia",
        },
        knowsAbout: [
          "vendita immobiliare",
          "locazione immobiliare",
          "valutazione immobiliare",
          "documentazione immobiliare",
        ],
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "it-IT",
        publisher: { "@id": organizationId },
      },
    ],
  };
}

function accommodationType(listing: AgencyListing) {
  const type = listing.property_type.toLowerCase();
  return type.includes("appart") || type.includes("attico") || type.includes("bilocale") || type.includes("stanza")
    ? "Apartment"
    : "House";
}

export function listingStructuredData(listing: AgencyListing) {
  const url = `${SITE_URL}/immobili/${listing.slug}`;
  const address = {
    "@type": "PostalAddress",
    addressLocality: listing.city,
    addressRegion: listing.province || undefined,
    addressCountry: "IT",
  };

  const property = {
    "@type": accommodationType(listing),
    name: listing.title,
    description: listing.description,
    address,
    numberOfRooms: listing.rooms || undefined,
    numberOfBedrooms: listing.bedrooms || undefined,
    numberOfBathroomsTotal: listing.bathrooms || undefined,
    floorSize: listing.surface_sqm
      ? {
          "@type": "QuantitativeValue",
          value: listing.surface_sqm,
          unitCode: "MTK",
          unitText: "m²",
        }
      : undefined,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Guimmia",
            item: SITE_URL,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Vetrina immobili",
            item: `${SITE_URL}/immobili`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: listing.title,
            item: url,
          },
        ],
      },
      {
        "@type": "RealEstateListing",
        name: listing.title,
        description: listing.description,
        url,
        datePosted: listing.published_at || undefined,
        image: listing.cover_image_url
          ? absoluteUrl(listing.cover_image_url)
          : undefined,
        about: property,
        offers: {
          "@type": "Offer",
          price: (listing.price_cents / 100).toFixed(2),
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
          url,
          offeredBy: { "@id": organizationId },
        },
        publisher: { "@id": organizationId },
      },
    ],
  };
}
