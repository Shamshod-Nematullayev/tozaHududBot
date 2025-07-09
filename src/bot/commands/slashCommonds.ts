import { Composer } from "telegraf";
import { MyContext } from "types/botContext";

const composer = new Composer<MyContext>();

composer.command("user", (ctx) => {
  ctx.reply(`Sizning id raqamingiz: <code> ${ctx.from.id}</code>`, {
    parse_mode: "HTML",
  });
});

export default composer;
