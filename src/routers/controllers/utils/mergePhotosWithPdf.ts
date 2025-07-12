import { bot } from "@bot/core/bot";
import axios from "axios";
import { PDFDocument } from "pdf-lib";
import PDFMerger from "pdf-merger-js";

/**
 * PDF va rasm birlashtirish
 * photos telegramga yuklangan rasmning fileIdsi bo'lishi kerak
 */
export async function mergePhotosWithPdf(
  photos: string[],
  currentFile: Buffer
): Promise<Buffer> {
  const photosBuffer = await Promise.all(
    photos.map(async (file_id) => {
      const file = await bot.telegram.getFile(file_id);
      const photoBuffer = await bot.telegram.getFileLink(file.file_id);
      const response = await axios.get(photoBuffer.href, {
        responseType: "arraybuffer",
      });
      return response.data;
    })
  );

  const pdfDoc = await PDFDocument.create();
  for (let photoBuffer of photosBuffer) {
    const image = await pdfDoc.embedPng(photoBuffer);
    const scale = Math.min(595 / image.width, 842 / image.height, 1); // Scale factor for A4 size
    const page = pdfDoc.addPage([image.width * scale, image.height * scale]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width * scale,
      height: image.height * scale,
    });
  }

  let pdfBuffer = await pdfDoc.save();
  const merger = new PDFMerger();
  await merger.add(currentFile);
  await merger.add(Buffer.from(pdfBuffer));

  return await merger.saveAsBuffer();
}
