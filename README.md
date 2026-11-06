# Duchess Bakehouse

A single-page site for a Lagos cake and small chops kitchen. Static HTML, CSS
and vanilla JavaScript — no build step, no framework, no package install.

## Running it

```bash
python -m http.server 5188
```

Then open <http://localhost:5188>. Any static server works; the port is set in
`.claude/launch.json`.

## Layout

```
index.html              every section of the page
assets/css/style.css    all styling
assets/js/catalogue.js  ← the file to edit for business details
assets/js/analytics.js  optional tracking, off by default
assets/js/main.js       nav, drawer, reveals, gallery filter, product dialog
assets/js/concierge.js  the six-step cake brief
assets/js/chops.js      the small chops tray builder
assets/img/             cake-01..41 as webp + jpg pairs
robots.txt, sitemap.xml
```

## The one file that matters

`assets/js/catalogue.js` holds everything an owner changes: the WhatsApp
number, the size guide, occasions, delivery areas, lead times and the analytics
switch. Nothing else hardcodes them.

Setting the WhatsApp number there fixes every link on the site at once. Links
in the markup still carry a documented stand-in (`2348000000000`), and any link
using it is rewritten at runtime from the config.

## Before go-live

These are unresolved. Several are **claims the site currently makes that nobody
has verified** — they were in the copy before this work started and have been
left alone rather than quietly deleted.

### Blocking

- [ ] **Real WhatsApp / phone number.** Set `WHATSAPP` in `catalogue.js`. Also
      add `telephone` back to the JSON-LD in `index.html`; it was removed so
      search engines are not fed a fake contact.
- [ ] **Confirm the production domain.** `canonical`, `og:url`, `og:image`,
      `robots.txt` and `sitemap.xml` all assume `duchessbakehouse.com`. The
      preview runs on GitHub Pages.

### Claims to verify or remove

- [ ] "500+ cakes delivered" (hero stat)
- [ ] "48h standard notice" and the two-to-three-week wedding/December lead time
- [ ] "70% deposit locks your date"
- [ ] The three named testimonials — real people, with permission to publish?
- [ ] Cake starting prices (₦35,000 to ₦280,000) and all small chops rates
- [ ] Pickup. The concierge offers it as a *request* ("would prefer to pick up,
      please confirm") because the site publishes delivery only.
- [ ] The footer names six specific areas (Lekki, Ikoyi, VI, Ajah, Ikeja, Yaba)
      while the FAQ and structured data say only Lagos Island and Mainland.
      Those suburbs were removed from the JSON-LD as unverified; the footer copy
      was left alone. Pick one and make them agree.

### Imagery

- [ ] **The small chops video is wrong.** `assets/video/craft-choc.mp4` is stock
      footage of a cocktail in a coconut shell, sitting beside the puff puff and
      asun. It needs real photography of your small chops.
- [ ] Two of the three "How it is made" clips are also stock. Only the third
      shows an actual Duchess cake.
- [ ] The hero video is a studio composite of a strawberry cupcake, not your work.

### Not built

- [ ] Separate crawlable pages (`/cakes/:slug`, `/cakes/birthday`, …). The site
      is one page; the sitemap lists one URL rather than inventing routes.
- [ ] Flavour list. Deliberately a free-text field in the concierge, because no
      flavour menu is published anywhere.
- [ ] Allergen, cancellation and refund policy; opening hours; pickup address.

## What the site will not do

Decisions worth keeping if the code changes hands:

- **No price is ever quoted.** Cake designs are quote-only. The tray builder
  multiplies quantity by the rates already printed in the menu and nothing
  else — no discounts, no bundle pricing.
- **Nothing is booked.** Every flow ends by opening WhatsApp. No confirmation,
  no reservation, no availability claim.
- **Guest count is passed along, not converted.** The page says the kitchen
  sizes the tray, so no guests-per-piece ratio is applied.
- **`wa.me` cannot attach a file.** The concierge asks people to attach a
  reference photo in the chat rather than pretending to upload it.
- **Analytics are off** until enabled in `catalogue.js`, and events are named as
  enquiries. Opening WhatsApp is not a sale.

## Tested

Verified in a browser at 375, 1024, 1280 and 1440 px:

- 40 gallery designs, unique slugs, no broken images
- Occasion filters (13 birthday / 15 kids / 7 wedding / 5 celebration)
- Product dialog: open, next, previous, close, focus trap, focus restore,
  `?cake=` and `?filter=` deep links
- Concierge: validation on every step, date floor, review summary, edit jumps,
  WhatsApp payload
- Tray builder: totals checked by hand against the published rates
- No horizontal overflow at any width tested

## Not tested

- Anything requiring animation frames. The checks ran in a headless preview
  pane, where `requestAnimationFrame` never fires, so CSS transitions, the
  GSAP hero timeline and smooth scrolling could not be observed running.
- Lighthouse and Core Web Vitals. No figures are claimed.
- Real WhatsApp delivery on a phone, which needs the real number first.
- Screen reader passes. Semantics, labels, focus order and focus trapping were
  verified in code and in the DOM, but not with an actual screen reader.
