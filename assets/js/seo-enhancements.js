(() => {
  "use strict";

  const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href.split("#")[0].split("?")[0];
  const path = location.pathname.replace(/\/+$/, "") || "/";

  function cleanText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function addJsonLd(id, data) {
    if (document.getElementById(id)) return;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  function addFaqSchema() {
    if (path !== "/faq") return;

    const entries = Array.from(document.querySelectorAll("main details"))
      .map((detail) => {
        const question = cleanText(detail.querySelector("summary")?.textContent);
        const answer = cleanText(detail.querySelector(".answer")?.textContent);
        if (!question || !answer) return null;
        return {
          "@type": "Question",
          name: question,
          acceptedAnswer: {
            "@type": "Answer",
            text: answer
          }
        };
      })
      .filter(Boolean);

    if (!entries.length) return;

    addJsonLd("ox-faq-schema", {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${canonical}#faq`,
      url: canonical,
      inLanguage: "nl-BE",
      mainEntity: entries
    });
  }

  function addBreadcrumbSchema() {
    if (path === "/") return;

    const h1 = cleanText(document.querySelector("main h1, header h1, h1")?.textContent);
    const title = h1 || cleanText(document.title.split("|")[0]) || "OsmoseXpert";

    addJsonLd("ox-breadcrumb-schema", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "OsmoseXpert",
          item: "https://osmose-xpert.be/"
        },
        {
          "@type": "ListItem",
          position: 2,
          name: title,
          item: canonical
        }
      ]
    });
  }

  addFaqSchema();
  addBreadcrumbSchema();
})();
