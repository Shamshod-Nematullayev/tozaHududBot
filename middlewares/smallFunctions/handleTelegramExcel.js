const https = require("https");
const fs = require("fs");
const xlsx = require("xlsx");
const { messages } = require("../../lib/messages");
const { keyboards } = require("../../requires");

// Helper function to download file using HTTPS
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close(resolve);
        });
      })
      .on("error", (error) => {
        fs.unlink(dest, () => reject(error));
      });
  });
}

async function handleTelegramExcel(ctx) {
  try {
    if (!ctx.message) {
      ctx.scene.leave();
    }
    if (
      ctx.message.document &&
      (ctx.message.document.mime_type ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        ctx.message.document.mime_type === "application/vnd.ms-excel")
    ) {
      const xlsxLink = await ctx.telegram.getFileLink(
        ctx.message.document.file_id
      );
      ctx.reply(messages.pleaseWait);

      const filePath = "./alert_letter.xls"; // Path where the Excel file will be saved

      await downloadFile(xlsxLink.href, filePath); // Download the Excel file

      const xls = xlsx.readFile(filePath); // Read the Excel file
      const jsonData = xlsx.utils.sheet_to_json(xls.Sheets[xls.SheetNames[0]]); // Convert sheet to JSON

      // Further processing with jsonData
      console.log("Excel data:", jsonData);

      // Optionally, reply or perform actions with the processed data
      await ctx.reply("Excel file processed successfully!");

      // Clean up: Remove the downloaded file
      await fs.unlinkSync(filePath);

      return jsonData; // Return JSON data if needed
    } else {
      ctx.reply("Invalid or unsupported document type.", keyboards.cancelBtn);
    }
  } catch (error) {
    console.error("Error handling Excel file:", error);
    throw error;
  }
}

module.exports = { handleTelegramExcel };
