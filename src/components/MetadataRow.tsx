import type { ReactNode } from 'react';
import { useCopied } from '../copy.js';

export function MetadataRow({
  label,
  value,
  hint,
  copyValue,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  copyValue?: string;
}) {
  const { copied, copy } = useCopied();
  const empty = value === null || value === undefined || value === '';

  return (
    <div className="seo-dt__row">
      <div className="seo-dt__label">{label}</div>
      <div className="seo-dt__value">
        {empty ? <span className="seo-dt__muted">—</span> : value}
        {hint ? <span className="seo-dt__hint">{hint}</span> : null}
      </div>
      {copyValue ? (
        <button
          type="button"
          className="seo-dt__btn"
          onClick={() => {
            void copy(copyValue);
          }}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
