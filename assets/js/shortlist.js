/* Duchess Bakehouse - shortlist.
   People do not pick one cake. They pick three and ask "can you do something
   like these?", so let them collect designs and send the set in one message.

   Everything here is built from the .cake figures on whatever page it runs on,
   so it works on the homepage and on every generated collection page without
   needing any markup of its own.

   Saved designs live in localStorage. That is a per-viewer convenience: it
   never reaches us, it does not sync between devices, and it can come back
   empty in a private window, so every read and write is guarded and the page
   works perfectly well when it fails. */
(function () {
  "use strict";

  var cfg = window.DUCHESS || {};
  var cakes = Array.prototype.slice.call(document.querySelectorAll(".cake[data-slug]"));
  if (!cakes.length) return;

  var KEY = "duchess.shortlist";
  var HEART = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3s-6.6-4.3-6.6-8.9a3.4 3.4 0 0 1 6.6-1.4 3.4 3.4 0 0 1 6.6 1.4c0 4.6-6.6 8.9-6.6 8.9z"/></svg>';

  /* Name and image are stored alongside the slug so the panel can render a
     design that is not on the page you happen to be looking at. */
  var saved = load();

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.filter(function (it) { return it && typeof it.slug === "string"; });
    } catch (e) { return []; }
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* convenience only */ }
  }

  function has(slug) {
    for (var i = 0; i < saved.length; i++) if (saved[i].slug === slug) return true;
    return false;
  }

  function entryFor(fig) {
    var img = fig.querySelector("img");
    var strong = fig.querySelector("figcaption strong");
    return {
      slug: fig.dataset.slug,
      name: strong ? strong.textContent.trim() : fig.dataset.slug,
      /* .src rather than getAttribute, so the absolute URL survives being
         rendered on a page at a different depth. */
      img: img ? img.src : ""
    };
  }

  function toggle(entry) {
    if (has(entry.slug)) {
      saved = saved.filter(function (it) { return it.slug !== entry.slug; });
    } else {
      saved.push(entry);
      if (window.duchessTrack) window.duchessTrack("shortlist_add", { design: entry.slug });
    }
    persist();
    sync();
  }

  /* ---------------- controls on each card ---------------- */
  var cardButtons = [];

  cakes.forEach(function (fig) {
    var entry = entryFor(fig);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cake__save";
    btn.innerHTML = HEART;
    btn.addEventListener("click", function (e) {
      e.stopPropagation();          /* the card itself opens the dialog */
      e.preventDefault();
      toggle(entryFor(fig));
    });

    fig.appendChild(btn);
    cardButtons.push({ slug: entry.slug, name: entry.name, btn: btn });
  });

  /* ---------------- control inside the product dialog ---------------- */
  var box = document.getElementById("lightbox");
  var dialogBtn = null;

  if (box) {
    var actions = box.querySelector(".lb-detail__actions");
    if (actions) {
      dialogBtn = document.createElement("button");
      dialogBtn.type = "button";
      dialogBtn.className = "btn btn--ghost lb-save";
      dialogBtn.addEventListener("click", function () {
        var slug = box.dataset.slug;
        if (!slug) return;
        for (var i = 0; i < cakes.length; i++) {
          if (cakes[i].dataset.slug === slug) { toggle(entryFor(cakes[i])); return; }
        }
      });
      actions.insertBefore(dialogBtn, actions.firstChild);
    }
  }

  document.addEventListener("duchess:cakeshown", syncDialog);

  /* ---------------- the panel ---------------- */
  var bar = document.createElement("button");
  bar.type = "button";
  bar.className = "sl-bar";
  bar.setAttribute("aria-haspopup", "dialog");

  var panel = document.createElement("div");
  panel.className = "sl-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Your shortlist");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML =
    '<div class="sl-panel__inner">' +
      '<div class="sl-panel__head">' +
        '<h2>Your shortlist</h2>' +
        '<button type="button" class="sl-close" aria-label="Close shortlist">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button>' +
      '</div>' +
      '<ul class="sl-list"></ul>' +
      '<p class="sl-empty">Nothing saved yet. Tap the heart on any cake to keep it here.</p>' +
      '<div class="sl-foot">' +
        '<a class="btn btn--berry" target="_blank" rel="noopener">Send shortlist on WhatsApp</a>' +
        '<button type="button" class="btn btn--ghost sl-clear">Clear</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(bar);
  document.body.appendChild(panel);

  var list = panel.querySelector(".sl-list");
  var empty = panel.querySelector(".sl-empty");
  var sendLink = panel.querySelector(".sl-foot a");
  var lastFocus = null;

  function message() {
    var lines = ["Hi Duchess Bakehouse, these are the designs I like:", ""];
    saved.forEach(function (it, i) {
      lines.push((i + 1) + ". " + it.name + " (ref: " + it.slug + ")");
    });
    lines.push("", "Could you tell me what something like these would cost?");
    return "https://wa.me/" + (cfg.whatsapp || "") + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function openPanel() {
    lastFocus = document.activeElement;
    panel.classList.add("is-open");
    panel.removeAttribute("aria-hidden");
    document.body.classList.add("is-locked");
    void panel.offsetWidth;        /* flush style before moving focus in */
    panel.querySelector(".sl-close").focus();
  }

  function closePanel() {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  bar.addEventListener("click", openPanel);
  panel.querySelector(".sl-close").addEventListener("click", closePanel);
  panel.addEventListener("click", function (e) { if (e.target === panel) closePanel(); });
  panel.querySelector(".sl-clear").addEventListener("click", function () {
    saved = [];
    persist();
    sync();
  });

  var FOCUSABLE = 'a[href], button:not([disabled])';
  document.addEventListener("keydown", function (e) {
    if (!panel.classList.contains("is-open")) return;
    if (e.key === "Escape") { closePanel(); return; }
    if (e.key !== "Tab") return;
    var f = Array.prototype.slice.call(panel.querySelectorAll(FOCUSABLE))
      .filter(function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------------- rendering ---------------- */
  function syncDialog() {
    if (!dialogBtn || !box) return;
    var on = has(box.dataset.slug || "");
    dialogBtn.textContent = on ? "Saved to shortlist" : "Save to shortlist";
    dialogBtn.setAttribute("aria-pressed", String(on));
  }

  function sync() {
    cardButtons.forEach(function (c) {
      var on = has(c.slug);
      c.btn.classList.toggle("is-on", on);
      c.btn.setAttribute("aria-pressed", String(on));
      c.btn.setAttribute("aria-label", (on ? "Remove " : "Save ") + c.name + " to your shortlist");
    });

    bar.textContent = "Shortlist " + saved.length;
    bar.hidden = saved.length === 0;
    bar.setAttribute("aria-label", "Open your shortlist, " + saved.length + " saved");

    list.innerHTML = "";
    saved.forEach(function (it) {
      var li = document.createElement("li");

      var open = document.createElement("button");
      open.type = "button";
      open.className = "sl-item";
      var thumb = document.createElement("img");
      thumb.src = it.img;
      thumb.alt = "";
      var nm = document.createElement("span");
      nm.textContent = it.name;
      open.appendChild(thumb);
      open.appendChild(nm);
      open.addEventListener("click", function () {
        closePanel();
        document.dispatchEvent(new CustomEvent("duchess:opencake", { detail: { slug: it.slug } }));
      });

      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "sl-remove";
      rm.textContent = "Remove";
      rm.setAttribute("aria-label", "Remove " + it.name + " from your shortlist");
      rm.addEventListener("click", function () { toggle(it); });

      li.appendChild(open);
      li.appendChild(rm);
      list.appendChild(li);
    });

    empty.hidden = saved.length > 0;
    sendLink.hidden = saved.length === 0;
    sendLink.href = message();

    syncDialog();
    if (saved.length === 0 && panel.classList.contains("is-open")) {
      /* nothing left to look at */
      closePanel();
    }
  }

  sync();
})();
