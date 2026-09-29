import type { SeoIssue } from '../types.js';

const ORDER: Record<SeoIssue['severity'], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function IssueList({ issues }: { issues: SeoIssue[] }) {
  if (issues.length === 0) {
    return <div className="seo-dt__empty">No issues detected.</div>;
  }

  const sorted = [...issues].sort(
    (left, right) => ORDER[left.severity] - ORDER[right.severity],
  );

  return (
    <div className="seo-dt__issues">
      {sorted.map((item) => (
        <div
          key={item.id}
          className="seo-dt__issue"
          data-severity={item.severity}
        >
          <div className="seo-dt__issue-msg">
            {item.severity.toUpperCase()} · {item.message}
          </div>
          {item.details ? (
            <div className="seo-dt__issue-details">{item.details}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function countIssues(issues: SeoIssue[]): {
  error: number;
  warning: number;
  info: number;
} {
  return issues.reduce(
    (counts, item) => {
      counts[item.severity] += 1;
      return counts;
    },
    { error: 0, warning: 0, info: 0 },
  );
}
