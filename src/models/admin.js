import { Markup } from "telegraf";
import { loadConfig, saveConfig } from "../utils/config.js";

const adminMenu = Markup.inlineKeyboard([
  [Markup.button.callback("Текущие настройки", "admin_show_config")],
  [Markup.button.callback("Триал (дни)", "admin_edit_trial")],
  [Markup.button.callback("Подписка (дни)", "admin_edit_subscription")],
  [Markup.button.callback("Ссылка на канал", "admin_edit_channel")],
  [Markup.button.callback("Ссылка на отзывы", "admin_edit_reviews")],
  [Markup.button.callback("Описание подписки", "admin_edit_description")],
  [Markup.button.callback("Администраторы", "admin_edit_admins")],
  [Markup.button.callback("Закрыть", "admin_close")],
]);

export function setupAdmin(bot) {
  bot.command("root", async (ctx) => {
    const config = loadConfig();
    const userId = ctx.from.id;

    if (!config.admins.includes(userId)) {
      ctx.reply("У вас нет прав доступа к настройкам бота.");
      return;
    }

    ctx.reply("Панель администратора:", adminMenu);
  });

  function askInput(ctx, key, label) {
    const config = loadConfig();
    ctx.editMessageText(
      `${label}\n\nТекущее значение:\n${config[key]}\n\nВведите новое:`
    );
    ctx.session = { adminEditingKey: key };
  }

  bot.action("admin_show_config", async (ctx) => {
    await ctx.answerCbQuery();
    const config = loadConfig();

    const text =
      `Текущие настройки:\n\n` +
      `Триал (дни): ${config.trialDurationDays}\n` +
      `Подписка (дни): ${config.subscriptionDurationDays}\n` +
      `Ссылка на канал: ${config.demoChannelUrl}\n` +
      `Ссылка на отзывы: ${config.reviewsUrl}\n\n` +
      `Описание подписки:\n${config.subscriptionDescription}\n\n` +
      `Администраторы:\n${config.admins.join(", ")}`;

    await ctx.editMessageText(text, {
      reply_markup: adminMenu.reply_markup,
    });
  });

  bot.action("admin_edit_trial", (ctx) => {
    ctx.answerCbQuery();
    askInput(ctx, "trialDurationDays", "Редактирование триала (в днях)");
  });

  bot.action("admin_edit_subscription", (ctx) => {
    ctx.answerCbQuery();
    askInput(
      ctx,
      "subscriptionDurationDays",
      "Редактирование обычной подписки (в днях)"
    );
  });

  bot.action("admin_edit_channel", (ctx) => {
    ctx.answerCbQuery();
    askInput(ctx, "demoChannelUrl", "Редактирование ссылки на канал");
  });

  bot.action("admin_edit_reviews", (ctx) => {
    ctx.answerCbQuery();
    askInput(ctx, "reviewsUrl", "Редактирование ссылки на отзывы");
  });

  bot.action("admin_edit_description", (ctx) => {
    ctx.answerCbQuery();
    askInput(
      ctx,
      "subscriptionDescription",
      "Редактирование описания подписки"
    );
  });

  bot.action("admin_edit_admins", (ctx) => {
    ctx.answerCbQuery();
    askInput(
      ctx,
      "admins",
      "Редактирование списка администраторов (введите ID через запятую)"
    );
  });

  bot.action("admin_close", async (ctx) => {
    await ctx.answerCbQuery();

    try {
      await ctx.deleteMessage();
    } catch {}

    await ctx.telegram.sendMessage(
      ctx.chat.id,
      "Вы вышли из режима редактирования"
    );

    await ctx.telegram.sendMessage(ctx.chat.id, "Что тебя интересует?", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "Демо-версия 📚", callback_data: "demo" }],
          [{ text: "Подписка ⚜️", callback_data: "open_subscription" }],
          [{ text: "Отзывы ☁️", callback_data: "reviews" }],
          [{ text: "Тех. Поддержка ⚒️", callback_data: "support" }],
          [{ text: "Telegram-канал 💅", callback_data: "channel" }],
        ],
      },
    });
  });

  bot.on("text", (ctx) => {
    const key = ctx.session?.adminEditingKey;
    if (!key) return;

    const config = loadConfig();
    const text = ctx.message.text;

    if (key === "admins") {
      const ids = text
        .split(",")
        .map((x) => Number(x.trim()))
        .filter(Boolean);
      config.admins = ids;
    } else if (
      key === "trialDurationDays" ||
      key === "subscriptionDurationDays"
    ) {
      config[key] = Number(text);
    } else {
      config[key] = text;
    }

    saveConfig(config);

    ctx.reply("Значение обновлено.", adminMenu);
    ctx.session = null;
  });
}
