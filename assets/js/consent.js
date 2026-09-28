(() => {
  "use strict";

  const STORAGE_KEY = "ox_consent_v2";
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const QUOTE_KEY = "ox_quote_verified";
  const COUNTED_QUOTES_KEY = "ox_quote_counted";
  const QUOTE_MAX_AGE = 30 * 60 * 1000;
  const script = document.currentScript;
  const gtmId = script?.dataset.gtmId || "";
  const gaId = script?.dataset.gaId || "";
  const adsId = script?.dataset.adsId || "";
  const conversionLabel = script?.dataset.adsConversionLabel || "";
  const banner = document.querySelector("[data-cookie-banner]");
  const dialog = document.querySelector("[data-cookie-dialog]");
  const analyticsInput = dialog?.querySelector("#ox-consent-analytics");
  const marketingInput = dialog?.querySelector("#ox-consent-marketing");
  let lastOpener = null;
  let consentModeReady = false;
  let gtmLoaded = false;
  let adsLoaded = false;
  let marketingAllowed = false;
  let analyticsAllowed = false;
  let analyticsLoaded = false;
  let googleLoaded = false;

  function readConsent() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (!value || value.version !== 2) return null;
      const updated = Date.parse(value.updatedAt || "");
      if (!Number.isFinite(updated) || Date.now() - updated > MAX_AGE) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return {
        necessary: true,
        analytics: Boolean(value.analytics),
        marketing: Boolean(value.marketing),
        version: 2,
        updatedAt: value.updatedAt
      };
    } catch {
      return null;
    }
  }

  function setupConsentMode() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    if (consentModeReady) return;
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
      wait_for_update: 500
    });
    consentModeReady = true;
  }

  function addScript(src, marker) {
    if (!src || document.querySelector(`script[data-consent-source="${marker}"]`)) return;
    const element = document.createElement("script");
    element.async = true;
    element.src = src;
    element.dataset.consentSource = marker;
    document.head.append(element);
  }

  function loadGtm() {
    if (!gtmId || gtmLoaded) return;
    window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
    addScript(`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`, "gtm");
    gtmLoaded = true;
  }

  function verifiedQuoteSubmission() {
    try {
      // Only form code writes this record, after Formspree acknowledges success.
      // A query string, a submit click, or a legacy timestamp is not proof.
      const value = JSON.parse(sessionStorage.getItem(QUOTE_KEY) || "null");
      if (!value) return null;
      const age = Date.now() - value.createdAt;
      if (typeof value.id !== "string" || !/^[a-zA-Z0-9_-]{8,128}$/.test(value.id) ||
          value.method !== "form" || typeof value.createdAt !== "number" ||
          !Number.isFinite(age) || age < 0 || age >= QUOTE_MAX_AGE) {
        sessionStorage.removeItem(QUOTE_KEY);
        return null;
      }
      return value;
    } catch {
      return null;
    }
  }

  function claimQuote(submission, key) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || "{}");
      const counted = Object.fromEntries(Object.entries(saved && typeof saved === "object" ? saved : {})
        .filter(([, timestamp]) => typeof timestamp === "number" && Date.now() - timestamp >= 0 && Date.now() - timestamp < QUOTE_MAX_AGE)
        .slice(-99));
      if (Object.prototype.hasOwnProperty.call(counted, submission.id)) {
        return false;
      }
      // Persist before queueing: reload, consent changes and repeated events
      // cannot count this submission again. No storage means no conversion.
      counted[submission.id] = Date.now();
      sessionStorage.setItem(key, JSON.stringify(counted));
      return true;
    } catch {
      return false;
    }
  }

  function recordQuoteConversion() {
    if (document.body.dataset.conversion !== "quote") return;
    const submission = verifiedQuoteSubmission();
    if (!submission) return;
    // Independent consent and deduplication: Analytics must not consume the
    // Ads marker, or vice versa. Keep the verified marker until its expiry.
    if (analyticsAllowed && analyticsLoaded && claimQuote(submission, "ox_quote_counted_ga")) {
      window.gtag("event", "generate_lead", {
        send_to: gaId,
        lead_source: "quote_form",
        form_name: "offerte",
        page_location: safePageLocation()
      });
    }
    if (!marketingAllowed || !adsLoaded || !conversionLabel || !claimQuote(submission, COUNTED_QUOTES_KEY)) return;
    window.gtag("event", "conversion", {
      send_to: `${adsId}/${conversionLabel}`,
      transaction_id: submission.id,
      event_category: "lead",
      event_label: "quote"
    });
  }

  function safePageLocation() {
    // Never forward arbitrary query parameters or form values to Analytics.
    const url = new URL(location.origin + location.pathname);
    const query = new URLSearchParams(location.search);
    const allow = { utm_source: ["google"], utm_medium: ["cpc"], utm_campaign: ["ox_ramen_regio_nl"] };
    Object.entries(allow).forEach(([key, values]) => {
      const value = query.get(key);
      if (values.includes(value)) url.searchParams.set(key, value);
    });
    if (marketingAllowed) ["gclid", "gbraid", "wbraid"].forEach((key) => {
      const value = query.get(key);
      if (value && /^[A-Za-z0-9_-]{5,300}$/.test(value)) url.searchParams.set(key, value);
    });
    return url.href;
  }

  function loadGoogle(id) {
    if (googleLoaded) return;
    addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`, "google-tag");
    window.gtag("js", new Date());
    googleLoaded = true;
  }

  function loadAnalytics() {
    if (!gaId || analyticsLoaded) return;
    loadGoogle(gaId);
    let referrer = "";
    try { if (document.referrer) { const ref = new URL(document.referrer); referrer = ref.origin + ref.pathname; } } catch { /* no referrer */ }
    window.gtag("config", gaId, {
      page_location: safePageLocation(),
      page_referrer: referrer,
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    analyticsLoaded = true;
  }

  function loadAds() {
    if (!adsId || adsLoaded) return;
    loadGoogle(adsId);
    window.gtag("config", adsId);
    adsLoaded = true;
  }

  function expireCookie(name) {
    const base = `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; SameSite=Lax`;
    ["", location.hostname, ".osmose-xpert.be"].forEach((domain) => {
      try { document.cookie = `${base}${domain ? `; Domain=${domain}` : ""}`; } catch { /* blocked */ }
    });
  }

  function clearRevokedStorage(consent) {
    let names = [];
    try { names = document.cookie.split(";").map((part) => part.trim().split("=")[0]).filter(Boolean); } catch { names = []; }
    names.forEach((name) => {
      const analyticsCookie = /^_ga(?:_|$)|^_gid$|^_gat/.test(name);
      const marketingCookie = /^_gcl_|^_gac_/.test(name);
      if ((!consent.analytics && analyticsCookie) || (!consent.marketing && marketingCookie)) expireCookie(name);
    });
  }

  function applyConsent(consent) {
    marketingAllowed = Boolean(consent.marketing);
    analyticsAllowed = Boolean(consent.analytics);
    if (gaId) window[`ga-disable-${gaId}`] = !analyticsAllowed;
    setupConsentMode();
    window.gtag("consent", "update", {
      analytics_storage: consent.analytics ? "granted" : "denied",
      ad_storage: consent.marketing ? "granted" : "denied",
      ad_user_data: consent.marketing ? "granted" : "denied",
      ad_personalization: consent.marketing ? "granted" : "denied"
    });
    clearRevokedStorage(consent);
    if (consent.analytics || consent.marketing) loadGtm();
    if (consent.analytics) loadAnalytics();
    if (consent.marketing) {
      loadAds();
    }
    recordQuoteConversion();
    document.documentElement.dataset.analyticsConsent = String(consent.analytics);
    document.documentElement.dataset.marketingConsent = String(consent.marketing);
    window.dispatchEvent(new CustomEvent("ox:consent-updated", { detail: consent }));
  }

  function saveConsent(values) {
    const consent = {
      necessary: true,
      analytics: Boolean(values.analytics),
      marketing: Boolean(values.marketing),
      version: 2,
      updatedAt: new Date().toISOString()
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consent)); } catch { /* session-only choice */ }
    applyConsent(consent);
    banner?.setAttribute("hidden", "");
    if (dialog?.open) dialog.close();
  }

  function openDialog(opener) {
    const saved = readConsent();
    lastOpener = opener instanceof HTMLElement ? opener : document.activeElement;
    if (analyticsInput instanceof HTMLInputElement) analyticsInput.checked = Boolean(saved?.analytics);
    if (marketingInput instanceof HTMLInputElement) marketingInput.checked = Boolean(saved?.marketing);
    banner?.setAttribute("hidden", "");
    if (typeof dialog?.showModal === "function") dialog.showModal();
  }

  banner?.querySelector("[data-consent-reject]")?.addEventListener("click", () => saveConsent({ analytics: false, marketing: false }));
  banner?.querySelector("[data-consent-settings]")?.addEventListener("click", (event) => openDialog(event.currentTarget));
  banner?.querySelector("[data-consent-accept]")?.addEventListener("click", () => saveConsent({ analytics: true, marketing: true }));
  dialog?.querySelector("[data-consent-reject]")?.addEventListener("click", () => saveConsent({ analytics: false, marketing: false }));
  dialog?.querySelector("[data-consent-save]")?.addEventListener("click", () => saveConsent({
    analytics: analyticsInput instanceof HTMLInputElement && analyticsInput.checked,
    marketing: marketingInput instanceof HTMLInputElement && marketingInput.checked
  }));
  dialog?.querySelector("[data-consent-accept]")?.addEventListener("click", () => saveConsent({ analytics: true, marketing: true }));
  dialog?.querySelector("[data-consent-close]")?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("close", () => {
    if (!readConsent()) banner?.removeAttribute("hidden");
    if (lastOpener instanceof HTMLElement) lastOpener.focus();
  });
  window.addEventListener("ox:open-consent", (event) => openDialog(event.detail?.opener));
  // The normal flow counts on /bedankt/, after navigation has completed.
  // This also handles a verified result arriving late on that page.
  window.addEventListener("ox:lead-success", recordQuoteConversion);

  setupConsentMode();
  const saved = readConsent();
  if (saved) {
    banner?.setAttribute("hidden", "");
    applyConsent(saved);
  } else {
    banner?.removeAttribute("hidden");
    applyConsent({ necessary: true, analytics: false, marketing: false, version: 2 });
  }
})();
