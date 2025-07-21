import { sendKunlikPhoneReports } from "../../intervals/kunlikPhoneReports.js";
import { sendKunlikPinflReports } from "../../intervals/kunlikPinflReports.js";
import { nazoratchilarKunlikTushum } from "../../intervals/nazoratchilarKunlikTushum.js";
import { sendMFYIncomeReport } from "../../intervals/sendMFYIncomeReport.js";
import xatlovchilarIshiHisobot from "../../intervals/xatlovchilarIshiHisobot.js";
import { find_address_by_pinfil_from_mvd } from "../../api/mvd-pinfil.js";
import { Composer } from "telegraf";
import { messages } from "@lib/messages.js";
import { Admin } from "@models/Admin.js";
import { MyContext } from "types/botContext.js";
import { isAdmin } from "@bot/middlewares/scene/utils/validator.js";

// Main codes =====================================================================================
const composer = new Composer<MyContext>();

composer.command("admin", async (ctx) => {
  const admins = await Admin.find();
  if (admins.length === 0) ctx.scene.enter("newAdmin");
});
composer.command("change_password", async (ctx) => {
  if (!(await isAdmin(ctx.from.id))) return ctx.reply(messages.youAreNotAdmin);
  ctx.scene.enter("changePasswordScene");
});

// ======================== Special functions (not required just shortcuts) ========================//

composer.command("tushum", async (ctx) => {
  await nazoratchilarKunlikTushum();
  sendMFYIncomeReport(1144);
});
composer.hears(/pnflreport_\w/g, async (ctx) => {
  const companyId = Number(ctx.message.text.split("_")[1]);
  sendKunlikPinflReports(companyId);
});

composer.hears(/mvd_\w+/g, async (ctx) => {
  const address = await find_address_by_pinfil_from_mvd(
    Number(ctx.message.text.split("_")[1])
  );
  ctx.reply(
    `<code>${address.details.PermanentRegistration.Cadastre}</code>\n<code>${address.details.PermanentRegistration.Address}</code>`,
    { parse_mode: "HTML" }
  );
});

composer.hears("xatlovchilar_report", async (ctx) => {
  xatlovchilarIshiHisobot(1144);
});

composer.hears("phone_report", () => {
  sendKunlikPhoneReports(1144);
});

composer.hears("pochtaHarajatiniTekshirishScene", (ctx) =>
  ctx.scene.enter("pochtaHarajatiniTekshirishScene")
);
composer.hears(
  "Talabnomalarni import qilish",

  (ctx) => {
    ctx.scene.enter("uploadWarningTozamakonScene");
  }
);

export default composer;
