"""Generate the crawlable cake collection pages from assets/data/catalogue.json.

catalogue.json is the single source of truth for all cake data, including cakes
added through the admin panel. Re-run after editing it:

    python tools/build-collections.py

Writes cakes/index.html and cakes/<category>/index.html.
"""

import os
import json
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://zaddywebbuilds.github.io/duchessbakehouse"

CATEGORIES = [
    ("birthday", "Birthday cakes in Lagos",
     "Character cakes for the little ones and black-and-gold restraint for the "
     "grown ones. Names, ages and toppers included, baked for your date and "
     "delivered standing."),
    ("kids", "Kids' birthday cakes in Lagos",
     "Minnie, Paw Patrol, Barbie, teddies and whatever they are obsessed with "
     "this month. Bright, sturdy and built to survive the party."),
    ("wedding", "Wedding cakes in Lagos",
     "Tiered buttercream, piped roses, drapes and pearls. We deliver set up and "
     "standing at your venue, not boxed for somebody else to fix."),
    ("anniversary", "Anniversary cakes in Lagos",
     "Red roses, gold spheres and the number that matters, however many years "
     "it has been."),
    ("celebration", "Send-forth and thanksgiving cakes in Lagos",
     "Farewells, graduations, office closings and December gatherings. "
     "Lettering on top and enough slices for the room."),
]


def read_catalogue():
    path = os.path.join(ROOT, "assets", "data", "catalogue.json")
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)["cakes"]


def figure_html(cake, prefix):
    slug = cake["slug"]
    name = cake["name"]
    sub = cake.get("sub", "")
    alt = cake.get("alt", name)
    img = cake.get("img", "")
    img_fallback = cake.get("imgFallback", img.replace(".webp", ".jpg"))
    cat = cake["category"]
    cat_label = cat.capitalize()
    tall_class = " cake--tall" if cake.get("tall") else ""

    sub_span = f"<span>{sub}</span>" if sub else ""
    fallback_srcset = f' srcset="{prefix}assets/img/{img_fallback} 1x"' if img_fallback else ""

    return (
        f'<figure data-slug="{slug}" class="cake{tall_class} r-up" '
        f'data-cat="{cat}" data-tilt tabindex="0">\n'
        f'        <img src="{prefix}assets/img/{img}" alt="{alt}" '
        f'width="700" height="933" loading="lazy" decoding="async">\n'
        f'        <span class="cake__tag">{cat_label}</span>\n'
        f'        <figcaption><strong>{name}</strong>{sub_span}</figcaption>\n'
        f'      </figure>'
    )


