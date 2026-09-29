import type { ReactElement } from 'react';
import { SeoDevtoolsPanel } from './SeoDevtoolsPanel.js';

export type SeoDevtoolsTheme = 'dark' | 'light';

export type SeoDevtoolsPlugin = {
  id: string;
  name: string;
  render: (
    el: HTMLElement,
    props: { theme: SeoDevtoolsTheme; devtoolsOpen: boolean },
  ) => ReactElement;
};

export function createSeoDevtoolsPlugin(): SeoDevtoolsPlugin {
  return {
    id: 'seo',
    name: 'SEO',
    render: (_el, props) => <SeoDevtoolsPanel theme={props.theme} />,
  };
}
