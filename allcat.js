// Весь ассортимент поставщика (~27 000 ароматов): бренды A–Z и поиск.
// Файл data/all.json большой, поэтому грузим его только когда покупатель дошёл до блока или начал искать.
(function () {
  var root = document.getElementById("all");
  if (!root) return;
  var PHOTO = "https://parfumoteka-opt.ru/media/photos/"; // фото берём с сайта поставщика
  var STEP = 24;
  var input = root.querySelector(".all-search input");
  var letters = root.querySelector(".letters");
  var brandBox = root.querySelector(".brand-list");
  var grid = root.querySelector(".all-grid");
  var status = root.querySelector(".all-status");
  var data = null, loading = null, list = [], shown = 0, letter = "", brand = -1, query = "";

  // --- поиск: без регистра, ё = е, русские названия популярных брендов и слов → латиница ---
  var RU = {
    "шанель": "chanel", "диор": "dior", "том форд": "tom ford", "крид": "creed", "баккара": "baccarat", "килиан": "kilian",
    "тизиана теренци": "tiziana terenzi", "тизиана": "tiziana", "ксерджофф": "xerjoff", "монталь": "montale", "латтафа": "lattafa",
    "ив сен лоран": "yves saint laurent", "армани": "armani", "гуччи": "gucci", "версаче": "versace", "прада": "prada",
    "герлен": "guerlain", "эрмес": "hermes", "гермес": "hermes", "живанши": "givenchy", "ланком": "lancome", "эррера": "herrera",
    "мейсон": "maison", "мэйсон": "maison", "марли": "marly", "инитио": "initio", "байредо": "byredo", "ле лабо": "le labo",
    "молекула": "molecule", "зелински": "zielinski", "соваж": "sauvage", "саваж": "sauvage", "тобакко": "tobacco", "табак": "tobacco",
    "ваниль": "vanill", "черри": "cherry", "вишня": "cherry", "авентус": "aventus", "блю": "bleu", "жадор": "adore", "мисс": "miss",
    "коко": "coco", "шанс": "chance", "делина": "delina", "лейтон": "layton", "лэйтон": "layton", "наксос": "naxos", "кирке": "kirke",
    "уд": "oud", "роза": "rose", "блэк": "black", "блек": "black", "аль харамайн": "al haramain", "расаси": "rasasi", "аджмал": "ajmal",
    "нишан": "nishane", "аморуаж": "amouage", "амуаж": "amouage", "мансера": "mancera", "кензо": "kenzo", "бёрберри": "burberry",
    "барберри": "burberry", "лакост": "lacoste", "хуго": "hugo", "босс": "boss", "дольче": "dolce", "габбана": "gabbana",
    "валентино": "valentino", "валентина": "valentino", "джо малон": "jo malone", "нина риччи": "nina ricci", "мюглер": "mugler",
    "мугле": "mugler", "кельвин кляйн": "calvin klein", "кельвин": "calvin", "булгари": "bvlgari", "бвлгари": "bvlgari", "картье": "cartier",
    "ланвин": "lanvin", "москино": "moschino", "пако рабан": "paco rabanne", "рабан": "rabanne", "жан поль готье": "jean paul gaultier",
    "готье": "gaultier", "эскада": "escada", "хлое": "chloe", "хлоя": "chloe", "клое": "chloe", "ральф лорен": "ralph lauren",
    "селин": "celine", "опиум": "opium", "либре": "libre", "ла ви э бель": "la vie est belle",
    "эксцентрик": "escentric", "молекьюл": "molecule", "аква ди джо": "acqua di gio", "джорджио": "giorgio", "гивенчи": "givenchy",
    "томми": "tommy", "хилфигер": "hilfiger", "диесел": "diesel", "дизель": "diesel", "фрэнк": "frank",
  };
  var TR = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ы: "y", э: "e", ю: "yu", я: "ya", ь: "", ъ: "" };
  function norm(s) { return String(s).toLowerCase().replace(/ё/g, "е").replace(/[’'`´]/g, "").replace(/[^a-zа-я0-9]+/g, " ").trim(); }
  function variants(q) {
    var n = norm(q), out = [n];
    // заменяем только целые слова: «уд» → oud, но «худ» не трогаем; «валентин…» – по началу слова
    n = " " + n + " ";
    Object.keys(RU).forEach(function (ru) { n = n.split(" " + ru + " ").join(" " + RU[ru] + " "); });
    n = n.trim();
    if (n !== out[0]) out.push(n);
    var tr = n.replace(/[а-я]/g, function (c) { return TR[c] || ""; });
    if (out.indexOf(tr) === -1) out.push(tr);
    return out;
  }
  // Каждое слово запроса должно найтись в «бренд + название + тип»
  function matches(hay, q) { return q.split(" ").every(function (w) { return hay.indexOf(w) !== -1; }); }
  function find(vs) {
    var out = [];
    for (var k = 0; k < data.hay.length; k++) {
      var h = data.hay[k];
      if (vs.some(function (q) { return matches(h, q); })) out.push(k);
    }
    return out;
  }

  function load() {
    if (loading) return loading;
    status.textContent = "Загружаем весь ассортимент…";
    loading = fetch("data/all.json?v=" + (root.dataset.v || "1"))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (d) {
        d.hay = d.items.map(function (it) { return norm(d.brands[it[0]][0] + " " + it[1] + " " + it[2]); });
        data = d;
        root.querySelector("[data-all-count]").textContent = d.items.length.toLocaleString("ru-RU");
        root.querySelector("[data-brand-count]").textContent = d.brands.length.toLocaleString("ru-RU");
        renderLetters();
        status.textContent = "";
        if (query) search(); else pickLetter(letter || firstLetter());
      })
      .catch(function () { loading = null; status.textContent = "Не удалось загрузить ассортимент. Обновите страницу или напишите нам в Telegram."; });
    return loading;
  }

  function letterOf(name) { var c = name.trim().charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : /[А-ЯЁ]/.test(c) ? "А–Я" : "0–9"; }
  function firstLetter() { return "A"; }
  function renderLetters() {
    var have = {};
    data.brands.forEach(function (b) { have[letterOf(b[0])] = 1; });
    letters.innerHTML = "";
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").concat(["А–Я", "0–9"]).forEach(function (l) {
      if (!have[l]) return;
      var b = document.createElement("button");
      b.type = "button"; b.textContent = l; b.className = "letter";
      b.setAttribute("aria-pressed", String(l === letter));
      b.onclick = function () { input.value = ""; query = ""; pickLetter(l); };
      letters.appendChild(b);
    });
  }
  function pickLetter(l) {
    letter = l; brand = -1;
    [].forEach.call(letters.children, function (b) { b.setAttribute("aria-pressed", String(b.textContent === l)); });
    brandBox.innerHTML = "";
    data.brands.forEach(function (b, i) {
      if (letterOf(b[0]) !== l) return;
      var btn = document.createElement("button");
      btn.type = "button"; btn.className = "brand-btn";
      btn.innerHTML = "<span></span><small></small>";
      btn.firstChild.textContent = b[0];
      btn.lastChild.textContent = b[1];
      btn.onclick = function () { pickBrand(i, btn); };
      brandBox.appendChild(btn);
    });
    brandBox.hidden = false;
    list = []; grid.innerHTML = "";
    status.textContent = "Выберите бренд – или найдите аромат через поиск.";
  }
  function pickBrand(i, btn) {
    brand = i;
    [].forEach.call(brandBox.children, function (b) { b.classList.toggle("on", b === btn); });
    list = [];
    data.items.forEach(function (it, k) { if (it[0] === i) list.push(k); });
    list.sort(function (a, b) { return hasPhoto(b) - hasPhoto(a) || a - b; }); // сначала ароматы с фото
    status.textContent = data.brands[i][0] + " – " + list.length + " " + plural(list.length);
    show(true);
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function search() {
    if (!data) { load(); return; }
    var vs = variants(query);
    if (!vs[0]) { pickLetter(letter || firstLetter()); return; }
    brandBox.hidden = true;
    [].forEach.call(letters.children, function (b) { b.setAttribute("aria-pressed", "false"); });
    list = find(vs);
    // Ничего не нашли – пробуем без окончаний: «валентина» → «valenti» найдёт Valentino
    if (!list.length) list = find(vs.map(function (q) { return q.split(" ").map(function (w) { return w.length > 5 ? w.slice(0, w.length - 2) : w; }).join(" "); }));
    // выше те, где запрос совпал с началом бренда или названия аромата («валентина» → сначала Valentino, а не Mario Valentino)
    var w0 = vs[vs.length - 1].split(" ")[0].slice(0, 5);
    function rank(k) {
      var it = data.items[k];
      return (norm(data.brands[it[0]][0]).indexOf(w0) === 0 ? 2 : 0) + (norm(it[1]).indexOf(w0) === 0 ? 1 : 0);
    }
    list.sort(function (a, b) { return rank(b) - rank(a) || hasPhoto(b) - hasPhoto(a) || a - b; });
    status.textContent = list.length ? "Нашли " + list.length + " " + plural(list.length) : "Ничего не нашли. Напишите нам название – проверим у поставщиков.";
    show(true);
  }
  function plural(n) { var m = n % 10, c = n % 100; return m === 1 && c !== 11 ? "аромат" : m >= 2 && m <= 4 && (c < 10 || c >= 20) ? "аромата" : "ароматов"; }

  function hasPhoto(k) { return data.items[k][4] ? 1 : 0; }

  // Фото из Google Таблицы: Шухрат может вписать свою ссылку для любого аромата (бренд + название)
  function sheetPhoto(b, title) {
    var key = (b + "|" + title).toLowerCase();
    var hit = (window.CATALOG_ITEMS || []).find(function (x) { return x.photo && (x.brand + "|" + x.title).toLowerCase() === key; });
    return hit ? hit.photo : "";
  }

  // У ~10 000 ароматов у поставщика нет фото – рисуем аккуратный флакон с этикеткой вместо пустого места.
  // Форма и цвет флакона зависят от названия, поэтому соседние карточки выглядят по-разному.
  var TINTS = [["#e9c58a", "#b98236"], ["#e7b3a8", "#a8574a"], ["#cfc6b6", "#6f6658"], ["#b9d3cf", "#4f7f79"], ["#d8c48a", "#8a7432"], ["#c9a3c4", "#6e4767"]];
  var NS = "http://www.w3.org/2000/svg";
  function svgEl(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(function (a) { e.setAttribute(a, attrs[a]); });
    if (text) e.textContent = text;
    return e;
  }
  function bottle(ph, b, title) {
    var h = 0;
    for (var i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
    var t = TINTS[h % TINTS.length], shape = h % 3, id = "g" + h;
    var svg = svgEl("svg", { viewBox: "0 0 200 240", class: "bottle-ph", "aria-hidden": "true" });
    var defs = svgEl("defs", {}), gr = svgEl("linearGradient", { id: id, x1: "0", x2: "1" });
    gr.append(svgEl("stop", { offset: "0", "stop-color": t[0] }), svgEl("stop", { offset: "1", "stop-color": t[1] }));
    defs.appendChild(gr); svg.appendChild(defs);
    var body = shape === 0 ? svgEl("rect", { x: 52, y: 78, width: 96, height: 140, rx: 14 })
      : shape === 1 ? svgEl("ellipse", { cx: 100, cy: 152, rx: 62, ry: 66 })
      : svgEl("rect", { x: 40, y: 92, width: 120, height: 120, rx: 22 });
    body.setAttribute("fill", "url(#" + id + ")");
    body.setAttribute("stroke", "rgba(0,0,0,.18)");
    svg.append(
      svgEl("rect", { x: 78, y: 22, width: 44, height: 34, rx: 5, fill: "#1a1612" }),
      svgEl("rect", { x: 88, y: 56, width: 24, height: 26, fill: "#c9a35e" }),
      body,
      svgEl("rect", { x: 66, y: 128, width: 68, height: 50, rx: 4, fill: "rgba(255,255,255,.82)" }),
      svgEl("text", { x: 100, y: 146, "text-anchor": "middle", class: "bp-brand" }, b.length > 16 ? b.slice(0, 15) + "…" : b),
      svgEl("text", { x: 100, y: 166, "text-anchor": "middle", class: "bp-title" }, title.length > 14 ? title.slice(0, 13) + "…" : title)
    );
    ph.appendChild(svg);
  }

  // Цена из Google Таблицы, если Шухрат её туда вписал (бренд + название + объём)
  function priceFor(b, title, vol) {
    var items = window.CATALOG_ITEMS || [];
    var key = (b + "|" + title + "|" + vol).toLowerCase();
    var hit = items.find(function (x) { return x.section !== "Разлив" && (x.brand + "|" + x.title + "|" + x.vol).toLowerCase() === key; });
    return hit ? hit.price : 0;
  }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function card(k) {
    var it = data.items[k], b = data.brands[it[0]][0], vols = it[3] ? it[3].split("|") : [];
    var c = el("article", "card");
    var ph = el("div", "photo");
    var src = sheetPhoto(b, it[1]) || (it[4] ? PHOTO + it[4] : "");
    if (src) {
      var img = document.createElement("img");
      img.src = src; img.alt = b + " " + it[1]; img.loading = "lazy"; img.referrerPolicy = "no-referrer";
      img.onerror = function () { img.remove(); bottle(ph, b, it[1]); };
      ph.appendChild(img);
    } else bottle(ph, b, it[1]);
    ph.appendChild(el("span", "tag", "Под заказ"));
    var body = el("div", "body");
    body.append(el("span", "brand", b), el("h3", "name", it[1]), el("p", "meta", it[2] + (it[5] ? " · есть тестер" : "")));
    var sel = null;
    if (vols.length) {
      sel = el("select", "vol");
      sel.setAttribute("aria-label", "Объём");
      vols.forEach(function (v) { var o = el("option", "", v); o.value = v; sel.appendChild(o); });
      sel.value = vols.indexOf("100 мл") !== -1 ? "100 мл" : vols[vols.length - 1];
      body.appendChild(sel);
    }
    var foot = el("div", "foot"), price = el("div", "price");
    function cur() {
      var vol = sel ? sel.value : "";
      var p = priceFor(b, it[1], vol);
      return { name: b + " " + it[1] + (it[2] ? " (" + it[2].toLowerCase() + ")" : "") + (vol ? " · " + vol : ""), price: p, all: true };
    }
    function refresh() {
      var p = cur();
      price.textContent = p.price ? CartCore.money(p.price) : "Цена по запросу";
      price.className = "price" + (p.price ? "" : " ask");
      var q = Cart.qty(p.name), box = foot.querySelector(".buy");
      var nb = el("div", "buy");
      if (!q) {
        var btn = el("button", "btn small", "Заказать");
        btn.type = "button";
        btn.onclick = function () { document.dispatchEvent(new CustomEvent("fx:spray", { detail: btn })); Cart.add(cur()); };
        nb.appendChild(btn);
      } else {
        var s = el("div", "stepper"), mi = el("button", "", "−"), pl = el("button", "", "+");
        mi.type = pl.type = "button"; mi.setAttribute("aria-label", "Меньше"); pl.setAttribute("aria-label", "Больше");
        mi.onclick = function () { Cart.change(p.name, -1); };
        pl.onclick = function () { Cart.change(p.name, 1); };
        s.append(mi, el("span", "", q + " шт"), pl);
        nb.appendChild(s);
      }
      if (box) box.replaceWith(nb); else foot.appendChild(nb);
    }
    if (sel) sel.onchange = refresh;
    foot.prepend(price);
    refresh();
    c._refresh = refresh;
    body.appendChild(foot);
    c.append(ph, body);
    return c;
  }
  function show(reset) {
    if (reset) { grid.innerHTML = ""; shown = 0; }
    var more = grid.querySelector(".more");
    if (more) more.remove();
    list.slice(shown, shown + STEP).forEach(function (k) { grid.appendChild(card(k)); });
    shown = Math.min(list.length, shown + STEP);
    if (shown < list.length) {
      var m = el("button", "btn ghost more", "Показать ещё (" + (list.length - shown) + ")");
      m.type = "button";
      m.onclick = function () { show(false); };
      grid.appendChild(m);
    }
  }
  document.addEventListener("cart:change", function () { [].forEach.call(grid.querySelectorAll(".card"), function (c) { c._refresh && c._refresh(); }); });
  document.addEventListener("catalog:ready", function () { [].forEach.call(grid.querySelectorAll(".card"), function (c) { c._refresh && c._refresh(); }); });

  var t;
  input.addEventListener("focus", load);
  input.addEventListener("input", function () { clearTimeout(t); t = setTimeout(function () { query = input.value; search(); }, 250); });

  // Поиск с первого экрана: переносим запрос сюда
  // Сначала грузим и ищем, потом едем к результатам: если ехать сразу, страница по дороге меняет высоту
  // (подгружается каталог, закреплённый блок с флаконом) и прокрутка останавливается не там
  window.AllSearch = function (q) {
    input.value = q; query = q;
    load().then(function () {
      search();
      requestAnimationFrame(function () {
        var y = root.querySelector(".all-search").getBoundingClientRect().top + scrollY - 90;
        window.scrollTo({ top: y, behavior: Math.abs(y - scrollY) > 4000 ? "auto" : "smooth" });
      });
    });
  };

  var hero = document.querySelector(".hero-search");
  if (hero) {
    hero.addEventListener("submit", function (e) { e.preventDefault(); window.AllSearch(hero.elements.q.value.trim()); });
    hero.elements.q.addEventListener("focus", load); // пока человек печатает, каталог уже грузится
  }

  // Грузим заранее, когда покупатель приближается к блоку
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { load(); o.disconnect(); } }, { rootMargin: "800px" }).observe(root);
  } else load();
})();
