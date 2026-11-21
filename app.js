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

  // Кнопки слегка тянутся за курсором
  if (fine) $$(".magnetic").forEach(function (b) {
    b.addEventListener("mousemove", function (e) {
      var r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * .25, y: (e.clientY - r.top - r.height / 2) * .35, duration: .3 });
    });
    b.addEventListener("mouseleave", function () { gsap.to(b, { x: 0, y: 0, duration: .5, ease: "elastic.out(1, .4)" }); });
  });

  new ResizeObserver(function () { ScrollTrigger.refresh(); }).observe(document.body);
})();
