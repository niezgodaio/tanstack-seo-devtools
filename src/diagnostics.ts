import {
  DESCRIPTION_MAX_LENGTH,
  DESCRIPTION_MIN_LENGTH,
  JSON_LD_URL_KEYS,
  TITLE_MAX_LENGTH,
  TITLE_MIN_LENGTH,
} from './constants.js';
import { isRecord, jsonLdText, prettyJson } from './jsonLd.js';
import type {
  CanonicalInfo,
  DocumentMetadata,
  HreflangEntry,
  JsonLdBlock,
  OpenGraphInfo,
  SeoIssue,
  SeoSnapshot,
  TwitterInfo,
} from './types.js';

function issue(
  id: string,
  severity: SeoIssue['severity'],
  message: string,
  details?: string,
): SeoIssue {
  return { id, severity, message, details };
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function meaningfullyDifferent(left: string, right: string): boolean {
  const a = normalizeText(left);
  const b = normalizeText(right);

  if (!a || !b || a === b) {
    return false;
  }

  return !a.includes(b) && !b.includes(a);
}

function isAbsoluteUrl(value: string): boolean {
  return /^(https?:)?\/\//i.test(value);
}

function isMalformedUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return true;
  }
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('#') ||
    trimmed.startsWith('?')
  ) {
    return false;
  }
  if (trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return false;
  }
  if (!isAbsoluteUrl(trimmed) && !trimmed.includes('://')) {
    return /\s/.test(trimmed);
  }

  try {
    const url = new URL(trimmed);
    return url.protocol !== 'http:' && url.protocol !== 'https:';
  } catch {
    return true;
  }
}

function collectUrlIssues(
  value: unknown,
  path: string,
  seen: SeoIssue[],
): void {
  if (typeof value === 'string') {
    if (isMalformedUrl(value)) {
      seen.push(
        issue(
          `jsonld-url-${path}-${seen.length}`,
          'warning',
          `Malformed URL in JSON-LD property ${path}`,
          value,
        ),
      );
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectUrlIssues(entry, `${path}[${index}]`, seen);
    });
    return;
  }

  if (isRecord(value)) {
    const nested =
      jsonLdText(value.url) ??
      jsonLdText(value['@id']) ??
      jsonLdText(value.contentUrl);
    if (nested) {
      collectUrlIssues(nested, path, seen);
    }
  }
}

function diagnoseDocument(documentMeta: DocumentMetadata): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const title = documentMeta.title?.trim() ?? '';
  const description = documentMeta.description?.trim() ?? '';

  if (!title) {
    issues.push(issue('title-missing', 'error', 'Missing document title'));
  } else {
    if (title.length < TITLE_MIN_LENGTH) {
      issues.push(
        issue(
          'title-short',
          'warning',
          `Title is suspiciously short (${title.length} characters)`,
          `Recommended minimum is ${TITLE_MIN_LENGTH} characters.`,
        ),
      );
    }
    if (title.length > TITLE_MAX_LENGTH) {
      issues.push(
        issue(
          'title-long',
          'warning',
          `Title is very long (${title.length} characters)`,
          `Recommended maximum is ${TITLE_MAX_LENGTH} characters.`,
        ),
      );
    }
  }

  if (documentMeta.titles.length > 1) {
    issues.push(
      issue(
        'title-duplicate',
        'error',
        `Duplicate title elements (${documentMeta.titles.length})`,
        documentMeta.titles.join(' | '),
      ),
    );
  }

  if (!description) {
    issues.push(
      issue('description-missing', 'warning', 'Missing meta description'),
    );
  } else {
    if (description.length < DESCRIPTION_MIN_LENGTH) {
      issues.push(
        issue(
          'description-short',
          'info',
          `Description is suspiciously short (${description.length} characters)`,
          `Recommended minimum is ${DESCRIPTION_MIN_LENGTH} characters.`,
        ),
      );
    }
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      issues.push(
        issue(
          'description-long',
          'warning',
          `Description is very long (${description.length} characters)`,
          `Recommended maximum is ${DESCRIPTION_MAX_LENGTH} characters.`,
        ),
      );
    }
  }

  if (documentMeta.descriptions.length > 1) {
    issues.push(
      issue(
        'description-duplicate',
        'warning',
        `Duplicate meta descriptions (${documentMeta.descriptions.length})`,
      ),
    );
  }

  if (!documentMeta.language) {
    issues.push(
      issue('lang-missing', 'warning', 'Missing html lang attribute'),
    );
  }

  return issues;
}

