import { displayType } from '../jsonLd.js';
import type { SeoInspection } from '../types.js';
import { countIssues } from './IssueList.js';
import { MetadataRow } from './MetadataRow.js';

function mark(
  ok: boolean,
  warning = false,
): { tone: 'ok' | 'warn' | 'error'; symbol: string } {
  if (!ok) {
    return { tone: warning ? 'warn' : 'error', symbol: warning ? '!' : '✕' };
  }
  return { tone: 'ok', symbol: '✓' };
}

export function Overview({ inspection }: { inspection: SeoInspection }) {
  const { snapshot, issues } = inspection;
  const counts = countIssues(issues);
  const title = snapshot.document.title;
  const description = snapshot.document.description;
  const types = snapshot.jsonLd.flatMap((block) =>
    block.valid
      ? block.entities.map((entity) => displayType(entity.type))
      : [`Invalid #${block.index + 1}`],
  );

  const titleMark = mark(
    Boolean(title),
    issues.some(
      (item) => item.id === 'title-short' || item.id === 'title-long',
    ),
  );
  const descriptionMark = mark(
    Boolean(description),
    issues.some((item) => item.id.startsWith('description')),
  );
  const canonicalMark = mark(
    Boolean(snapshot.canonical.href) && snapshot.canonical.count === 1,
    snapshot.canonical.count === 0,
  );

  return (
    <div>
      <MetadataRow
        label="Current page"
        value={snapshot.url}
        copyValue={snapshot.url}
      />
      <MetadataRow
        label="Title"
        value={
          <span className="seo-dt__status">
            <span className="seo-dt__mark" data-tone={titleMark.tone}>
              {titleMark.symbol}
            </span>
            {title ?? 'Missing'}
          </span>
        }
        hint={title ? `${title.length} characters` : undefined}
        copyValue={title ?? undefined}
      />
      <MetadataRow
        label="Description"
        value={
          <span className="seo-dt__status">
            <span className="seo-dt__mark" data-tone={descriptionMark.tone}>
              {descriptionMark.symbol}
            </span>
            {description ?? 'Missing'}
          </span>
        }
        hint={description ? `${description.length} characters` : undefined}
        copyValue={description ?? undefined}
      />
      <MetadataRow
        label="Canonical"
        value={
          <span className="seo-dt__status">
            <span className="seo-dt__mark" data-tone={canonicalMark.tone}>
              {canonicalMark.symbol}
            </span>
            {snapshot.canonical.href ?? 'Missing'}
          </span>
        }
        copyValue={snapshot.canonical.href ?? undefined}
      />
      <MetadataRow
        label="Open Graph"
        value={
          <span className="seo-dt__status">
            <span
              className="seo-dt__mark"
              data-tone={snapshot.openGraph.propertyCount ? 'ok' : 'warn'}
            >
              {snapshot.openGraph.propertyCount ? '✓' : '!'}
            </span>
            {snapshot.openGraph.propertyCount} properties
          </span>
        }
      />
      <MetadataRow
        label="Twitter"
        value={
          <span className="seo-dt__status">
            <span
              className="seo-dt__mark"
              data-tone={snapshot.twitter.card ? 'ok' : 'warn'}
            >
              {snapshot.twitter.card ? '✓' : '!'}
            </span>
            {snapshot.twitter.card ?? 'Missing twitter:card'}
          </span>
        }
      />
      <MetadataRow
        label="Structured Data"
        value={
          types.length ? (
            <span className="seo-dt__status">
              {types.map((type) => (
                <span key={type}>
                  <span className="seo-dt__mark" data-tone="ok">
                    ✓
                  </span>{' '}
                  {type}{' '}
                </span>
              ))}
            </span>
          ) : (
            <span className="seo-dt__muted">None</span>
          )
        }
      />
      <MetadataRow
        label="Issues"
        value={`${counts.error} error · ${counts.warning} warning · ${counts.info} info`}
      />
    </div>
  );
}
