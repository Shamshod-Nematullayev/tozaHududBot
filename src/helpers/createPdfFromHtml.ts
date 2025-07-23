import puppeteer, { PDFMargin } from "puppeteer";
import os from "os";
import path from "path";

export async function createPdfFromHtml(
  html: string,
  margin?: PDFMargin
): Promise<Uint8Array> {
  let optionsByOs = {};
  if (os.platform() === "win32") {
    optionsByOs = {
      args: [],
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    };
  } else {
    optionsByOs = {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      userDataDir: path.join(os.tmpdir(), "puppeteer"),
      executablePath: "/usr/bin/chromium-browser",
    };
  }
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const buffer = await page.pdf({
    format: "A4",
    margin,
  });
  await browser.close();
  return buffer;
}
