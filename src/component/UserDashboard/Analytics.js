// src/utils/analytics.js
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, eventParams);
    console.log('Event sent:', eventName, eventParams);
  } else {
    console.warn('gtag is not defined');
  }
};
