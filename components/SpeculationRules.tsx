'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

interface SpeculationRulesProps {
  prerenderPaths?: string[];
  prefetchPaths?: string[];
  eagerness?: 'immediate' | 'eager' | 'moderate' | 'conservative';
}

export function SpeculationRules({
  prerenderPaths = [],
  prefetchPaths = [],
  eagerness = 'eager',
}: SpeculationRulesProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [nonce, setNonce] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
        HTMLScriptElement.supports &&
        HTMLScriptElement.supports('speculationrules')
    );
    const meta = document.querySelector('meta[name="csp-nonce"]');
    setNonce(meta?.getAttribute('content') ?? null);
  }, []);

  const rules = {
    prerender: prerenderPaths.map(path => ({
      urls: [path],
      eagerness,
    })),
    prefetch: prefetchPaths.map(path => ({
      urls: [path],
      eagerness,
    })),
  };

  if (
    !isSupported ||
    !nonce ||
    (prerenderPaths.length === 0 && prefetchPaths.length === 0)
  ) {
    return null;
  }

  return (
    <Script
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(rules),
      }}
      type="speculationrules"
    />
  );
}
