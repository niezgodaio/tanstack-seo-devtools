import { useEffect, useRef, useState } from 'react';
import { collectMetadata } from './collectMetadata.js';
import { diagnoseSeo } from './diagnostics.js';
import { subscribeToSeoChanges } from './subscribe.js';
import type { SeoInspection, SeoSnapshot } from './types.js';

export function useSeoSnapshot(): SeoInspection | null {
  const [inspection, setInspection] = useState<SeoInspection | null>(null);
  const previousRef = useRef<SeoSnapshot | undefined>(undefined);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const collect = () => {
      const snapshot = collectMetadata(
        document,
        window.location.href,
        previousRef.current,
      );
      previousRef.current = snapshot;
      setInspection({
        snapshot,
        issues: diagnoseSeo(snapshot),
      });
    };

    collect();
    return subscribeToSeoChanges(collect);
  }, []);

  return inspection;
}
