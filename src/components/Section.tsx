import type { ReactNode } from 'react';

export function Section({
  id,
  title,
  badge,
  children,
}: {
  id: string;
  title: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section className="seo-dt__section" id={id}>
      <h2 className="seo-dt__h2">
        {title}
        {badge ? <span className="seo-dt__badge">{badge}</span> : null}
      </h2>
      {children}
    </section>
  );
}
