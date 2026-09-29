import { describe, expect, it, vi } from 'vitest';
import { collectMetadata } from '../src/collectMetadata.js';
import { HEAD_CHANGE_DEBOUNCE_MS } from '../src/constants.js';
import { subscribeToSeoChanges } from '../src/subscribe.js';
import { COMPLETE_TITLE, PAGE_URL } from './fixtures.js';

describe('subscribeToSeoChanges', () => {
  it('notifies after a head mutation from an SPA update', async () => {
    document.documentElement.setAttribute('lang', 'en');
    document.head.innerHTML = `<title>${COMPLETE_TITLE}</title>`;

    const listener = vi.fn(() => {
      collectMetadata(document, PAGE_URL);
    });

    const stop = subscribeToSeoChanges(listener, {
      debounceMs: HEAD_CHANGE_DEBOUNCE_MS,
      document,
      window,
    });

    const title = document.querySelector('title');
    expect(title).toBeTruthy();
    title?.replaceChildren('Updated article title for live SEO checks');

    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalled();
    });

    const snapshot = collectMetadata(document, PAGE_URL);
    expect(snapshot.document.title).toBe(
      'Updated article title for live SEO checks',
    );

    stop();
  });
});
