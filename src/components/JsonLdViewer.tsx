import { type ReactNode, useState } from 'react';
import { useCopied } from '../copy.js';
import { displayType, prettyJson } from '../jsonLd.js';
import type { JsonLdBlock, JsonLdEntity } from '../types.js';

function JsonValue({ value }: { value: unknown }) {
  if (value === null) {
    return <span className="seo-dt__json-null">null</span>;
  }
  if (typeof value === 'string') {
    return <span className="seo-dt__json-string">"{value}"</span>;
  }
  if (typeof value === 'number') {
    return <span className="seo-dt__json-number">{String(value)}</span>;
  }
  if (typeof value === 'boolean') {
    return <span className="seo-dt__json-boolean">{String(value)}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span>[]</span>;
    }
    return (
      <details open>
        <summary>[{value.length}]</summary>
        {value.map((entry, index) => (
          <div className="seo-dt__json-node" key={index}>
            <span className="seo-dt__json-key">{index}: </span>
            <JsonValue value={entry} />
          </div>
        ))}
      </details>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return <span>{'{}'}</span>;
    }
    return (
      <details open>
        <summary>{`{${entries.length}}`}</summary>
        {entries.map(([key, nested]) => (
          <div className="seo-dt__json-node" key={key}>
            <span className="seo-dt__json-key">"{key}": </span>
            <JsonValue value={nested} />
          </div>
        ))}
      </details>
    );
  }
  return <span>{String(value)}</span>;
}

function EntitySummary({ entity }: { entity: JsonLdEntity }) {
  if (entity.kind === 'breadcrumb' && entity.breadcrumbs?.length) {
    return (
      <ol className="seo-dt__list">
        {entity.breadcrumbs.map((item, index) => (
          <li
            key={`${item.position ?? index}-${item.name ?? item.item ?? index}`}
          >
            {item.name ?? item.item ?? `Item ${index + 1}`}
          </li>
        ))}
      </ol>
    );
  }

  const rows = Object.entries(entity.summary);
  if (rows.length === 0) {
    return (
      <div className="seo-dt__muted">No compact fields for this type.</div>
    );
  }

  return (
    <div className="seo-dt__entity-meta">
      {rows.map(([key, value]) => (
        <div key={key}>
          {key}: {typeof value === 'string' ? value : prettyJson(value)}
        </div>
      ))}
    </div>
  );
}

function EntityView({
  entity,
  fallbackRaw,
}: {
  entity: JsonLdEntity;
  fallbackRaw: string;
}) {
  const [showJson, setShowJson] = useState(false);
  const { copied, copy } = useCopied();
  const json = prettyJson(entity.value);

  return (
    <details className="seo-dt__entity" open>
      <summary>{displayType(entity.type)}</summary>
      <div className="seo-dt__hint">
        @type: {displayType(entity.type)}
        {entity.id ? ` · @id: ${entity.id}` : ''}
        {entity.context !== undefined
          ? ` · @context: ${typeof entity.context === 'string' ? entity.context : prettyJson(entity.context)}`
          : ''}
      </div>
      <EntitySummary entity={entity} />
      <div className="seo-dt__actions">
        <button
          type="button"
          className="seo-dt__btn"
          onClick={() => setShowJson((value) => !value)}
        >
          {showJson ? 'Hide JSON' : 'View JSON'}
        </button>
        <button
          type="button"
          className="seo-dt__btn"
          onClick={() => {
            void copy(json || fallbackRaw);
          }}
        >
          {copied ? 'Copied' : 'Copy JSON'}
        </button>
      </div>
      {showJson ? (
        <div className="seo-dt__json">
          <JsonValue value={entity.value} />
        </div>
      ) : null}
    </details>
  );
}

function InvalidBlock({ block }: { block: JsonLdBlock }) {
  const { copied, copy } = useCopied();

  return (
    <details className="seo-dt__entity" open>
      <summary>Invalid JSON-LD #{block.index + 1}</summary>
      <div className="seo-dt__issue" data-severity="error">
        <div className="seo-dt__issue-msg">
          {block.error ?? 'Malformed JSON'}
        </div>
      </div>
      <div className="seo-dt__actions">
        <button
          type="button"
          className="seo-dt__btn"
          onClick={() => {
            void copy(block.raw);
          }}
        >
          {copied ? 'Copied' : 'Copy raw'}
        </button>
      </div>
      <pre className="seo-dt__json">{block.raw}</pre>
    </details>
  );
}

export function JsonLdViewer({ blocks }: { blocks: JsonLdBlock[] }) {
  if (blocks.length === 0) {
    return (
      <div className="seo-dt__empty">No JSON-LD structured data found.</div>
    );
  }

  const nodes: ReactNode[] = [];

  blocks.forEach((block) => {
    if (!block.valid) {
      nodes.push(<InvalidBlock key={`invalid-${block.index}`} block={block} />);
      return;
    }

    if (block.entities.length === 0) {
      nodes.push(
        <details className="seo-dt__entity" key={`empty-${block.index}`} open>
          <summary>JSON-LD #{block.index + 1}</summary>
          <div className="seo-dt__json">
            <JsonValue value={block.parsed} />
          </div>
        </details>,
      );
      return;
    }

    block.entities.forEach((entity, entityIndex) => {
      nodes.push(
        <EntityView
          key={`${block.index}-${entityIndex}-${displayType(entity.type)}`}
          entity={entity}
          fallbackRaw={block.raw}
        />,
      );
    });
  });

  return <div>{nodes}</div>;
}
