import { useState } from 'react';
import { countIssues, IssueList } from './components/IssueList.js';
import { JsonLdViewer } from './components/JsonLdViewer.js';
import { MetadataRow } from './components/MetadataRow.js';
import { Overview } from './components/Overview.js';
import { Previews } from './components/Previews.js';
import { Section } from './components/Section.js';
import { useCopied } from './copy.js';
import { prettyJson } from './jsonLd.js';
import { toSeoExport } from './snapshot.js';
import { SEO_DEVTOOLS_CSS } from './styles.js';
import type { SeoInspection, SeoSnapshot } from './types.js';
import { useSeoSnapshot } from './useSeoSnapshot.js';

type PanelSection =
  | 'overview'
  | 'metadata'
  | 'open-graph'
  | 'twitter'
  | 'hreflang'
  | 'structured-data'
  | 'issues';

const SECTIONS: Array<{ id: PanelSection; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'metadata', label: 'Metadata' },
  { id: 'open-graph', label: 'Open Graph' },
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'hreflang', label: 'hreflang' },
  { id: 'structured-data', label: 'Structured Data' },
  { id: 'issues', label: 'Issues' },
];

function RobotsRows({
  label,
  raw,
  directives,
}: {
  label: string;
  raw: string | null;
  directives: Record<string, string | boolean> | null;
}) {
  return (
    <>
      <MetadataRow
        label={`${label} raw`}
        value={raw}
        copyValue={raw ?? undefined}
      />
      <MetadataRow
        label={`${label} parsed`}
        value={
          directives
            ? Object.entries(directives)
                .map(([key, value]) =>
                  value === true ? key : `${key}: ${value}`,
                )
                .join(', ')
            : null
        }
      />
    </>
  );
}

function MetadataSections({ snapshot }: { snapshot: SeoSnapshot }) {
  return (
    <>
      <MetadataRow
        label="Title"
        value={snapshot.document.title}
        hint={
          snapshot.document.title
            ? `${snapshot.document.title.length} characters`
            : undefined
        }
        copyValue={snapshot.document.title ?? undefined}
      />
      <MetadataRow
        label="Description"
        value={snapshot.document.description}
        hint={
          snapshot.document.description
            ? `${snapshot.document.description.length} characters`
            : undefined
        }
        copyValue={snapshot.document.description ?? undefined}
      />
      <MetadataRow label="Charset" value={snapshot.document.charset} />
      <MetadataRow label="Viewport" value={snapshot.document.viewport} />
      <MetadataRow label="Language" value={snapshot.document.language} />
      <MetadataRow label="Base URL" value={snapshot.document.baseHref} />
      <MetadataRow
        label="Canonical"
        value={snapshot.canonical.href}
        hint={`${snapshot.canonical.isAbsolute ? 'absolute' : 'relative'}${snapshot.canonical.matchesCurrent ? ' · matches current URL' : ''}`}
        copyValue={snapshot.canonical.href ?? undefined}
      />
      <MetadataRow label="Current URL" value={snapshot.canonical.currentUrl} />
      <MetadataRow
        label="Canonical count"
        value={String(snapshot.canonical.count)}
      />
      <RobotsRows
        label="Robots"
        raw={snapshot.robots.robots?.raw ?? null}
        directives={snapshot.robots.robots?.directives ?? null}
      />
      <RobotsRows
        label="Googlebot"
        raw={snapshot.robots.googlebot?.raw ?? null}
        directives={snapshot.robots.googlebot?.directives ?? null}
      />
    </>
  );
}

function OpenGraphSection({ snapshot }: { snapshot: SeoSnapshot }) {
  const og = snapshot.openGraph;
  return (
    <>
      <MetadataRow
        label="og:title"
        value={og.title}
        copyValue={og.title ?? undefined}
      />
      <MetadataRow
        label="og:description"
        value={og.description}
        copyValue={og.description ?? undefined}
      />
      <MetadataRow
        label="og:url"
        value={og.url}
        copyValue={og.url ?? undefined}
      />
      <MetadataRow label="og:type" value={og.type} />
      <MetadataRow label="og:site_name" value={og.siteName} />
      <MetadataRow label="og:locale" value={og.locale} />
      {og.images.length === 0 ? (
        <MetadataRow label="og:image" value={null} />
      ) : (
        og.images.map((image, index) => (
          <div
            key={`${image.url}-${image.width ?? ''}-${image.height ?? ''}-${image.alt ?? ''}`}
          >
            <MetadataRow
              label={
                og.images.length > 1 ? `og:image #${index + 1}` : 'og:image'
              }
              value={image.url}
              copyValue={image.url}
            />
            <MetadataRow label="og:image:width" value={image.width ?? null} />
            <MetadataRow label="og:image:height" value={image.height ?? null} />
            <MetadataRow label="og:image:alt" value={image.alt ?? null} />
            <MetadataRow label="og:image:type" value={image.type ?? null} />
          </div>
        ))
      )}
    </>
  );
}

