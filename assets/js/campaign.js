(() => {
  "use strict";

  const form = document.getElementById("ads-quote-form");
  const service = document.getElementById("cp-service");
  const status = document.getElementById("cp-form-status");
  const submit = form?.querySelector('[type="submit"]');
  const query = new URLSearchParams(location.search);

  // Interaction signals are secondary diagnostics, never successful leads.
  function interaction(name, detail = {}) {
    if (document.documentElement.dataset.analyticsConsent !== "true") return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: `ox_${name}`, page_type: "campaign", ...detail });
  }

  function syncService() {
    document.querySelectorAll("[data-service]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.service === service?.value));
    });
  }

  const initialService = query.get("dienst");
  if (service && Array.from(service.options).some((option) => option.value === initialService)) {
    service.value = initialService;
  }
  syncService();
  service?.addEventListener("change", syncService);
  document.querySelectorAll("[data-service]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!service) return;
      service.value = button.dataset.service;
      syncService();
      interaction("service_select", { service: service.value });
      document.getElementById("aanvraag")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      document.getElementById("cp-name")?.focus({ preventScroll: true });
    });
  });

  document.querySelectorAll("[data-cp-track]").forEach((element) => {
    element.addEventListener("click", () => interaction(element.dataset.cpTrack));
  });

  // Only consented, allowlisted campaign identifiers accompany the request.
  // Arbitrary query strings and search terms may contain personal information.
  function addAttribution(data) {
    data.set("pagina", `${location.origin}${location.pathname}`);
    if (document.documentElement.dataset.marketingConsent === "true") {
      const allowedValues = {
        utm_source: ["google"],
        utm_medium: ["cpc"],
        utm_campaign: ["ox_ramen_regio_nl"],
        matchtype: ["e", "p", "b"],
        device: ["c", "m", "t"]
      };
      Object.entries(allowedValues).forEach(([name, allowed]) => {
        const value = query.get(name);
        if (allowed.includes(value)) data.set(name, value);
      });
      ["utm_id", "utm_content"].forEach((name) => {
        const value = query.get(name);
        if (value && /^\d{1,30}$/.test(value)) data.set(name, value);
      });
      ["gclid", "gbraid", "wbraid"].forEach((name) => {
        const value = query.get(name);
        if (value && /^[A-Za-z0-9_-]{5,300}$/.test(value)) data.set(name, value);
      });
    }
  }

  let sending = false;
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    sending = false;
    if (submit) submit.disabled = false;
    if (status) {
      status.textContent = "";
      status.classList.remove("cp-error");
    }
    syncService();
  });
  form?.addEventListener("submit", async (event) => {
    // Shared form handling also skips data-form-handler="campaign".
    event.preventDefault();
    event.stopImmediatePropagation();
    if (sending || !form.reportValidity()) return;
    if (form.elements._gotcha?.value) return;
    sending = true;
    submit.disabled = true;
    status.classList.remove("cp-error");
    status.textContent = "Uw aanvraag wordt verzonden…";
    const data = new FormData(form);
    data.delete("_next");
    addAttribution(data);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      const result = await response.json().catch(() => null);
      const hasErrors = result?.errors && (!Array.isArray(result.errors) || result.errors.length > 0);
      const hasChallenge = result?.challenge || result?.captcha || result?.recaptcha ||
        /captcha|challenge/i.test(String(result?.next || ""));
      if (!response.ok || !result || typeof result !== "object" || Array.isArray(result) ||
          result.ok === false || result.error || hasErrors || hasChallenge) {
        let message = "Verzenden is niet gelukt. Controleer uw gegevens en probeer opnieuw, of contacteer ons via WhatsApp of telefoon.";
        if (response.status === 429) message = "Er zijn even te veel aanvragen. Probeer het straks opnieuw of contacteer ons via WhatsApp of telefoon.";
        throw new Error(message);
      }
      const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `ox-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      try {
        sessionStorage.setItem("ox_quote_verified", JSON.stringify({ id, createdAt: Date.now(), method: "form" }));
      } catch { /* Successful submission remains visible when storage is blocked. */ }
      window.dispatchEvent(new CustomEvent("ox:lead-success", { detail: { id, method: "form", service: service?.value || "" } }));
      interaction("quote_success", { service: service?.value || "" });
      status.textContent = "Bedankt! Uw aanvraag is ontvangen. U wordt doorgestuurd naar de bevestiging.";
      status.focus({ preventScroll: true });
      form.reset();
      syncService();
      // The thank-you page consumes the verified marker for consent-aware Ads measurement.
      window.setTimeout(() => location.assign("/bedankt/"), 900);
    } catch (error) {
      status.classList.add("cp-error");
      status.textContent = error.name === "AbortError"
        ? "We kregen niet tijdig een bevestiging. Controleer uw e-mail of neem contact met ons op voordat u opnieuw verzendt, om een dubbele aanvraag te voorkomen."
        : error instanceof TypeError
          ? "We konden de verzending niet bevestigen. Controleer uw internetverbinding of contacteer ons via WhatsApp of telefoon."
          : error.message;
      status.focus({ preventScroll: true });
      submit.disabled = false;
      sending = false;
    } finally {
      window.clearTimeout(timeout);
    }
  }, { capture: true });

  const chat = document.querySelector("[data-chatbase-dialog]");
  document.querySelector("[data-cp-close-chat]")?.addEventListener("click", (event) => {
    event.preventDefault();
    const focusQuote = () => window.requestAnimationFrame(() => {
      document.getElementById("aanvraag")?.scrollIntoView({ behavior: "instant" });
      document.getElementById("cp-name")?.focus({ preventScroll: true });
    });
    if (chat?.open) {
      chat.addEventListener("close", focusQuote, { once: true });
      chat.close();
    } else focusQuote();
  });

  const videoDialog = document.querySelector("[data-video-dialog]");
  const video = videoDialog?.querySelector("video");
  let videoOpener;
  document.querySelector("[data-video-open]")?.addEventListener("click", (event) => {
    videoOpener = event.currentTarget;
    videoDialog?.showModal();
    video?.play().catch(() => {});
    interaction("video_open");
  });
  document.querySelector("[data-video-close]")?.addEventListener("click", () => videoDialog?.close());
  videoDialog?.addEventListener("click", (event) => {
    if (event.target === videoDialog) videoDialog.close();
  });
  videoDialog?.addEventListener("close", () => {
    video?.pause();
    videoOpener?.focus();
  });

  // Hide mobile actions when the actual form, footer, or a privacy choice is open.
  const mobileBar = document.querySelector(".cp-mobile-bar");
  const cookieBanner = document.querySelector("[data-cookie-banner]");
  const cookieDialog = document.querySelector("[data-cookie-dialog]");
  const obstructions = new Set();
  function syncMobileBar() {
    if (!mobileBar) return;
    const privacyOpen = (cookieBanner && !cookieBanner.hidden) || cookieDialog?.open;
    mobileBar.hidden = Boolean(privacyOpen || chat?.open || videoDialog?.open || obstructions.size);
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) obstructions.add(entry.target);
        else obstructions.delete(entry.target);
      });
      syncMobileBar();
    }, { threshold: .08 });
    [form, document.querySelector(".ox-site-footer")].filter(Boolean).forEach((element) => observer.observe(element));
  }
  const stateObserver = new MutationObserver(syncMobileBar);
  [cookieBanner, cookieDialog, chat, videoDialog].filter(Boolean).forEach((element) => stateObserver.observe(element, { attributes: true, attributeFilter: ["hidden", "open"] }));
  window.addEventListener("ox:consent-updated", syncMobileBar);
  syncMobileBar();
})();
