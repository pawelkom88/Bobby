'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import Image from 'next/image';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('landing');

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    document.body.style.overflow = !isOpen ? 'hidden' : '';
  };

  const closeMenu = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  return (
    <>
      {/* Hamburger Button */}
      <button
        className={`mobile-nav-hamburger ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      {/* Menu Overlay */}
      <div
        className={`mobile-nav-overlay ${isOpen ? 'active' : ''}`}
        onClick={closeMenu}
      />

      {/* Mobile Menu */}
      <nav className={`mobile-nav-menu ${isOpen ? 'active' : ''}`}>
        <div className="mobile-nav-links">
          <a
            href="#how-it-works"
            className="mobile-nav-link"
            onClick={closeMenu}
          >
            {t('nav.howItWorks')}
          </a>
          <a href="#faq" className="mobile-nav-link" onClick={closeMenu}>
            {t('nav.faq')}
          </a>
          <Link href="/contact" className="mobile-nav-link" onClick={closeMenu}>
            {t('nav.contact')}
          </Link>
        </div>

        <div className="mobile-nav-footer">
          <Link
            href="/login"
            className="ach-button-small mobile-nav-cta"
            onClick={closeMenu}
          >
            {t('nav.startTraining')}
          </Link>
        </div>
      </nav>
    </>
  );
}
