// Настройки сайта Mr in Black PARFUM. Меняются здесь, код трогать не нужно.
window.SHOP_CONFIG = {
  // Ссылка на опубликованную Google Таблицу с ароматами (формат CSV).
  // Если пусто – ароматы берутся из файла products.csv.
  // Как получить: Файл → Поделиться → Опубликовать в интернете → лист, «Формат CSV» → Опубликовать.
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH1Ohl089MA0yaHi1Qbxh1z6nnDRSeaYo_CfuGMF1C4jxVQSmpG1524hJNHW4-w9bT9IhSOg7J8YAA/pub?gid=0&single=true&output=csv",

  phone: "+79324045064",
  phoneText: "+7 (932) 404-50-64",
  telegram: "https://t.me/shuhrat2401",

  // Адрес Google-скрипта, который принимает заказы (лист «Заказы» + сообщение в Telegram от бота).
  // Пока пусто – покупатель сам отправляет скопированный заказ в Telegram.
  ordersUrl: "https://script.google.com/macros/s/AKfycbySmZYAskYFSXH87halpvzXKbNA8m8_C8X2mfucn9rh2YzSU5vXY4WpNbkfWuz-5T9t/exec",

  // Ссылка на оплату (платёжная ссылка банка или ЮKassa). Пока пусто – кнопка «Оплатить» скрыта.
  payLink: "",
};
