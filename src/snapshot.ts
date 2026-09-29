import type {
  SeoExport,
  SeoInspection,
  SeoIssue,
  SeoSnapshot,
} from './types.js';

export function toSeoExport(
  snapshot: SeoSnapshot,
  issues: SeoIssue[],
): SeoExport {
  return {
    url: snapshot.url,
    title: snapshot.document.title,
    description: snapshot.document.description,
    canonical: snapshot.canonical.href,
    openGraph: snapshot.openGraph.properties,
    twitter: snapshot.twitter.properties,
    hreflang: snapshot.hreflang,
    jsonLd: snapshot.jsonLd.map((block) => ({
      index: block.index,
      valid: block.valid,
      parsed: block.parsed,
      error: block.error,
    })),
    issues,
  };
}

export function inspectSeo(
  snapshot: SeoSnapshot,
  issues: SeoIssue[],
): SeoInspection {
  return { snapshot, issues };
}
