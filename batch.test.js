// Проверка расчёта срока сбора: node batch.test.js
require("./batch.js");
const assert = require("assert");
const f = globalThis.nextDeadline;
const ekb = (s) => Date.parse(s + "+05:00"); // время Сургута
const tue = (now) => new Date(f(ekb(now), 2, 23, 59, 5)).toISOString();
// Суббота 21.11.2026 → вторник 24.11 23:59 по Сургуту = 18:59 UTC
assert.strictEqual(tue("2026-11-21T17:00:00"), "2026-11-24T18:59:00.000Z");
// Вторник днём → тот же вторник вечером
assert.strictEqual(tue("2026-11-24T12:00:00"), "2026-11-24T18:59:00.000Z");
// Вторник после 23:59 → следующий вторник
assert.strictEqual(tue("2026-11-24T23:59:30"), "2026-12-01T18:59:00.000Z");
// Поздний понедельник по Сургуту, когда в UTC ещё понедельник днём
assert.strictEqual(tue("2026-11-23T03:00:00"), "2026-11-24T18:59:00.000Z");
console.log("batch ok");
