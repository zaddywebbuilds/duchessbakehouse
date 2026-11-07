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
index.html               every section of the homepage
cakes/index.html         all 40 cakes, generated
cakes/<category>/        one page per occasion, generated
tools/build-collections.py   regenerates the above from index.html
assets/css/style.css     all styling
assets/js/catalogue.js   ← the file to edit for business details
assets/js/analytics.js   optional tracking, off by default
assets/js/main.js        nav, drawer, reveals, gallery filter, product dialog
assets/js/concierge.js   the six-step cake brief
assets/js/chops.js       the small chops tray builder
assets/img/              cake-01..41 as webp + jpg pairs
robots.txt, sitemap.xml
```

## Collection pages

`cakes/` and `cakes/<category>/` are **generated**, never hand-edited. The
homepage gallery is the single source of truth; the generator reads the figures
straight out of it, so a collection page cannot list a cake the site does not
have. After adding or recategorising a cake:

```bash
python tools/build-collections.py
```

Add any new category to the `CATEGORIES` list in that script and to
`sitemap.xml`. The occasion cards on the homepage point at these pages, so
crawlers and anyone without JavaScript get a real page; with JavaScript the
click is intercepted and the gallery filters in place instead.

Individual cakes are not separate pages. Forty pages each holding one photo and
otherwise identical boilerplate is the thin-content pattern search engines
penalise, and writing unique copy for each would mean inventing descriptions.
Each cake is instead deep-linkable as `?cake=<slug>`, which opens its detail
view on load.

## The one file that matters

`assets/js/catalogue.js` holds everything an owner changes: the WhatsApp
number, the size guide, occasions, delivery areas, lead times and the analytics
switch. Nothing else hardcodes them.

Changing `WHATSAPP` there moves every link on the site at once. The markup
carries the same number so the page still works with scripting off and so
crawlers read the right contact, and `main.js` syncs every `wa.me` and `tel:`
link back to the config on load. Keep `telephone` in the JSON-LD in step too.

## Before go-live

These are unresolved. Several are **claims the site currently makes that nobody
has verified** — they were in the copy before this work started and have been
left alone rather than quietly deleted.

### Blocking

- [x] ~~Real WhatsApp / phone number.~~ Set to `+234 810 447 6261`
      (`2348104476261`) in `catalogue.js`, the markup and the JSON-LD.
      **Still worth doing:** open each button on a real phone and confirm
      WhatsApp opens the right chat with the message prefilled.
- [x] ~~Confirm the production domain.~~ Set to
      `https://zaddywebbuilds.github.io/duchessbakehouse` across `canonical`,
      `og:url`, `og:image`, the JSON-LD, `robots.txt`, `sitemap.xml` and the
      page generator (2026-11-07).

      **If a custom domain is added later**, change `SITE` in
      `tools/build-collections.py`, re-run it, and search for the old host in
      `index.html`, `robots.txt` and `sitemap.xml`.

      **`robots.txt` is not actually read at this URL.** On a GitHub Pages
      *project* site, crawlers only fetch `robots.txt` from the domain root —
      `zaddywebbuilds.github.io/robots.txt` — which this repository does not
      control. The file is kept because it becomes correct the moment a custom
      domain is attached. Until then, submit `sitemap.xml` directly in Google
      Search Console rather than relying on the `Sitemap:` line.

- [ ] **The contact email may be dead.** The footer offers
      `hello@duchessbakehouse.com`, on a domain that is not serving the site.
      Replace it with a working address, or drop it and leave WhatsApp and the
      phone number as the contact routes.

### Claims — confirmed by the owner, 2026-11-06

- [x] "500+ cakes delivered"
- [x] "48h standard notice", and two to three weeks for weddings and December
- [x] "70% deposit locks your date"
- [x] The three named testimonials
- [x] Cake starting prices (₦35,000 to ₦280,000) and the small chops rates
- [x] Delivery areas. The footer's named areas are back in the JSON-LD
      `areaServed`, and `priceRange` now carries the confirmed range rather than
      a vague `₦₦`. The areas sit inside the Island/Mainland coverage stated
      elsewhere, so the two are consistent.

Still unconfirmed:

- [ ] **Pickup.** The concierge offers it as a request ("would prefer to pick
      up, please confirm"). Nothing on the site says collection is available,
      so it was never part of the claims above. Confirm separately, then either
      make it a plain option or drop it.

### Why there is no review schema

The testimonials are confirmed genuine, but they are deliberately **not** marked
up as `Review` or `aggregateRating`. Search engines restrict self-serving
reviews published on a business's own site, and three hand-picked quotes are not
an aggregate rating — marking them up that way invites a penalty and would not
earn rich results anyway. Collect reviews somewhere verifiable, such as a Google
Business Profile, and link to that instead.

### Imagery

- [ ] **The small chops video is wrong.** `assets/video/craft-choc.mp4` is stock
      footage of a cocktail in a coconut shell, sitting beside the puff puff and
      asun. It needs real photography of your small chops.
- [ ] Two of the three "How it is made" clips are also stock. Only the third
      shows an actual Duchess cake.
- [ ] The hero video is a studio composite of a strawberry cupcake, not your work.

### Not built

- [ ] Per-cake pages. See the reasoning under Collection pages above.
- [ ] Flavour list. Deliberately a free-text field in the concierge, because no
      flavour menu is published anywhere.
- [ ] Allergen, cancellation and refund policy; opening hours; pickup address.
- [ ] A founder story and behind-the-scenes photography, which need owner
      material rather than code.

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

## Performance notes

- `three.min.js` is 589 KB, roughly 79% of all the JavaScript on the site, and
  it powers nothing but the floating pearls behind the headline. It is no
  longer loaded from the markup. `scene.js` checks `prefers-reduced-motion` and
  WebGL support first, then fetches the library only if the layer will actually
  run — previously those checks happened *after* the download.
- Still worth a decision: the decorative layer also runs on phones, where that
  589 KB buys background sparkle on the slowest connections. Dropping it below
  760 px would be a one-line change in `scene.js`.
- Videos total about 6.4 MB (`craft-macaron.mp4` alone is 3.2 MB) but are
  `preload="none"` and fetched by an IntersectionObserver as they scroll in.
- The synthetic preloader is gone. It used to hold a near-blank screen behind a
  fake progress bar for up to 3.2 seconds before anything painted.

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
