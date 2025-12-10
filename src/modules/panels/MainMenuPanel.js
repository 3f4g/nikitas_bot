import { Markup } from "telegraf";

export const mainMenuPanel = Markup.inlineKeyboard([
  [Markup.button.callback("Демо-версия 📚", "demo")],
  [Markup.button.callback("Подписка ⚜️", "open_subscription")],
  [Markup.button.callback("Отзывы ☁️", "reviews")],
  [Markup.button.callback("Тех. Поддержка ⚒️", "support")],
  [Markup.button.callback("Telegram-канал 💅", "channel")],
  [Markup.button.callback("Тесты", "tests")],
]);
