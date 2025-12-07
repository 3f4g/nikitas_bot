import { Markup } from 'telegraf';

const mainMenu = Markup.inlineKeyboard([
  [Markup.button.callback('Демо-версия 📚', 'demo')],
  [Markup.button.callback('Подписка ⚜️', 'open_subscription')],
  [Markup.button.callback('Отзывы ☁️', 'reviews')],
  [Markup.button.callback('Тех. Поддержка ⚒️', 'support')],
  [Markup.button.callback('Telegram-канал 💅', 'channel')]
]);

export function setupMain(bot) {
  bot.start((ctx) => {
    ctx.reply('Что тебя интересует?', mainMenu);
  });

  bot.action('reviews', (ctx) => {
    ctx.editMessageText('Отзывы пока в разработке', mainMenu);
  });

  bot.action('support', (ctx) => {
    ctx.editMessageText('Техподдержка: @your_support', mainMenu);
  });

  bot.action('channel', (ctx) => {
    ctx.editMessageText('Наш канал: https://t.me/your_channel', mainMenu);
  });
}