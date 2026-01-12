'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      let refreshing = false;
      let isFirstController = !navigator.serviceWorker.controller;
      let updateTimerId: number | undefined;

      const handleControllerChange = () => {
        if (isFirstController) {
          isFirstController = false;
          return;
        }

        if (refreshing) {
          return;
        }

        refreshing = true;
        window.location.reload();
      };

      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.log('Service Worker registered successfully:', registration.scope);

          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;

            if (!newWorker) {
              return;
            }

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });

          // Check for updates periodically
          updateTimerId = window.setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          logger.error('Service Worker registration failed:', error);
        });

      navigator.serviceWorker.addEventListener(
        'controllerchange',
        handleControllerChange
      );

      return () => {
        if (updateTimerId) {
          window.clearInterval(updateTimerId);
        }
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          handleControllerChange
        );
      };
    }
  }, []);

  return null;
}
