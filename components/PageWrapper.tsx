'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import BottomNav from './BottomNav';
import { ROUTES } from '@/lib/routes';
import { useLocale } from 'next-intl';

interface PageWrapperProps {
  children: React.ReactNode;
  scrollRestorationKey?: string;
}

export default function PageWrapper({
  children,
  scrollRestorationKey,
}: PageWrapperProps) {
  const pathname = usePathname();
  const locale = useLocale();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef(0);
  const isNavigatingRef = useRef(false);

  const showBottomNav =
    pathname !== `/${locale}` &&
    pathname !== `/${locale}${ROUTES.HOME}` &&
    pathname !== `/${locale}${ROUTES.DIAL}` &&
    pathname !== `/${locale}${ROUTES.CONVERSATION}` &&
    pathname !== `/${locale}${ROUTES.COMPLETION}` &&
    !pathname.includes('/parent-guide') &&
    !pathname.includes('/faq') &&
    !pathname.includes('/pytania') &&
    !pathname.includes('/contact') &&
    !pathname.includes('/kontakt') &&
    !pathname.includes('/privacy-policy') &&
    !pathname.includes('/terms-conditions') &&
    !pathname.includes('/cookies-policy') &&
    !pathname.includes('/safety-privacy') &&
    !pathname.includes('/beta-feedback');

  useEffect(() => {
    if (!scrollRestorationKey) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    isNavigatingRef.current = false;

    const isWindowScroll = () =>
      container.scrollHeight <= container.clientHeight + 1;
    const getScrollTop = () =>
      isWindowScroll() ? window.scrollY : container.scrollTop;
    const setScrollTop = (value: number) => {
      if (isWindowScroll()) {
        window.scrollTo(0, value);
      } else {
        container.scrollTop = value;
      }
    };

    const savedPosition = sessionStorage.getItem(scrollRestorationKey);
    if (savedPosition) {
      const targetPosition = Number(savedPosition);
      lastScrollTopRef.current = targetPosition;
      window.requestAnimationFrame(() => {
        setScrollTop(targetPosition);
      });
    } else {
      lastScrollTopRef.current = getScrollTop();
    }

    let rafId = 0;
    const handleScroll = () => {
      if (isNavigatingRef.current) return;
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        const currentPosition = getScrollTop();
        lastScrollTopRef.current = currentPosition;
        sessionStorage.setItem(scrollRestorationKey, String(currentPosition));
        rafId = 0;
      });
    };

    const scrollTarget = isWindowScroll() ? window : container;
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });

    const handleNavigate = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a[href]');
      if (!link) return;
      isNavigatingRef.current = true;
      sessionStorage.setItem(
        scrollRestorationKey,
        String(lastScrollTopRef.current)
      );
    };
    document.addEventListener('click', handleNavigate, true);

    return () => {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
      sessionStorage.setItem(
        scrollRestorationKey,
        String(lastScrollTopRef.current)
      );
      scrollTarget.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleNavigate, true);
    };
  }, [scrollRestorationKey]);

  return (
    <div
      className="page-wrapper"
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: showBottomNav ? '75px' : '0',
        }}
      >
        {children}
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
