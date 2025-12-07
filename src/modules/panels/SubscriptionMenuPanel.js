import { Markup } from "telegraf";

export const subscriptionMenu = Markup.inlineKeyboard([
  [Markup.button.callback("Подписка 💵", "sub_plans")],
  [Markup.button.callback("О подписке ⚜️", "sub_about")],
  [Markup.button.callback("Промокод 🐾", "sub_promo")],
  [Markup.button.callback("Вернуться назад 👀", "sub_back")],
]);
