import { Markup } from 'telegraf';
import { mainMenuPanel } from './panels/MainMenuPanel.js';

const subscriptionMenu = Markup.inlineKeyboard([
  [Markup.button.callback('Подписка 💵', 'sub_plans')],
  [Markup.button.callback('О подписке ⚜️', 'sub_about')],
  [Markup.button.callback('Промокод 🐾', 'sub_promo')],
  [Markup.button.callback('Вернуться назад 👀', 'sub_back')]
]);

const planMenu = Markup.inlineKeyboard([
  [Markup.button.callback('1 месяц — 599₽', 'plan_month')],
  [Markup.button.callback('1 год — 999₽', 'plan_year')],
  [Markup.button.callback('Навсегда — 1299₽', 'plan_lifetime')],
  [Markup.button.callback('Вернуться назад 👀', 'sub_back')]
]);

const backButton = Markup.inlineKeyboard([
  [Markup.button.callback('Вернуться назад 👀', 'sub_back')]
]);

const aboutText = `
<b>Оплатив подписку, ты получишь:</b>

⚡ Безлимитный доступ к базе из более чем 1000 тестов.  
🧵 Препараты на большом и малом увеличении.  
🧠 Переход на новый уровень понимания гистологии.  

<i>*Активируй демо-версию и познакомься бесплатно</i>
`;

export function setupSubscription(bot) {
  
  bot.action('open_subscription', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('Меню подписки:', {
      parse_mode: 'HTML',
      reply_markup: subscriptionMenu.reply_markup
    });
  });

  bot.action('sub_about', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText(aboutText, {
      parse_mode: 'HTML',
      reply_markup: backButton.reply_markup
    });
  });

  bot.action('sub_plans', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('Выбери вариант подписки:', {
      reply_markup: planMenu.reply_markup
    });
  });

  bot.action('sub_promo', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('Введите промокод:', {
      reply_markup: backButton.reply_markup
    });
  });

  bot.action('plan_month', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('Оформление подписки: "1 месяц — 599₽"', {
      reply_markup: backButton.reply_markup
    });
  });

  bot.action('plan_year', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('Оформление подписки: "1 год — 999₽"', {
      reply_markup: backButton.reply_markup
    });
  });

  bot.action('plan_lifetime', async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText('Оформление подписки: "Навсегда — 1299₽"', {
      reply_markup: backButton.reply_markup
    });
  });

  bot.action('sub_back', async (ctx) => {
    await ctx.answerCbQuery();
    
    try { await ctx.deleteMessage(); } catch {}

    await ctx.telegram.sendMessage(ctx.chat.id, 'Что тебя интересует?', {
  
      reply_markup: {
        mainMenuPanel
      }
    });
  });
}