const nodeHtmlToImage = require("node-html-to-image");

const defaultPuppeteerArgs = {
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
};

module.exports = (options) => {
  const puppeteerArgs = {
    ...defaultPuppeteerArgs,
    ...options.puppeteerArgs,
  };

  return nodeHtmlToImage({
    ...options,
    puppeteerArgs,
  });
};
