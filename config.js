// Настройки сайта Mr in Black PARFUM. Меняются здесь, код трогать не нужно.
window.SHOP_CONFIG = {
  // Ссылка на опубликованную Google Таблицу с ароматами (формат CSV).
  // Если пусто – ароматы берутся из файла products.csv.
  // Как получить: Файл → Поделиться → Опубликовать в интернете → лист, «Формат CSV» → Опубликовать.
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSH1Ohl089MA0yaHi1Qbxh1z6nnDRSeaYo_CfuGMF1C4jxVQSmpG1524hJNHW4-w9bT9IhSOg7J8YAA/pub?gid=0&single=true&output=csv",

  phone: "+79324045064",
  phoneText: "+7 (932) 404-50-64",
  telegram: "https://t.me/shuhrat2401",

  // Сбор заказов под заказ раз в неделю: когда закрывается (день: 0 – вс, 1 – пн, 2 – вт … 6 – сб).
  // utcOffset: 5 – время Сургута. Чтобы убрать таймер с сайта, напишите batch: null.
  batch: { day: 2, hour: 23, minute: 59, utcOffset: 5 },

  // Ссылка на оплату (платёжная ссылка банка или ЮKassa). Пока пусто – кнопка «Оплатить» скрыта.
  payLink: "",
};