def page(prefix, slug, title, intro, cakes, canonical):
    cards = "\n".join(
        "      " + figure_html(c, prefix) for c in cakes
    )
    nav_home = prefix + "index.html"
    return f"""<!doctype html>
<html lang="en-NG">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title} | Duchess Bakehouse</title>
<meta name="description" content="{intro}">
<meta name="theme-color" content="#35101a">
<link rel="canonical" href="{canonical}">

<meta property="og:type" content="website">
<meta property="og:site_name" content="Duchess Bakehouse">
<meta property="og:locale" content="en_NG">
<meta property="og:url" content="{canonical}">
<meta property="og:title" content="{title} | Duchess Bakehouse">
<meta property="og:description" content="{intro}">
<meta property="og:image" content="{SITE}/assets/img/cake-40.jpg">
<meta name="twitter:card" content="summary_large_image">

<link rel="stylesheet" href="{prefix}assets/css/style.css">
</head>
<body>

<a class="skip-link" href="#main">Skip to content</a>
<div class="grain" aria-hidden="true"></div>

<header class="nav is-stuck" id="nav">
  <div class="nav__inner">
    <a class="brand" href="{nav_home}" aria-label="Duchess Bakehouse, home">
      <span class="brand__dot" aria-hidden="true"></span>
      <span>Duchess Bakehouse<small>Lagos</small></span>
    </a>
    <nav class="nav__links" aria-label="Primary">
      <a href="{prefix}cakes/index.html">All cakes</a>
      <a href="{nav_home}#chops">Small Chops</a>
      <a href="{nav_home}#delivery">Delivery</a>
    </nav>
    <div style="display:flex;align-items:center;gap:.7rem">
      <a class="btn btn--primary nav__cta" href="{nav_home}#concierge">Order a cake</a>
    </div>
  </div>
</header>

<main id="main">
<section class="section section--page">
  <div class="shell">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="{nav_home}">Home</a> <span aria-hidden="true">/</span>
      <a href="{prefix}cakes/index.html">Cakes</a>{'' if slug == 'all' else ' <span aria-hidden="true">/</span> <span>' + title.split(" in ")[0] + '</span>'}
    </nav>

    <div class="section-head">
      <span class="eyebrow">Cake collection</span>
      <h1 class="title">{title}</h1>
      <p class="lede">{intro}</p>
    </div>

    <div class="gallery" id="gallery">
{cards}
    </div>

    <p class="coll-cta">
      <a class="btn btn--berry btn--lg" href="{nav_home}#concierge">Create your cake</a>
      <a class="btn btn--ghost btn--lg" href="{prefix}cakes/index.html">See every cake</a>
    </p>
  </div>
</section>
</main>

<footer class="footer">
  <div class="shell">
    <p>&copy; 2026 Duchess Bakehouse. Baked in Lagos.
      <a href="{nav_home}">Back to the homepage</a></p>
  </div>
</footer>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-labelledby="lbTitle" aria-hidden="true">
  <button class="lb-btn lb-close" id="lbClose" aria-label="Close">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
  </button>
  <button class="lb-btn lb-prev" id="lbPrev" aria-label="Previous cake">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>
  </button>
  <button class="lb-btn lb-next" id="lbNext" aria-label="Next cake">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
  </button>
  <div class="lb-panel">
    <div class="lb-media"><img id="lbImg" src="" alt=""></div>
    <div class="lb-detail">
      <span class="lb-detail__tag" id="lbTag"></span>
      <h3 class="lb-detail__title" id="lbTitle"></h3>
      <p class="lb-detail__sub" id="lbSub"></p>
      <p class="lb-detail__price" id="lbPrice"></p>
      <h4 class="lb-detail__label">Sizes &amp; servings</h4>
      <div class="lb-detail__sizes" id="lbSizes"></div>
      <p class="lb-detail__lead" id="lbLead"></p>
      <div class="lb-detail__actions">
        <a class="btn btn--berry" id="lbOrder" href="#" target="_blank" rel="noopener">Order this design</a>
        <button class="btn btn--ghost" id="lbCloseAlt" type="button">Keep browsing</button>
      </div>
    </div>
  </div>
</div>

<a class="wa-float is-in" href="https://wa.me/2348104476261?text=Hi%20Duchess%20Bakehouse%2C%20I%27d%20like%20to%20order%20a%20cake."
   target="_blank" rel="noopener">Order on WhatsApp</a>

<script src="{prefix}assets/js/catalogue.js" defer></script>
<script src="{prefix}assets/js/analytics.js" defer></script>
<script src="{prefix}assets/js/main.js" defer></script>
<script src="{prefix}assets/js/shortlist.js" defer></script>
</body>
</html>
"""


def write(path, text):
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    return path


def main():
    cakes = read_catalogue()
    if not cakes:
        sys.exit("no cakes found in assets/data/catalogue.json")

    written = []

    written.append(write("cakes/index.html", page(
        "../", "all", "Every cake we have baked",
        "The full Duchess Bakehouse portfolio: birthdays, kids' parties, weddings, "
        "anniversaries, send-forth and thanksgiving, all baked to order in Lagos.",
        cakes, SITE + "/cakes/")))
    print("  cakes/index.html  (%d cakes)" % len(cakes))

    for slug, title, intro in CATEGORIES:
        sub = [c for c in cakes if c["category"] == slug]
        if not sub:
            print("  skipped %s (no cakes)" % slug)
            continue
        written.append(write("cakes/%s/index.html" % slug, page(
            "../../", slug, title, intro, sub, "%s/cakes/%s/" % (SITE, slug))))
        print("  cakes/%s/index.html  (%d cakes)" % (slug, len(sub)))

    print("\n%d pages written" % len(written))


if __name__ == "__main__":
    main()
