import { getInspector } from "@bot/utils/getInspector.js";
import { Admin } from "@models/Admin.js";
import { Mahalla } from "@models/Mahalla.js";
import { SpecialTaskItem } from "@models/SpecialTaskItem.js";
import { Composer, Context, Markup } from "telegraf";
import { CallbackQuery, Update } from "telegraf/typings/core/types/typegram.js";
import { MyContext } from "types/botContext.js";

const composer = new Composer<MyContext>();
const PAGE_SIZE = 50;

// ================== MAHALLA TANLASH ==================

async function handleSpecialTask(
  ctx: Context<Update.CallbackQueryUpdate<CallbackQuery>> &
    Omit<MyContext, keyof Context<Update>> & {
      match: RegExpExecArray;
    },
  type: string
) {
  const inspector = await getInspector(ctx.from?.id);
  const admin = await Admin.findOne({ user_id: ctx.from?.id });

  if (!inspector && !admin) return ctx.reply("Sizda huquq yo'q!");

  let filters: any = {
    companyId: inspector?.companyId,
  };

  if (!admin) {
    filters["biriktirilganNazoratchi.inspactor_id"] = inspector.id;
  }

  const mahallalar = await Mahalla.find(filters);

  if (!mahallalar.length)
    return ctx.reply("Sizga biriktirilgan mahallalar yo'q!");

  const buttons = mahallalar.map((mfy) => [
    Markup.button.callback(mfy.name, `${type}_${mfy.id}_1`),
  ]);

  await ctx.deleteMessage();
  await ctx.reply("Mahallani tanlang!", Markup.inlineKeyboard(buttons));
}

// ================== ACTIONLAR ==================

composer.action("electricity_special", (ctx) =>
  handleSpecialTask(ctx, "electricity")
);

composer.action("phone_special", (ctx) => handleSpecialTask(ctx, "phone"));

// ================== TASKLARNI KO'RSATISH ==================

async function showList(
  ctx: Context<Update.CallbackQueryUpdate<CallbackQuery>> &
    Omit<MyContext, keyof Context<Update>> & {
      match: RegExpExecArray;
    },
  type: string
) {
  if (!("data" in ctx.update.callback_query)) return;

  const [, mfyId, pageStr] = ctx.update.callback_query.data.split("_");

  const page = Number(pageStr) || 1;
  const skip = (page - 1) * PAGE_SIZE;

  const baseFilter = {
    mahallaId: mfyId,
    type,
    status: "in-progress",
  };

  const total = await SpecialTaskItem.countDocuments(baseFilter);

  const tasks = await SpecialTaskItem.find(baseFilter)
    .skip(skip)
    .limit(PAGE_SIZE);

  let message = `Mazkur abonentlarning ${
    type === "phone" ? "telefon raqamlarini" : "elektr kodlarini"
  } aniqlab botdan kiritish kerak:\n\n`;

  if (!tasks.length) {
    message += "Topshiriqlar mavjud emas.";
  }

  tasks.forEach((task, i) => {
    message += `${skip + i + 1}. ${task.accountNumber} ${task.fullName}\n`;
  });

  // ================== PAGING BUTTONS ==================

  const navButtons = [];

  if (page > 1) {
    navButtons.push(
      Markup.button.callback("⬅️ Oldingi", `${type}_${mfyId}_${page - 1}`)
    );
  }

  if (skip + PAGE_SIZE < total) {
    navButtons.push(
      Markup.button.callback("Keyingi ➡️", `${type}_${mfyId}_${page + 1}`)
    );
  }

  await ctx.deleteMessage();
  await ctx.reply(
    message,
    navButtons.length ? Markup.inlineKeyboard([navButtons]) : undefined
  );
}

// ================== REGEX ACTIONLAR ==================

composer.action(/^electricity_/, (ctx) => showList(ctx, "electricity"));

composer.action(/^phone_/, (ctx) => showList(ctx, "phone"));

export default composer;
