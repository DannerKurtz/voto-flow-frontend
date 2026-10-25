import Script from 'next/script';
import { analyticsBootstrap, analyticsMeasurementId } from '../lib/analytics';

const measurementId = 'G-HNV8XRED08';

export function GoogleAnalytics() {
  const configuredMeasurementId = analyticsMeasurementId(measurementId, process.env.NODE_ENV);
  if (!configuredMeasurementId) return null;
  return <>
    <Script id="google-analytics-config" strategy="afterInteractive">
      {analyticsBootstrap(configuredMeasurementId)}
    </Script>
    <Script id="google-analytics-loader" src={`https://www.googletagmanager.com/gtag/js?id=${configuredMeasurementId}`} strategy="afterInteractive" />
  </>;
}
