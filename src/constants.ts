export const TITLE_MIN_LENGTH = 30;
export const TITLE_MAX_LENGTH = 60;
export const DESCRIPTION_MIN_LENGTH = 50;
export const DESCRIPTION_MAX_LENGTH = 160;
export const HEAD_CHANGE_DEBOUNCE_MS = 80;

export const JSON_LD_URL_KEYS = [
  '@id',
  'url',
  'image',
  'logo',
  'item',
  'sameAs',
  'mainEntityOfPage',
  'contentUrl',
  'thumbnailUrl',
] as const;

export const ARTICLE_TYPES = ['Article', 'BlogPosting', 'NewsArticle'] as const;
export const PRODUCT_TYPES = ['Product'] as const;
export const ORGANIZATION_TYPES = ['Organization'] as const;
export const PERSON_TYPES = ['Person'] as const;
export const BREADCRUMB_TYPES = ['BreadcrumbList'] as const;
export const WEBSITE_TYPES = ['WebSite'] as const;
export const WEBPAGE_TYPES = ['WebPage'] as const;
