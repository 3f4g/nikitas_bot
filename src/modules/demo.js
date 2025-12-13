import { Markup } from "telegraf";
import db from "../db/db.js";
import { mainMenuPanel } from "./panels/MainMenuPanel.js";
import { loadConfig } from "../utils/config.js";
import { safeCall } from "../utils/safeCall.js";

const { channelUrl, channelId, trialDurationDays } = loadConfig();

const demoKeyboard = Markup.inlineKeyboard([
  [
    Markup.button.callback("Проверить", "demo_check"),
    Markup.button.url("Подписаться", channelUrl || ""),
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
  // bot.action("demo", async (ctx) => {
  //   await safeCall(ctx.answerCbQuery(), "demo.answerCbQuery");
  //   await safeCall(
  //     ctx.editMessageText(
  //       "Для оформления пробной подписки необходимо подписаться на телеграм канал",
  //       demoKeyboard
  //     ),
  //     "demo.editMessageText"
  //   );
  // });

  bot.action("demo", async (ctx) => {
  await safeCall(ctx.answerCbQuery(), "demo.answerCbQuery");

  const userId = ctx.from.id;
  const { channelId } = loadConfig();

  // --- 1. Проверяем наличие trial в базе ---
  let row;
  try {
    row = db.prepare(`SELECT expiresAt FROM users WHERE id = ?`).get(userId);
  } catch (e) {
    console.log("demo.dbCheck error:", e.description || e);
    row = null;
  }

  console.log('row', row)

  const now = Date.now();

  // Если trial есть И он ещё не истёк → показываем главное меню
  if (row && row.expiresAt > now) {
    await safeCall(
      ctx.editMessageText(
        `У вас уже активирована пробная подписка до:\n<b>${new Date(
          row.expiresAt
        ).toLocaleString("ru-RU")}</b>`,
        { reply_markup: mainMenuPanel.reply_markup, parse_mode: "HTML" }
      ),
      "demo.alreadyActivated"
    );
    return;
  }

  // --- 2. Trial нет → проверяем подписку на канал ---
  let member;
  try {
    member = await ctx.telegram.getChatMember(channelId, userId);
  } catch (e) {
    console.log("demo.getChatMember error:", e.description || e);
    member = null;
  }

  const isSubscribed =
    member && member.status !== "left" && member.status !== "kicked";

  // --- 3. Если НЕ подписан → показываем панель ---
  if (!isSubscribed) {
    await safeCall(
      ctx.editMessageText(
        "Для получения пробной подписки необходимо подписаться на канал:",
        { reply_markup: demoKeyboard.reply_markup }
      ),
      "demo.needSubscribe"
    );
    return;
  }

  // --- 4. Если подписан → выдаём trial ---
  const expiresAt = giveTrial(userId);
  const date = new Date(expiresAt).toLocaleString("ru-RU");

  await safeCall(
    ctx.editMessageText(
      `🎉 Пробная подписка активирована до:\n<b>${date}</b>`,
      { reply_markup: mainMenuPanel.reply_markup, parse_mode: "HTML" }
    ),
    "demo.trialGranted"
  );
});

  bot.action("demo_check", async (ctx) => {
    await safeCall(ctx.answerCbQuery(), "demo_check.answerCbQuery");

    const userId = ctx.from.id;

    // Получаем актуальный config на каждый вызов
    const { channelId } = loadConfig();

    // Проверяем подписку
    let member;
    try {
      member = await ctx.telegram.getChatMember(channelId, userId);
    } catch (e) {
      console.log("getChatMember error:", e.description || e);
      member = null;
    }

    if (!member || member.status === "left" || member.status === "kicked") {
      await safeCall(
        ctx.editMessageText(
          "Похоже, вы ещё не подписались на канал. Подпишитесь и нажмите «Проверить» ещё раз.",
          { reply_markup: demoKeyboard.reply_markup }
        ),
        "demo_check.notSubscribed"
      );
      return;
    }

    const expiresAt = giveTrial(userId);
    const date = new Date(expiresAt).toLocaleString("ru-RU");

    await safeCall(
      ctx.editMessageText(`Пробная подписка активирована до:\n<b>${date}</b>`, {
        reply_markup: mainMenuPanel.reply_markup,
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
