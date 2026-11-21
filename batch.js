// Сбор заказов раз в неделю: таймер до закрытия сбора (день и время – в config.js).
(function () {
  // Ближайший дедлайн по местному времени магазина (UTC + offsetH), в миллисекундах UTC
  function nextDeadline(nowMs, day, hour, minute, offsetH) {
    var local = new Date(nowMs + offsetH * 3600e3); // «часы магазина» в полях UTC
    var d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), hour, minute, 0));
    d.setUTCDate(d.getUTCDate() + ((day - local.getUTCDay() + 7) % 7));
    if (d.getTime() <= local.getTime()) d.setUTCDate(d.getUTCDate() + 7);
    return d.getTime() - offsetH * 3600e3;
  }
  (typeof window !== "undefined" ? window : globalThis).nextDeadline = nextDeadline;
  if (typeof document === "undefined") return; // запуск из теста

  var cfg = (window.SHOP_CONFIG || {}).batch;
  var box = document.querySelector(".batch");
  if (!box) return;
  if (!cfg) { box.hidden = true; return; }
  var cells = { d: box.querySelector("[data-t=d]"), h: box.querySelector("[data-t=h]"), m: box.querySelector("[data-t=m]"), s: box.querySelector("[data-t=s]") };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  function set(el, v) {
    if (el.textContent === v) return;
    el.textContent = v;
    el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick");
  }
  function tick() {
    var left = Math.max(0, nextDeadline(Date.now(), cfg.day, cfg.hour, cfg.minute, cfg.utcOffset) - Date.now()) / 1000 | 0;
    set(cells.d, String(left / 86400 | 0));
    set(cells.h, pad(left % 86400 / 3600 | 0));
    set(cells.m, pad(left % 3600 / 60 | 0));
    set(cells.s, pad(left % 60));
  }
  tick();
  setInterval(tick, 1000);
})();
