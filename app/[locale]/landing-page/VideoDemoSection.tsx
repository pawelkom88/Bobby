'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import { Activity } from 'react';
import styles from './VideoDemoSection.module.css';

export function VideoDemoSection() {
  const t = useTranslations('landing');
  const [showVideo, setShowVideo] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Handle video playback when visibility changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!showVideo) {
      void video.pause();
    }
  }, [showVideo]);

  return (
    <section className={styles.section} aria-labelledby="video-demo-title">
      <div className={styles.content}>
        <h2 id="video-demo-title" className={styles.title}>
          {t('videoDemo.title')}
        </h2>
        <p className={styles.subtitle}>
          {t('videoDemo.subtitle')}
        </p>
        
        <div className={styles.wrapper}>
          <Activity mode={showVideo ? 'visible' : 'hidden'}>
            <div className={styles.container}>
              {hasError ? (
                <div className={styles.fallback}>
                  <span className={styles.fallbackText}>
                    {t('videoDemo.fallbackText')}
                  </span>
                </div>
              ) : (
                <video
                  className={styles.video}
                  ref={videoRef}
                  title={t('videoDemo.videoTitle')}
                  onError={() => setHasError(true)}
                  controls
                  playsInline
                  preload="metadata"
                  poster="/bobby-demo-poster.jpg"
                  aria-label={t('videoDemo.videoTitle')}
                >
                  <source src="/bobby-demo-video.mp4" type="video/mp4" />
                  <source src="/bobby-demo-video.webm" type="video/webm" />
                  {t('videoDemo.fallbackText')}
                </video>
              )}
            </div>
          </Activity>
          
          {!showVideo && !hasError && (
            <div className={styles.placeholder}>
              <button
                type="button"
                className={styles.playButton}
                onClick={() => setShowVideo(true)}
                aria-label={t('videoDemo.playVideo')}
              >
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 80 80"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="40" cy="40" r="40" fill="rgba(102, 126, 234, 0.9)" />
                  <path d="M30 25L30 55L55 40L30 25Z" fill="white" />
                </svg>
              </button>
              <p className={styles.placeholderText}>
                {t('videoDemo.clickToPlay')}
              </p>
            </div>
          )}
        </div>
        
        {showVideo && (
          <button
            type="button"
            className={styles.hideButton}
            onClick={() => setShowVideo(false)}
          >
            {t('videoDemo.hideVideo')}
          </button>
        )}
      </div>
    </section>
  );
}
