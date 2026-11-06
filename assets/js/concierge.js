/* Duchess Bakehouse - cake concierge.
   A guided brief, not a checkout. It never quotes a price, holds a date or
   confirms an order: the last step hands the collected answers to WhatsApp and
   stops there. Every option below comes from catalogue.js or from the gallery
   itself, so nothing here invents a product the bakery does not offer. */
(function () {
  "use strict";

  var cfg = window.DUCHESS || {};
  var wiz = document.getElementById("wiz");
  if (!wiz) return;

  var form = document.getElementById("wizForm");
  var panels = Array.prototype.slice.call(wiz.querySelectorAll(".wiz__panel"));
  var steps = Array.prototype.slice.call(wiz.querySelectorAll("#wizSteps li"));
  var back = document.getElementById("wizBack");
  var next = document.getElementById("wizNext");
  var send = document.getElementById("wizSend");
  var live = document.getElementById("wizLive");
  var review = document.getElementById("wizReview");

  var LAST = panels.length;
  var current = 1;
  var STORE = "duchess.concierge";

  function el(id) { return document.getElementById(id); }
  function picked(name) {
    var n = form.querySelector('input[name="' + name + '"]:checked');
    return n ? n.value : "";
  }

  /* ---------------- choices ---------------- */
  function fill(select, values, placeholder) {
    if (!select) return;
    select.innerHTML = "";
    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = placeholder;
    select.appendChild(blank);
    values.forEach(function (v) {
      var o = document.createElement("option");
      o.value = typeof v === "string" ? v : v.value;
      o.textContent = typeof v === "string" ? v : v.label;
      select.appendChild(o);
    });
  }

  fill(el("wizOccasion"), cfg.occasions || [], "Choose an occasion");
  fill(el("wizArea"), cfg.areas || [], "Choose an area");
  fill(el("wizSize"), (cfg.sizes || []).map(function (s) {
    return { value: s.label, label: s.label + " - " + s.serves };
  }), "Choose a size");

  /* Read the design list off the gallery so it can never drift from the cakes
     actually on the page. */
  fill(el("wizDesign"), Array.prototype.slice
    .call(document.querySelectorAll("#gallery .cake"))
    .map(function (f) {
      var strong = f.querySelector("figcaption strong");
      return { value: f.dataset.slug || "", label: strong ? strong.textContent.trim() : f.dataset.slug };
    })
    .filter(function (d) { return d.value; }), "Choose a design");

  /* ---------------- earliest date ---------------- */
  var minDays = typeof cfg.minNoticeDays === "number" ? cfg.minNoticeDays : 2;
  var dateInput = el("wizDate");
  var earliest = new Date();
  earliest.setHours(0, 0, 0, 0);
  earliest.setDate(earliest.getDate() + minDays);
  function iso(d) {
    var m = String(d.getMonth() + 1), day = String(d.getDate());
    return d.getFullYear() + "-" + (m.length < 2 ? "0" + m : m) + "-" + (day.length < 2 ? "0" + day : day);
  }
  if (dateInput) dateInput.min = iso(earliest);
  if (el("wizDateHint")) el("wizDateHint").textContent = cfg.leadNote || "";
  if (el("wizLongNotice")) el("wizLongNotice").textContent = cfg.longNoticeNote || "";

  /* ---------------- conditional fields ---------------- */
  function syncConditionals() {
    var ownIdea = picked("source") === "own";
    el("wizDesignWrap").hidden = ownIdea;
    el("wizBriefWrap").hidden = !ownIdea;

    var pickup = picked("fulfilment") === "Pickup";
    el("wizAreaWrap").hidden = pickup;
    el("wizAddressWrap").hidden = pickup;

    el("wizRefNote").hidden = !el("wizHasRef").checked;

    /* The published lead time is longer for weddings and December, so say so
       while the date is being picked rather than after the brief is sent. */
    var longNotice = el("wizLongNotice");
    if (longNotice) {
      var dv = el("wizDate").value;
      longNotice.hidden = !(el("wizOccasion").value === "Wedding" || (dv && dv.slice(5, 7) === "12"));
    }
  }

  /* ---------------- validation ---------------- */
  function setError(errId, msg, input) {
    var p = el(errId);
    if (p) p.textContent = msg || "";
    if (input) {
      if (msg) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
    return !msg;
  }

  function validate(step) {
    var ok = true;

    if (step === 1) {
      var o = el("wizOccasion");
      ok = setError("wizErrOccasion", o.value ? "" : "Pick an occasion so we know where to start.", o) && ok;
    }

    if (step === 2) {
      if (picked("source") === "own") {
        var b = el("wizBrief");
        ok = setError("wizErrBrief", b.value.trim() ? "" : "Tell us roughly what you have in mind.", b) && ok;
        setError("wizErrDesign", "", el("wizDesign"));
      } else {
        var d = el("wizDesign");
        ok = setError("wizErrDesign", d.value ? "" : "Choose a design, or switch to your own idea.", d) && ok;
        setError("wizErrBrief", "", el("wizBrief"));
      }
    }

    if (step === 3) {
      var s = el("wizSize");
      ok = setError("wizErrSize", s.value ? "" : "Pick a size. We can still change it when we talk.", s) && ok;
    }

    if (step === 4) {
      var dt = el("wizDate");
      var msg = "";
      if (!dt.value) msg = "We need a date to check the diary.";
      else if (dt.value < dt.min) msg = "We need at least " + minDays + " days. The earliest is " + dt.min + ".";
      ok = setError("wizErrDate", msg, dt) && ok;

      var a = el("wizArea");
      var needsArea = picked("fulfilment") !== "Pickup" && !a.value;
      ok = setError("wizErrArea", needsArea ? "Which side of Lagos are we delivering to?" : "", a) && ok;
    }

    if (step === 5) {
      var n = el("wizName");
      ok = setError("wizErrName", n.value.trim() ? "" : "What should we call you?", n) && ok;
      var ph = el("wizPhone");
      var digits = ph.value.replace(/\D/g, "");
      ok = setError("wizErrPhone", digits.length >= 7 ? "" : "Add a number we can reach you on.", ph) && ok;
    }

    return ok;
  }

  /* ---------------- the brief itself ---------------- */
  function answers() {
    var own = picked("source") === "own";
    var pickup = picked("fulfilment") === "Pickup";
    var sel = el("wizDesign");
    var chosen = sel.options[sel.selectedIndex];
    var rows = [];

    rows.push(["Occasion", el("wizOccasion").value, 1]);
    rows.push(["Design", own
      ? el("wizBrief").value.trim()
      : (chosen ? chosen.textContent + " (ref: " + sel.value + ")" : ""), 2]);
    if (el("wizInscription").value.trim()) rows.push(["Message on cake", el("wizInscription").value.trim(), 2]);
    if (el("wizHasRef").checked) rows.push(["Reference photo", "Will attach in the chat", 2]);

    rows.push(["Size", el("wizSize").value, 3]);
    if (el("wizGuests").value) rows.push(["Guests", el("wizGuests").value, 3]);
    if (el("wizFlavour").value.trim()) rows.push(["Flavour", el("wizFlavour").value.trim(), 3]);

    rows.push(["Date", el("wizDate").value, 4]);
    /* Pickup is phrased as a request: the site publishes delivery across Lagos
       but says nothing about collection, so this must not read as a promise. */
    rows.push(["Fulfilment", pickup ? "Would prefer to pick up, please confirm" : "Delivery to " + el("wizArea").value, 4]);
    if (!pickup && el("wizAddress").value.trim()) rows.push(["Address", el("wizAddress").value.trim(), 4]);

    rows.push(["Name", el("wizName").value.trim(), 5]);
    rows.push(["Phone", el("wizPhone").value.trim(), 5]);
    if (el("wizNotes").value.trim()) rows.push(["Notes", el("wizNotes").value.trim(), 5]);

    return rows;
  }

  function waLink() {
    var lines = ["Hi Duchess Bakehouse, here is my cake brief.", ""];
    answers().forEach(function (r) { lines.push(r[0] + ": " + r[1]); });
    lines.push("", "Please confirm availability and send me a quote.");
    return "https://wa.me/" + (cfg.whatsapp || "") + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function renderReview() {
    review.innerHTML = "";
    answers().forEach(function (row) {
      var dt = document.createElement("dt");
      dt.textContent = row[0];

      var dd = document.createElement("dd");
      var val = document.createElement("span");
      val.textContent = row[1];
      var edit = document.createElement("button");
      edit.type = "button";
      edit.className = "wiz__edit";
      edit.textContent = "Edit";
      edit.setAttribute("aria-label", "Edit " + row[0].toLowerCase());
      edit.addEventListener("click", function () { go(row[2]); });

      dd.appendChild(val);
      dd.appendChild(edit);
      review.appendChild(dt);
      review.appendChild(dd);
    });
    send.href = waLink();
  }

  /* ---------------- navigation ---------------- */
  function go(step) {
    current = Math.min(Math.max(step, 1), LAST);

    panels.forEach(function (p) { p.hidden = Number(p.dataset.panel) !== current; });
    steps.forEach(function (li) {
      var n = Number(li.dataset.step);
      li.classList.toggle("is-done", n < current);
      li.classList.toggle("is-current", n === current);
      if (n === current) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });

    back.hidden = current === 1;
    next.hidden = current === LAST;
    send.hidden = current !== LAST;

    if (current === LAST) renderReview();

    var h = panels[current - 1].querySelector(".wiz__h");
    if (h) h.focus();
    if (live) live.textContent = "Step " + current + " of " + LAST;
    save();
  }

  var tracked = {};
  function trackOnce(name) {
    if (tracked[name] || !window.duchessTrack) return;
    tracked[name] = true;
    window.duchessTrack(name, {});
  }

  next.addEventListener("click", function () {
    if (!validate(current)) {
      var bad = panels[current - 1].querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    trackOnce("concierge_started");
    /* "brief ready", not "complete": reaching the review step means the
       customer has something to send, not that an order exists. */
    if (current + 1 === LAST) trackOnce("concierge_brief_ready");
    go(current + 1);
  });
  back.addEventListener("click", function () { go(current - 1); });
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  /* ---------------- draft ---------------- */
  function save() {
    try {
      var d = {};
      Array.prototype.slice.call(form.elements).forEach(function (f) {
        if (!f.name) return;
        if (f.type === "radio") { if (f.checked) d[f.name] = f.value; }
        else if (f.type === "checkbox") d[f.name] = f.checked;
        else d[f.name] = f.value;
      });
      sessionStorage.setItem(STORE, JSON.stringify(d));
    } catch (e) { /* a remembered draft is a convenience, never a requirement */ }
  }

  function restore() {
    var d = null;
    try { d = JSON.parse(sessionStorage.getItem(STORE) || "null"); } catch (e) { return; }
    if (!d) return;
    Array.prototype.slice.call(form.elements).forEach(function (f) {
      if (!f.name || !(f.name in d)) return;
      if (f.type === "radio") f.checked = d[f.name] === f.value;
      else if (f.type === "checkbox") f.checked = !!d[f.name];
      else f.value = d[f.name];
    });
  }

  /* Arriving from a design's detail view preselects that design. */
  function prefillFromUrl() {
    var slug = null;
    try { slug = new URL(window.location.href).searchParams.get("cake"); } catch (e) { return; }
    if (!slug) return;
    var sel = el("wizDesign");
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === slug) { sel.selectedIndex = i; return; }
    }
  }

  form.addEventListener("input", function () { syncConditionals(); save(); });
  form.addEventListener("change", function () { syncConditionals(); save(); });

  restore();
  prefillFromUrl();
  syncConditionals();

  /* Start at the top rather than dropping someone mid-form on a reload. */
  panels.forEach(function (p) { p.hidden = Number(p.dataset.panel) !== 1; });
  steps[0].classList.add("is-current");
  steps[0].setAttribute("aria-current", "step");
  back.hidden = true;
  send.hidden = true;
})();
