export const SEO_DEVTOOLS_CSS = `
[data-seo-devtools] {
  --seo-dt-fg: #e4e4e7;
  --seo-dt-muted: #a1a1aa;
  --seo-dt-border: rgba(255, 255, 255, 0.12);
  --seo-dt-tab: rgba(255, 255, 255, 0.04);
  --seo-dt-tab-hover: rgba(255, 255, 255, 0.08);
  --seo-dt-tab-active: rgba(255, 255, 255, 0.12);
  --seo-dt-accent: #facc15;
  --seo-dt-badge: rgba(255, 255, 255, 0.1);
  --seo-dt-surface: rgba(255, 255, 255, 0.04);
  box-sizing: border-box;
  height: 100%;
  overflow: auto;
  padding: 0 10px 16px;
  color: var(--seo-dt-fg);
  color-scheme: dark;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-size: 12px;
  line-height: 1.45;
}

[data-seo-devtools][data-theme="light"] {
  --seo-dt-fg: #18181b;
  --seo-dt-muted: #52525b;
  --seo-dt-border: rgba(24, 24, 27, 0.14);
  --seo-dt-tab: rgba(24, 24, 27, 0.04);
  --seo-dt-tab-hover: rgba(24, 24, 27, 0.08);
  --seo-dt-tab-active: rgba(24, 24, 27, 0.1);
  --seo-dt-accent: #ca8a04;
  --seo-dt-badge: rgba(24, 24, 27, 0.08);
  --seo-dt-surface: rgba(24, 24, 27, 0.04);
  color-scheme: light;
}

[data-seo-devtools] *,
[data-seo-devtools] *::before,
[data-seo-devtools] *::after {
  box-sizing: border-box;
}

.seo-dt__nav {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  flex-wrap: nowrap;
  gap: 0;
  margin: 0 -10px 12px;
  padding: 0 6px;
  overflow-x: auto;
  background: inherit;
  border-bottom: 1px solid var(--seo-dt-border);
}

.seo-dt__nav-btn {
  appearance: none;
  -webkit-appearance: none;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  background: transparent;
  color: var(--seo-dt-muted);
  padding: 9px 10px 7px;
  font: inherit;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
  cursor: pointer;
}

.seo-dt__nav-btn:hover {
  color: var(--seo-dt-fg);
  background: var(--seo-dt-tab-hover);
}

.seo-dt__nav-btn[data-active="true"] {
  color: var(--seo-dt-fg);
  background: transparent;
  border-bottom-color: var(--seo-dt-accent);
}

.seo-dt__nav-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.25rem;
  height: 1.15rem;
  padding: 0 5px;
  border-radius: 999px;
  background: var(--seo-dt-badge);
  color: var(--seo-dt-fg);
  font-size: 10px;
  font-variant-numeric: tabular-nums;
}

.seo-dt__toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 10px;
}

.seo-dt__section {
  margin-bottom: 16px;
}

.seo-dt__h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--seo-dt-fg);
}

.seo-dt__badge {
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--seo-dt-badge);
  color: var(--seo-dt-muted);
}

.seo-dt__row {
  display: grid;
  grid-template-columns: 140px minmax(0, 1fr) auto;
  gap: 8px;
  align-items: start;
  padding: 4px 0;
  border-bottom: 1px solid var(--seo-dt-border);
}

.seo-dt__label {
  color: var(--seo-dt-muted);
}

.seo-dt__value {
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  color: var(--seo-dt-fg);
}

.seo-dt__muted {
  color: var(--seo-dt-muted);
}

.seo-dt__hint {
  display: block;
  margin-top: 2px;
  color: var(--seo-dt-muted);
  font-size: 11px;
}

.seo-dt__btn {
  appearance: none;
  -webkit-appearance: none;
  border: 1px solid var(--seo-dt-border);
  background: var(--seo-dt-tab);
  color: var(--seo-dt-fg);
  border-radius: 4px;
  padding: 2px 7px;
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  white-space: nowrap;
}

.seo-dt__btn:hover {
  background: var(--seo-dt-tab-hover);
}

.seo-dt__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.seo-dt__mark {
  font-weight: 700;
}

.seo-dt__mark[data-tone="ok"] { color: #3dd68c; }
.seo-dt__mark[data-tone="warn"] { color: #f5b942; }
.seo-dt__mark[data-tone="error"] { color: #ff6b6b; }
.seo-dt__mark[data-tone="info"] { color: #6db7ff; }

.seo-dt__kv {
  display: grid;
  gap: 2px;
  margin: 0 0 10px;
}

.seo-dt__issues {
  display: grid;
  gap: 6px;
}

.seo-dt__issue {
  padding: 6px 8px;
  border-left: 3px solid currentColor;
  background: var(--seo-dt-surface);
}

.seo-dt__issue[data-severity="error"] { color: #ff8a8a; }
.seo-dt__issue[data-severity="warning"] { color: #f5b942; }
.seo-dt__issue[data-severity="info"] { color: #8ec5ff; }

.seo-dt__issue-msg {
  font-weight: 600;
}

.seo-dt__issue-details {
  margin-top: 2px;
  opacity: 0.8;
  overflow-wrap: anywhere;
}

.seo-dt__empty {
  color: var(--seo-dt-muted);
  font-style: italic;
}

.seo-dt__entity {
  border: 1px solid var(--seo-dt-border);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 8px;
  background: var(--seo-dt-surface);
}

.seo-dt__entity summary {
  cursor: pointer;
  font-weight: 700;
  color: var(--seo-dt-fg);
}

.seo-dt__entity-meta {
  margin: 6px 0;
}

.seo-dt__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}

.seo-dt__json {
  margin: 0;
  padding: 8px;
  overflow: auto;
  max-height: 280px;
  background: rgba(0, 0, 0, 0.28);
  border-radius: 4px;
}

[data-seo-devtools][data-theme="light"] .seo-dt__json {
  background: rgba(24, 24, 27, 0.06);
}

.seo-dt__json-node {
  margin-left: 12px;
}

.seo-dt__json-key {
  color: #9cdcfe;
}

.seo-dt__json-string { color: #ce9178; }
.seo-dt__json-number { color: #b5cea8; }
.seo-dt__json-boolean { color: #569cd6; }
.seo-dt__json-null { color: #808080; }

.seo-dt__preview {
  display: grid;
  gap: 10px;
}

.seo-dt__serp {
  max-width: 600px;
  padding: 10px;
  border: 1px solid var(--seo-dt-border);
  border-radius: 6px;
  background: #fff;
}

.seo-dt__serp-url {
  color: #006621;
  font-size: 12px;
}

.seo-dt__serp-title {
  color: #1a0dab;
  font-size: 18px;
  font-family: Arial, sans-serif;
  line-height: 1.3;
}

.seo-dt__serp-desc {
  color: #4d5156;
  font-family: Arial, sans-serif;
  font-size: 14px;
}

.seo-dt__card {
  max-width: 420px;
  border: 1px solid var(--seo-dt-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--seo-dt-surface);
}

.seo-dt__card-img,
.seo-dt__card-placeholder {
  width: 100%;
  height: 180px;
  object-fit: cover;
  background: var(--seo-dt-tab-active);
}

.seo-dt__card-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--seo-dt-muted);
}

.seo-dt__card-body {
  padding: 10px;
}

.seo-dt__card-site {
  font-size: 11px;
  color: var(--seo-dt-muted);
  text-transform: uppercase;
}

.seo-dt__card-title {
  font-weight: 700;
  margin: 4px 0;
  color: var(--seo-dt-fg);
}

.seo-dt__note {
  color: var(--seo-dt-muted);
  font-size: 11px;
  margin-bottom: 8px;
}

.seo-dt__list {
  margin: 0;
  padding-left: 18px;
}

.seo-dt__waiting {
  color: var(--seo-dt-muted);
  padding: 12px 4px;
}
`;