function diagnoseCanonical(canonical: CanonicalInfo): SeoIssue[] {
  const issues: SeoIssue[] = [];

  if (canonical.count === 0) {
    issues.push(issue('canonical-missing', 'warning', 'Missing canonical URL'));
    return issues;
  }

  if (canonical.count > 1) {
    issues.push(
      issue(
        'canonical-multiple',
        'error',
        `Multiple canonical tags (${canonical.count})`,
        canonical.hrefs.join(', '),
      ),
    );
  }

  const href = canonical.href ?? '';
  if (!href) {
    issues.push(issue('canonical-invalid', 'error', 'Canonical href is empty'));
    return issues;
  }

  try {
    if (canonical.isAbsolute) {
      new URL(href);
    } else {
      new URL(href, canonical.currentUrl);
      issues.push(
        issue(
          'canonical-relative',
          'warning',
          'Canonical URL is relative',
          href,
        ),
      );
    }
  } catch {
    issues.push(
      issue('canonical-invalid', 'error', 'Canonical URL is invalid', href),
    );
    return issues;
  }

  if (canonical.matchesCurrent) {
    return issues;
  }

  if (canonical.differsByQueryOnly) {
    issues.push(
      issue(
        'canonical-query-diff',
        'info',
        'Canonical differs from the current URL only by query string',
        `${canonical.href} vs ${canonical.currentUrl}`,
      ),
    );
    return issues;
  }

  issues.push(
    issue(
      'canonical-mismatch',
      'warning',
      'Canonical differs from the current URL',
      `${canonical.href} vs ${canonical.currentUrl}`,
    ),
  );

  return issues;
}

