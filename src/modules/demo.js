import { Markup } from "telegraf";
import db from "../db/db.js";
import { mainMenuPanel } from "./panels/MainMenuPanel.js";
import { loadConfig } from "../utils/config.js";
import { safeCall } from "../utils/safeCall.js";

const { DEMO_CHANNEL_URL, DEMO_CHANNEL_ID, trialDurationDays } = loadConfig();

const demoKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback("Проверить", "demo_check"),
    Markup.button.url("Подписаться", DEMO_CHANNEL_URL || ""),
  ],
  [Markup.button.callback("Назад", "demo_back")],
]);

function giveTrial(userId) {
  const expiresAt = Date.now() + trialDurationDays * 24 * 60 * 60 * 1000;

  db.prepare(
    `
    INSERT INTO users (id, expiresAt)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET expiresAt = excluded.expiresAt
  `
  ).run(userId, expiresAt);

  return expiresAt;
}

export function setupDemo(bot) {
  bot.action("demo", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "demo.answerCbQuery");
    await safeCall(
      ctx.editMessageText(
        "Для оформления пробной подписки необходимо подписаться на телеграм канал",
        demoKeyboard
      ),
      "demo.editMessageText"
    );
  });

  bot.action("demo_check", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "demo_check.answerCbQuery");

    const userId = ctx.from.id;

    let member;
    try {
      member = await ctx.telegram.getChatMember(DEMO_CHANNEL_ID, userId);
    } catch {
      member = null;
    }

    if (!member || member.status === "left" || member.status === "kicked") {
      await safeCall(
        ctx.editMessageText(
          "Похоже, вы ещё не подписались на канал. Подпишитесь и нажмите «Проверить» ещё раз.",
          demoKeyboard
        ),
        "demo_check.notSubscribed"
      );
      return;
    }

    const expiresAt = giveTrial(userId);
    const date = new Date(expiresAt).toLocaleString("ru-RU");

    await safeCall(
      ctx.editMessageText(`Пробная подписка активирована до:\n<b>${date}</b>`, {
        reply_markup: mainMenuPanel,
        parse_mode: "HTML",
      }),
      "demo_check.success"
    );
  });

  bot.action("demo_back", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "demo_back.answerCbQuery");

    await safeCall(ctx.deleteMessage(), "demo_back.deleteMessage");

    await safeCall(
      ctx.telegram.sendMessage(ctx.chat.id, "Что тебя интересует?", {
        reply_markup: mainMenuPanel.reply_markup,
      }),
      "demo_back.sendMainMenu"
    );
  });
}
