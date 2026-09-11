(() => {
  'use strict';
  const AGENT_ID = 'TkHOZ_mxX3kecf30oT-ri';
  const CONSENT_KEY = 'ox_campaign_preferences_v1';
  const $ = (selector) => document.querySelector(selector);
  let preferences = { assistant: false, measurement: false };
  try { const saved = JSON.parse(localStorage.getItem(CONSENT_KEY)); if (saved) preferences = { assistant: saved.assistant === true, measurement: saved.measurement === true }; } catch (_) { /* Storage is optional. */ }
  let pendingIntent = 'woning';
  let chatInstalled = false;
  let chatLoading = false;
  let chatReady = false;
  window.addEventListener('message', (event) => {
    const frame = document.getElementById('chatbase-center-stage-iframe');
    if (event.origin !== 'https://www.chatbase.co' || !frame || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'iframeReady') { chatReady = true; chatLoading = false; $('#chat-status').textContent = ''; }
  });
  let trackingInstalled = false;
  const consentDialog = $('#chat-consent');
  const settingsDialog = $('#settings-dialog');
  const prompts = {
    woning: 'Ik wil de ramen van mijn woning laten reinigen. Kunt u mij helpen om mijn aanvraag samen te stellen?',
    onderhoud: 'Ik wil vast onderhoud bespreken. Welke van jullie vier onderhoudsformules past bij mijn woning?',
    afspraak: 'Ik wil een afspraak plannen. Kunt u eerst bekijken welke planning geschikt is voor mijn opdracht?',
    bronze: 'Ik wil Bronze bespreken: 2 reinigingen per jaar, om de 6 maanden.',
    silver: 'Ik wil Silver bespreken: 4 reinigingen per jaar, om de 3 maanden.',
    gold: 'Ik wil Gold bespreken: 6 reinigingen per jaar, om de 2 maanden.',
    platinum: 'Ik wil Platinum bespreken: 12 reinigingen per jaar, maandelijks.'
  };
  function savePreferences() { try { localStorage.setItem(CONSENT_KEY, JSON.stringify(preferences)); } catch (_) {} }
  function track(event, fields = {}) {
    if (!preferences.measurement) return;
    window.dataLayer = window.dataLayer || [];
    // Deliberately exclude names, email, phone, free text and images.
    window.dataLayer.push({ event, page_type: 'osmosexpert_campagne', ...fields });
  }
  function installTracking() {
    if (!preferences.measurement || trackingInstalled) return;
    trackingInstalled = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-W8T8WMTW';
    document.head.appendChild(script);
  }
  function showChatFallback(message) {
    const status = $('#chat-status');
    status.replaceChildren(document.createTextNode(message + ' '));
    const link = document.createElement('a');
    link.href = '#aanvraag';
    link.textContent = 'Gebruik het aanvraagformulier.';
    status.appendChild(link);
    status.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  function installChat(message) {
    if (chatInstalled) { window.chatbaseCenterStage("sendMessage", message, {}); return; }
    if (!window.chatbaseCenterStage || window.chatbaseCenterStage('getState') !== 'initialized') {
      const queue = (...args) => { window.chatbaseCenterStage.q ||= []; window.chatbaseCenterStage.q.push(args); };
      window.chatbaseCenterStage = new Proxy(queue, {
        get(target, key) { if (key === 'q') return target.q; return (...args) => target(key, ...args); }
      });
    }
    const script = document.createElement('script');
    script.src = 'https://www.chatbase.co/center-stage-embed.min.js';
    script.id = AGENT_ID;
    script.domain = 'www.chatbase.co';
    script.async = true;
    script.onerror = () => {
      chatInstalled = false;
      chatLoading = false;
      script.remove();
      showChatFallback('De assistent kon niet worden geladen. U kunt opnieuw proberen of ons rechtstreeks bereiken.');
    };
    window.chatbaseCenterStage("sendMessage", message, {});
    document.body.appendChild(script);
    chatInstalled = true;
  }
  function openChat(intent) {
    if (chatLoading) return;
    chatLoading = true;
    const status = $('#chat-status');
    status.textContent = 'De assistent wordt geopend…';
    // The selected request is visibly sent as a user message. Do not reset conversations.
    installChat(prompts[intent] || prompts.woning);
    track('ox_chat_open', { intent });
    window.setTimeout(() => {
      chatLoading = false;
      if (!chatInstalled) return;
      if (chatReady) status.textContent = '';
      else showChatFallback('Opent de assistent niet?');
    }, 10000);
  }
  document.querySelectorAll('[data-chat-intent]').forEach((button) => {
    button.addEventListener('click', () => {
      pendingIntent = button.dataset.chatIntent;
      if (preferences.assistant) openChat(pendingIntent);
      else consentDialog.showModal();
    });
  });
  $('#allow-chat').addEventListener('click', () => {
    preferences.assistant = true;
    savePreferences();
    consentDialog.close();
    openChat(pendingIntent);
  });
  $('#use-form').addEventListener('click', () => {
    consentDialog.close();
    $('#aanvraag').scrollIntoView({ behavior: 'smooth' });
    $('#lead-form input[name="naam"]').focus({ preventScroll: true });
  });
  document.querySelectorAll('.dialog-close').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
  $('#privacy-settings').addEventListener('click', () => {
    $('#chat-preference').checked = preferences.assistant;
    $('#measurement-preference').checked = preferences.measurement;
    settingsDialog.showModal();
  });
  $('#save-preferences').addEventListener('click', () => {
    const mustReload = (preferences.assistant && !$('#chat-preference').checked && chatInstalled) || (preferences.measurement && !$('#measurement-preference').checked && trackingInstalled);
    preferences.assistant = $('#chat-preference').checked;
    preferences.measurement = $('#measurement-preference').checked;
    savePreferences();
    settingsDialog.close();
    // There is no documented Chatbase destroy API. Reload stops loaded integrations.
    if (mustReload) window.location.reload();
    else installTracking();
  });
  installTracking();

  // Keep the compact page navigation aligned with the visible section.
  if ('IntersectionObserver' in window) {
    const navigation = Array.from(document.querySelectorAll('.page-nav a'));
    if (navigation[0]) navigation[0].setAttribute('aria-current', 'location');
    const sections = new IntersectionObserver((entries) => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (!visible) return;
      navigation.forEach(link => {
        if (link.hash === '#' + visible.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-15% 0px -55% 0px' });
    navigation.forEach(link => {
      const target = document.querySelector(link.hash);
      if (target) sections.observe(target);
    });
    window.addEventListener('pagehide', () => sections.disconnect(), { once: true });
  }

  const form = $('#lead-form');
  const submit = form.querySelector('[type="submit"]');
  const formStatus = $('#form-status');
  let submitting = false;
  let submissionConfirmed = false;
  let formStarted = false;
  form.addEventListener('input', () => {
    if (!formStarted) { formStarted = true; track('ox_form_start'); }
  });
  form.addEventListener('submit', async (event) => {
    // Native POST remains available when JS is disabled. With JS, only HTTP success is a lead.
    event.preventDefault();
    if (submitting || submissionConfirmed || !form.reportValidity()) return;
    if (form.elements._gotcha.value) return;
    submitting = true;
    submit.disabled = true;
    submit.textContent = 'Uw aanvraag wordt verstuurd…';
    formStatus.textContent = '';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, signal: controller.signal });
      if (!response.ok) throw new Error('server');
      submissionConfirmed = true;
      const eventId = window.crypto?.randomUUID?.() || String(Date.now());
      track('ox_lead_submitted', { lead_source: 'landing_form', event_id: eventId });
      form.hidden = true;
      $('#form-success').hidden = false;
      $('#form-success').focus({ preventScroll: true });
      $('#form-success').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (error) {
      formStatus.replaceChildren(document.createTextNode(error.name === 'AbortError'
        ? 'De bevestiging duurt langer dan verwacht. Mogelijk is uw aanvraag al aangekomen. Bel ons om dit te controleren voordat u opnieuw verstuurt.'
        : 'We konden de verzending niet bevestigen. Uw gegevens staan nog in het formulier. Probeer opnieuw of bel ons.'));
      const phone = document.createElement('a'); phone.href = 'tel:+32493673484'; phone.textContent = ' 0493 67 34 84'; formStatus.appendChild(phone);
      track('ox_form_error', { reason: error.name === 'AbortError' ? 'timeout' : 'unconfirmed' });
    } finally {
      window.clearTimeout(timeout);
      submitting = false;
      submit.disabled = false;
      submit.textContent = 'Vraag mijn voorstel aan ↗';
    }
  });
  document.querySelectorAll('a[href^="tel:"]').forEach((link) => link.addEventListener('click', () => track('ox_phone_click')));
  document.querySelectorAll('video').forEach((video) => {
    video.addEventListener('play', () => {
      document.querySelectorAll('video').forEach((other) => { if (other !== video) other.pause(); });
      track('ox_video_play', { video_id: video.id });
    });
    video.addEventListener('ended', () => track('ox_video_complete', { video_id: video.id }));
    video.addEventListener('error', () => {
      const message = document.createElement('p'); message.className = 'media-caption'; message.textContent = 'De video kan op dit moment niet worden geladen. U kunt uw aanvraag gewoon verderzetten.';
      video.insertAdjacentElement('afterend', message);
    }, { once: true });
  });
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    const services = ['Ramenreiniging woning', 'Ramenreiniging villa', 'Ramen en veranda', 'Zonnepanelen', 'Combinatie / andere aanvraag', 'Zakelijke aanvraag'];
    try {
      Promise.resolve(document.modelContext.registerTool({
        name: 'start_reinigingsaanvraag',
        title: 'Start een reinigingsaanvraag',
        description: 'Open het aanvraagformulier en selecteer de dienst. Verstuurt geen gegevens en maakt geen offerte of boeking. De bezoeker vult het formulier verder in en verstuurt het zelf.',
        inputSchema: { type: 'object', properties: { dienst: { type: 'string', enum: services } }, required: ['dienst'], additionalProperties: false },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input) {
          if (!input || typeof input !== 'object' || Object.keys(input).some(key => key !== 'dienst') || !services.includes(input.dienst)) throw new Error('Kies een beschikbare dienst.');
          if (submissionConfirmed) return { status: 'reeds_ingediend', opnieuw_verstuurd: false };
          form.elements.dienst.value = input.dienst;
          $('#aanvraag').scrollIntoView({ behavior: 'smooth' });
          form.elements.dienst.focus();
          return { status: 'formulier_geopend', dienst: form.elements.dienst.value, ingediend: false, geboekt: false };
        }
      }, { signal: lifecycle.signal })).catch(() => {});
      window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
    } catch (_) { /* Optional browser capability; the ordinary form stays available. */ }
  }
})();
