/** Measurement IDs are public configuration, never credentials. */
export function analyticsMeasurementId(value: string | undefined, environment: string | undefined): string | null {
  const id = value?.trim();
  return environment === 'production' && id && /^G-[A-Z0-9]+$/.test(id) ? id : null;
}

export function analyticsBootstrap(measurementId: string): string {
  if (!/^G-[A-Z0-9]+$/.test(measurementId)) throw new Error('Invalid Google Analytics measurement ID');
  return `
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
    window.gtag('js', new Date());
    window.gtag('config', ${JSON.stringify(measurementId)}, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
  `;
}
