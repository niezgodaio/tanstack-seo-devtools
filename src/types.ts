export type SeoIssueSeverity = 'error' | 'warning' | 'info';

export interface SeoIssue {
  id: string;
  severity: SeoIssueSeverity;
  message: string;
  details?: string;
}

export interface MetaEntry {
  name?: string;
  property?: string;
  content: string;
}

export interface DocumentMetadata {
  title: string | null;
  titles: string[];
  description: string | null;
  descriptions: string[];
  charset: string | null;
  viewport: string | null;
  language: string | null;
  baseHref: string | null;
}

export interface CanonicalInfo {
  href: string | null;
  hrefs: string[];
  currentUrl: string;
  isAbsolute: boolean;
  matchesCurrent: boolean;
  differsByQueryOnly: boolean;
  count: number;
}

export interface RobotsDirective {
  raw: string;
  directives: Record<string, string | boolean>;
}

export interface RobotsInfo {
  robots: RobotsDirective | null;
  googlebot: RobotsDirective | null;
}

export interface HreflangEntry {
  hreflang: string;
  href: string;
  isXDefault: boolean;
  isMalformed: boolean;
}

export interface OpenGraphImage {
  url: string;
  width?: string;
  height?: string;
  alt?: string;
  type?: string;
}

export interface OpenGraphInfo {
  title: string | null;
  description: string | null;
  url: string | null;
  type: string | null;
  siteName: string | null;
  locale: string | null;
  images: OpenGraphImage[];
  properties: Record<string, string[]>;
  propertyCount: number;
}

export interface TwitterInfo {
  card: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  imageAlt: string | null;
  site: string | null;
  creator: string | null;
  properties: Record<string, string[]>;
}

export type JsonLdSummaryKind =
  | 'article'
  | 'product'
  | 'organization'
  | 'person'
  | 'breadcrumb'
  | 'website'
  | 'webpage'
  | 'other';

export interface BreadcrumbItem {
  position?: number;
  name?: string;
  item?: string;
}

export interface JsonLdEntity {
  context?: unknown;
  type?: string | string[];
  id?: string;
  kind: JsonLdSummaryKind;
  summary: Record<string, unknown>;
  breadcrumbs?: BreadcrumbItem[];
  value: unknown;
}

export interface JsonLdBlock {
  index: number;
  valid: boolean;
  raw: string;
  parsed?: unknown;
  error?: string;
  entities: JsonLdEntity[];
}

export interface SeoSnapshot {
  url: string;
  document: DocumentMetadata;
  canonical: CanonicalInfo;
  robots: RobotsInfo;
  hreflang: HreflangEntry[];
  openGraph: OpenGraphInfo;
  twitter: TwitterInfo;
  jsonLd: JsonLdBlock[];
}

export interface SeoInspection {
  snapshot: SeoSnapshot;
  issues: SeoIssue[];
}

export interface SeoExport {
  url: string;
  title: string | null;
  description: string | null;
  canonical: string | null;
  openGraph: Record<string, string[]>;
  twitter: Record<string, string[]>;
  hreflang: HreflangEntry[];
  jsonLd: Array<{
    index: number;
    valid: boolean;
    parsed?: unknown;
    error?: string;
  }>;
  issues: SeoIssue[];
}
