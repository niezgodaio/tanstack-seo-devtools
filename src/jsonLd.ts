import {
  ARTICLE_TYPES,
  BREADCRUMB_TYPES,
  ORGANIZATION_TYPES,
  PERSON_TYPES,
  PRODUCT_TYPES,
  WEBPAGE_TYPES,
  WEBSITE_TYPES,
} from './constants.js';
import type {
  BreadcrumbItem,
  JsonLdBlock,
  JsonLdEntity,
  JsonLdSummaryKind,
} from './types.js';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function shortTypeName(type: string): string {
  const trimmed = type.replace(/\/$/, '');
  const parts = trimmed.split(/[/#]/);
  return parts[parts.length - 1] || type;
}

export function normalizeTypes(type: unknown): string[] {
  if (typeof type === 'string') {
    return [shortTypeName(type)];
  }

  if (Array.isArray(type)) {
    return type
      .filter((entry): entry is string => typeof entry === 'string')
      .map(shortTypeName);
  }

  return [];
}

export function displayType(type: string | string[] | undefined): string {
  if (!type) {
    return 'Untitled';
  }

  return Array.isArray(type) ? type.join(', ') : type;
}

function hasType(types: string[], candidates: readonly string[]): boolean {
  const lower = types.map((entry) => entry.toLowerCase());
  return candidates.some((candidate) =>
    lower.includes(candidate.toLowerCase()),
  );
}

export function jsonLdText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    for (const entry of value) {
      const text = jsonLdText(entry);
      if (text) {
        return text;
      }
    }
    return undefined;
  }

  if (isRecord(value)) {
    if (typeof value.name === 'string') {
      return value.name;
    }
    if (typeof value.headline === 'string') {
      return value.headline;
    }
    if (typeof value.url === 'string') {
      return value.url;
    }
    if (typeof value['@id'] === 'string') {
      return value['@id'];
    }
    if (typeof value.text === 'string') {
      return value.text;
    }
  }

  return undefined;
}

function pick(
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const key of keys) {
    if (record[key] !== undefined) {
      const text = jsonLdText(record[key]);
      result[key] = text ?? record[key];
    }
  }

  return result;
}

function offerFields(offers: unknown): Record<string, unknown> {
  const offer = Array.isArray(offers) ? offers[0] : offers;
  if (!isRecord(offer)) {
    return offers === undefined ? {} : { offers };
  }

  const summary: Record<string, unknown> = {};
  const price = jsonLdText(offer.price);
  const currency = jsonLdText(offer.priceCurrency);
  const availability = jsonLdText(offer.availability);

  if (price) summary.price = price;
  if (currency) summary.priceCurrency = currency;
  if (availability) summary.availability = availability;
  summary.offers = offer;

  return summary;
}

function breadcrumbItems(value: unknown): BreadcrumbItem[] {
  if (!isRecord(value)) {
    return [];
  }

  const list = value.itemListElement;
  const items = Array.isArray(list) ? list : list ? [list] : [];

  return items
    .filter(isRecord)
    .map((item) => ({
      position:
        typeof item.position === 'number'
          ? item.position
          : Number.parseInt(String(item.position ?? ''), 10) || undefined,
      name: jsonLdText(item.name) ?? jsonLdText(item.item),
      item: jsonLdText(item.item),
    }))
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0));
}

function classify(types: string[]): JsonLdSummaryKind {
  if (hasType(types, ARTICLE_TYPES)) return 'article';
  if (hasType(types, PRODUCT_TYPES)) return 'product';
  if (hasType(types, ORGANIZATION_TYPES)) return 'organization';
  if (hasType(types, PERSON_TYPES)) return 'person';
  if (hasType(types, BREADCRUMB_TYPES)) return 'breadcrumb';
  if (hasType(types, WEBSITE_TYPES)) return 'website';
  if (hasType(types, WEBPAGE_TYPES)) return 'webpage';
  return 'other';
}

function summarizeEntity(
  record: Record<string, unknown>,
  kind: JsonLdSummaryKind,
): Record<string, unknown> {
  switch (kind) {
    case 'article':
      return pick(record, [
        'headline',
        'description',
        'author',
        'datePublished',
        'dateModified',
        'image',
        'publisher',
      ]);
    case 'product':
      return {
        ...pick(record, ['name', 'image', 'description', 'brand', 'sku']),
        ...offerFields(record.offers),
      };
    case 'organization':
      return pick(record, ['name', 'url', 'logo']);
    case 'person':
      return pick(record, ['name', 'url', 'image']);
    case 'website':
    case 'webpage':
      return pick(record, ['name', 'url', 'description', 'potentialAction']);
    case 'breadcrumb':
    case 'other':
      return pick(record, ['name', 'url', 'description']);
  }
}

export function toJsonLdEntity(value: unknown): JsonLdEntity | null {
  if (!isRecord(value)) {
    return null;
  }

  const types = normalizeTypes(value['@type']);
  const kind = classify(types);
  const type = types.length === 1 ? types[0] : types.length ? types : undefined;

  return {
    context: value['@context'],
    type,
    id: typeof value['@id'] === 'string' ? value['@id'] : undefined,
    kind,
    summary: summarizeEntity(value, kind),
    breadcrumbs: kind === 'breadcrumb' ? breadcrumbItems(value) : undefined,
    value,
  };
}

export function extractJsonLdEntities(parsed: unknown): JsonLdEntity[] {
  if (Array.isArray(parsed)) {
    return parsed.flatMap(extractJsonLdEntities);
  }

  if (!isRecord(parsed)) {
    return [];
  }

  const graph = parsed['@graph'];
  if (Array.isArray(graph)) {
    const context = parsed['@context'];
    return graph.flatMap((node) => {
      if (
        isRecord(node) &&
        node['@context'] === undefined &&
        context !== undefined
      ) {
        return extractJsonLdEntities({ ...node, '@context': context });
      }
      return extractJsonLdEntities(node);
    });
  }

  const entity = toJsonLdEntity(parsed);
  return entity ? [entity] : [];
}

export function parseJsonLdBlock(raw: string, index: number): JsonLdBlock {
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      index,
      valid: false,
      raw,
      error: 'JSON-LD script is empty',
      entities: [],
    };
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);
    return {
      index,
      valid: true,
      raw,
      parsed,
      entities: extractJsonLdEntities(parsed),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON';
    return {
      index,
      valid: false,
      raw,
      error: message,
      entities: [],
    };
  }
}

export function collectJsonLdBlocks(
  doc: Document,
  previous: JsonLdBlock[] = [],
): JsonLdBlock[] {
  const unused = new Map<string, JsonLdBlock[]>();

  for (const block of previous) {
    const list = unused.get(block.raw) ?? [];
    list.push(block);
    unused.set(block.raw, list);
  }

  const scripts = [
    ...doc.querySelectorAll('script[type="application/ld+json"]'),
  ];

  return scripts.map((script, index) => {
    const raw = script.textContent ?? '';
    const cached = unused.get(raw);
    const reused = cached?.shift();

    if (reused) {
      return { ...reused, index };
    }

    return parseJsonLdBlock(raw, index);
  });
}

export function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}
