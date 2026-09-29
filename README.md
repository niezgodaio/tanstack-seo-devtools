# @niezgodaio/tanstack-seo-devtools

TanStack Devtools plugin for inspecting the SEO state of the currently rendered page.

The plugin reads the live `document` and reports HTML metadata, canonical URLs, robots directives, hreflang links, Open Graph tags, Twitter/X cards, and JSON-LD structured data. It is observational: it does not change application metadata.

## Install

```bash
pnpm add -D @niezgodaio/tanstack-seo-devtools
```

Peer dependencies: `react` and `react-dom` (>= 18).

## Usage

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools';
import { createSeoDevtoolsPlugin } from '@niezgodaio/tanstack-seo-devtools';

<TanStackDevtools
  plugins={[
    createSeoDevtoolsPlugin(),
  ]}
/>
```

Open TanStack Devtools and select the **SEO** plugin tab. The panel updates on client-side navigation and `<head>` mutations.

## What it inspects

- Document title, description, charset, viewport, `html lang`, `<base>`
- Canonical URLs vs `location.href`
- Robots / googlebot directives
- `hreflang` alternates
- Open Graph, including multiple `og:image` entries
- Twitter/X cards (with Open Graph fallbacks)
- JSON-LD objects, arrays, and `@graph`
- Obvious inconsistencies and missing tags

## Development-only

Mount the plugin the same way you already guard TanStack Devtools, for example behind `import.meta.env.DEV`. `@tanstack/devtools-vite` also strips this plugin from production builds.

TanStack Devtools 0.14+ includes a built-in **SEO** shell tab with SERP/social previews. This package is a separate **SEO** plugin in the Plugins list and inspects the live document in more depth.

## Local testing

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

In an app that already mounts TanStack Devtools:

1. Run the app in development.
2. Open TanStack Devtools (trigger button or the configured hotkey, default Control+~).
3. Select the **SEO** plugin.
4. Navigate between routes and confirm title, canonical, OG, Twitter, and JSON-LD update.
