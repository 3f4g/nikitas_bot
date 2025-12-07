import { mainMenuPanel } from "./panels/MainMenuPanel.js";

export function setupMain(bot) {
  bot.start((ctx) => {
    ctx.reply("Что тебя интересует?", mainMenuPanel);
  });

  bot.action("reviews", (ctx) => {
    ctx.editMessageText("Отзывы пока в разработке", mainMenuPanel);
  });

  bot.action("support", (ctx) => {
    ctx.editMessageText("Техподдержка: @your_support", mainMenuPanel);
  });

  bot.action("channel", (ctx) => {
    ctx.editMessageText("Наш канал: https://t.me/your_channel", mainMenuPanel);
  });
}
