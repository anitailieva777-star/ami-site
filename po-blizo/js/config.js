/* ============================================================
   НАСТРОЙКИ — попълнете тук, без да пипате останалия код.
   ============================================================ */
window.PB_CONFIG = {
  // Линкове към чекаута в ConvertBuilder (с https://).
  // Докато са плейсхолдъри, бутоните водят към офертата на страницата.
  checkout: {
    basic: "[ЛИНК — ОСНОВНО]",
    gift:  "[ЛИНК — ПОДАРЪЧНО]"
  },

  // Meta Pixel ID (само цифри). Пикселът се зарежда едва след съгласие за бисквитки.
  pixelId: "[META PIXEL ID]",

  // Данни за събитията ViewContent / InitiateCheckout
  currency: "EUR",
  products: {
    basic: { id: "po-blizo-osnovno",   name: "ПО-БЛИЗО — основно тесте",     value: 34.90 },
    gift:  { id: "po-blizo-podarachno", name: "ПО-БЛИЗО — подаръчно издание", value: 44.90 }
  },

  // Параметри от адреса на лендинга, които се пренасят към чекаута
  forwardParams: ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "utm_id", "fbclid"]
};
