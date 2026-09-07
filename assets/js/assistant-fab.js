(() => {
  "use strict";

  const CHAT_URL = "https://www.chatbase.co/chatbot-iframe/TkHOZ_mxX3kecf30oT-ri";
  const floating = document.querySelector(".ox-floating-actions");
  const secondary = floating?.querySelector(".ox-floating-secondary");

  if (!floating || !secondary || secondary.querySelector("[data-ox-assistant-fab]")) return;

  const BOT_ICON = `
    <svg class="ox-assistant-icon-svg" viewBox="0 0 44 44" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="oxBotGradient" x1="4" y1="3" x2="40" y2="41" gradientUnits="userSpaceOnUse">
          <stop stop-color="#18c7c2"/><stop offset="1" stop-color="#078f89"/>
        </linearGradient>
      </defs>
      <circle cx="22" cy="22" r="21" fill="url(#oxBotGradient)"/>
      <circle cx="22" cy="22" r="20.25" fill="none" stroke="rgba(255,255,255,.24)" stroke-width="1.5"/>
      <path d="M13.2 15.7c0-2.25 1.82-4.07 4.07-4.07h9.46c2.25 0 4.07 1.82 4.07 4.07v8.72c0 2.25-1.82 4.07-4.07 4.07H22.9l-4.22 3.22.76-3.22h-2.17c-2.25 0-4.07-1.82-4.07-4.07V15.7Z" fill="#fff"/>
      <circle cx="18.7" cy="20.05" r="1.55" fill="#0aa39d"/>
      <circle cx="25.3" cy="20.05" r="1.55" fill="#0aa39d"/>
      <path d="M18.9 24.05c1.92 1.54 4.28 1.54 6.2 0" fill="none" stroke="#0aa39d" stroke-width="1.45" stroke-linecap="round"/>
      <path d="M22 11.62V9.4" stroke="#fff" stroke-width="1.55" stroke-linecap="round"/>
      <circle cx="22" cy="8.2" r="1.35" fill="#fff"/>
    </svg>`;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ox-floating-icon ox-assistant-fab";
  button.setAttribute("data-ox-assistant-fab", "");
  button.setAttribute("aria-label", "Open digitale assistent");
  button.setAttribute("aria-expanded", "false");
  button.title = "Digitale assistent";
  button.innerHTML = BOT_ICON;
  secondary.prepend(button);

  let dialog = document.querySelector("[data-chatbase-dialog]");

  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.className = "ox-chat-dialog ox-assistant-dialog";
    dialog.setAttribute("data-chatbase-dialog", "");
    dialog.setAttribute("aria-labelledby", "ox-assistant-dialog-title");
    dialog.innerHTML = `
      <div class="ox-chat-dialog-shell">
        <header class="ox-chat-dialog-header">
          <div class="ox-assistant-dialog-brand">
            <span class="ox-assistant-dialog-icon" aria-hidden="true">${BOT_ICON}</span>
            <div>
              <p>OsmoseXpert</p>
              <h2 id="ox-assistant-dialog-title">Digitale assistent</h2>
              <span class="ox-assistant-dialog-subtitle">Prijzen • afspraken • onderhoudsplannen</span>
            </div>
          </div>
          <button type="button" class="ox-chat-dialog-close" data-chatbase-close aria-label="Chat sluiten">×</button>
        </header>
        <iframe class="ox-chat-frame" data-chatbase-frame title="Chat met de digitale assistent van OsmoseXpert" src="about:blank" loading="lazy" data-external-src="${CHAT_URL}" referrerpolicy="strict-origin-when-cross-origin"></iframe>
      </div>`;
    document.body.appendChild(dialog);
  }

  const frame = dialog.querySelector("[data-chatbase-frame]");
  let pending = false;

  function openNow() {
    if (!(dialog instanceof HTMLDialogElement) || !(frame instanceof HTMLIFrameElement)) return;
    frame.removeAttribute("srcdoc");
    if (frame.src !== CHAT_URL) frame.src = CHAT_URL;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add("ox-chat-open");
    button.setAttribute("aria-expanded", "true");
  }

  function requestOpen() {
    if (document.documentElement.dataset.marketingConsent === "true") {
      openNow();
      return;
    }
    pending = true;
    window.dispatchEvent(new CustomEvent("ox:open-consent", { detail: { opener: button } }));
  }

  button.addEventListener("click", requestOpen);
  dialog.querySelector("[data-chatbase-close]")?.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("ox-chat-open");
    button.setAttribute("aria-expanded", "false");
    button.focus({ preventScroll: true });
  });

  window.addEventListener("ox:consent-updated", (event) => {
    if (pending && event.detail?.marketing) {
      pending = false;
      window.setTimeout(openNow, 0);
    } else if (pending && !event.detail?.marketing) {
      pending = false;
    }
    if (!event.detail?.marketing && dialog.open) dialog.close();
  });
})();
