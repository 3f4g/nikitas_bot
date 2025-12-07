import { Markup } from "telegraf";
import db from "../db/db.js";
import { mainMenuPanel } from "./panels/MainMenuPanel.js";
import { loadConfig } from "../utils/config.js";

const config = loadConfig();

const demoKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback("Проверить", "demo_check"),
    Markup.button.url("Подписаться", config.DEMO_CHANNEL_URL || ""),
  ],
  [Markup.button.callback("Назад", "demo_back")],
]);

function giveTrial(userId) {
  const { trialDurationDays } = config;

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
    await ctx.answerCbQuery();
    await ctx.editMessageText(
      "Для оформления пробной подписки необходимо подписаться на телеграм канал",
      demoKeyboard
    );
  });

  bot.action("demo_check", async (ctx) => {
    await ctx.answerCbQuery();
    const userId = ctx.from.id;

    let member;
    try {
      member = await ctx.telegram.getChatMember(config.DEMO_CHANNEL_ID, userId);
    } catch {
      member = null;
    }

    if (!member || member.status === "left" || member.status === "kicked") {
      await ctx.editMessageText(
        "Похоже, вы ещё не подписались на канал. Подпишитесь и нажмите «Проверить» ещё раз.",
        demoKeyboard
      );
      return;
    }

    const expiresAt = giveTrial(userId);
    const date = new Date(expiresAt).toLocaleString("ru-RU");
    await ctx.editMessageText(
      `Пробная подписка активирована до:\n<b>${date}</b>`,
      { reply_markup: mainMenuPanel, parse_mode: "HTML" }
    );
  });

  bot.action("demo_back", async (ctx) => {
    await ctx.answerCbQuery();
    try {
      await ctx.deleteMessage();
    } catch {}
    await ctx.telegram.sendMessage(ctx.chat.id, "Что тебя интересует?", {
      reply_markup: mainMenuPanel.reply_markup,
    });
  });
}
