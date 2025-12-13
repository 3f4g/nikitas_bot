import { Markup } from "telegraf";
import db from "../db/db.js";
import { safeCall } from "../utils/safeCall.js";
import { mainMenuPanel } from "./panels/MainMenuPanel.js";

function ensureSession(ctx) {
  if (!ctx.session) ctx.session = {};
}

function hasActiveSubscription(userId) {
  const row = db
    .prepare("SELECT expiresAt FROM users WHERE id = ?")
    .get(userId);

  if (!row?.expiresAt) return false;
  return Number(row.expiresAt) > Date.now();
}

async function editOrSend(ctx, text, extra, log) {
  try {
    await ctx.editMessageText(text, extra);
  } catch (err) {
    try {
      await ctx.deleteMessage();
    } catch {}

    await safeCall(ctx.telegram.sendMessage(ctx.chat.id, text, extra), log);
  }
}

function testsListKeyboard(tests) {
  const keyboard = tests.map((t) => [
    Markup.button.callback(t.title, `tests_open_${t.id}`),
  ]);

  keyboard.push([Markup.button.callback("↩️ Назад", "tests_back")]);

  return Markup.inlineKeyboard(keyboard);
}

function userQuestionKeyboard() {
  return {
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⬅️", callback_data: "tests_prev" },
          { text: "➡️", callback_data: "tests_next" },
        ],
        [{ text: "🔄 Перевернуть", callback_data: "tests_flip" }],
        [{ text: "↩️ К списку тестов", callback_data: "tests" }],
      ],
    },
  };
}

export function setupTests(bot) {
  bot.action("tests", async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "tests.open");

    const userId = ctx.from?.id;
    if (!userId) return;

    if (!hasActiveSubscription(userId)) {
      await editOrSend(
        ctx,
        "🔒 Доступ к разделу «Тесты» возможен только по активной подписке.\n\nОформите подписку, чтобы продолжить.",
        {
          reply_markup: Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "⚜️ Оформить подписку",
                "open_subscription"
              ),
            ],
            [Markup.button.callback("↩️ Назад", "tests_back")],
          ]).reply_markup,
        },
        "tests.noSubscription"
      );
      return;
    }

    const tests = db
      .prepare("SELECT id, title FROM tests ORDER BY id DESC")
      .all();

    if (!tests.length) {
      await editOrSend(
        ctx,
        "Пока нет доступных тестов.",
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("↩️ Назад", "tests_back")],
          ]).reply_markup,
        },
        "tests.empty"
      );
      return;
    }

    await editOrSend(
      ctx,
      "Выберите тест:",
      { reply_markup: testsListKeyboard(tests).reply_markup },
      "tests.list"
    );
  });

  bot.action("tests_back", async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "tests.back");

    await editOrSend(
      ctx,
      "Главное меню:",
      { reply_markup: mainMenuPanel.reply_markup },
      "tests.back.toMain"
    );
  });

  bot.action(/^tests_open_(\d+)$/, async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "tests.openOne");

    const testId = Number(ctx.match[1]);

    const count = db
      .prepare("SELECT COUNT(*) AS c FROM test_questions WHERE testId = ?")
      .get(testId).c;

    if (!count) {
      await editOrSend(
        ctx,
        "В этом тесте пока нет вопросов.",
        {
          reply_markup: Markup.inlineKeyboard([
            [Markup.button.callback("↩️ Назад", "tests")],
          ]).reply_markup,
        },
        "tests.openOne.empty"
      );
      return;
    }

    ctx.session.currentUserTest = {
      testId,
      index: 0,
      showingBack: false,
    };

    await showUserQuestion(ctx);
  });

  bot.action("tests_next", async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "tests.next");

    const s = ctx.session.currentUserTest;
    if (!s) return;

    const total = db
      .prepare("SELECT COUNT(*) AS c FROM test_questions WHERE testId = ?")
      .get(s.testId).c;

    if (s.index < total - 1) s.index++;
    await showUserQuestion(ctx);
  });

  bot.action("tests_prev", async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "tests.prev");

    const s = ctx.session.currentUserTest;
    if (!s) return;

    if (s.index > 0) s.index--;
    await showUserQuestion(ctx);
  });

  bot.action("tests_flip", async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "tests.flip");

    const s = ctx.session.currentUserTest;
    if (!s) return;

    const q = db
      .prepare("SELECT * FROM test_questions WHERE testId = ? LIMIT 1 OFFSET ?")
      .get(s.testId, s.index);

    const kb = userQuestionKeyboard();

    if (!s.showingBack) {
      if (q.backImageId) {
        await safeCall(
          ctx.editMessageMedia(
            {
              type: "photo",
              media: q.backImageId,
              caption: `🔄 Ответ\n\n${q.backText || ""}`,
            },
            kb
          ),
          "tests.flip.back.image"
        );
      } else {
        await safeCall(
          ctx.editMessageText(`🔄 Ответ\n\n${q.backText || ""}`, kb),
          "tests.flip.back.text"
        );
      }
      s.showingBack = true;
    } else {
      await showUserQuestion(ctx);
    }
  });

  async function showUserQuestion(ctx) {
    ensureSession(ctx);

    const s = ctx.session.currentUserTest;
    if (!s) return;

    const q = db
      .prepare("SELECT * FROM test_questions WHERE testId = ? LIMIT 1 OFFSET ?")
      .get(s.testId, s.index);

    const kb = userQuestionKeyboard();
    s.showingBack = false;

    if (q.frontImageId) {
      await safeCall(
        ctx.editMessageMedia(
          {
            type: "photo",
            media: q.frontImageId,
            caption: `❓ Вопрос ${s.index + 1}\n\n${q.frontText || ""}`,
          },
          kb
        ),
        "tests.show.front.image"
      );
      return;
    }

    await safeCall(
      ctx.editMessageText(
        `❓ Вопрос ${s.index + 1}\n\n${q.frontText || ""}`,
        kb
      ),
      "tests.show.front.text"
    );
  }
}
