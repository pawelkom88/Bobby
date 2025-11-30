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

  useEffect(() => {
    setIsSupported(
      typeof window !== 'undefined' &&
        HTMLScriptElement.supports &&
        HTMLScriptElement.supports('speculationrules')
    );
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
    (prerenderPaths.length === 0 && prefetchPaths.length === 0)
  ) {
    return null;
  }

  return (
    <Script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(rules),
      }}
      type="speculationrules"
    />
  );
}
