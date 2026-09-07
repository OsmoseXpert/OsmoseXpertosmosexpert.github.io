(() => {
  "use strict";

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  loadScript("/assets/js/site-shell-base.js")
    .then(() => loadScript("/assets/js/assistant-fab.js"))
    .catch((error) => console.error("OsmoseXpert site shell kon niet laden.", error));
})();
