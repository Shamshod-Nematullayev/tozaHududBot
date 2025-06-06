const nodeHtmlToImage = require("node-html-to-image");
const puppeteer = require("puppeteer"); // <-- MUHIM!

const defaultPuppeteerArgs = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  userDataDir: "/tmp",
  // executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium-browser",
};
console.log(process.env.CHROMIUM_PATH);

module.exports = (options) => {
  const puppeteerArgs = {
    ...defaultPuppeteerArgs,
    ...(options.puppeteerArgs || {}),
  };

  return nodeHtmlToImage({
    puppeteerArgs, // <-- sozlamalar alohida
    ...options,
  });
};
