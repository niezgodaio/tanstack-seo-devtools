import { collectJsonLdBlocks } from './jsonLd.js';
import type {
  CanonicalInfo,
  DocumentMetadata,
  HreflangEntry,
  MetaEntry,
  OpenGraphImage,
  OpenGraphInfo,
  RobotsDirective,
  RobotsInfo,
  SeoSnapshot,
  TwitterInfo,
} from './types.js';

function attr(el: Element, name: string): string {
  return (el.getAttribute(name) ?? '').trim();
}

function metaContent(el: Element): string {
  return attr(el, 'content');
}

function first(values: string[]): string | null {
  const value = values.find((entry) => entry.length > 0);
  return value ?? null;
}

function metaByName(doc: Document, name: string): string[] {
  return [...doc.querySelectorAll('meta[name]')].flatMap((el) => {
    if (attr(el, 'name').toLowerCase() !== name.toLowerCase()) {
      return [];
    }
    return [metaContent(el)];
  });
}

export function parseRobotsContent(raw: string): RobotsDirective {
  const directives: Record<string, string | boolean> = {};

  for (const part of raw.split(',')) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }

    const colon = trimmed.indexOf(':');
    if (colon === -1) {
      directives[trimmed.toLowerCase()] = true;
      continue;
    }

    const key = trimmed.slice(0, colon).trim().toLowerCase();
    const value = trimmed.slice(colon + 1).trim();
    directives[key] = value;
  }

  return { raw, directives };
}

function collectCharset(doc: Document): string | null {
  const charsetEl = doc.querySelector('meta[charset]');
  if (charsetEl) {
    return attr(charsetEl, 'charset') || null;
  }

  const httpEquiv = [...doc.querySelectorAll('meta[http-equiv]')].find(
    (el) => attr(el, 'http-equiv').toLowerCase() === 'content-type',
  );

  if (httpEquiv) {
    const content = metaContent(httpEquiv);
    const match = content.match(/charset\s*=\s*([^\s;]+)/i);
    return match?.[1] ?? (content || null);
  }

  return doc.characterSet || null;
}

function collectDocumentMetadata(doc: Document): DocumentMetadata {
  const titleElements = [...doc.querySelectorAll('title')];
  const titles = titleElements.map((el) => (el.textContent ?? '').trim());
  const descriptions = metaByName(doc, 'description');

  return {
    title: first(titles) ?? (doc.title.trim() || null),
    titles,
    description: first(descriptions),
    descriptions,
    charset: collectCharset(doc),
    viewport: first(metaByName(doc, 'viewport')),
    language: attr(doc.documentElement, 'lang') || null,
    baseHref: doc.querySelector('base')
      ? attr(doc.querySelector('base') as Element, 'href') || null
      : null,
  };
}

function isAbsoluteUrl(value: string): boolean {
  return /^(https?:)?\/\//i.test(value);
}

function tryParseUrl(value: string, base?: string): URL | null {
  try {
    return base ? new URL(value, base) : new URL(value);
  } catch {
    return null;
  }
}

function normalizePathname(pathname: string): string {
  if (pathname === '/') {
    return pathname;
  }
  return pathname.replace(/\/+$/, '');
}

function urlsMatch(
  left: URL,
  right: URL,
): { matches: boolean; differsByQueryOnly: boolean } {
  const sameOrigin = left.origin === right.origin;
  const samePath =
    normalizePathname(left.pathname) === normalizePathname(right.pathname);

  if (sameOrigin && samePath && left.search === right.search) {
    return { matches: true, differsByQueryOnly: false };
  }

  if (sameOrigin && samePath) {
    return { matches: false, differsByQueryOnly: true };
  }

  return { matches: false, differsByQueryOnly: false };
}

function collectCanonical(doc: Document, currentUrl: string): CanonicalInfo {
  const hrefs = [...doc.querySelectorAll('link[rel]')].flatMap((el) => {
    const rels = attr(el, 'rel').toLowerCase().split(/\s+/);
    if (!rels.includes('canonical')) {
      return [];
    }
    return [attr(el, 'href')];
  });

  const href = first(hrefs);
  const absolute = href ? isAbsoluteUrl(href) : false;
  const current = tryParseUrl(currentUrl);
  const canonical = href ? tryParseUrl(href, currentUrl) : null;
  const comparison =
    canonical && current
      ? urlsMatch(canonical, current)
      : { matches: false, differsByQueryOnly: false };

  return {
    href,
    hrefs,
    currentUrl,
    isAbsolute: absolute,
    matchesCurrent: comparison.matches,
    differsByQueryOnly: comparison.differsByQueryOnly,
    count: hrefs.length,
  };
}

