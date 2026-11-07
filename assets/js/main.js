/* Duchess Bakehouse - interaction layer */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- hero headline ---------------- */
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;

    var words = $$(".hero .reveal-word > span");
    if (reduced || typeof gsap === "undefined") {
      words.forEach(function (w) { w.style.transform = "none"; });
      $$(".hero__kicker, .hero__sub, .hero__actions, .hero__stats, .hero__shot")
        .forEach(function (n) { n.style.opacity = 1; });
      return;
    }

    // The CSS start offset is a percentage, which the browser reports back as a
    // pixel matrix. GSAP would keep those pixels in `y` and animate only the
    // percentage, so the word never moves. Re-seed the offset purely as yPercent.
    gsap.set(words, { y: 0, yPercent: 105 });

    var tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(words, { yPercent: 0, duration: 1.05, stagger: 0.075 })
      .from(".hero__kicker", { y: 16, opacity: 0, duration: .7 }, 0.15)
      .from(".hero__sub", { y: 22, opacity: 0, duration: .8 }, "-=.65")
      .from(".hero__actions .btn", { y: 18, opacity: 0, duration: .65, stagger: .09 }, "-=.5")
      .from(".hero__stats div", { y: 16, opacity: 0, duration: .6, stagger: .08 }, "-=.45")
      .from(".hero__shot", { y: 38, opacity: 0, scale: .97, duration: 1.1 }, "-=1.2");
  }

  /* Every script on the page is deferred, so the DOM is already parsed here and
     the hero can start immediately instead of waiting on images and video the
     way the old preloader did. */
  startHero();

  /* ---------------- nav ---------------- */
  var nav = $("#nav");
  var onScroll = function () {
    if (nav) nav.classList.toggle("is-stuck", window.scrollY > 24);
    var wa = $("#waFloat");
    if (wa) wa.classList.toggle("is-in", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------------- mobile drawer ---------------- */
  (function drawer() {
    var burger = $("#burger");
    var panel = $("#drawer");
    if (!burger || !panel) return;

    function setOpen(open) {
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      panel.classList.toggle("is-open", open);
      panel.setAttribute("aria-hidden", String(!open));
      document.body.classList.toggle("is-locked", open);
      if (open) {
        $$("a", panel).forEach(function (a, i) {
          a.style.transitionDelay = (0.06 + i * 0.055) + "s";
        });
      } else {
        $$("a", panel).forEach(function (a) { a.style.transitionDelay = "0s"; });
      }
    }

    burger.addEventListener("click", function () {
      setOpen(burger.getAttribute("aria-expanded") !== "true");
    });
    $$("a", panel).forEach(function (a) {
      a.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) setOpen(false);
    });
  })();

  /* ---------------- scroll reveals ---------------- */
  (function reveals() {
    var items = $$(".r-up");
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(function (n) { n.classList.add("r-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var sibs = Array.prototype.slice.call(en.target.parentNode.children)
          .filter(function (n) { return n.classList.contains("r-up"); });
        var idx = Math.min(sibs.indexOf(en.target), 7);
        en.target.style.transitionDelay = (idx * 0.075) + "s";
        en.target.classList.add("r-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -11% 0px", threshold: 0.05 });
    items.forEach(function (n) { io.observe(n); });
  })();

  /* ---------------- 3D tilt ---------------- */
  (function tilt() {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    $$("[data-tilt]").forEach(function (card) {
      var raf = null;
      var max = card.classList.contains("cake") ? 7 : 9;

      function move(e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = null;
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform =
            "perspective(1000px) rotateY(" + (px * max) + "deg) rotateX(" +
            (-py * max) + "deg) translateY(-6px) scale(1.012)";
        });
      }
      function leave() {
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        card.style.transform = "";
      }

      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      card.addEventListener("blur", leave);
    });
  })();

  /* ---------------- catalogue: filtering, detail view, ordering ---------------- */
  (function catalogue() {
    var cfg = window.DUCHESS || {};
    var box = $("#lightbox");
    var img = $("#lbImg");
    if (!box || !img) return;

    var chips = $$(".chip");
    var cakes = $$("#gallery .cake");
    var idx = 0;
    var lastFocus = null;

    var elTag = $("#lbTag"), elTitle = $("#lbTitle"), elSub = $("#lbSub");
    var elPrice = $("#lbPrice"), elSizes = $("#lbSizes"), elLead = $("#lbLead");
    var elOrder = $("#lbOrder");

    /* catalogue.js is the single source for the contact number. Every wa.me and
       tel: link is synced to it here, so changing that one constant moves the
       whole site and the markup only has to be right enough to work with
       scripting off. */
    if (cfg.whatsapp) {
      $$('a[href*="wa.me/"]').forEach(function (a) {
        a.href = a.getAttribute("href").replace(/wa\.me\/\d+/, "wa.me/" + cfg.whatsapp);
      });
      $$('a[href^="tel:"]').forEach(function (a) {
        a.href = "tel:+" + cfg.whatsapp;
      });
    }

    if (elSizes && cfg.sizes) {
      cfg.sizes.forEach(function (s) {
        var row = document.createElement("div");
        var b = document.createElement("b");
        b.textContent = s.label;
        var sp = document.createElement("span");
        sp.textContent = s.serves;
        row.appendChild(b);
        row.appendChild(sp);
        elSizes.appendChild(row);
      });
    }
    if (elPrice && cfg.priceNote) elPrice.textContent = cfg.priceNote;
    if (elLead && cfg.leadNote) elLead.textContent = cfg.leadNote;

    function visible() {
      return cakes.filter(function (c) { return !c.classList.contains("is-hidden"); });
    }

    function data(fig) {
      var i = $("img", fig);
      var strong = $("figcaption strong", fig);
      var span = $("figcaption span", fig);
      var tag = $(".cake__tag", fig);
      return {
        slug: fig.dataset.slug || "",
        name: strong ? strong.textContent.trim() : "This design",
        sub: span ? span.textContent.trim() : "",
        tag: tag ? tag.textContent.trim() : (fig.dataset.cat || ""),
        src: i ? i.src : "",
        alt: i ? i.alt : ""
      };
    }

    /* No per-cake price is published, so the message asks for a quote and
       carries the design reference rather than stating a figure. */
    function orderLink(d) {
      var msg = "Hi Duchess Bakehouse, I would like to order the " + d.name +
                " design (ref: " + d.slug + "). Please send me a quote.";
      return "https://wa.me/" + (cfg.whatsapp || "") + "?text=" + encodeURIComponent(msg);
    }

    function setParam(key, val) {
      try {
        var u = new URL(window.location.href);
        if (val) u.searchParams.set(key, val); else u.searchParams.delete(key);
        history.replaceState(null, "", u);
      } catch (e) { /* deep links are a nicety; never block the UI over them */ }
    }

    function show(i) {
      var list = visible();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var d = data(list[idx]);

      img.src = d.src;
      img.alt = d.alt;
      if (elTag) elTag.textContent = d.tag;
      if (elTitle) elTitle.textContent = d.name;
      if (elSub) elSub.textContent = d.sub;
      if (elOrder) {
        elOrder.href = orderLink(d);
        elOrder.setAttribute("aria-label", "Order the " + d.name + " design on WhatsApp");
      }
      setParam("cake", d.slug);
    }

    var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    function trapTab(e) {
      var f = $$(FOCUSABLE, box).filter(function (n) { return n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      if (window.duchessTrack) {
        var current = visible()[idx];
        window.duchessTrack("cake_detail_view", { design: current ? current.dataset.slug : "" });
      }
      box.classList.add("is-open");
      box.removeAttribute("aria-hidden");
      document.body.classList.add("is-locked");
      /* The dialog transitions out of visibility:hidden, and a hidden element
         cannot take focus, so flush style before moving focus into it. */
      void box.offsetWidth;
      $("#lbClose").focus();
    }

    function close() {
      box.classList.remove("is-open");
      box.setAttribute("aria-hidden", "true");
      document.body.classList.remove("is-locked");
      setParam("cake", null);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    cakes.forEach(function (fig) {
      function trigger() { open(visible().indexOf(fig)); }
      fig.addEventListener("click", trigger);

      /* The caption button becomes the single tab stop for the card, so a
         keyboard user gets one labelled control instead of a bare figure. */
      fig.removeAttribute("tabindex");
      var cap = $("figcaption", fig);
      if (cap) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cake__view";
        btn.textContent = "View details";
        btn.setAttribute("aria-label", "View details for " + data(fig).name);
        btn.addEventListener("click", function (e) { e.stopPropagation(); trigger(); });
        cap.appendChild(btn);
      }
    });

    function applyFilter(f, animate) {
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c.dataset.filter === f)); });
      cakes.forEach(function (cake) {
        var on = f === "all" || cake.dataset.cat === f;
        cake.classList.toggle("is-hidden", !on);
        if (on && animate && !reduced && typeof gsap !== "undefined") {
          gsap.fromTo(cake, { opacity: 0, y: 18, scale: .97 },
            { opacity: 1, y: 0, scale: 1, duration: .5, ease: "power2.out", clearProps: "transform" });
        }
      });
      setParam("filter", f === "all" ? null : f);
    }

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () { applyFilter(chip.dataset.filter, true); });
    });

    /* Occasion cards are plain anchors to #cakes, so they still land somewhere
       useful with scripting off. With it on they also set the matching filter. */
    $$("[data-occasion]").forEach(function (card) {
      card.addEventListener("click", function () { applyFilter(card.dataset.occasion, true); });
    });

    $("#lbClose").addEventListener("click", close);
    var altClose = $("#lbCloseAlt");
    if (altClose) altClose.addEventListener("click", close);
    $("#lbPrev").addEventListener("click", function () { show(idx - 1); });
    $("#lbNext").addEventListener("click", function () { show(idx + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "ArrowRight") show(idx + 1);
      else if (e.key === "Tab") trapTab(e);
    });

    /* ?filter= and ?cake= make a filtered view or a single design linkable. */
    (function deepLink() {
      var params;
      try { params = new URL(window.location.href).searchParams; } catch (e) { return; }

      var f = params.get("filter");
      if (f && chips.some(function (c) { return c.dataset.filter === f; })) applyFilter(f, false);

      var slug = params.get("cake");
      if (!slug) return;
      var list = visible();
      for (var i = 0; i < list.length; i++) {
        if (list[i].dataset.slug === slug) { open(i); return; }
      }
    })();
  })();

  /* ---------------- lazy videos ---------------- */
  (function lazyVideos() {
    var vids = $$("video[data-lazyvid]");
    if (!vids.length) return;

    if (!("IntersectionObserver" in window)) {
      vids.forEach(function (v) { v.load(); v.play().catch(function () {}); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var v = en.target;
        if (en.isIntersecting) {
          if (!v.dataset.loaded) { v.load(); v.dataset.loaded = "1"; }
          v.play().catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { rootMargin: "180px 0px", threshold: 0.2 });

    vids.forEach(function (v) { io.observe(v); });
  })();

  /* ---------------- misc ---------------- */
  var yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

})();
