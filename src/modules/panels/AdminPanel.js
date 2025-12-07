import { Markup } from "telegraf";

export const adminMenu = Markup.inlineKeyboard([
  [Markup.button.callback("Текущие настройки", "admin_show_config")],
  [Markup.button.callback("Триал (дни)", "admin_edit_trial")],
  [Markup.button.callback("Подписка (дни)", "admin_edit_subscription")],
  [Markup.button.callback("Ссылка на канал", "admin_edit_channel")],
  [Markup.button.callback("Ссылка на отзывы", "admin_edit_reviews")],
  [Markup.button.callback("Описание подписки", "admin_edit_description")],
  [Markup.button.callback("Администраторы", "admin_edit_admins")],
  [Markup.button.callback("Закрыть", "admin_close")],
]);
