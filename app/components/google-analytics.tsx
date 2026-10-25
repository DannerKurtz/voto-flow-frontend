import Script from 'next/script';
import { analyticsBootstrap, analyticsMeasurementId } from '../lib/analytics';

export function GoogleAnalytics() {
  const measurementId = analyticsMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, process.env.NODE_ENV);
  if (!measurementId) return null;
  return <>
    <Script id="google-analytics-config" strategy="afterInteractive">
      {analyticsBootstrap(measurementId)}
    </Script>
    <Script id="google-analytics-loader" src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
  </>;
}
