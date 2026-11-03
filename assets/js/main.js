/* Duchess Bakehouse - interaction layer */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- preloader ---------------- */
  (function loader() {
    var el = $("#loader");
    var fill = $("#loaderFill");
    if (!el) return;

    var pct = 0;
    var timer = setInterval(function () {
      pct = Math.min(pct + Math.random() * 18, 92);
      if (fill) fill.style.width = pct + "%";
    }, 130);

    function finish() {
      clearInterval(timer);
      if (fill) fill.style.width = "100%";
      setTimeout(function () {
        el.classList.add("is-done");
        document.body.classList.remove("is-locked");
        startHero();
      }, 260);
    }

    document.body.classList.add("is-locked");
    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish);
    // never hold the page hostage to a slow video
    setTimeout(finish, 3200);
  })();

  /* ---------------- hero headline ---------------- */
  var heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;

    var words = $$(".hero .reveal-word > span");
    if (reduced || typeof gsap === "undefined") {
      words.forEach(function (w) { w.style.transform = "none"; });
      $$(".hero__kicker, .hero__sub, .hero__actions, .hero__stats, .float-card, .hero__badge")
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
      .from(".float-card", { y: 44, opacity: 0, scale: .95, duration: 1, stagger: .12 }, "-=1.1")
      .from(".hero__badge", { scale: .6, opacity: 0, duration: .7, ease: "back.out(1.7)" }, "-=.45");
  }

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

  /* ---------------- hero card parallax ---------------- */
  (function heroParallax() {
    if (reduced || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    var layers = $$(".hero [data-depth]");
    if (!layers.length) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, raf = null;

    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5);
      ty = (e.clientY / window.innerHeight - 0.5);
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });

    function loop() {
      cx += (tx - cx) * 0.07;
      cy += (ty - cy) * 0.07;
      layers.forEach(function (l) {
        var d = parseFloat(l.dataset.depth) || 20;
        l.style.transform =
          "translate3d(" + (-cx * d) + "px," + (-cy * d * 0.7) + "px,0) " +
          "rotateY(" + (-cx * d * 0.1) + "deg) rotateX(" + (cy * d * 0.08) + "deg)";
      });
      if (Math.abs(tx - cx) > 0.001 || Math.abs(ty - cy) > 0.001) {
        raf = requestAnimationFrame(loop);
      } else { raf = null; }
    }
  })();

  /* ---------------- gallery filter ---------------- */
  (function filters() {
    var chips = $$(".chip");
    var cakes = $$("#gallery .cake");
    if (!chips.length) return;

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.dataset.filter;
        chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });

        cakes.forEach(function (cake) {
          var show = f === "all" || cake.dataset.cat === f;
          cake.classList.toggle("is-hidden", !show);
          if (show && !reduced && typeof gsap !== "undefined") {
            gsap.fromTo(cake, { opacity: 0, y: 18, scale: .97 },
              { opacity: 1, y: 0, scale: 1, duration: .5, ease: "power2.out", clearProps: "transform" });
          }
        });
      });
    });
  })();

  /* ---------------- lightbox ---------------- */
  (function lightbox() {
    var box = $("#lightbox");
    var img = $("#lbImg");
    var cap = $("#lbCap");
    if (!box || !img) return;

    var idx = 0;
    var lastFocus = null;

    function visible() {
      return $$("#gallery .cake").filter(function (c) { return !c.classList.contains("is-hidden"); });
    }

    function show(i) {
      var list = visible();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var fig = list[idx];
      var src = $("img", fig);
      img.src = src.src;
      img.alt = src.alt;
      var strong = $("figcaption strong", fig);
      var span = $("figcaption span", fig);
      cap.innerHTML = "";
      if (strong) cap.appendChild(document.createTextNode(strong.textContent));
      if (span) {
        var s = document.createElement("span");
        s.textContent = span.textContent;
        cap.appendChild(s);
      }
    }

    function open(i) {
      lastFocus = document.activeElement;
      show(i);
      box.classList.add("is-open");
      document.body.classList.add("is-locked");
      $("#lbClose").focus();
    }

    function close() {
      box.classList.remove("is-open");
      document.body.classList.remove("is-locked");
      if (lastFocus) lastFocus.focus();
    }

    $$("#gallery .cake").forEach(function (fig) {
      function trigger() { open(visible().indexOf(fig)); }
      fig.addEventListener("click", trigger);
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); trigger(); }
      });
    });

    $("#lbClose").addEventListener("click", close);
    $("#lbPrev").addEventListener("click", function () { show(idx - 1); });
    $("#lbNext").addEventListener("click", function () { show(idx + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });

    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
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

  /* keep the hero video from burning cycles off-screen */
  (function heroVideo() {
    var v = $("#heroVid");
    if (!v || !("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) v.play().catch(function () {});
      else v.pause();
    }, { threshold: 0 }).observe(v);
  })();

  /* ---------------- misc ---------------- */
  var yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

})();
