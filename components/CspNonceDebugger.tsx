'use client';

import { useEffect, useMemo, useState } from 'react';
import { logger } from '@/lib/logger';

type ScriptNonceInfo = {
  attr: string | null;
  prop: string | null;
};

interface NonceDebugState {
  meta: string | null;
  structured: ScriptNonceInfo;
  speculation: ScriptNonceInfo;
}

export default function CspNonceDebugger() {
  const [nonceState, setNonceState] = useState<NonceDebugState | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const overlayStyle = useMemo(
    () => ({
      position: 'fixed' as const,
      bottom: 16,
      right: 16,
      zIndex: 9999,
      backgroundColor: 'rgba(20, 20, 20, 0.85)',
      color: '#fff',
      padding: '0.75rem 1rem',
      borderRadius: 8,
      fontSize: '0.75rem',
      lineHeight: 1.4,
      maxWidth: 320,
      boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
    }),
    []
  );

  const rowStyle = useMemo(
    () => ({
      display: 'flex',
      justifyContent: 'space-between',
      gap: 6,
      marginBottom: 4,
    }),
    []
  );

  const labelStyle = useMemo(
    () => ({
      opacity: 0.7,
      fontSize: '0.65rem',
      flexShrink: 0,
    }),
    []
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';

    if (typeof window !== 'undefined') {
      (window as any).__cspNonceDebuggerInfo = { host, isLocalHost };
    }
    logger.debug('CspNonceDebugger mode', { host, isLocalHost });

    if (!isLocalHost) {
      return;
    }

    setIsVisible(true);

    const readMeta = () =>
      document
        .querySelector('meta[name="csp-nonce"]')
        ?.getAttribute('content') ?? null;

    const readScript = (selector: string): ScriptNonceInfo => {
      const script = document.querySelector<HTMLScriptElement>(selector);
      return {
        attr: script?.getAttribute('nonce') ?? null,
        prop: script?.nonce ?? null,
      };
    };

    const collect = (): NonceDebugState => ({
      meta: readMeta(),
      structured: readScript('script#structured-data'),
      speculation: readScript('script[type="speculationrules"]'),
    });

    const initial = collect();
    if (typeof window !== 'undefined') {
      (window as any).__cspNonceDebuggerSnapshot = initial;
    }
    logger.debug('CSP nonce snapshot', initial);
    setNonceState(initial);

    const intervalId = window.setInterval(() => {
      const refreshed = collect();
      logger.debug('CSP nonce refresh', refreshed);
      setNonceState(refreshed);
      if (refreshed.speculation.prop) {
        window.clearInterval(intervalId);
      }
    }, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  if (!isVisible || !nonceState) {
    return null;
  }

  const renderValue = (value: string | null) =>
    value ? (
      <span style={{ wordBreak: 'break-all' }}>{value}</span>
    ) : (
      <span style={{ opacity: 0.6 }}>n/a</span>
    );

  return (
    <div
      style={overlayStyle}
      role="status"
      aria-live="polite"
      data-csp-nonce-debugger="true"
    >
      <div style={rowStyle}>
        <span style={labelStyle}>Header/meta:</span>
        {renderValue(nonceState.meta)}
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Structured script prop:</span>
        {renderValue(nonceState.structured.prop)}
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Structured script attr:</span>
        {renderValue(nonceState.structured.attr)}
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Speculation prop:</span>
        {renderValue(nonceState.speculation.prop)}
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>Speculation attr:</span>
        {renderValue(nonceState.speculation.attr)}
      </div>
    </div>
  );
}
