// Google Analytics utility functions

declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';
const DEBUG = import.meta.env.DEV; // Enable debug in development

const log = (...args: any[]) => {
  // Always log in development, or if explicitly enabled
  if (DEBUG || import.meta.env.VITE_GA_DEBUG === 'true') {
    console.log('[GA]', ...args);
  }
};

const logError = (...args: any[]) => {
  console.error('[GA Error]', ...args);
};

const logAlways = (...args: any[]) => {
  console.log('[GA]', ...args);
};

export const initGA = () => {
  // Always log initialization attempt
  logAlways('Initializing Google Analytics...');
  logAlways('Environment check - VITE_GA_MEASUREMENT_ID:', import.meta.env.VITE_GA_MEASUREMENT_ID || 'undefined');
  logAlways('Measurement ID:', GA_MEASUREMENT_ID ? `${GA_MEASUREMENT_ID.substring(0, 4)}...` : 'NOT SET');

  if (!GA_MEASUREMENT_ID) {
    logError('Google Analytics: Measurement ID not configured. Set VITE_GA_MEASUREMENT_ID in .env');
    return;
  }

  // Initialize dataLayer first (before script loads)
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());

  // Inject Google Analytics script if not already present
  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    log('Loading GA script...');
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    
    script.onload = () => {
      log('GA script loaded successfully');
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_path: window.location.pathname,
        debug_mode: DEBUG,
      });
      log('GA config sent');
    };
    
    script.onerror = () => {
      logError('Failed to load GA script');
    };
    
    document.head.appendChild(script);
  } else {
    log('GA script already present');
    // Script already exists, just send config
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: window.location.pathname,
      debug_mode: DEBUG,
    });
    log('GA config sent (script already loaded)');
  }

  // Verify initialization after a short delay
  setTimeout(() => {
    if (window.gtag && window.dataLayer) {
      logAlways('GA initialized successfully. dataLayer length:', window.dataLayer.length);
      logAlways('dataLayer contents:', window.dataLayer);
    } else {
      logError('GA initialization failed - gtag or dataLayer not available');
      logError('gtag type:', typeof window.gtag);
      logError('dataLayer type:', typeof window.dataLayer);
    }
  }, 1000);
};

export const trackPageView = (path: string) => {
  if (!GA_MEASUREMENT_ID) {
    log('trackPageView: Measurement ID not set');
    return;
  }
  if (!window.gtag) {
    logError('trackPageView: gtag not available');
    return;
  }

  log('Tracking page view:', path);
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
  });
};

export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!GA_MEASUREMENT_ID) {
    log('trackEvent: Measurement ID not set');
    return;
  }
  if (!window.gtag) {
    logError('trackEvent: gtag not available');
    return;
  }

  log('Tracking event:', { action, category, label, value });
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Convenience functions for common events
export const trackFileUpload = (fileName: string) => {
  trackEvent('file_upload', 'engagement', fileName);
};

export const trackFileDownload = (fileName: string) => {
  trackEvent('file_download', 'engagement', fileName);
};

export const trackPrioritization = (stationCount: number) => {
  trackEvent('prioritization_generated', 'engagement', undefined, stationCount);
};

export const trackLogin = () => {
  trackEvent('login', 'authentication');
};

export const trackLogout = () => {
  trackEvent('logout', 'authentication');
};

// Debug helper to check GA status
export const checkGAStatus = () => {
  const status = {
    measurementId: GA_MEASUREMENT_ID ? `${GA_MEASUREMENT_ID.substring(0, 4)}...` : 'NOT SET',
    gtagAvailable: typeof window.gtag === 'function',
    dataLayerAvailable: Array.isArray(window.dataLayer),
    dataLayerLength: window.dataLayer?.length || 0,
    scriptLoaded: !!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`),
    dataLayerContents: window.dataLayer || [],
  };
  
  console.log('[GA Status Check]', status);
  return status;
};

// Make it available globally for debugging in browser console
if (typeof window !== 'undefined') {
  (window as any).checkGAStatus = checkGAStatus;
}

