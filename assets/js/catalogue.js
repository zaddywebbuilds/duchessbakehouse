/* Duchess Bakehouse - central business settings and catalogue rules.
   This is the one file to edit to change contact details, lead times or the
   published size guide. Nothing else in the site hardcodes them. */
window.DUCHESS = (function () {
  "use strict";

  /* The one place the contact number is set. Digits only, full international
     form, no plus sign. Every wa.me and tel: link on the page is synced to this
     at runtime, so the copies in the markup are only a no-script fallback. */
  var WHATSAPP = "2348104476261";

  return {
    whatsapp: WHATSAPP,
    whatsappDisplay: "+234 810 447 6261",

    /* Mirrors the published guide in the How to order section. Serving counts
       are the bakery's own estimates. No per-cake price is published anywhere,
       so every design in the catalogue is quote-only. */
    sizes: [
      { label: "6 inch", serves: "Serves 10 to 12" },
      { label: "8 inch", serves: "Serves 20 to 25" },
      { label: "10 inch", serves: "Serves 35 to 40" },
      { label: "Two tier", serves: "Serves 50 plus" },
      { label: "Three tier", serves: "Wedding scale" }
    ],

    priceNote: "Priced on request. Size, flavour, finish and toppers all move the number.",
    leadNote: "48 hours standard notice. Weddings and December dates need two to three weeks.",

    /* Concierge options. These mirror what the site already publishes: the
       occasion sections, the size guide above, and Lagos Island / Mainland
       coverage. Flavours are deliberately a free-text field, because no flavour
       list is published anywhere and a dropdown would be inventing the menu. */
    occasions: [
      "Birthday",
      "Kids birthday",
      "Wedding",
      "Anniversary",
      "Send-forth or graduation",
      "Corporate or end-of-year",
      "Other"
    ],
    areas: ["Lagos Island", "Lagos Mainland"],

    /* The published 48 hours, expressed in days for the date picker's minimum. */
    minNoticeDays: 2,
    longNoticeNote: "Weddings and December dates usually need two to three weeks, so we may come back to you about this date.",

    /* OWNER TODO: set enabled to true and paste a GA4 measurement ID to switch
       tracking on. While this is false no third-party script is loaded and
       nothing leaves the browser. */
    analytics: {
      enabled: false,
      ga4MeasurementId: ""
    }
  };
})();
