// Проверка логики корзины: node cart.test.js
require("./cart.js");
const assert = require("assert");
const C = globalThis.CartCore;
const list = [
  { name: "Creed Aventus · 10 мл (разлив)", price: 2500, qty: 2 },
  { name: "Dior Sauvage · 100 мл", price: 0, qty: 1 },
];
assert.strictEqual(C.total(list), 5000);
assert.strictEqual(C.hasUnpriced(list), true);
assert.strictEqual(C.totalText(list), C.money(5000) + " + по запросу");
assert.strictEqual(C.totalText([list[1]]), "по запросу");
assert.strictEqual(C.totalText([list[0]]), C.money(5000));
assert.strictEqual(C.validPhone("+7 (932) 404-50-64"), true);
assert.strictEqual(C.validPhone("12345"), false);
const t = C.orderText(list, { name: "Анна", phone: "+79990000000", how: "Доставка", address: "ул. Ленина, 1", comment: "" });
assert.ok(t.includes("Creed Aventus · 10 мл (разлив) – 2 шт – " + C.money(5000)));
assert.ok(t.includes("Dior Sauvage · 100 мл – 1 шт – цена по запросу"));
assert.ok(t.includes("Адрес: ул. Ленина, 1"));
assert.ok(!C.orderText([list[0]], { name: "А", phone: "1", how: "Самовывоз", address: "x", comment: "" }).includes("Адрес:"));
console.log("cart ok");

const r = C.sync([{ name: "A", price: 100, qty: 2 }, { name: "Old", price: 50, qty: 1 }], [{ name: "A", price: 120 }]);
assert.deepStrictEqual(r.removed, ["Old"]);
assert.strictEqual(r.list[0].price, 120);
assert.strictEqual(r.changed, true);
assert.strictEqual(C.sync([{ name: "A", price: 120, qty: 1 }], [{ name: "A", price: 120 }]).changed, false);
// Аромат из «Всего ассортимента» не выкидывается, хотя в таблице его нет
const r2 = C.sync([{ name: "Lattafa Khamrah · 100 мл", price: 0, qty: 1, all: true }], []);
assert.strictEqual(r2.list.length, 1);
assert.strictEqual(r2.changed, false);
console.log("sync ok");
