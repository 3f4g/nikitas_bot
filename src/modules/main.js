import { loadConfig } from "../utils/config.js";
import { mainMenuPanel } from "./panels/MainMenuPanel.js";

export function setupMain(bot) {
  const config = loadConfig();

  bot.start((ctx) => {
    ctx.reply("Что тебя интересует?", mainMenuPanel);
  });

  bot.action("reviews", (ctx) => {
    ctx.editMessageText("Отзывы пока в разработке", mainMenuPanel);
  });

  bot.action("support", (ctx) => {
    ctx.editMessageText(`Техподдержка: ${config.supportUrl}`, mainMenuPanel);
  });

  bot.action("channel", (ctx) => {
    ctx.editMessageText(`Наш канал: ${config.channelUrl}`, mainMenuPanel);
  });
}
