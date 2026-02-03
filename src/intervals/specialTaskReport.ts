import { deletePreviousReport } from "@bot/helpers/deletePreviousReport.js";
import { createImgFromHtml } from "@helpers/createImgFromHtml.js";
import { renderHtmlByEjs } from "@helpers/renderHtmlByEjs.js";
import { sendHtmlAsPhoto } from "@helpers/sendHtmlAsPhoto.js";
import { Abonent } from "@models/Abonent.js";
import { Company } from "@models/Company.js";
import { Mahalla } from "@models/Mahalla.js";
import { ReportType } from "@models/ReportsMessage.js";
import { SpecialTaskItem } from "@models/SpecialTaskItem.js";

async function updateTasks(companyId: number, type: "phone" | "electricity") {
  const confirmType =
    type === "phone" ? "phone_tasdiqlandi" : "ekt_kod_tasdiqlandi";

  // 1. Barcha tasklarni olish
  const tasks = await SpecialTaskItem.find({ companyId });

  if (!tasks.length) return;

  // 2. Mos abonentlarni topish
  const abonents = await Abonent.find({
    companyId,
    [`${confirmType}.confirm`]: true,
    [`${confirmType}.updated_at`]: { $gt: new Date(2026, 0, 15) },
    id: { $in: tasks.map((t) => t.id) },
  });

  if (!abonents.length) return;

  // 3. Abonent id larini olish
  const abonentIds = abonents.map((a) => a.id);

  // 4. Shu id larga mos tasklarni DONE qilish
  await SpecialTaskItem.updateMany(
    { id: { $in: abonentIds } },
    { $set: { status: "completed" } }
  );
}

export async function specialTaskReport(
  companyId = 1144,
  type: "phone" | "electricity"
) {
  try {
    // Update all tasks
    await updateTasks(companyId, type);

    // Get all tasks
    const tasks = await SpecialTaskItem.find({ companyId });
    const mahallas = await Mahalla.find({ companyId });

    // getResults
    const result: {
      mahallaName: string;
      allTasksCount: number;
      complatedTasksCount: number;
      complatedPercent: number;
    }[] = [];

    for (const mahalla of mahallas) {
      const mahallaTasks = tasks.filter((t) => t.mahallaId === mahalla.id);
      const allTasksCount = mahallaTasks.length;
      const complatedTasksCount = mahallaTasks.filter(
        (t) => t.status === "completed"
      ).length;
      let complatedPercent = (complatedTasksCount / allTasksCount) * 100;
      if (complatedPercent > 100) complatedPercent = 100;
      if (isNaN(complatedPercent)) complatedPercent = 0;
      result.push({
        mahallaName: mahalla.name,
        allTasksCount,
        complatedTasksCount,
        complatedPercent,
      });
    }

    // sorting, filtering
    result.sort((a, b) => b.complatedPercent - a.complatedPercent);
    // draw and send telegram
    const company = await Company.findOne({ id: companyId });
    const html = await renderHtmlByEjs("specialTaskReport.ejs", {
      result,
      type,
    });
    const msg = await sendHtmlAsPhoto(
      {
        htmlString: html,
        selector: "body",
      },
      company?.GROUP_ID_NAZORATCHILAR as string,
      {
        parse_mode: "HTML",
        caption:
          "Maxsus topshiriq bo'yicha ma'lumot, " +
          new Date().toLocaleDateString(),
      }
    );

    await deletePreviousReport(
      companyId,
      ReportType.specialTaskReportByMFY,
      msg
    );
  } catch (error) {
    console.error(error);
  }
}

export async function specialTaskReportByInspectors(companyId = 1144) {
  try {
    // TODO
  } catch (error) {
    console.error(error);
  }
}
