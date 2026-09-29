import type { SeoSnapshot } from '../types.js';

function truncate(value: string, max: number): string {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max - 1)}…`;
}

function hostLabel(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.host + parsed.pathname.replace(/\/+$/, '');
  } catch {
    return url;
  }
}

export function Previews({ snapshot }: { snapshot: SeoSnapshot }) {
  const title = snapshot.document.title ?? snapshot.openGraph.title ?? '';
  const description =
    snapshot.document.description ?? snapshot.openGraph.description ?? '';
  const canonical = snapshot.canonical.href ?? snapshot.url;
  const ogImage = snapshot.openGraph.images[0]?.url;
  const twitterImage = snapshot.twitter.image ?? ogImage;
  const twitterTitle =
    snapshot.twitter.title ?? snapshot.openGraph.title ?? title;
  const twitterDescription =
    snapshot.twitter.description ??
    snapshot.openGraph.description ??
    description;

  return (
    <div className="seo-dt__preview">
      <div>
        <div className="seo-dt__note">Approximate SERP preview</div>
        <div className="seo-dt__serp">
          <div className="seo-dt__serp-url">{hostLabel(canonical)}</div>
          <div className="seo-dt__serp-title">
            {truncate(title || 'Untitled', 60)}
          </div>
          <div className="seo-dt__serp-desc">
            {truncate(description || 'No meta description.', 160)}
          </div>
        </div>
      </div>

      <div>
        <div className="seo-dt__note">Open Graph preview</div>
        <div className="seo-dt__card">
          {ogImage ? (
            <img className="seo-dt__card-img" src={ogImage} alt="" />
          ) : (
            <div className="seo-dt__card-placeholder">No og:image</div>
          )}
          <div className="seo-dt__card-body">
            <div className="seo-dt__card-site">
              {snapshot.openGraph.siteName ?? hostLabel(canonical)}
            </div>
            <div className="seo-dt__card-title">
              {(snapshot.openGraph.title ?? title) || 'No og:title'}
            </div>
            <div>
              {(snapshot.openGraph.description ?? description) ||
                'No og:description'}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="seo-dt__note">Twitter / X preview</div>
        <div className="seo-dt__card">
          {twitterImage ? (
            <img className="seo-dt__card-img" src={twitterImage} alt="" />
          ) : (
            <div className="seo-dt__card-placeholder">No twitter:image</div>
          )}
          <div className="seo-dt__card-body">
            <div className="seo-dt__card-site">
              {snapshot.twitter.card ?? 'summary'}
            </div>
            <div className="seo-dt__card-title">
              {twitterTitle || 'No title'}
            </div>
            <div>{twitterDescription || 'No description'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
