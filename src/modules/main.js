import { loadConfig } from "../utils/config.js";
import { mainMenuPanel } from "./panels/MainMenuPanel.js";
import { safeCall } from "../utils/safeCall.js";

export function setupMain(bot) {
  bot.start(async (ctx) => {
    await safeCall(
      ctx.reply("Что тебя интересует?", mainMenuPanel),
      "main.start reply"
    );
  });

  bot.action("reviews", async (ctx) => {
    await safeCall(
      ctx.editMessageText("Отзывы пока в разработке", mainMenuPanel),
      "main.reviews edit"
    );
  });

  bot.action("support", async (ctx) => {
    const { supportUrl } = loadConfig();
    await safeCall(
      ctx.editMessageText(`Техподдержка: ${supportUrl}`, mainMenuPanel),
      "main.support edit"
    );
  });

  bot.action("channel", async (ctx) => {
    const { channelUrl } = loadConfig();
    await safeCall(
      ctx.editMessageText(`Наш канал: ${channelUrl}`, mainMenuPanel),
      "main.channel edit"
    );
  });
}
