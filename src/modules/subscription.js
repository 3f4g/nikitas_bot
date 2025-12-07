import { Markup } from "telegraf";
import { safeCall } from "../utils/safeCall.js";
import { loadConfig } from "../utils/config.js";

const subscriptionMenu = Markup.inlineKeyboard([
  [Markup.button.callback("Подписка 💵", "sub_plans")],
  [Markup.button.callback("О подписке ⚜️", "sub_about")],
  [Markup.button.callback("Промокод 🐾", "sub_promo")],
  [Markup.button.callback("Вернуться назад 👀", "sub_back")],
]);

const planMenu = Markup.inlineKeyboard([
  [Markup.button.callback("1 месяц — 599₽", "plan_month")],
  [Markup.button.callback("1 год — 999₽", "plan_year")],
  [Markup.button.callback("Навсегда — 1299₽", "plan_lifetime")],
  [Markup.button.callback("Вернуться назад 👀", "sub_back")],
]);

const backButton = Markup.inlineKeyboard([
  [Markup.button.callback("Вернуться назад 👀", "sub_back")],
]);


export function setupSubscription(bot) {
  bot.action("open_subscription", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "open_subscription.answerCbQuery");
    await safeCall(
      ctx.editMessageText("Меню подписки:", {
        parse_mode: "HTML",
        reply_markup: subscriptionMenu.reply_markup,
      }),
      "open_subscription.editMessageText"
    );
  });

  bot.action("sub_about", async (ctx) => {
    const { subscriptionDescription } = loadConfig();

    await safeCall(ctx.answerCbQuery(), "sub_about.answerCbQuery");
    await safeCall(
      ctx.editMessageText(subscriptionDescription, {
        parse_mode: "HTML",
        reply_markup: backButton.reply_markup,
      }),
      "sub_about.editMessageText"
    );
  });

  bot.action("sub_plans", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "sub_plans.answerCbQuery");
    await safeCall(
      ctx.editMessageText("Выбери вариант подписки:", {
        reply_markup: planMenu.reply_markup,
      }),
      "sub_plans.editMessageText"
    );
  });

  bot.action("sub_promo", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "sub_promo.answerCbQuery");
    await safeCall(
      ctx.editMessageText("Введите промокод:", {
        reply_markup: backButton.reply_markup,
      }),
      "sub_promo.editMessageText"
    );
  });

  bot.action("plan_month", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "plan_month.answerCbQuery");
    await safeCall(
      ctx.editMessageText('Оформление подписки: "1 месяц — 599₽"', {
        reply_markup: backButton.reply_markup,
      }),
      "plan_month.editMessageText"
    );
  });

  bot.action("plan_year", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "plan_year.answerCbQuery");
    await safeCall(
      ctx.editMessageText('Оформление подписки: "1 год — 999₽"', {
        reply_markup: backButton.reply_markup,
      }),
      "plan_year.editMessageText"
    );
  });

  bot.action("plan_lifetime", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "plan_lifetime.answerCbQuery");
    await safeCall(
      ctx.editMessageText('Оформление подписки: "Навсегда — 1299₽"', {
        reply_markup: backButton.reply_markup,
      }),
      "plan_lifetime.editMessageText"
    );
  });

  bot.action("sub_back", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "sub_back.answerCbQuery");
    await safeCall(ctx.deleteMessage(), "sub_back.deleteMessage");

    await safeCall(
      ctx.telegram.sendMessage(ctx.chat.id, "Что тебя интересует?", {
        reply_markup: {
          inline_keyboard: [
            [{ text: "Демо-версия 📚", callback_data: "demo" }],
            [{ text: "Подписка ⚜️", callback_data: "open_subscription" }],
            [{ text: "Отзывы ☁️", callback_data: "reviews" }],
            [{ text: "Тех. Поддержка ⚒️", callback_data: "support" }],
            [{ text: "Telegram-канал 💅", callback_data: "channel" }],
          ],
        },
      }),
      "sub_back.sendMainMenu"
    );
  });
}
