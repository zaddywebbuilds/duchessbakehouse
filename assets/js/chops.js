/* Duchess Bakehouse - small chops tray builder.
   Quantities are multiplied by the rates already published in the menu and
   nothing else: no discounts, no guests-to-pieces guesswork, no stock or
   delivery promises. The kitchen still sizes the tray and quotes delivery. */
(function () {
  "use strict";

  var cfg = window.DUCHESS || {};
  var root = document.getElementById("chops");
  var bundle = document.getElementById("bundle");
  if (!root || !bundle) return;

  /* Scoped to #chops deliberately: .tray is also used by the cake size guide
     further down the page, and those are not orderable line items. */
  var rows = Array.prototype.slice.call(root.querySelectorAll("[data-item][data-price]"));
  if (!rows.length) return;

  var list = document.getElementById("bundleList");
  var empty = document.getElementById("bundleEmpty");
  var totalEl = document.getElementById("bundleTotal");
  var send = document.getElementById("bundleSend");
  var guests = document.getElementById("bundleGuests");
  var when = document.getElementById("bundleDate");
  var wantCake = document.getElementById("bundleCake");
  var cakeNote = document.getElementById("bundleCakeNote");

  function naira(n) {
    try { return "₦" + n.toLocaleString("en-NG"); }
    catch (e) { return "₦" + String(n); }
  }

  function slug(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  /* ---- quantity steppers ---- */
  var items = rows.map(function (row) {
    var name = row.dataset.item;

    var wrap = document.createElement("div");
    wrap.className = "qty";

    var minus = document.createElement("button");
    minus.type = "button";
    minus.className = "qty__btn";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "One less " + name);

    var input = document.createElement("input");
    input.type = "number";
    input.className = "qty__input";
    input.id = "qty-" + slug(name);
    input.min = "0";
    input.max = "999";
    input.value = "0";
    input.inputMode = "numeric";
    input.setAttribute("aria-label", name + " quantity");

    var plus = document.createElement("button");
    plus.type = "button";
    plus.className = "qty__btn";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "One more " + name);

    function step(by) {
      input.value = Math.max(0, Math.min(999, (parseInt(input.value, 10) || 0) + by));
      render();
    }
    minus.addEventListener("click", function () { step(-1); });
    plus.addEventListener("click", function () { step(1); });
    input.addEventListener("input", render);

    wrap.appendChild(minus);
    wrap.appendChild(input);
    wrap.appendChild(plus);
    (row.querySelector("dd") || row).appendChild(wrap);

    return {
      name: name,
      unit: row.dataset.unit || "",
      price: parseInt(row.dataset.price, 10) || 0,
      input: input
    };
  });

  function chosen() {
    return items
      .map(function (it) {
        return { name: it.name, unit: it.unit, price: it.price, qty: parseInt(it.input.value, 10) || 0 };
      })
      .filter(function (it) { return it.qty > 0; });
  }

  function waLink(picked, total) {
    var lines = ["Hi Duchess Bakehouse, I would like to order small chops.", ""];

    if (picked.length) {
      picked.forEach(function (p) {
        lines.push(p.qty + " x " + p.name + " at " + naira(p.price) + " / " + p.unit +
                   " = " + naira(p.qty * p.price));
      });
      lines.push("", "That comes to " + naira(total) + " from your published rates.");
    } else {
      lines.push("I have not picked quantities yet, please advise.");
    }

    if (guests.value) lines.push("Guests: " + guests.value);
    if (when.value) lines.push("Event date: " + when.value);
    if (wantCake.checked) lines.push("I would like a cake with this as well.");

    lines.push("", "Please confirm availability and the delivery fee for my area.");
    return "https://wa.me/" + (cfg.whatsapp || "") + "?text=" + encodeURIComponent(lines.join("\n"));
  }

  function render() {
    var picked = chosen();
    var total = 0;

    list.innerHTML = "";
    picked.forEach(function (p) {
      var line = p.qty * p.price;
      total += line;

      var li = document.createElement("li");
      var label = document.createElement("span");
      label.textContent = p.qty + " × " + p.name;
      var amount = document.createElement("b");
      amount.textContent = naira(line);
      li.appendChild(label);
      li.appendChild(amount);
      list.appendChild(li);
    });

    empty.hidden = picked.length > 0;
    totalEl.textContent = naira(total);
    cakeNote.hidden = !wantCake.checked;
    send.href = waLink(picked, total);
  }

  guests.addEventListener("input", render);
  when.addEventListener("change", render);
  wantCake.addEventListener("change", render);

  /* Only reveal the builder once it can actually work. */
  bundle.hidden = false;
  render();
})();
