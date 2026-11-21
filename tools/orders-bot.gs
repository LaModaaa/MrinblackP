// Приём заказов с сайта Mr in Black PARFUM.
// Каждый заказ: 1) записывается строкой на лист «Заказы» этой Google Таблицы, 2) приходит в Telegram от бота.
// Ставится в ОТДЕЛЬНУЮ новую таблицу (не в каталог – каталог опубликован в интернете, а тут имена и телефоны):
// Расширения → Apps Script → вставить этот код целиком.
// Токен бота и номер чата хранятся в «Свойствах скрипта», а не здесь и не на сайте:
//   Настройки проекта (шестерёнка) → Свойства скрипта → добавить:
//     BOT_TOKEN – токен от @BotFather
//     CHAT_IDS  – номера чатов через запятую (узнать: функция findChatIds ниже)

function doPost(e) {
  var o;
  try { o = JSON.parse(e.postData.contents); } catch (err) { return out("bad json"); }
  if (o.website) return out("ok"); // скрытое поле-ловушка: его заполняют только спам-боты
  var text = String(o.text || "").slice(0, 3500);
  if (!text || !o.phone) return out("empty");

  var sheet = SpreadsheetApp.getActive().getSheetByName("Заказы") || SpreadsheetApp.getActive().insertSheet("Заказы");
  if (sheet.getLastRow() === 0) sheet.appendRow(["Когда", "Имя", "Телефон", "Получение", "Адрес", "Сумма", "Заказ", "Комментарий"]);
  sheet.appendRow([new Date(), cut(o.name), "'" + String(o.phone).slice(0, 40), cut(o.how), cut(o.address), cut(o.total), cut(o.items, 3000), cut(o.comment)]);

  var p = PropertiesService.getScriptProperties();
  var token = p.getProperty("BOT_TOKEN");
  String(p.getProperty("CHAT_IDS") || "").split(",").forEach(function (id) {
    id = id.trim();
    if (!token || !id) return;
    UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "post", muteHttpExceptions: true,
      payload: { chat_id: id, text: "🛍 Новый заказ с сайта\n\n" + text },
    });
  });
  return out("ok");
}

// Запустить один раз после того, как владелец нажал «Старт» в боте: в журнале появятся номера чатов.
function findChatIds() {
  var token = PropertiesService.getScriptProperties().getProperty("BOT_TOKEN");
  var r = JSON.parse(UrlFetchApp.fetch("https://api.telegram.org/bot" + token + "/getUpdates").getContentText());
  (r.result || []).forEach(function (u) {
    var c = (u.message || {}).chat;
    if (c) Logger.log(c.id + " – " + [c.first_name, c.last_name, c.username].filter(String).join(" "));
  });
}

// Проверка бота: шлёт «Проверка бота» на первый номер из CHAT_IDS и пишет в журнал ответ Telegram.
function testSend() {
  var p = PropertiesService.getScriptProperties();
  Logger.log("CHAT_IDS = " + p.getProperty("CHAT_IDS") + ", токен " + (p.getProperty("BOT_TOKEN") ? "есть" : "НЕТ"));
  var id = String(p.getProperty("CHAT_IDS") || "").split(",")[0].trim();
  var r = UrlFetchApp.fetch("https://api.telegram.org/bot" + p.getProperty("BOT_TOKEN") + "/sendMessage",
    { method: "post", muteHttpExceptions: true, payload: { chat_id: id, text: "Проверка бота ✅" } });
  Logger.log(r.getContentText());
}

// Обрезаем длину; текст, начинающийся с = + - @, таблица приняла бы за формулу – экранируем апострофом
function cut(v, n) { var s = String(v == null ? "" : v).slice(0, n || 300); return /^[=+\-@]/.test(s) ? "'" + s : s; }
function out(s) { return ContentService.createTextOutput(s); }
