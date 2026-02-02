import { bot } from "@bot/core/bot.js";

type ReportType = "users" | "payments";
type ReportFormat = "excel" | "pdf" | "image";

export class ReportService {
  async generateReport({
    type,
    filters,
    format,
    telegramChatId,
    responseType = "arraybuffer",
  }: {
    type: ReportType;
    filters: any;
    format: ReportFormat;
    telegramChatId: number;
    responseType: "arraybuffer";
  }) {
    const data = await this.getData(type, filters);
    const formatted = this.formatData(type, data);
    const reportResult = await this.exportReport(format, formatted);
    if (telegramChatId) {
      if (format === "image") {
        bot.telegram.sendPhoto(telegramChatId, { source: reportResult });
      } else {
        bot.telegram.sendDocument(telegramChatId, { source: reportResult });
      }
    }
  }

  async getData(type: ReportType, filters: any) {
    if (type === "users") {
      // return UserModel.find(filters)
    }
    if (type === "payments") {
      // return PaymentModel.find(filters)
    }
  }

  formatData(type: ReportType, data: any) {
    if (type === "users") {
      // return data.map(u:  => ({
      //   Name: u.name,
      //   Phone: u.phone
      // }))
    }
  }

  exportReport(format: ReportFormat, data: any): Promise<Buffer> {
    //   if (format === "excel") return ExcelExporter(data)
    //   if (format === "pdf") return PdfExporter(data)
    //   if (format === "image") return ImageExporter(data)
    return Promise.resolve(Buffer.from("")); // TODO
  }
}
