import { describe, expect, it } from 'vitest';
import { collectMetadata } from '../src/collectMetadata.js';
import { diagnoseSeo } from '../src/diagnostics.js';
import {
  ARTICLE_JSON_LD,
  COMPLETE_DESCRIPTION,
  COMPLETE_TITLE,
  completeHead,
  createFixture,
  PAGE_URL,
} from './fixtures.js';

function issueIds(
  head: string,
  lang?: string,
  href = PAGE_URL,
  jsonLd: Array<string | unknown> = [],
): string[] {
  return diagnoseSeo(
    collectMetadata(createFixture(head, lang, jsonLd), href),
  ).map((item) => item.id);
}

describe('diagnoseSeo', () => {
  it('reports missing title', () => {
    expect(issueIds('', 'en')).toContain('title-missing');
  });

  it('reports duplicate titles and descriptions', () => {
    const ids = issueIds(
      `
        <title>First title that is long enough here</title>
        <title>Second title that is long enough too</title>
        <meta name="description" content="${COMPLETE_DESCRIPTION}">
        <meta name="description" content="${COMPLETE_DESCRIPTION}">
      `,
      'en',
    );
    expect(ids).toContain('title-duplicate');
    expect(ids).toContain('description-duplicate');
  });

  it('reports multiple canonical tags as an error', () => {
    const issues = diagnoseSeo(
      collectMetadata(
        createFixture(
          `
            <title>${COMPLETE_TITLE}</title>
            <link rel="canonical" href="${PAGE_URL}">
            <link rel="canonical" href="https://example.com/other">
          `,
          'en',
        ),
        PAGE_URL,
      ),
    );
    const multiple = issues.find((item) => item.id === 'canonical-multiple');
    expect(multiple?.severity).toBe('error');
  });

  it('treats query-only canonical differences as info', () => {
    const issues = diagnoseSeo(
      collectMetadata(
        createFixture(
          `
            <title>${COMPLETE_TITLE}</title>
            <link rel="canonical" href="${PAGE_URL}">
          `,
          'en',
        ),
        `${PAGE_URL}?utm=1`,
      ),
    );
    const query = issues.find((item) => item.id === 'canonical-query-diff');
    expect(query?.severity).toBe('info');
    expect(issues.some((item) => item.id === 'canonical-mismatch')).toBe(false);
  });

  it('flags malformed JSON-LD as an error', () => {
    const issues = diagnoseSeo(
      collectMetadata(
        createFixture(`<title>${COMPLETE_TITLE}</title>`, 'en', ['{bad']),
        PAGE_URL,
      ),
    );
    expect(issues.some((item) => item.id.startsWith('jsonld-invalid'))).toBe(
      true,
    );
  });

  it('flags duplicate identical JSON-LD objects', () => {
    const ids = issueIds('', 'en', PAGE_URL, [
      ARTICLE_JSON_LD,
      ARTICLE_JSON_LD,
    ]);
    expect(ids).toContain('jsonld-duplicate');
  });

  it('does not require identical title and og:title when one contains the other', () => {
    const ids = issueIds(
      completeHead().replace(
        `property="og:title" content="${COMPLETE_TITLE}"`,
        `property="og:title" content="${COMPLETE_TITLE} | Example"`,
      ),
      'en',
    );
    expect(ids).not.toContain('consistency-title-og');
  });
});
