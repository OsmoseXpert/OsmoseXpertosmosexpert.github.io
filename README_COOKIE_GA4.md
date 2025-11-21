# OsmoseXpert – Cookiebanner + GA4

Deze versie voegt toe:
- Compacte **zwarte cookiebanner** met witte tekst (assets/css/cookie-banner.css).
- Consent-first logica (default **analytics_storage = denied**).
- **Google Analytics 4** geladen met Measurement ID **G-FE95SCP0KD** na toestemming.
- Automatisch ingevoegd op alle .html pagina's (CSS in `<head>`, JS voor `</body>`).

## Testen

1. Open je site, je zou de cookiebanner moeten zien.
2. Zie je hem niet? Open in een **incognitovenster** of verwijder `localStorage` sleutel `ox_cookie_consent_v1` en herlaad.
3. Na **Accepteren** verschijnt GA4-verkeer in Realtime in Google Analytics.