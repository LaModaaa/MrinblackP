// Анимации и мелочи интерфейса. Корзина и каталог живут в cart.js и catalog.js.
(function () {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(pointer: fine)").matches;
  var cfg = window.SHOP_CONFIG || {};
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  // Контакты берём из config.js, чтобы менять в одном месте
  $$(".tg-link").forEach(function (a) { if (cfg.telegram) a.href = cfg.telegram; });
  $$(".tel-link").forEach(function (a) { if (cfg.phone) a.href = "tel:" + cfg.phone; });

  var lastY = 0;
  addEventListener("scroll", function () {
    $(".header").classList.toggle("hide", scrollY > lastY && scrollY > 300);
    lastY = scrollY;
  }, { passive: true });

  // Плавный переход по ссылкам (CSS scroll-behavior: smooth ломает ScrollTrigger)
  function go(sel) { var el = $(sel); if (el) el.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) { if ($(a.getAttribute("href"))) { e.preventDefault(); go(a.getAttribute("href")); } });
  });
  // «Смотреть разлив» / «Смотреть флаконы» – фильтруем каталог и едем к нему
  $$("[data-show]").forEach(function (b) {
    b.addEventListener("click", function () { if (window.CatalogShow) CatalogShow(b.dataset.show); go("#catalog"); });
  });

  // Сколько разных ароматов в каталоге (разлив и флакон одного аромата – один аромат)
  function countAromas() {
    var seen = {};
    (window.CATALOG_ITEMS || []).forEach(function (it) { seen[it.brand + "|" + it.title] = 1; });
    var n = Object.keys(seen).length, el = $(".why [data-count='24']") || $(".why-item:last-child b");
    if (n && el) { el.dataset.count = n; if (!window.gsap || reduce) el.textContent = n; }
  }
  document.addEventListener("catalog:ready", countAromas);
  if (window.CATALOG_ITEMS) countAromas();

  if (!window.gsap || !window.ScrollTrigger || reduce) {
    document.documentElement.classList.add("no-gsap");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("gsap-on");

  function splitWords(el) {
    var esc = function (w) { return w.replace(/&/g, "&amp;").replace(/</g, "&lt;"); };
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w"><span>' + esc(w) + "</span></span>"; }).join(" ");
    return el.querySelectorAll(".w > span");
  }

  // Прелоадер → логотип на первом экране
  var intro = gsap.timeline();
  intro.from(".pre-logo span", { yPercent: 60, opacity: 0, duration: .9, ease: "power3.out" })
    .from(".pre-logo small", { letterSpacing: "1.4em", opacity: 0, duration: .9, ease: "power2.out" }, "-=.5")
    .to(".preloader", { opacity: 0, duration: .6, onComplete: function () { $(".preloader").remove(); } }, "+=.25")
    .from(".bm-top", { yPercent: 40, opacity: 0, filter: "blur(12px)", duration: 1.2, ease: "power3.out" }, "-=.3")
    .from(".bm-sub i", { scaleX: 0, duration: .9, ease: "power2.out" }, "-=.7")
    .from(".bm-sub", { letterSpacing: "1.2em", opacity: 0, duration: 1 }, "<")
    .from(".fleur", { scale: 0, rotate: -90, opacity: 0, duration: .7, ease: "back.out(2)" }, "-=.5")
    .from(".eyebrow, .lead, .hero .btns", { y: 24, opacity: 0, stagger: .12, duration: .7 }, "-=.4");

  // Золотой отблеск бежит по логотипу
  gsap.to(".bm-top", { backgroundPosition: "200% 0", duration: 6, ease: "none", repeat: -1 });

  // Дым: линии рисуются и медленно плывут
  $$(".smoke path").forEach(function (p, i) {
    var len = p.getTotalLength();
    gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    gsap.to(p, { strokeDashoffset: 0, duration: 3.2, delay: 1.6 + (i % 4) * .25, ease: "power2.inOut" });
    gsap.to(p, { x: i % 2 ? 30 : -30, y: i % 2 ? -20 : 20, duration: 7 + i, yoyo: true, repeat: -1, ease: "sine.inOut" });
  });
  gsap.to(".smoke", { yPercent: 18, opacity: .2, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-in", { yPercent: -14, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "40% top", end: "bottom top", scrub: true } });

  // Бегущая строка ускоряется от прокрутки
  var mq = gsap.to(".mq-track", { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
  ScrollTrigger.create({
    onUpdate: function (self) {
      var v = Math.min(Math.abs(self.getVelocity()) / 300, 6);
      gsap.to(mq, { timeScale: 1 + v, duration: .2, overwrite: true });
      gsap.to(mq, { timeScale: 1, duration: 1.2, delay: .2 });
    },
  });

  // Заголовки появляются по словам
  $$(".split").forEach(function (h) {
    gsap.from(splitWords(h), { yPercent: 110, duration: .9, stagger: .06, ease: "power3.out", scrollTrigger: { trigger: h, start: "top 85%" } });
  });
  gsap.from(".fmt", { y: 60, opacity: 0, stagger: .15, duration: .9, ease: "power3.out", scrollTrigger: { trigger: ".fmt-grid", start: "top 80%" } });
  gsap.from(".steps li", { y: 50, opacity: 0, stagger: .12, duration: .8, scrollTrigger: { trigger: ".steps", start: "top 80%" } });
  gsap.from(".contacts dl > div, .contacts .btns", { x: -30, opacity: 0, stagger: .1, duration: .7, scrollTrigger: { trigger: ".contacts", start: "top 70%" } });
  gsap.from(".map", { clipPath: "inset(0 0 100% 0 round 18px)", duration: 1.2, ease: "power3.inOut", scrollTrigger: { trigger: ".map", start: "top 80%" } });

  // Счётчики
  $$(".why b").forEach(function (b) {
    ScrollTrigger.create({
      trigger: b, start: "top 85%", once: true,
      onEnter: function () {
        if (!b.dataset.count) return;
        var o = { n: 0 };
        gsap.to(o, { n: +b.dataset.count, duration: 1.6, ease: "power2.out", onUpdate: function () { b.textContent = Math.round(o.n).toLocaleString("ru-RU") + (b.dataset.suffix || ""); } });
      },
    });
  });

  // Карточки каталога выезжают при каждой перерисовке
  document.addEventListener("catalog:render", function () {
    gsap.from("#grid .card", { y: 40, opacity: 0, duration: .6, stagger: .05, ease: "power2.out", clearProps: "all" });
    ScrollTrigger.refresh();
  });

  // Флакон наполняется слоями: база → сердце → верх, текст подсвечивается в такт
  var layers = $$(".layer");
  gsap.set(".liq", { scaleY: 0, transformOrigin: "50% 100%" });
  var wide = matchMedia("(min-width: 861px)").matches;
  var pyr = gsap.timeline({
    scrollTrigger: { trigger: ".pyramid", start: wide ? "top top" : "top 70%", end: wide ? "+=1600" : "bottom 60%", scrub: .8, pin: wide ? ".pyr-in" : false,
      onUpdate: function (st) {
        var n = Math.min(3, Math.floor(st.progress * 3.3)); // сколько слоёв уже налито
        layers.forEach(function (l) { l.classList.toggle("on", 4 - +l.dataset.l <= n); });
      } },
  });
  pyr.to(".l3", { scaleY: 1, ease: "none" }).to(".l2", { scaleY: 1, ease: "none" }).to(".l1", { scaleY: 1, ease: "none" })
    .to(".cap", { y: -10, ease: "power1.inOut" }, "-=.4");
  gsap.to(".bubbles circle", { y: -200, opacity: 0, duration: 3, stagger: { each: .5, repeat: -1 }, ease: "power1.in" });
  gsap.to(".bottle-glow", { scale: 1.15, opacity: .7, duration: 2.5, yoyo: true, repeat: -1, ease: "sine.inOut" });

  // Цитата: слова загораются по одному, последние – золотом
  var qt = $(".q-text");
  if (qt) {
    qt.innerHTML = qt.textContent.trim().split(/\s+/).map(function (w) { return '<span class="qw">' + w.replace(/</g, "&lt;") + "</span>"; }).join(" ");
    var qws = qt.querySelectorAll(".qw");
    ScrollTrigger.create({
      trigger: ".quote", start: "top 75%", end: "bottom 45%", scrub: true,
      onUpdate: function (st) {
        var n = Math.round(st.progress * qws.length);
        qws.forEach(function (w, i) { w.classList.toggle("lit", i < n); w.classList.toggle("gold", i < n && i >= qws.length - 3); });
      },
    });
  }

  // Наклон карточки и блик за курсором (делегирование – карточки перерисовываются)
  if (fine) {
    var grid = $("#grid"), tilted = null;
    grid.addEventListener("mousemove", function (e) {
      var card = e.target.closest(".card");
      if (tilted && tilted !== card) gsap.to(tilted, { rotateX: 0, rotateY: 0, duration: .5 });
      tilted = card;
      if (!card) return;
      var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      gsap.to(card, { rotateY: (px - .5) * 10, rotateX: (.5 - py) * 8, transformPerspective: 900, duration: .4 });
      card.style.setProperty("--mx", px * 100 + "%");
      card.style.setProperty("--my", py * 100 + "%");
    });
    grid.addEventListener("mouseleave", function () { if (tilted) gsap.to(tilted, { rotateX: 0, rotateY: 0, duration: .5 }); tilted = null; });
  }

  // Кнопки слегка тянутся за курсором
  if (fine) $$(".magnetic").forEach(function (b) {
    b.addEventListener("mousemove", function (e) {
      var r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .3 });
    });
    b.addEventListener("mouseleave", function () { gsap.to(b, { x: 0, y: 0, duration: .5, ease: "elastic.out(1, .4)" }); });
  });

  // Эффекты на одном холсте: золотая пыль на первом экране, дымный след курсора, «пшик» при покупке
  var cv = $(".fx"), ctx = cv.getContext("2d"), dpr = Math.min(devicePixelRatio || 1, 2), W, H;
  function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); addEventListener("resize", size);
  var parts = [], rnd = function (a, b) { return a + Math.random() * (b - a); };
  var dust = [];
  for (var i = 0; i < (fine ? 70 : 35); i++) dust.push({ x: rnd(0, 1), y: rnd(0, 1), r: rnd(.6, 2.2), s: rnd(.00015, .0006), t: rnd(0, 6.28) });

  // kind: 0 – дым (растёт и тает), 1 – капля спрея (летит и гаснет)
  function puff(x, y, kind, vx, vy) { parts.push({ x: x, y: y, vx: vx, vy: vy, life: 0, max: kind ? rnd(35, 60) : rnd(40, 70), r: kind ? rnd(1, 2.6) : rnd(6, 12), kind: kind }); }

  if (fine) addEventListener("mousemove", function (e) { if (Math.random() < .5) puff(e.clientX, e.clientY, 0, rnd(-.3, .3), rnd(-.8, -.2)); }, { passive: true });
  document.addEventListener("fx:spray", function (e) {
    var r = e.detail.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    for (var k = 0; k < 46; k++) { var a = rnd(-2.6, -0.5), v = rnd(2, 7); puff(x, y, 1, Math.cos(a) * v, Math.sin(a) * v); }
    for (var m = 0; m < 6; m++) puff(x + rnd(-20, 20), y - rnd(0, 20), 0, rnd(-1, 1), rnd(-1.5, -.4));
  });

  (function loop(t) {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    ctx.clearRect(0, 0, W, H);
    var heroFade = Math.max(0, 1 - scrollY / H);
    if (heroFade > 0) dust.forEach(function (d) {
      d.y -= d.s; if (d.y < -.02) { d.y = 1.02; d.x = rnd(0, 1); }
      var tw = .35 + .65 * Math.abs(Math.sin(t / 900 + d.t));
      ctx.globalAlpha = tw * .8 * heroFade;
      ctx.fillStyle = "#f0cf8e";
      ctx.beginPath(); ctx.arc(d.x * W + Math.sin(t / 2000 + d.t) * 12, d.y * H, d.r, 0, 6.28); ctx.fill();
    });
    for (var j = parts.length - 1; j >= 0; j--) {
      var p = parts[j];
      p.life++; p.x += p.vx; p.y += p.vy;
      if (p.kind) { p.vx *= .95; p.vy = p.vy * .95 + .05; } else { p.r += .35; p.vx *= .98; }
      var k2 = 1 - p.life / p.max;
      if (k2 <= 0) { parts.splice(j, 1); continue; }
      if (p.kind) { ctx.globalAlpha = k2; ctx.fillStyle = "#f3d9a4"; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill(); }
      else {
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, "rgba(230,191,120," + (.16 * k2) + ")"); g.addColorStop(1, "rgba(230,191,120,0)");
        ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  })(0);

  new ResizeObserver(function () { ScrollTrigger.refresh(); }).observe(document.body);
})();
