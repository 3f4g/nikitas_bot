import { Markup } from "telegraf";
import db from "../db/db.js";
import { safeCall } from "../utils/safeCall.js";

function ensureSession(ctx) {
  if (!ctx.session) ctx.session = {};
}

/* ==========================
   KEYBOARDS
========================== */

function subscriptionsListKeyboard(subs) {
  const rows = subs.map((s) => [
    Markup.button.callback(
      `${s.title} — ${s.price / 100}₽ / ${s.durationDays} дн.`,
      `admin_subscription_open_${s.id}`
    ),
  ]);

  rows.unshift([
    Markup.button.callback("➕ Создать подписку", "admin_subscription_create"),
  ]);

  rows.push([
    Markup.button.callback("↩️ Назад", "admin_back"),
  ]);

  return Markup.inlineKeyboard(rows);
}

function subscriptionViewKeyboard(id) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("✏️ Редактировать", `admin_subscription_edit_${id}`)],
    [Markup.button.callback("🗑 Удалить", `admin_subscription_delete_${id}`)],
    [Markup.button.callback("↩️ Назад", "admin_subscriptions_edit")],
  ]);
}

function editFieldsKeyboard(id) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Название", `admin_subscription_edit_title_${id}`)],
    [Markup.button.callback("Цена", `admin_subscription_edit_price_${id}`)],
    [Markup.button.callback("Срок действия", `admin_subscription_edit_duration_${id}`)],
    [Markup.button.callback("↩️ Назад", `admin_subscription_open_${id}`)],
  ]);
}

/* ==========================
   MODULE
========================== */

export function setupAdminSubscriptions(bot) {
  /* ==========================
     OPEN SUBSCRIPTIONS LIST
  ========================== */
  bot.action("admin_subscriptions_edit", async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "admin.subs.open");

    const subs = db.prepare(`SELECT * FROM subscriptions`).all();

    await safeCall(
      ctx.editMessageText(
        subs.length ? "Существующие подписки:" : "Подписок пока нет.",
        { reply_markup: subscriptionsListKeyboard(subs).reply_markup }
      ),
      "admin.subs.list"
    );
  });

  /* ==========================
     CREATE SUBSCRIPTION
  ========================== */
  bot.action("admin_subscription_create", async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "admin.subs.create.start");

    ctx.session.creatingSubscription = {
      step: "title",
      data: {},
    };

    await safeCall(
      ctx.editMessageText("Введите название подписки:"),
      "admin.subs.create.title"
    );
  });

  bot.on("text", async (ctx) => {
    ensureSession(ctx);
    const s = ctx.session.creatingSubscription;
    if (!s) return;

    const text = ctx.message.text;

    // STEP 1 — TITLE
    if (s.step === "title") {
      s.data.title = text;
      s.step = "price";
      await safeCall(ctx.reply("Введите цену (в рублях):"), "admin.subs.price");
      return;
    }

    // STEP 2 — PRICE
    if (s.step === "price") {
      s.data.price = Number(text) * 100;
      s.step = "duration";
      await safeCall(
        ctx.reply("Введите срок действия (в днях):"),
        "admin.subs.duration"
      );
      return;
    }

    // STEP 3 — DURATION
    if (s.step === "duration") {
      s.data.durationDays = Number(text);

      db.prepare(`
        INSERT INTO subscriptions (title, price, durationDays)
        VALUES (?, ?, ?)
      `).run(
        s.data.title,
        s.data.price,
        s.data.durationDays
      );

      ctx.session.creatingSubscription = null;

      await safeCall(
        ctx.reply("✅ Подписка создана."),
        "admin.subs.created"
      );

      // возвращаемся к списку
      await bot.handleUpdate({
        callback_query: {
          data: "admin_subscriptions_edit",
          message: ctx.message,
        },
      });
    }
  });

  /* ==========================
     VIEW SUBSCRIPTION
  ========================== */
  bot.action(/^admin_subscription_open_(\d+)$/, async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "admin.subs.openOne");

    const id = Number(ctx.match[1]);
    const sub = db
      .prepare(`SELECT * FROM subscriptions WHERE id = ?`)
      .get(id);

    if (!sub) return;

    await safeCall(
      ctx.editMessageText(
        `📦 <b>${sub.title}</b>\n\n💰 Цена: ${sub.price / 100} ₽\n⏳ Срок: ${sub.durationDays} дней`,
        {
          parse_mode: "HTML",
          reply_markup: subscriptionViewKeyboard(id).reply_markup,
        }
      ),
      "admin.subs.view"
    );
  });

  /* ==========================
     EDIT SUBSCRIPTION
  ========================== */
  bot.action(/^admin_subscription_edit_(\d+)$/, async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "admin.subs.editMenu");

    const id = Number(ctx.match[1]);

    await safeCall(
      ctx.editMessageText(
        "Что вы хотите изменить?",
        { reply_markup: editFieldsKeyboard(id).reply_markup }
      ),
      "admin.subs.edit.menu"
    );
  });

  /* ==========================
     DELETE SUBSCRIPTION
  ========================== */
  bot.action(/^admin_subscription_delete_(\d+)$/, async (ctx) => {
    ensureSession(ctx);
    await safeCall(ctx.answerCbQuery(), "admin.subs.delete");

    const id = Number(ctx.match[1]);
    db.prepare(`DELETE FROM subscriptions WHERE id = ?`).run(id);

    await safeCall(
      ctx.editMessageText("🗑 Подписка удалена."),
      "admin.subs.deleted"
    );

    await bot.handleUpdate({
      callback_query: {
        data: "admin_subscriptions_edit",
        message: ctx.callbackQuery.message,
      },
    });
  });
}