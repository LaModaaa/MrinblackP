// Ароматы с ценами из Google Таблицы (или products.csv): цены для общего каталога и подбор аромата.
// Отдельный блок «Хиты» с сайта убран – сетка рисуется, только если на странице есть #grid.
(function () {
  var cfg = window.SHOP_CONFIG || {};
  var SHEET_URL = (cfg.sheetCsvUrl || "").trim();
  var CACHE_KEY = "mib-parfum-catalog-v1";
  var grid = document.getElementById("grid");
  var tabs = document.getElementById("tabs");
  var chips = document.getElementById("chips");
  var search = document.getElementById("search");
  var items = [];
  var section = "Все", sex = "Все", query = "", showAll = false;
  var FIRST = 12; // сначала 12 ароматов, остальные по кнопке

  function shown() {
    return items.filter(function (it) {
      return (section === "Все" || it.section === section) && (sex === "Все" || it.sex === sex) &&
        (!query || (it.brand + " " + it.title + " " + it.type + " " + it.notes + " " + it.family).toLowerCase().indexOf(query) !== -1);
    });
  }
  function visible() {
    var list = shown();
    return query || showAll ? list : list.slice(0, FIRST);
  }

  // CSV: кавычки, запятые и переносы строк внутри ячеек
  function parseCSV(text) {
    text = text.replace(/^﻿/, "");
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); rows.push(row); row = []; cell = "";
      } else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim() !== ""; }); });
  }

  // Столбцы ищем по названию – порядок в таблице не важен
  var COLUMNS = {
    section: ["раздел"], brand: ["бренд"], title: ["название", "аромат"], type: ["тип"], sex: ["для кого", "пол"], family: ["характер", "семейство"], notes: ["ноты"],
    vol: ["объём", "объем"], price: ["цена", "стоимость"], photo: ["фото", "картинка"], badge: ["метка", "значок"], stock: ["в наличии", "наличие"],
  };
  function toItems(rows) {
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    var idx = {};
    Object.keys(COLUMNS).forEach(function (k) { idx[k] = head.findIndex(function (h) { return COLUMNS[k].indexOf(h) !== -1; }); });
    if (idx.title === -1) throw new Error("В таблице нет столбца «Название»");
    var get = function (r, k) { return idx[k] === -1 ? "" : (r[idx[k]] || "").trim(); };
    return rows.slice(1).map(function (r) {
      var it = {
        section: get(r, "section") || "Под заказ", brand: get(r, "brand"), title: get(r, "title"), type: get(r, "type"),
        sex: get(r, "sex"), family: get(r, "family"), notes: get(r, "notes"), vol: get(r, "vol"), badge: get(r, "badge"), photo: get(r, "photo"),
        price: Number(get(r, "price").replace(/[^\d,.]/g, "").replace(",", ".")) || 0,
        inStock: !/^(нет|-|0|no)$/i.test(get(r, "stock")),
      };
      // Это имя попадает в корзину и в текст заказа – по нему же сверяем цены
      it.name = [it.brand, it.title].filter(Boolean).join(" ") + (it.vol ? " · " + it.vol : "") + (it.section === "Разлив" ? " (разлив)" : "");
      return it;
    }).filter(function (it) { return it.title && it.inStock; });
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function buttons(box, values, current, onPick) {
    box.innerHTML = "";
    values.forEach(function (v) {
      var b = el("button", "chip", v);
      b.type = "button";
      b.setAttribute("aria-pressed", String(v === current));
      b.onclick = function () { onPick(v); showAll = false; render(); };
      box.appendChild(b);
    });
  }
  function uniq(key) {
    var out = ["Все"];
    items.forEach(function (it) { if (it[key] && out.indexOf(it[key]) === -1) out.push(it[key]); });
    return out;
  }

  function buyBox(it) {
    var box = el("div", "buy");
    var q = window.Cart ? Cart.qty(it.name) : 0;
    if (!q) {
      var b = el("button", "btn small", it.section === "Разлив" ? "В корзину" : "Заказать");
      b.type = "button";
      b.onclick = function () { document.dispatchEvent(new CustomEvent("fx:spray", { detail: b })); Cart.add(it); };
      box.appendChild(b);
    } else {
      var s = el("div", "stepper");
      var minus = el("button", "", "−"), plus = el("button", "", "+");
      minus.type = plus.type = "button";
      minus.setAttribute("aria-label", "Меньше");
      plus.setAttribute("aria-label", "Больше");
      minus.onclick = function () { Cart.change(it.name, -1); };
      plus.onclick = function () { document.dispatchEvent(new CustomEvent("fx:spray", { detail: plus })); Cart.change(it.name, 1); };
      s.append(minus, el("span", "", q + " шт"), plus);
      box.appendChild(s);
    }
    return box;
  }

  function render() {
    if (!grid) return; // блока с сеткой на странице нет – таблица нужна только ради цен и подбора
    buttons(tabs, uniq("section"), section, function (v) { section = v; });
    buttons(chips, uniq("sex"), sex, function (v) { sex = v; });
    grid.innerHTML = "";
    var all = shown(), list = visible();
    if (!list.length) {
      var p = el("p", "empty", "Такого аромата пока нет в каталоге – напишите нам, привезём под заказ.");
      grid.appendChild(p);
      return;
    }
    list.forEach(function (it, i) {
      var card = el("article", "card");
      card.style.setProperty("--i", i % 8);
      var photo = el("div", "photo");
      if (it.photo) {
        var img = document.createElement("img");
        img.src = it.photo; img.alt = it.brand + " " + it.title; img.loading = "lazy";
        img.onerror = function () { photo.classList.add("noimg"); img.remove(); };
        photo.appendChild(img);
      } else photo.classList.add("noimg");
      photo.appendChild(el("span", "tag" + (it.section === "Разлив" ? " pour" : ""), it.section === "Разлив" ? "Разлив" : "Флакон"));
      if (it.badge) photo.appendChild(el("span", "badge", it.badge));
      var body = el("div", "body");
      body.appendChild(el("span", "brand", it.brand));
      body.appendChild(el("h3", "name", it.title));
      if (it.notes) body.appendChild(el("p", "notes", it.notes));
      body.appendChild(el("p", "meta", [it.type, it.vol].filter(Boolean).join(" · ")));
      var foot = el("div", "foot");
      foot.append(el("div", "price" + (it.price ? "" : " ask"), it.price ? CartCore.money(it.price) : "Цена по запросу"), buyBox(it));
      body.appendChild(foot);
      card.append(photo, body);
      grid.appendChild(card);
    });
    if (list.length < all.length) {
      var more = el("button", "btn ghost more", "Показать все " + all.length);
      more.type = "button";
      more.onclick = function () { showAll = true; render(); };
      grid.appendChild(more);
    }
    document.dispatchEvent(new Event("catalog:render"));
  }

  document.addEventListener("cart:change", function () {
    if (!grid) return;
    var cards = grid.querySelectorAll(".card"), list = visible();
    cards.forEach(function (c, i) { if (list[i]) c.querySelector(".buy").replaceWith(buyBox(list[i])); });
  });
  if (search) search.addEventListener("input", function () { query = search.value.trim().toLowerCase(); render(); });
  window.CatalogBuyBox = buyBox; // та же кнопка для подбора аромата
  // Фильтр по разделу из внешних кнопок (блок «Два формата»)
  window.CatalogShow = function (v) { section = v; showAll = false; render(); };
  function ready() { window.CATALOG_ITEMS = items; document.dispatchEvent(new Event("catalog:ready")); }

  function load() {
    var url = SHEET_URL || "products.csv";
    fetch(url + (url.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (text) {
        var list = toItems(parseCSV(text));
        if (JSON.stringify(list) !== JSON.stringify(items)) { items = list; render(); ready(); }
        try { localStorage.setItem(CACHE_KEY, JSON.stringify(list)); } catch (e) {}
      })
      .catch(function () {
        if (items.length) return;
        var cached = null;
        try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); } catch (e) {}
        if (cached && cached.length) { items = cached; render(); ready(); }
        else if (grid) grid.innerHTML = '<p class="empty">Не удалось загрузить каталог. Напишите нам в Telegram – подскажем, что есть.</p>';
      });
  }
  load();
  // Если подключена таблица – раз в минуту проверяем, не поменяли ли цены
  if (SHEET_URL) setInterval(function () { if (!document.hidden) load(); }, 60000);
})();