function TwitterSection({ snapshot }: { snapshot: SeoSnapshot }) {
  const twitter = snapshot.twitter;
  return (
    <>
      <MetadataRow label="twitter:card" value={twitter.card} />
      <MetadataRow
        label="twitter:title"
        value={twitter.title}
        hint={
          !twitter.title && snapshot.openGraph.title
            ? `OG fallback: ${snapshot.openGraph.title}`
            : undefined
        }
        copyValue={twitter.title ?? undefined}
      />
      <MetadataRow
        label="twitter:description"
        value={twitter.description}
        hint={
          !twitter.description && snapshot.openGraph.description
            ? `OG fallback: ${snapshot.openGraph.description}`
            : undefined
        }
        copyValue={twitter.description ?? undefined}
      />
      <MetadataRow
        label="twitter:image"
        value={twitter.image}
        hint={
          !twitter.image && snapshot.openGraph.images[0]
            ? `OG fallback: ${snapshot.openGraph.images[0].url}`
            : undefined
        }
        copyValue={twitter.image ?? undefined}
      />
      <MetadataRow label="twitter:image:alt" value={twitter.imageAlt} />
      <MetadataRow label="twitter:site" value={twitter.site} />
      <MetadataRow label="twitter:creator" value={twitter.creator} />
    </>
  );
}

function HreflangSection({ snapshot }: { snapshot: SeoSnapshot }) {
  if (snapshot.hreflang.length === 0) {
    return <div className="seo-dt__empty">No hreflang links found.</div>;
  }

  return (
    <>
      {snapshot.hreflang.map((entry) => (
        <MetadataRow
          key={`${entry.hreflang}-${entry.href}`}
          label={
            entry.isXDefault ? `${entry.hreflang} (x-default)` : entry.hreflang
          }
          value={entry.href || 'Missing URL'}
          hint={entry.isMalformed ? 'Malformed or missing URL' : undefined}
          copyValue={entry.href || undefined}
        />
      ))}
    </>
  );
}

function PanelBody({ inspection }: { inspection: SeoInspection }) {
  const [section, setSection] = useState<PanelSection>('overview');
  const { copied, copy } = useCopied();
  const counts = countIssues(inspection.issues);
  const issueCount = inspection.issues.length;
  const jsonLdCount = inspection.snapshot.jsonLd.length;

  return (
    <>
      <div className="seo-dt__nav">
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="seo-dt__nav-btn"
            data-active={section === item.id}
            onClick={() => setSection(item.id)}
          >
            {item.label}
            {item.id === 'issues' && issueCount > 0 ? (
              <span className="seo-dt__nav-count">{issueCount}</span>
            ) : null}
            {item.id === 'structured-data' && jsonLdCount > 0 ? (
              <span className="seo-dt__nav-count">{jsonLdCount}</span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="seo-dt__toolbar">
        <button
          type="button"
          className="seo-dt__btn"
          onClick={() => {
            void copy(
              prettyJson(toSeoExport(inspection.snapshot, inspection.issues)),
            );
          }}
        >
          {copied ? 'Copied snapshot' : 'Copy SEO snapshot'}
        </button>
      </div>

      {section === 'overview' ? (
        <Section id="overview" title="Overview">
          <Overview inspection={inspection} />
          <div className="seo-dt__section">
            <Previews snapshot={inspection.snapshot} />
          </div>
        </Section>
      ) : null}

      {section === 'metadata' ? (
        <Section id="metadata" title="Metadata">
          <MetadataSections snapshot={inspection.snapshot} />
        </Section>
      ) : null}

      {section === 'open-graph' ? (
        <Section
          id="open-graph"
          title="Open Graph"
          badge={`${inspection.snapshot.openGraph.propertyCount} properties`}
        >
          <OpenGraphSection snapshot={inspection.snapshot} />
        </Section>
      ) : null}

      {section === 'twitter' ? (
        <Section id="twitter" title="Twitter / X">
          <TwitterSection snapshot={inspection.snapshot} />
        </Section>
      ) : null}

      {section === 'hreflang' ? (
        <Section
          id="hreflang"
          title="hreflang"
          badge={String(inspection.snapshot.hreflang.length)}
        >
          <HreflangSection snapshot={inspection.snapshot} />
        </Section>
      ) : null}

      {section === 'structured-data' ? (
        <Section
          id="structured-data"
          title="Structured Data"
          badge={String(jsonLdCount)}
        >
          <JsonLdViewer blocks={inspection.snapshot.jsonLd} />
        </Section>
      ) : null}

      {section === 'issues' ? (
        <Section
          id="issues"
          title="Issues"
          badge={`${counts.error}e / ${counts.warning}w / ${counts.info}i`}
        >
          <IssueList issues={inspection.issues} />
        </Section>
      ) : null}
    </>
  );
}

export function SeoDevtoolsPanel({
  theme = 'dark',
}: {
  theme?: 'dark' | 'light';
}) {
  const inspection = useSeoSnapshot();

  return (
    <div data-seo-devtools data-theme={theme === 'light' ? 'light' : 'dark'}>
      <style>{SEO_DEVTOOLS_CSS}</style>
      {inspection ? (
        <PanelBody inspection={inspection} />
      ) : (
        <div className="seo-dt__waiting">Inspecting document metadata…</div>
      )}
    </div>
  );
}
