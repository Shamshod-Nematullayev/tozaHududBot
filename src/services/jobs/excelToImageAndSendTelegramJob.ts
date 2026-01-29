import { Job } from "agenda";
import { JobPayloads, JobNames } from "./job.type.js";
import fs from "fs";
import { readExcel } from "@helpers/getJsonFromExcel.js";
import { notificationService } from "@services/notification.js";
import { groupArray } from "@helpers/groupArray.js";
import { createImgFromHtml } from "@helpers/createImgFromHtml.js";
import { renderHtmlByEjs } from "@helpers/renderHtmlByEjs.js";
import { bot } from "@bot/core/bot.js";
import { sendHtmlAsPhoto } from "@helpers/sendHtmlAsPhoto.js";

export async function excelToImageAndSendTelegramJob(
  job: Job<JobPayloads[typeof JobNames.ExcelToImageAndSendTelegram]>
) {
  const payload = job.attrs.data;
  try {
    console.log("=== ExcelToImageAndSendTelegram Job Started ===");
    console.log("Job ID:", job.attrs._id);
    console.log("Payload:", payload);

    // get excel
    const excelFile = fs.readFileSync(payload.excelFilePath);
    // parse excel to array
    const array = readExcel(excelFile) as {
      group: string;
      [key: string]: string;
    }[];

    if (array.length === 0) {
      throw new Error(
        "Excel fayl bo'shligi sababli, telegram gruppaga yuborilmadi"
      );
    }
    if (array[0].group === "" || array[0].group === undefined) {
      throw new Error(
        "Excel faylda group qiymati bo'shligi sababli, telegram gruppaga yuborilmadi"
      );
    }

    // group array by field
    const groupedArray = groupArray(array, "group");
    // create images
    for (const groupName in groupedArray) {
      const group = groupedArray[groupName];
      const html = await renderHtmlByEjs("scaledTable.ejs", {
        data: group,
      });
      await sendHtmlAsPhoto(
        {
          htmlString: html,
          selector: "table",
        },
        payload.telegramChatId,
        {
          caption: groupName,
        }
      );
    }

    console.log("=== ExcelToImageAndSendTelegram Job Finished ===");
    notificationService.createNotification({
      type: "info",
      message: "Telegram gruppaga yuborildi",
      receiver: {
        id: payload.userId,
        name: payload.userId,
      },
      sender: {
        id: "system",
        name: "GreenZone System",
      },
    });
  } catch (err: any) {
    notificationService.createNotification({
      type: "alert",
      message: err.message,
      receiver: {
        id: payload.userId,
        name: payload.userId,
      },
      sender: {
        id: "system",
        name: "GreenZone System",
      },
    });
    console.error("🔥 Job crashed:", err);
  } finally {
    fs.unlinkSync(payload.excelFilePath);
    job.remove();
  }
}
