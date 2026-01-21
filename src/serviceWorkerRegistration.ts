// Check if running on localhost
function checkIsLocalhost(): boolean {
  const { hostname } = window.location;
  if (hostname === 'localhost' || hostname === '[::1]') {
    return true;
  }
  // Check for 127.x.x.x addresses
  const parts = hostname.split('.');
  if (parts.length !== 4 || parts[0] !== '127') {
    return false;
  }
  return parts.slice(1).every((part) => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

const isLocalhost = checkIsLocalhost();

// Service worker logging - intentionally using console for PWA debugging
const swLog = {
  info: (message: string) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[SW] ${message}`);
    }
  },
  error: (message: string, error?: unknown) => {
    // eslint-disable-next-line no-console
    console.error(`[SW] ${message}`, error ?? '');
  },
};

type Config = {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
};

export function register(config?: Config): void {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      // Service worker won't work if PUBLIC_URL is on a different origin
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        // Running on localhost - check if service worker exists
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          swLog.info('PWA is being served cache-first by a service worker.');
        });
      } else {
        // Not localhost - register service worker
        registerValidSW(swUrl, config);
      }
    });
  }
}

function registerValidSW(swUrl: string, config?: Config): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }
        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // New content available - will be used on next visit
              swLog.info('New content available; will be used on next visit.');
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              // Content cached for offline use
              swLog.info('Content is cached for offline use.');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      swLog.error('Error during service worker registration:', error);
    });
}

function checkValidServiceWorker(swUrl: string, config?: Config): void {
  fetch(swUrl, { headers: { 'Service-Worker': 'script' } })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        // No service worker found - reload page
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        // Service worker found - proceed with registration
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      swLog.info('No internet connection. App is running in offline mode.');
    });
}

export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        swLog.error('Unregister failed:', error.message);
      });
  }
}
