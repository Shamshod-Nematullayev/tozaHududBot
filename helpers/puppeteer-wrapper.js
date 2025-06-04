const nodeHtmlToImage = require("node-html-to-image");
const puppeteer = require("puppeteer"); // <-- MUHIM!

const defaultPuppeteerArgs = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  userDataDir: "/tmp/puppeteer",
};

module.exports = (options) => {
  const puppeteerArgs = {
    ...defaultPuppeteerArgs,
    ...(options.puppeteerArgs || {}),
  };

  return nodeHtmlToImage({
    ...options,
    puppeteer, // <-- modulning o‘zi
    puppeteerArgs, // <-- sozlamalar alohida
  });
};