function collectHreflang(doc: Document, currentUrl: string): HreflangEntry[] {
  return [...doc.querySelectorAll('link[rel]')].flatMap((el) => {
    const rels = attr(el, 'rel').toLowerCase().split(/\s+/);
    if (!rels.includes('alternate')) {
      return [];
    }

    const hreflang = attr(el, 'hreflang');
    if (!hreflang) {
      return [];
    }

    const href = attr(el, 'href');
    const parsed = href ? tryParseUrl(href, currentUrl) : null;

    return [
      {
        hreflang,
        href,
        isXDefault: hreflang.toLowerCase() === 'x-default',
        isMalformed: !href || !parsed,
      },
    ];
  });
}

function collectMetaEntries(doc: Document): MetaEntry[] {
  return [...doc.querySelectorAll('meta')].flatMap((el) => {
    const name = attr(el, 'name') || undefined;
    const property = attr(el, 'property') || undefined;
    const content = metaContent(el);
    if (!name && !property) {
      return [];
    }
    return [{ name, property, content }];
  });
}

function keyedValues(
  entries: MetaEntry[],
  prefix: 'og:' | 'twitter:',
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const entry of entries) {
    const key = (entry.property || entry.name || '').toLowerCase();
    if (!key.startsWith(prefix)) {
      continue;
    }
    const list = result[key] ?? [];
    list.push(entry.content);
    result[key] = list;
  }

  return result;
}

function firstKeyed(
  properties: Record<string, string[]>,
  key: string,
): string | null {
  return first(properties[key] ?? []);
}

function collectOgImages(entries: MetaEntry[]): OpenGraphImage[] {
  const images: OpenGraphImage[] = [];
  let current: OpenGraphImage | null = null;

  for (const entry of entries) {
    const key = (entry.property || entry.name || '').toLowerCase();
    if (!key.startsWith('og:image')) {
      continue;
    }

    if (
      key === 'og:image' ||
      key === 'og:image:url' ||
      key === 'og:image:secure_url'
    ) {
      if (key === 'og:image' || !current) {
        current = { url: entry.content };
        images.push(current);
      } else if (!current.url) {
        current.url = entry.content;
      }
      continue;
    }

    if (!current) {
      continue;
    }

    if (key === 'og:image:width') current.width = entry.content;
    else if (key === 'og:image:height') current.height = entry.content;
    else if (key === 'og:image:alt') current.alt = entry.content;
    else if (key === 'og:image:type') current.type = entry.content;
  }

  return images;
}

function collectOpenGraph(entries: MetaEntry[]): OpenGraphInfo {
  const properties = keyedValues(entries, 'og:');
  const images = collectOgImages(entries);

  return {
    title: firstKeyed(properties, 'og:title'),
    description: firstKeyed(properties, 'og:description'),
    url: firstKeyed(properties, 'og:url'),
    type: firstKeyed(properties, 'og:type'),
    siteName: firstKeyed(properties, 'og:site_name'),
    locale: firstKeyed(properties, 'og:locale'),
    images,
    properties,
    propertyCount: Object.values(properties).reduce(
      (sum, values) => sum + values.length,
      0,
    ),
  };
}

function collectTwitter(entries: MetaEntry[]): TwitterInfo {
  const properties = keyedValues(entries, 'twitter:');

  return {
    card: firstKeyed(properties, 'twitter:card'),
    title: firstKeyed(properties, 'twitter:title'),
    description: firstKeyed(properties, 'twitter:description'),
    image: firstKeyed(properties, 'twitter:image'),
    imageAlt: firstKeyed(properties, 'twitter:image:alt'),
    site: firstKeyed(properties, 'twitter:site'),
    creator: firstKeyed(properties, 'twitter:creator'),
    properties,
  };
}

function collectRobots(doc: Document): RobotsInfo {
  const robotsRaw = first(metaByName(doc, 'robots'));
  const googlebotRaw = first(metaByName(doc, 'googlebot'));

  return {
    robots: robotsRaw ? parseRobotsContent(robotsRaw) : null,
    googlebot: googlebotRaw ? parseRobotsContent(googlebotRaw) : null,
  };
}

export function collectMetadata(
  doc: Document,
  href: string,
  previous?: SeoSnapshot,
): SeoSnapshot {
  const entries = collectMetaEntries(doc);

  return {
    url: href,
    document: collectDocumentMetadata(doc),
    canonical: collectCanonical(doc, href),
    robots: collectRobots(doc),
    hreflang: collectHreflang(doc, href),
    openGraph: collectOpenGraph(entries),
    twitter: collectTwitter(entries),
    jsonLd: collectJsonLdBlocks(doc, previous?.jsonLd),
  };
}
