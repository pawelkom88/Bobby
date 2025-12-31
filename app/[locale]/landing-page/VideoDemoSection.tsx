'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { Activity } from 'react';

export function VideoDemoSection() {
  const t = useTranslations('landing');
  const [showVideo, setShowVideo] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Handle video playback when visibility changes
  useEffect(() => {
    const video = document.querySelector('.landing-video-demo-video') as HTMLVideoElement;
    if (!video) return;

    if (!showVideo) {
      void video.pause();
      return;
    }
    
    // Optional: Autoplay when shown (uncomment if desired)
    // void video.play();
  }, [showVideo]);

  return (
    <section className="landing-video-demo-section" aria-labelledby="video-demo-title">
      <div className="landing-video-demo-content">
        <h2 id="video-demo-title" className="landing-video-demo-title">
          {t('videoDemo.title')}
        </h2>
        <p className="landing-video-demo-subtitle">
          {t('videoDemo.subtitle')}
        </p>
        
        <div className="landing-video-demo-wrapper">
          <Activity mode={showVideo ? 'visible' : 'hidden'}>
            <div className="landing-video-demo-container">
              {hasError ? (
                <div className="landing-video-demo-fallback">
                  <span className="landing-video-demo-fallback-text">
                    {t('videoDemo.fallbackText')}
                  </span>
                </div>
              ) : (
                <video
                  className="landing-video-demo-video"
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
            <div className="landing-video-demo-placeholder">
              <button
                type="button"
                className="landing-video-demo-play-button"
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
              <p className="landing-video-demo-placeholder-text">
                {t('videoDemo.clickToPlay')}
              </p>
            </div>
          )}
        </div>
        
        {showVideo && (
          <button
            type="button"
            className="landing-video-demo-hide-button"
            onClick={() => setShowVideo(false)}
          >
            {t('videoDemo.hideVideo')}
          </button>
        )}
      </div>
    </section>
  );
}
