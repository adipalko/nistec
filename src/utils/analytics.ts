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

export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics: Measurement ID not configured');
    return;
  }

  // Inject Google Analytics script if not already present
  if (!document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)) {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);
  }

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
};

export const trackPageView = (path: string) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

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
  if (!GA_MEASUREMENT_ID || !window.gtag) return;

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