function diagnoseOpenGraph(openGraph: OpenGraphInfo): SeoIssue[] {
  const issues: SeoIssue[] = [];

  if (!openGraph.title) {
    issues.push(issue('og-title-missing', 'warning', 'Missing og:title'));
  }
  if (!openGraph.description) {
    issues.push(
      issue('og-description-missing', 'warning', 'Missing og:description'),
    );
  }
  if (!openGraph.url) {
    issues.push(issue('og-url-missing', 'warning', 'Missing og:url'));
  }
  if (!openGraph.type) {
    issues.push(issue('og-type-missing', 'warning', 'Missing og:type'));
  }
  if (openGraph.images.length === 0) {
    issues.push(issue('og-image-missing', 'warning', 'Missing og:image'));
  } else {
    openGraph.images.forEach((image, index) => {
      if (!image.alt) {
        issues.push(
          issue(
            `og-image-alt-missing-${index}`,
            'warning',
            `og:image is missing alt text${openGraph.images.length > 1 ? ` (#${index + 1})` : ''}`,
            image.url,
          ),
        );
      }
      if (!image.width || !image.height) {
        issues.push(
          issue(
            `og-image-size-missing-${index}`,
            'warning',
            `og:image is missing width or height${openGraph.images.length > 1 ? ` (#${index + 1})` : ''}`,
            image.url,
          ),
        );
      }
    });
  }

  return issues;
}

function diagnoseTwitter(
  twitter: TwitterInfo,
  openGraph: OpenGraphInfo,
): SeoIssue[] {
  const issues: SeoIssue[] = [];

  if (!twitter.card) {
    issues.push(
      issue('twitter-card-missing', 'warning', 'Missing twitter:card'),
    );
  }

  if (!twitter.title && !openGraph.title) {
    issues.push(
      issue(
        'twitter-title-missing',
        'warning',
        'Missing twitter:title and no og:title fallback',
      ),
    );
  }

  if (!twitter.description && !openGraph.description) {
    issues.push(
      issue(
        'twitter-description-missing',
        'warning',
        'Missing twitter:description and no og:description fallback',
      ),
    );
  }

  if (!twitter.image && openGraph.images.length === 0) {
    issues.push(
      issue(
        'twitter-image-missing',
        'warning',
        'Missing twitter:image and no og:image fallback',
      ),
    );
  }

  return issues;
}

function diagnoseHreflang(entries: HreflangEntry[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const seen = new Map<string, number>();

  entries.forEach((entry, index) => {
    if (entry.isMalformed) {
      issues.push(
        issue(
          `hreflang-malformed-${index}`,
          'warning',
          `Malformed or missing hreflang URL for ${entry.hreflang || '(empty)'}`,
          entry.href || undefined,
        ),
      );
    }

    const key = entry.hreflang.toLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);
  });

  for (const [hreflang, count] of seen) {
    if (count > 1) {
      issues.push(
        issue(
          `hreflang-duplicate-${hreflang}`,
          'warning',
          `Duplicate hreflang "${hreflang}" (${count})`,
        ),
      );
    }
  }

  return issues;
}

function diagnoseJsonLd(blocks: JsonLdBlock[]): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const seen = new Map<string, number>();

  blocks.forEach((block) => {
    if (!block.valid) {
      issues.push(
        issue(
          `jsonld-invalid-${block.index}`,
          'error',
          `JSON-LD block ${block.index + 1} is malformed`,
          block.error,
        ),
      );
      return;
    }

    const signature = prettyJson(block.parsed);
    seen.set(signature, (seen.get(signature) ?? 0) + 1);

    if (block.entities.length === 0) {
      issues.push(
        issue(
          `jsonld-empty-${block.index}`,
          'info',
          `JSON-LD block ${block.index + 1} has no objects to inspect`,
        ),
      );
    }

    block.entities.forEach((entity, entityIndex) => {
      if (entity.context === undefined) {
        issues.push(
          issue(
            `jsonld-context-missing-${block.index}-${entityIndex}`,
            'warning',
            `JSON-LD entity ${entityIndex + 1} in block ${block.index + 1} is missing @context`,
          ),
        );
      }
      if (!entity.type) {
        issues.push(
          issue(
            `jsonld-type-missing-${block.index}-${entityIndex}`,
            'warning',
            `JSON-LD entity ${entityIndex + 1} in block ${block.index + 1} is missing @type`,
          ),
        );
      }

      if (isRecord(entity.value)) {
        for (const key of JSON_LD_URL_KEYS) {
          if (entity.value[key] !== undefined) {
            collectUrlIssues(entity.value[key], key, issues);
          }
        }
      }
    });
  });

  for (const [signature, count] of seen) {
    if (count > 1) {
      issues.push(
        issue(
          'jsonld-duplicate',
          'warning',
          `Duplicate identical JSON-LD objects (${count})`,
          signature.slice(0, 180),
        ),
      );
    }
  }

  return issues;
}

function diagnoseConsistency(snapshot: SeoSnapshot): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const title = snapshot.document.title;
  const ogTitle = snapshot.openGraph.title;
  const twitterTitle = snapshot.twitter.title;
  const description = snapshot.document.description;
  const ogDescription = snapshot.openGraph.description;
  const twitterDescription = snapshot.twitter.description;

  if (title && ogTitle && meaningfullyDifferent(title, ogTitle)) {
    issues.push(
      issue(
        'consistency-title-og',
        'info',
        'Document title and og:title differ',
        `${title} vs ${ogTitle}`,
      ),
    );
  }

  if (ogTitle && twitterTitle && meaningfullyDifferent(ogTitle, twitterTitle)) {
    issues.push(
      issue(
        'consistency-og-twitter-title',
        'info',
        'og:title and twitter:title differ',
        `${ogTitle} vs ${twitterTitle}`,
      ),
    );
  }

  if (
    ogDescription &&
    twitterDescription &&
    meaningfullyDifferent(ogDescription, twitterDescription)
  ) {
    issues.push(
      issue(
        'consistency-og-twitter-description',
        'info',
        'og:description and twitter:description differ',
        `${ogDescription} vs ${twitterDescription}`,
      ),
    );
  }

  if (
    description &&
    ogDescription &&
    meaningfullyDifferent(description, ogDescription)
  ) {
    issues.push(
      issue(
        'consistency-description-og',
        'info',
        'Meta description and og:description differ',
        `${description} vs ${ogDescription}`,
      ),
    );
  }

  const canonical = snapshot.canonical.href;
  const ogUrl = snapshot.openGraph.url;
  if (canonical && ogUrl && meaningfullyDifferent(canonical, ogUrl)) {
    const canonicalUrl = tryUrl(canonical, snapshot.url);
    const openGraphUrl = tryUrl(ogUrl, snapshot.url);
    const sameNormalized =
      canonicalUrl &&
      openGraphUrl &&
      canonicalUrl.origin === openGraphUrl.origin &&
      canonicalUrl.pathname.replace(/\/+$/, '') ===
        openGraphUrl.pathname.replace(/\/+$/, '') &&
      canonicalUrl.search === openGraphUrl.search;

    if (!sameNormalized) {
      issues.push(
        issue(
          'consistency-canonical-og-url',
          'info',
          'Canonical and og:url differ',
          `${canonical} vs ${ogUrl}`,
        ),
      );
    }
  }

  return issues;
}

function tryUrl(value: string, base: string): URL | null {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

export function diagnoseSeo(snapshot: SeoSnapshot): SeoIssue[] {
  return [
    ...diagnoseDocument(snapshot.document),
    ...diagnoseCanonical(snapshot.canonical),
    ...diagnoseOpenGraph(snapshot.openGraph),
    ...diagnoseTwitter(snapshot.twitter, snapshot.openGraph),
    ...diagnoseHreflang(snapshot.hreflang),
    ...diagnoseJsonLd(snapshot.jsonLd),
    ...diagnoseConsistency(snapshot),
  ];
}
