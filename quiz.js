// Подбор аромата за 3 вопроса: ищет в каталоге по полу, характеру и формату.
(function () {
  var root = document.getElementById("quiz");
  if (!root) return;
  var steps = [].slice.call(root.querySelectorAll(".q-step"));
  var result = root.querySelector(".q-result");
  var grid = root.querySelector(".q-grid");
  var bar = root.querySelector(".q-progress span");
  var answers = {}, current = 0, picks = [];

  function show(i) {
    current = i;
    steps.forEach(function (s, k) { s.hidden = k !== i; });
    result.hidden = i < steps.length;
    bar.style.width = Math.round(i / steps.length * 100) + "%";
    var active = i < steps.length ? steps[i] : result;
    active.classList.remove("enter"); void active.offsetWidth; active.classList.add("enter");
  }

  // Лучшие совпадения: характер важнее всего, потом пол, потом формат
  function score(it) {
    var s = 0;
    if (answers.family && it.family === answers.family) s += 4;
    if (answers.sex === "Все" || it.sex === answers.sex) s += 2;
    else if (it.sex === "Унисекс") s += 1.5;
    else s -= 5;
    if (answers.section === "Все" || it.section === answers.section) s += 1;
    return s;
  }
  function pick() {
    var seen = {};
    return (window.CATALOG_ITEMS || []).slice()
      .sort(function (a, b) { return score(b) - score(a); })
      .filter(function (it) {
        var k = it.brand + "|" + it.title;
        if (seen[k] || score(it) < 0) return false;
        seen[k] = 1; return true;
      }).slice(0, 3);
  }

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }
  function renderResult() {
    grid.innerHTML = "";
    if (!picks.length) { grid.appendChild(el("p", "empty", "Каталог ещё загружается – попробуйте через секунду.")); return; }
    picks.forEach(function (it, i) {
      var c = el("article", "q-item");
      c.style.setProperty("--i", i);
      var ph = el("div", "q-photo");
      if (it.photo) { var img = document.createElement("img"); img.src = it.photo; img.alt = it.brand + " " + it.title; ph.appendChild(img); }
      var b = el("div", "q-body");
      b.append(el("span", "brand", it.brand), el("h3", "name", it.title));
      if (it.notes) b.appendChild(el("p", "notes", it.notes));
      b.appendChild(el("p", "meta", [it.section === "Разлив" ? "Разлив" : "Флакон", it.vol].filter(Boolean).join(" · ")));
      b.appendChild(window.CatalogBuyBox(it));
      c.append(ph, b);
      grid.appendChild(c);
    });
  }

  root.addEventListener("click", function (e) {
    var opt = e.target.closest(".q-opt");
    if (opt) {
      answers[opt.closest(".q-step").dataset.q] = opt.dataset.v;
      if (current + 1 < steps.length) show(current + 1);
      else { picks = pick(); renderResult(); show(steps.length); }
      return;
    }
    if (e.target.closest(".q-back") && current > 0) show(current - 1);
    if (e.target.closest(".q-restart")) { answers = {}; show(0); }
  });
  // Кнопки «В корзину» в результатах обновляются вместе с корзиной
  document.addEventListener("cart:change", function () {
    [].forEach.call(grid.querySelectorAll(".buy"), function (box, i) { if (picks[i]) box.replaceWith(window.CatalogBuyBox(picks[i])); });
  });
  show(0);
})();
