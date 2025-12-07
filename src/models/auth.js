import { Markup } from 'telegraf';
import db from '../db/db.js';

function hasAccess(userId) {
  const row = db
    .prepare(`SELECT expiresAt FROM users WHERE id = ?`)
    .get(userId);

  if (!row) return false;

  return Date.now() < row.expiresAt;
}

function grantTrial(userId) {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

  db.prepare(`
    INSERT INTO users (id, expiresAt)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET expiresAt = excluded.expiresAt;
  `).run(userId, expiresAt);

  return { expiresAt };
}

function revokeAccess(userId) {
  const result = db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
  return result.changes > 0;
}


export function withAccess(handler) {
  return (ctx) => {
    const userId = ctx.from.id;

    if (!hasAccess(userId)) {
      return ctx.reply(
        '⛔ У вас нет активной подписки.\nДля доступа нажмите кнопку:',
        Markup.inlineKeyboard([
          [Markup.button.callback('🔥 Оформить подписку', 'auth_subscribe')]
        ])
      );
    }

    return handler(ctx);
  };
}

export function setupAuth(bot) {
  bot.action('auth_subscribe', (ctx) => {
    const userId = ctx.from.id;
    const record = grantTrial(userId);

    const date = new Date(record.expiresAt).toLocaleString();

    return ctx.reply(
      `🎉 Доступ активирован!\nTrial действует до:\n<b>${date}</b>`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('subscribe', (ctx) =>
    ctx.reply(
      'Чтобы получить доступ, нажмите кнопку:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🔥 Оформить подписку', 'auth_subscribe')]
      ])
    )
  );

  bot.command('revoke', (ctx) => {
    const userId = ctx.from.id;
    const removed = revokeAccess(userId);

    if (removed) {
      return ctx.reply('🚫 Подписка удалена. Доступ закрыт.');
    } else {
      return ctx.reply('ℹ У вас нет активной подписки.');
    }
  });
}