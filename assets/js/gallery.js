/* Duchess Bakehouse — gallery enhancer.
   Fetches assets/data/catalogue.json and:
     1. Exposes window.DUCHESS_CATALOGUE so the product dialog can show prices
        and descriptions set via the admin panel.
     2. Appends any NEW cakes (slugs not already in the static markup) so cakes
        added through the admin panel appear on the homepage without editing
        index.html.

   The existing 40 static figures are untouched so gallery filters, tilt and
   shortlist continue to work as before. */
(function () {
  "use strict";

  var container = document.getElementById("gallery");
  if (!container) return;

  /* Resolve path relative to root regardless of page depth. */
  var depth = (window.location.pathname.match(/\//g) || []).length - 1;
  var prefix = depth > 1 ? Array(depth - 1).fill("..").join("/") + "/" : "";
  var jsonUrl = prefix + "assets/data/catalogue.json";

  fetch(jsonUrl)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var cakes = (data && data.cakes) || [];
      if (!cakes.length) return;

      /* Make data accessible for the dialog (prices, descriptions). */
      window.DUCHESS_CATALOGUE = {};
      cakes.forEach(function (c) { window.DUCHESS_CATALOGUE[c.slug] = c; });
      document.dispatchEvent(new CustomEvent("duchess:catalogueloaded"));

      /* Find slugs already in the DOM. */
      var existing = {};
      Array.prototype.forEach.call(
        container.querySelectorAll("figure[data-slug]"),
        function (fig) { existing[fig.dataset.slug] = true; }
      );

      /* Append only genuinely new cakes. */
      var added = 0;
      cakes.forEach(function (c) {
        if (existing[c.slug]) return;

        var tall = c.tall ? " cake--tall" : "";
        var sub = c.sub ? "<span>" + esc(c.sub) + "</span>" : "";
        var catLabel = c.category
          ? c.category.charAt(0).toUpperCase() + c.category.slice(1)
          : "";
        var imgSrc = prefix + "assets/img/" + c.img;

        var fig = document.createElement("figure");
        fig.dataset.slug = c.slug;
        fig.className = "cake" + tall + " r-up";
        fig.dataset.cat = c.category || "";
        fig.setAttribute("data-tilt", "");
        fig.tabIndex = 0;
        fig.innerHTML =
          '<img src="' + imgSrc + '"' +
          ' alt="' + esc(c.alt || c.name) + '"' +
          ' width="700" height="933" loading="lazy" decoding="async">' +
          '<span class="cake__tag">' + esc(catLabel) + "</span>" +
          "<figcaption><strong>" + esc(c.name) + "</strong>" + sub + "</figcaption>";

        container.appendChild(fig);
        added++;
      });

      if (added > 0) {
        /* Tell main.js and shortlist.js to pick up the new figures. */
        document.dispatchEvent(new CustomEvent("duchess:newcakes", { detail: { count: added } }));
      }
    })
    .catch(function () { /* catalogue.json unreachable — static markup is fine */ });

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
