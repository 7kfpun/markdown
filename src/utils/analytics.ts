import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = 'G-ZCP7WX9Z88';

let initialized = false;

export const initAnalytics = () => {
  if (initialized || !GA_MEASUREMENT_ID) return;
  try {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    initialized = true;
  } catch (error) {
    console.error('Analytics init failed', error);
  }
};

export const trackEvent = (action: string, params?: Record<string, any>) => {
  if (!initialized) return;
  try {
    ReactGA.event(action, params);
  } catch (error) {
    console.error('Analytics event failed', error);
  }
};
