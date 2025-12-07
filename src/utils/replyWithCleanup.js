const lastBotMessages = new Map();

export async function replyWithCleanup(ctx, text, keyboard) {
  try {
    // Удаляем сообщение пользователя
    if (ctx.message) {
      await ctx.deleteMessage(ctx.message.message_id).catch(() => {});
    }

    // Удаляем прошлое сообщение бота
    const botMsgId = lastBotMessages.get(ctx.from.id);
    if (botMsgId) {
      await ctx.deleteMessage(botMsgId).catch(() => {});
    }

    // Отправляем новое сообщение
    const sent = await ctx.reply(text, keyboard ?? undefined);

    // Запоминаем id отправленного сообщения
    lastBotMessages.set(ctx.from.id, sent.message_id);
  } catch (err) {
    console.error('cleanup error:', err);
  }
}