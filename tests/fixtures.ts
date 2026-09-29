export function createFixture(
  head: string,
  lang?: string,
  jsonLd: Array<string | unknown> = [],
): Document {
  const doc = document.implementation.createHTMLDocument('');
  if (lang) {
    doc.documentElement.setAttribute('lang', lang);
  } else {
    doc.documentElement.removeAttribute('lang');
  }
  doc.head.innerHTML = head;

  for (const block of jsonLd) {
    const script = doc.createElement('script');
    script.type = 'application/ld+json';
    script.textContent =
      typeof block === 'string' ? block : JSON.stringify(block);
    doc.head.appendChild(script);
  }

  return doc;
}

export const PAGE_URL = 'https://example.com/blog/my-post';

export const COMPLETE_TITLE = 'A complete article title for SEO tests';
export const COMPLETE_DESCRIPTION =
  'This is a complete meta description that is long enough to pass the minimum character threshold for diagnostics.';

export function completeHead(): string {
  return `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${COMPLETE_TITLE}</title>
    <meta name="description" content="${COMPLETE_DESCRIPTION}">
    <link rel="canonical" href="${PAGE_URL}">
    <meta name="robots" content="index, follow, max-snippet:160, max-image-preview:large">
    <link rel="alternate" hreflang="en" href="${PAGE_URL}">
    <link rel="alternate" hreflang="pl" href="https://example.com/pl/blog/my-post">
    <link rel="alternate" hreflang="x-default" href="${PAGE_URL}">
    <meta property="og:title" content="${COMPLETE_TITLE}">
    <meta property="og:description" content="${COMPLETE_DESCRIPTION}">
    <meta property="og:image" content="https://example.com/og.jpg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="Cover image">
    <meta property="og:url" content="${PAGE_URL}">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Example">
    <meta property="og:locale" content="en_US">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${COMPLETE_TITLE}">
    <meta name="twitter:description" content="${COMPLETE_DESCRIPTION}">
    <meta name="twitter:image" content="https://example.com/og.jpg">
    <meta name="twitter:image:alt" content="Cover image">
    <meta name="twitter:site" content="@example">
    <meta name="twitter:creator" content="@author">
  `;
}

export const ARTICLE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: COMPLETE_TITLE,
  description: COMPLETE_DESCRIPTION,
  author: { '@type': 'Person', name: 'Ada Lovelace' },
  datePublished: '2026-01-01',
  dateModified: '2026-01-02',
  image: 'https://example.com/og.jpg',
  publisher: { '@type': 'Organization', name: 'Example' },
};

export const BREADCRUMB_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://example.com/',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Blog',
      item: 'https://example.com/blog',
    },
    {
      '@type': 'ListItem',
      position: 3,
      name: 'Current article',
      item: PAGE_URL,
    },
  ],
};
