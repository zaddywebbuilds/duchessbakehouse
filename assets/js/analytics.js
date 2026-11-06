/* Duchess Bakehouse - optional analytics.
   Off by default. While analytics.enabled is false nothing is sent and no
   third-party script is fetched, so the site ships with no trackers until the
   owner turns them on in catalogue.js.

   Event names describe enquiries, never sales. Opening WhatsApp is somebody
   starting a conversation, not a completed order, and calling it a conversion
   would overstate every number the owner later reads. */
(function () {
  "use strict";

  var cfg = (window.DUCHESS && window.DUCHESS.analytics) || {};
  var on = !!cfg.enabled && !!cfg.ga4MeasurementId;

  if (on) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(cfg.ga4MeasurementId);
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", cfg.ga4MeasurementId);
  }

  /* Always defined, so callers never have to guard on whether tracking is on. */
  window.duchessTrack = function (name, params) {
    if (!on || typeof window.gtag !== "function") return;
    window.gtag("event", name, params || {});
  };

  /* One delegated listener covers every WhatsApp link on the page: hero, nav,
     footer, floating button, product dialog, concierge and the tray builder. */
  document.addEventListener("click", function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var a = t.closest('a[href*="wa.me"]');
    if (!a) return;
    window.duchessTrack("whatsapp_click", {
      label: a.id || (a.textContent || "").trim().slice(0, 40)
    });
  }, true);
})();
