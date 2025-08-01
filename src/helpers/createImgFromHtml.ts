import nodeHtmlToImage from "node-html-to-image";
import { Options } from "node-html-to-image/dist/types";
import puppeteer from "puppeteer";

const defaultPuppeteerArgs = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  userDataDir: "/tmp",
  // executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
};

export async function createImgFromHtml(options: Options): Promise<any> {
  const puppeteerArgs = {
    ...defaultPuppeteerArgs,
    ...(options.puppeteerArgs || {}),
  };

  return nodeHtmlToImage({
    puppeteerArgs, // <-- sozlamalar alohida
    ...options,
  });
}
