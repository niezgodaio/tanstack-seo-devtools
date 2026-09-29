import { HEAD_CHANGE_DEBOUNCE_MS } from './constants.js';

export type SeoSubscribeOptions = {
  debounceMs?: number;
  document?: Document;
  window?: Window & typeof globalThis;
};

function isInsidePlugin(node: Node): boolean {
  const element = node instanceof Element ? node : node.parentElement;
  return Boolean(element?.closest('[data-seo-devtools]'));
}

function mutationsAffectSeo(mutations: MutationRecord[]): boolean {
  return mutations.some((mutation) => {
    if (!isInsidePlugin(mutation.target)) {
      return true;
    }

    return [...mutation.addedNodes, ...mutation.removedNodes].some(
      (node) => !isInsidePlugin(node),
    );
  });
}

export function subscribeToSeoChanges(
  listener: () => void,
  options: SeoSubscribeOptions = {},
): () => void {
  const doc = options.document ?? document;
  const win = options.window ?? window;
  const debounceMs = options.debounceMs ?? HEAD_CHANGE_DEBOUNCE_MS;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const notify = () => {
    if (stopped) {
      return;
    }
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = undefined;
      if (!stopped) {
        listener();
      }
    }, debounceMs);
  };

  const observer = new win.MutationObserver((mutations) => {
    if (mutationsAffectSeo(mutations)) {
      notify();
    }
  });

  const observeOptions: MutationObserverInit = {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  };

  if (doc.head) {
    observer.observe(doc.head, observeOptions);
  }

  observer.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: ['lang'],
  });

  if (doc.body) {
    observer.observe(doc.body, observeOptions);
  }

  win.addEventListener('popstate', notify);
  win.addEventListener('hashchange', notify);

  const history = win.history;
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = ((...args: Parameters<History['pushState']>) => {
    const result = originalPushState(...args);
    notify();
    return result;
  }) as History['pushState'];

  history.replaceState = ((...args: Parameters<History['replaceState']>) => {
    const result = originalReplaceState(...args);
    notify();
    return result;
  }) as History['replaceState'];

  return () => {
    stopped = true;
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    observer.disconnect();
    win.removeEventListener('popstate', notify);
    win.removeEventListener('hashchange', notify);
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  };
}
