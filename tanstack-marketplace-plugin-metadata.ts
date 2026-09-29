interface PluginMetadata {
  /** Package name (e.g., '@tanstack/react-query-devtools') */
  packageName: string;

  /** Display title shown in the marketplace card */
  title: string;

  /** Short description of what the plugin does */
  description?: string;

  /** URL to a logo image (SVG, PNG, etc.) */
  logoUrl?: string;

  /** Required package dependency */
  requires?: {
    /** Required package name (e.g., '@tanstack/react-query') */
    packageName: string;
    /** Minimum required version (semver) */
    minVersion: string;
    /** Maximum version (if there's a known breaking change) */
    maxVersion?: string;
  };

  /** Plugin import configuration */
  pluginImport?: {
    /** The exact name to import from the package (e.g., 'FormDevtoolsPlugin' or 'ReactQueryDevtoolsPanel') */
    importName: string;
    /** Whether this is a JSX component or a function that returns a plugin */
    type: 'jsx' | 'function';
  };

  /**
   * Custom plugin ID pattern for matching against registered plugins in devtools.
   * If specified, this will be used to match plugin IDs that may have suffixes.
   * For example, pluginId: "tanstack-form" will match "tanstack-form-4" in devtools.
   * The default behavior of devtools is to lowercase the package name and replace non-alphanumeric characters with -
   * so if the name of the plugin is "My awesome Plugin", the default pluginId would be "my-awesome-plugin".
   */
  pluginId?: string;

  /** Official documentation URL / URL to the docs on how to implement devtools */
  docsUrl?: string;

  /** Plugin author/maintainer */
  author?: string;

  /** Repository URL */
  repoUrl?: string;

  /** Framework this plugin supports */
  framework: 'react' | 'solid' | 'vue' | 'svelte' | 'angular' | 'other';

  /** Mark as featured to appear in the Featured section with animated border */
  featured?: boolean;

  /** Mark as new to show a "New" banner on the card */
  isNew?: boolean;

  /** Tags for filtering and categorization */
  tags?: Array<string>;
}

export const plugin: PluginMetadata = {
  packageName: '@niezgodaio/tanstack-seo-devtools',
  title: 'SEO',
  description:
    'Inspect HTML metadata, Open Graph, Twitter cards, hreflang, and JSON-LD structured data from the live document.',
  pluginImport: {
    importName: 'createSeoDevtoolsPlugin',
    type: 'function',
  },
  pluginId: 'seo',
  docsUrl: 'https://github.com/niezgodaio/tanstack-seo-devtools',
  author: 'niezgoda',
  repoUrl: 'https://github.com/niezgodaio/tanstack-seo-devtools',
  framework: 'react',
  tags: ['seo', 'metadata', 'json-ld', 'open-graph'],
};
