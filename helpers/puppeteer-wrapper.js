const nodeHtmlToImage = require("node-html-to-image");

const defaultPuppeteerArgs = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
  userDataDir: "/tmp/puppeteer",
};

module.exports = (options) => {
  const puppeteerOptions = {
    ...defaultPuppeteerArgs,
    ...(options.puppeteer || {}),
  };

  return nodeHtmlToImage({
    ...options,
    puppeteer: puppeteerOptions,
  });
};
