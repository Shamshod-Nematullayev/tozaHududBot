import { getInspector } from "@bot/utils/getInspector.js";
import { Admin } from "@models/Admin.js";
import { Mahalla } from "@models/Mahalla.js";
import { SpecialTaskItem } from "@models/SpecialTaskItem.js";
import { Composer, Context, Markup } from "telegraf";
import { CallbackQuery, Update } from "telegraf/typings/core/types/typegram.js";
import { MyContext } from "types/botContext.js";

const composer = new Composer<MyContext>();

async function handleSpecialTask(
  ctx: Context<Update.CallbackQueryUpdate<CallbackQuery>> &
    Omit<MyContext, keyof Context<Update>> & {
      match: RegExpExecArray;
    },
  type: string
) {
  const inspector = await getInspector(ctx.from?.id);

  const admin = await Admin.findOne({ user_id: ctx.from?.id });
  let filters: any = {
    companyId: inspector.companyId,
  };
  if (!inspector && !admin) return ctx.reply("Sizda huquq yo'q!");
  if (!admin) {
    filters["biriktirilganNazoratchi.inspactor_id"] = inspector.id;
  }
  const mahallalar = await Mahalla.find(filters);

  if (!mahallalar.length)
    return ctx.reply("Sizga biriktirilgan mahallalar yo'q!");

  const buttons = mahallalar.map((mfy) => [
    Markup.button.callback(mfy.name, type + "_" + mfy.id),
  ]);
  await ctx.deleteMessage();
  await ctx.reply("Mahallani tanlang!", Markup.inlineKeyboard(buttons));
}

// ================== QABUL QILISH =======================
composer.action("electricity_special", async (ctx) =>
  handleSpecialTask(ctx, "electricity")
);

composer.action("phone_special", async (ctx) =>
  handleSpecialTask(ctx, "phone")
);

async function showList(
  ctx: Context<Update.CallbackQueryUpdate<CallbackQuery>> &
    Omit<MyContext, keyof Context<Update>> & {
      match: RegExpExecArray;
    },
  type: string
) {
  if (!("data" in ctx.update.callback_query)) return;
  const mfyId = ctx.update.callback_query.data?.split("_")[1];
  const tasks = await SpecialTaskItem.find({
    mahallaId: mfyId,
    type,
    status: "in-progress",
  });
  let message = `Mazkur abonentlarning ${
    type === "phone" ? "telefon raqamlarini" : "elektr kodlarini"
  } aniqlab botdan kiritish kerak:\n\n`;
  tasks.forEach((task, i) => {
    message += `${i + 1}. ${task.accountNumber} ${task.fullName}\n`;
  });
  await ctx.deleteMessage();
  await ctx.reply(message);
}

composer.action(/electricity_/, (ctx) => showList(ctx, "electricity"));
composer.action(/phone_/, (ctx) => showList(ctx, "phone"));

export default composer;
