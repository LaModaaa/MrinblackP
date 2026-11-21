// Корзина и оформление заказа. Логика (CartCore) отделена от интерфейса, чтобы её можно было проверить тестом.
(function () {
  var KEY = "mib-parfum-cart-v1";

  function money(n) { return Math.round(n).toLocaleString("ru-RU") + " ₽"; }
  // Цена 0 или пусто в таблице = «по запросу»: сумму подтверждает продавец
  function lineText(it) { return it.price ? money(it.price * it.qty) : "цена по запросу"; }

  var CartCore = {
    money: money,
    lineText: lineText,
    total: function (list) { return list.reduce(function (s, it) { return s + (it.price || 0) * it.qty; }, 0); },
    hasUnpriced: function (list) { return list.some(function (it) { return !it.price; }); },
    totalText: function (list) {
      var sum = CartCore.total(list);
      if (!CartCore.hasUnpriced(list)) return money(sum);
      return sum ? money(sum) + " + по запросу" : "по запросу";
    },
    orderText: function (list, f) {
      var lines = ["Заказ с сайта Mr in Black PARFUM", ""];
      list.forEach(function (it) { lines.push("• " + it.name + " – " + it.qty + " шт – " + lineText(it)); });
      lines.push("", "Итого: " + CartCore.totalText(list));
      lines.push("", "Имя: " + f.name, "Телефон: " + f.phone, "Получение: " + f.how);
      if (f.how === "Доставка") lines.push("Адрес: " + f.address);
      if (f.comment) lines.push("Комментарий: " + f.comment);
      return lines.join("\n");
    },
    validPhone: function (p) { return String(p || "").replace(/\D/g, "").length >= 10; },
    // Сверка корзины с каталогом: свежие цены, убранные ароматы выпадают
    sync: function (list, catalog) {
      var removed = [], changed = false;
      var next = list.filter(function (it) {
        var c = catalog.find(function (x) { return x.name === it.name; });
        if (!c) { removed.push(it.name); return false; }
        if (c.price !== it.price) { it.price = c.price; changed = true; }
        return true;
      });
      return { list: next, removed: removed, changed: changed || removed.length > 0 };
    },
  };
  (typeof window !== "undefined" ? window : globalThis).CartCore = CartCore;
  if (typeof document === "undefined") return; // запуск из теста без браузера

  var cfg = window.SHOP_CONFIG || {};
  var list = [];
  try { list = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { list = []; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) {} }

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var drawer = $(".drawer"), overlay = $(".overlay"), form = $(".order"), dlg = $(".done");

  function find(name) { return list.find(function (it) { return it.name === name; }); }
  function changed() {
    save();
    renderCart();
    document.dispatchEvent(new CustomEvent("cart:change"));
  }

  var Cart = {
    qty: function (name) { var it = find(name); return it ? it.qty : 0; },
    add: function (p) {
      var it = find(p.name);
      if (it) it.qty++;
      else list.push({ name: p.name, price: Number(p.price) || 0, qty: 1 });
      changed();
      bump();
      toast("Добавили: " + p.name);
    },
    change: function (name, d) {
      var it = find(name);
      if (!it) return;
      it.qty += d;
      if (it.qty <= 0) list = list.filter(function (x) { return x !== it; });
      changed();
    },
    open: openDrawer,
  };
  window.Cart = Cart;

  function bump() {
    var b = $(".cart-btn");
    b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
  }
  function renderHeader() {
    var n = list.reduce(function (s, it) { return s + it.qty; }, 0);
    $(".cart-count").hidden = !n;
    $(".cart-count").textContent = n;
  }

  function renderCart() {
    renderHeader();
    var ul = $(".cart-list");
    ul.innerHTML = "";
    list.forEach(function (it) {
      var li = document.createElement("li");
      li.innerHTML = '<div class="ci-name"></div><div class="stepper"><button type="button" aria-label="Меньше">−</button><span></span><button type="button" aria-label="Больше">+</button></div><b class="ci-sum"></b>';
      li.querySelector(".ci-name").textContent = it.name;
      li.querySelector(".stepper span").textContent = it.qty + " шт";
      li.querySelector(".ci-sum").textContent = lineText(it);
      var btns = li.querySelectorAll("button");
      btns[0].onclick = function () { Cart.change(it.name, -1); };
      btns[1].onclick = function () { Cart.change(it.name, 1); };
      ul.appendChild(li);
    });
    $(".cart-empty").hidden = list.length > 0;
    form.hidden = !list.length;
    $(".total-sum").textContent = CartCore.totalText(list);
    $(".total-note").hidden = !CartCore.hasUnpriced(list);
  }

  function openDrawer() {
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    drawer.inert = false;
    overlay.hidden = false;
    document.body.classList.add("lock");
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    drawer.inert = true;
    overlay.hidden = true;
    document.body.classList.remove("lock");
  }
  $(".cart-btn").addEventListener("click", openDrawer);
  $(".drawer .close").addEventListener("click", closeDrawer);
  overlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrawer(); });
  drawer.inert = true;

  document.addEventListener("catalog:ready", function () {
    var r = CartCore.sync(list, window.CATALOG_ITEMS || []);
    if (!r.changed) return;
    list = r.list;
    changed();
    if (r.removed.length) toast("Убрали из корзины – больше нет в продаже: " + r.removed.join(", "));
  });

  form.addEventListener("change", function () {
    var delivery = form.elements.how.value === "Доставка";
    $(".addr").hidden = !delivery;
    form.elements.address.required = delivery;
  });

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(fallback);
    return Promise.resolve(fallback());
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      ta.remove();
    }
  }

  var lastText = "";
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var el = form.elements;
    var f = { name: el.name.value.trim(), phone: el.phone.value.trim(), how: el.how.value, address: el.address.value.trim(), comment: el.comment.value.trim() };
    var err = !f.name ? "Укажите, пожалуйста, имя"
      : !CartCore.validPhone(f.phone) ? "Проверьте номер телефона"
      : f.how === "Доставка" && !f.address ? "Укажите адрес доставки" : "";
    $(".form-error").textContent = err;
    if (err) return;

    lastText = CartCore.orderText(list, f);
    copy(lastText);
    $(".order-text").textContent = lastText;
    $(".send-tg").href = cfg.telegram;
    $(".send-call").href = "tel:" + (cfg.phone || "");
    $(".pay").hidden = !cfg.payLink;
    if (cfg.payLink) $(".pay").href = cfg.payLink;
    closeDrawer();
    dlg.showModal();
  });
  $(".copy-again").addEventListener("click", function () { copy(lastText); toast("Текст заказа скопирован"); });
  $(".done .close").addEventListener("click", function () { dlg.close(); });

  var tt;
  function toast(t) {
    var el = $(".toast");
    el.textContent = t;
    el.classList.add("show");
    clearTimeout(tt);
    tt = setTimeout(function () { el.classList.remove("show"); }, 2200);
  }

  renderCart();
})();
