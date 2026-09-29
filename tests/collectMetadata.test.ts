import { describe, expect, it } from 'vitest';
import { collectMetadata, parseRobotsContent } from '../src/collectMetadata.js';
import { diagnoseSeo } from '../src/diagnostics.js';
import {
  ARTICLE_JSON_LD,
  BREADCRUMB_JSON_LD,
  COMPLETE_DESCRIPTION,
  COMPLETE_TITLE,
  completeHead,
  createFixture,
  PAGE_URL,
} from './fixtures.js';

describe('collectMetadata', () => {
  it('collects complete valid metadata', () => {
    const doc = createFixture(completeHead(), 'en', [
      ARTICLE_JSON_LD,
      BREADCRUMB_JSON_LD,
    ]);
    const snapshot = collectMetadata(doc, PAGE_URL);

    expect(snapshot.document.title).toBe(COMPLETE_TITLE);
    expect(snapshot.document.description).toBe(COMPLETE_DESCRIPTION);
    expect(snapshot.document.charset?.toLowerCase()).toBe('utf-8');
    expect(snapshot.document.viewport).toContain('width=device-width');
    expect(snapshot.document.language).toBe('en');
    expect(snapshot.canonical.href).toBe(PAGE_URL);
    expect(snapshot.canonical.isAbsolute).toBe(true);
    expect(snapshot.canonical.matchesCurrent).toBe(true);
    expect(snapshot.canonical.count).toBe(1);
    expect(snapshot.robots.robots?.directives).toMatchObject({
      index: true,
      follow: true,
      'max-snippet': '160',
      'max-image-preview': 'large',
    });
    expect(snapshot.hreflang.map((entry) => entry.hreflang)).toEqual([
      'en',
      'pl',
      'x-default',
    ]);
    expect(snapshot.openGraph.title).toBe(COMPLETE_TITLE);
    expect(snapshot.openGraph.images[0]).toMatchObject({
      url: 'https://example.com/og.jpg',
      width: '1200',
      height: '630',
      alt: 'Cover image',
    });
    expect(snapshot.twitter.card).toBe('summary_large_image');
    expect(snapshot.jsonLd).toHaveLength(2);
    expect(snapshot.jsonLd[0]?.entities[0]?.type).toBe('Article');
    expect(snapshot.jsonLd[1]?.entities[0]?.type).toBe('BreadcrumbList');
  });

  it('detects a missing title', () => {
    const doc = createFixture(
      '<meta name="description" content="A description without a title tag present.">',
      'en',
    );
    const snapshot = collectMetadata(doc, PAGE_URL);
    expect(snapshot.document.title).toBeNull();
    expect(snapshot.document.titles).toEqual([]);
  });

  it('collects multiple canonical tags', () => {
    const doc = createFixture(
      `
        <link rel="canonical" href="${PAGE_URL}">
        <link rel="canonical" href="https://example.com/other">
      `,
      'en',
    );
    const snapshot = collectMetadata(doc, PAGE_URL);
    expect(snapshot.canonical.count).toBe(2);
    expect(snapshot.canonical.hrefs).toEqual([
      PAGE_URL,
      'https://example.com/other',
    ]);
  });

  it('groups og:image dimensions and alt with the image', () => {
    const doc = createFixture(
      `
        <meta property="og:image" content="https://example.com/one.jpg">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:image:alt" content="First">
        <meta property="og:image" content="https://example.com/two.jpg">
        <meta property="og:image:width" content="800">
        <meta property="og:image:height" content="418">
        <meta property="og:image:alt" content="Second">
      `,
      'en',
    );
    const snapshot = collectMetadata(doc, PAGE_URL);
    expect(snapshot.openGraph.images).toEqual([
      {
        url: 'https://example.com/one.jpg',
        width: '1200',
        height: '630',
        alt: 'First',
      },
      {
        url: 'https://example.com/two.jpg',
        width: '800',
        height: '418',
        alt: 'Second',
      },
    ]);
  });

  it('collects Twitter metadata and uses OG fallbacks in diagnostics', () => {
    const withTwitter = collectMetadata(
      createFixture(completeHead(), 'en'),
      PAGE_URL,
    );
    expect(withTwitter.twitter).toMatchObject({
      card: 'summary_large_image',
      title: COMPLETE_TITLE,
      description: COMPLETE_DESCRIPTION,
      image: 'https://example.com/og.jpg',
      site: '@example',
      creator: '@author',
    });

    const ogOnly = collectMetadata(
      createFixture(
        `
          <title>${COMPLETE_TITLE}</title>
          <meta property="og:title" content="${COMPLETE_TITLE}">
          <meta property="og:description" content="${COMPLETE_DESCRIPTION}">
          <meta property="og:image" content="https://example.com/og.jpg">
        `,
        'en',
      ),
      PAGE_URL,
    );
    const issues = diagnoseSeo(ogOnly).map((item) => item.id);
    expect(issues).not.toContain('twitter-title-missing');
    expect(issues).not.toContain('twitter-description-missing');
    expect(issues).not.toContain('twitter-image-missing');
    expect(issues).toContain('twitter-card-missing');
  });

  it('parses a valid JSON-LD object', () => {
    const snapshot = collectMetadata(
      createFixture('', 'en', [ARTICLE_JSON_LD]),
      PAGE_URL,
    );
    expect(snapshot.jsonLd[0]?.valid).toBe(true);
    expect(snapshot.jsonLd[0]?.entities[0]).toMatchObject({
      type: 'Article',
      kind: 'article',
      summary: {
        headline: COMPLETE_TITLE,
        author: 'Ada Lovelace',
      },
    });
  });

  it('parses a JSON-LD array', () => {
    const snapshot = collectMetadata(
      createFixture('', 'en', [
        [
          ARTICLE_JSON_LD,
          { '@context': 'https://schema.org', '@type': 'Person', name: 'Ada' },
        ],
      ]),
      PAGE_URL,
    );
    expect(snapshot.jsonLd[0]?.entities.map((entity) => entity.type)).toEqual([
      'Article',
      'Person',
    ]);
  });

  it('expands JSON-LD @graph entities', () => {
    const snapshot = collectMetadata(
      createFixture('', 'en', [
        {
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              name: 'Example',
              url: 'https://example.com/',
            },
            { '@type': 'WebPage', name: 'Post', url: PAGE_URL },
          ],
        },
      ]),
      PAGE_URL,
    );
    const entities = snapshot.jsonLd[0]?.entities ?? [];
    expect(entities).toHaveLength(2);
    expect(entities[0]?.type).toBe('WebSite');
    expect(entities[1]?.type).toBe('WebPage');
    expect(entities[0]?.context).toBe('https://schema.org');
  });

  it('keeps malformed JSON-LD without throwing', () => {
    const snapshot = collectMetadata(
      createFixture('', 'en', ['{ headline: "bad json" }']),
      PAGE_URL,
    );
    expect(snapshot.jsonLd[0]?.valid).toBe(false);
    expect(snapshot.jsonLd[0]?.error).toBeTruthy();
    expect(snapshot.jsonLd[0]?.entities).toEqual([]);
  });

  it('supports multiple structured-data blocks', () => {
    const snapshot = collectMetadata(
      createFixture('', 'en', [ARTICLE_JSON_LD, BREADCRUMB_JSON_LD]),
      PAGE_URL,
    );
    expect(snapshot.jsonLd).toHaveLength(2);
    expect(snapshot.jsonLd[0]?.entities[0]?.kind).toBe('article');
    expect(snapshot.jsonLd[1]?.entities[0]?.kind).toBe('breadcrumb');
    expect(
      snapshot.jsonLd[1]?.entities[0]?.breadcrumbs?.map((item) => item.name),
    ).toEqual(['Home', 'Blog', 'Current article']);
  });

  it('collects duplicate metadata entries', () => {
    const snapshot = collectMetadata(
      createFixture(
        `
          <title>First title that is long enough here</title>
          <title>Second title that is long enough too</title>
          <meta name="description" content="${COMPLETE_DESCRIPTION}">
          <meta name="description" content="${COMPLETE_DESCRIPTION}">
        `,
        'en',
      ),
      PAGE_URL,
    );
    expect(snapshot.document.titles).toHaveLength(2);
    expect(snapshot.document.descriptions).toHaveLength(2);
  });
});

describe('parseRobotsContent', () => {
  it('parses boolean and valued directives', () => {
    expect(
      parseRobotsContent(
        'noindex, nofollow, max-snippet:20, max-image-preview:large',
      ).directives,
    ).toEqual({
      noindex: true,
      nofollow: true,
      'max-snippet': '20',
      'max-image-preview': 'large',
    });
  });
});
