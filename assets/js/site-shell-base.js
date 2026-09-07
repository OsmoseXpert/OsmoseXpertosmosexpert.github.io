(() => {
  "use strict";

  const nav = document.querySelector(".ox-site-nav");
  const navToggle = nav?.querySelector(".ox-nav-toggle");
  const navList = nav?.querySelector(".ox-nav-list");

  function closeNavigation({ restoreFocus = false } = {}) {
    if (!nav || !navToggle) return;
    nav.dataset.open = "false";
    document.documentElement.classList.remove("ox-nav-open");
    document.body.classList.remove("ox-nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Menu openen");
    if (restoreFocus) navToggle.focus();
  }

  navToggle?.addEventListener("click", () => {
    const next = nav?.dataset.open !== "true";
    nav.dataset.open = String(next);
    document.documentElement.classList.toggle("ox-nav-open", next);
    document.body.classList.toggle("ox-nav-open", next);
    navToggle.setAttribute("aria-expanded", String(next));
    navToggle.setAttribute("aria-label", next ? "Menu sluiten" : "Menu openen");
  });

  navList?.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeNavigation();
  });

  document.addEventListener("click", (event) => {
    if (nav?.dataset.open === "true" && !nav.contains(event.target)) closeNavigation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav?.dataset.open === "true") closeNavigation({ restoreFocus: true });
  });

  const desktopQuery = window.matchMedia("(min-width: 901px)");
  const handleDesktop = (event) => { if (event.matches) closeNavigation(); };
  desktopQuery.addEventListener?.("change", handleDesktop);

  document.querySelectorAll("[data-current-year]").forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    const rel = new Set((link.getAttribute("rel") || "").split(/\s+/).filter(Boolean));
    rel.add("noopener");
    rel.add("noreferrer");
    link.setAttribute("rel", Array.from(rel).join(" "));
  });

  document.querySelectorAll("[data-cookie-preferences], .cookie-reset").forEach((trigger) => {
    trigger.removeAttribute("onclick");
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      window.dispatchEvent(new CustomEvent("ox:open-consent", { detail: { opener: trigger } }));
    });
  });

  const floating = document.querySelector(".ox-floating-actions");
  if (floating) {
    let lastScroll = Math.max(0, window.scrollY);
    let revealTimer = 0;
    let scrollHidden = false;
    const intersecting = new Set();
    const cookieBanner = document.querySelector("[data-cookie-banner]");
    const cookieDialog = document.querySelector("[data-cookie-dialog]");
    const syncFloating = () => {
      const cookieVisible = Boolean(cookieBanner && !cookieBanner.hasAttribute("hidden"));
      const preferencesOpen = Boolean(cookieDialog?.open);
      floating.classList.toggle("ox-hidden", scrollHidden || intersecting.size > 0 || cookieVisible || preferencesOpen);
    };
    window.addEventListener("scroll", () => {
      const current = Math.max(0, window.scrollY);
      const goingDown = current > lastScroll && current > 140;
      scrollHidden = goingDown;
      syncFloating();
      lastScroll = current;
      window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => {
        scrollHidden = false;
        syncFloating();
      }, 1200);
    }, { passive: true });
    if ("IntersectionObserver" in window) {
      const obstructionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) intersecting.add(entry.target);
          else intersecting.delete(entry.target);
        });
        syncFloating();
      }, { threshold: .08 });
      document.querySelectorAll(".ox-site-footer, #offerteForm, .contact-form").forEach((node) => obstructionObserver.observe(node));
    }
    const cookieObserver = new MutationObserver(syncFloating);
    if (cookieBanner) cookieObserver.observe(cookieBanner, { attributes: true, attributeFilter: ["hidden"] });
    if (cookieDialog) cookieObserver.observe(cookieDialog, { attributes: true, attributeFilter: ["open"] });
    syncFloating();
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const saveData = Boolean(navigator.connection?.saveData);
  const videos = Array.from(document.querySelectorAll("video"));
  videos.forEach((video) => {
    video.muted = true;
    if (saveData) {
      video.autoplay = false;
      video.preload = "metadata";
      video.pause();
    }
    video.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
    if (!video.hasAttribute("tabindex")) video.tabIndex = 0;
    if (!video.hasAttribute("aria-label")) video.setAttribute("aria-label", "Achtergrondvideo. Druk op spatie om af te spelen of te pauzeren.");
  });

  function applyMotionPreference() {
    if (reduceMotion.matches) videos.forEach((video) => video.pause());
  }
  reduceMotion.addEventListener?.("change", applyMotionPreference);
  applyMotionPreference();

  if ("IntersectionObserver" in window && !reduceMotion.matches && !saveData) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (video.autoplay || video.hasAttribute("autoplay")) video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { rootMargin: "120px 0px", threshold: .05 });
    videos.forEach((video) => videoObserver.observe(video));
  }

  document.querySelectorAll("form").forEach((form) => {
    const action = form.getAttribute("action") || "";
    if (!action.includes("formspree.io")) return;
    form.addEventListener("submit", () => {
      const isQuote = form.id === "offerteForm" || form.id === "ads-quote-form" || form.hasAttribute("data-quote-form");
      try {
        sessionStorage.setItem(isQuote ? "ox_quote_submitted" : "ox_contact_submitted", String(Date.now()));
      } catch {
        // Storage may be disabled; the verified redirect query remains available.
      }
    });
  });

  const customerType = document.querySelector("#klant");
  const businessBlock = document.querySelector("#b2b-block");
  const company = document.querySelector("#bedrijf");
  const vat = document.querySelector("#btw");
  if (customerType && businessBlock && company && vat) {
    const syncBusinessFields = () => {
      const business = customerType.value === "zakelijk";
      businessBlock.classList.toggle("hidden", !business);
      company.required = business;
      vat.required = business;
    };
    customerType.addEventListener("change", syncBusinessFields);
    syncBusinessFields();
  }

  document.querySelectorAll(".upload-area").forEach((zone) => {
    zone.setAttribute("role", "button");
    zone.setAttribute("tabindex", "0");
    zone.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      zone.querySelector('input[type="file"]')?.click();
    });
  });

  document.querySelectorAll(".faq-question").forEach((question) => {
    question.setAttribute("role", "button");
    question.setAttribute("tabindex", "0");
    question.setAttribute("aria-expanded", String(question.parentElement?.classList.contains("active")));
    question.addEventListener("click", () => {
      window.requestAnimationFrame(() => {
        question.setAttribute("aria-expanded", String(question.parentElement?.classList.contains("active")));
      });
    });
    question.addEventListener("keydown", (event) => {
      if (event.key !== " " && event.key !== "Enter") return;
      event.preventDefault();
      question.click();
    });
  });

  const chatDialog = document.querySelector("[data-chatbase-dialog]");
  const chatFrame = chatDialog?.querySelector("[data-chatbase-frame]");
  const chatOpeners = document.querySelectorAll("[data-chatbase-open]");
  const chatFeedback = document.querySelector(".ox-assistant-feedback");
  let chatOpener = null;
  let pendingChat = false;

  function openChat(opener) {
    if (!(chatDialog instanceof HTMLDialogElement) || !(chatFrame instanceof HTMLIFrameElement)) return;
    chatOpener = opener instanceof HTMLElement ? opener : document.activeElement;
    if (document.documentElement.dataset.marketingConsent !== "true") {
      pendingChat = true;
      if (chatFeedback) chatFeedback.textContent = "Sta marketingcookies toe om de digitale assistent te openen.";
      window.dispatchEvent(new CustomEvent("ox:open-consent", { detail: { opener: chatOpener } }));
      return;
    }
    pendingChat = false;
    chatFrame.removeAttribute("srcdoc");
    if (chatFrame.dataset.externalSrc && chatFrame.src !== chatFrame.dataset.externalSrc) chatFrame.src = chatFrame.dataset.externalSrc;
    if (!chatDialog.open) chatDialog.showModal();
    document.body.classList.add("ox-chat-open");
  }

  if (chatDialog && chatFrame && chatOpeners.length) {
    chatOpeners.forEach((opener) => opener.addEventListener("click", (event) => {
      event.preventDefault();
      openChat(opener);
    }));
    chatDialog.querySelector("[data-chatbase-close]")?.addEventListener("click", () => chatDialog.close());
    chatDialog.addEventListener("click", (event) => {
      if (event.target === chatDialog) chatDialog.close();
    });
    chatDialog.addEventListener("close", () => {
      document.body.classList.remove("ox-chat-open");
      if (chatOpener instanceof HTMLElement) chatOpener.focus();
    });
    window.addEventListener("ox:consent-updated", (event) => {
      if (event.detail?.marketing && pendingChat) {
        const opener = chatOpener;
        pendingChat = false;
        window.setTimeout(() => openChat(opener), 0);
      }
      else if (!event.detail?.marketing && pendingChat) {
        pendingChat = false;
        if (chatFeedback) chatFeedback.textContent = "De chat bleef gesloten. U kunt ons ook rechtstreeks contacteren.";
      }
      if (!event.detail?.marketing && chatDialog.open) chatDialog.close();
    });
  }

  function updateExternalEmbeds(consent) {
    const marketingAllowed = Boolean(consent?.marketing);
    document.querySelectorAll("iframe[data-external-src]").forEach((frame) => {
      const deferredChat = frame.matches("[data-chatbase-frame]");
      const chatIsOpen = Boolean(frame.closest("[data-chatbase-dialog]")?.open);
      if (marketingAllowed && (!deferredChat || chatIsOpen)) {
        frame.removeAttribute("srcdoc");
        if (frame.src !== frame.dataset.externalSrc) frame.src = frame.dataset.externalSrc;
      } else {
        if (frame.getAttribute("src") !== "about:blank") frame.src = "about:blank";
        if (!frame.hasAttribute("srcdoc")) {
          frame.setAttribute("srcdoc", "<!doctype html><html lang='nl'><meta charset='utf-8'><meta name='viewport' content='width=device-width'><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:20px;box-sizing:border-box;background:#f8fafc;color:#0b364f;text-align:center;font:600 15px/1.5 system-ui,sans-serif}p{max-width:34rem}</style><p>Deze externe inhoud wordt geladen nadat u marketingcookies toestaat via Cookievoorkeuren onderaan de pagina.</p></html>");
        }
      }
    });
  }
  window.addEventListener("ox:consent-updated", (event) => updateExternalEmbeds(event.detail));
})();
