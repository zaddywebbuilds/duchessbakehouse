/* Duchess Bakehouse - central business settings and catalogue rules.
   This is the one file to edit to change contact details, lead times or the
   published size guide. Nothing else in the site hardcodes them. */
window.DUCHESS = (function () {
  "use strict";

  /* The stand-in digits currently sitting in the markup. Every link using them
     is rewritten at runtime from `whatsapp` below, so the real number only ever
     has to be set in one place. */
  var PLACEHOLDER = "2348000000000";

  /* OWNER TODO: replace with the real WhatsApp number in full international
     form, digits only, no plus sign. While this still equals PLACEHOLDER the
     site keeps showing the stand-in rather than inventing a number. */
  var WHATSAPP = "2348000000000";

  return {
    placeholder: PLACEHOLDER,
    whatsapp: WHATSAPP,
    whatsappIsPlaceholder: WHATSAPP === PLACEHOLDER,

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
    leadNote: "48 hours standard notice. Weddings and December dates need two to three weeks."
  };
})();
