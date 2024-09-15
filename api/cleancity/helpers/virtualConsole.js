const jsdom = require("jsdom");

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (error) => {
  console.log({ message: error.message });
  if (error.message.includes("Could not parse CSS stylesheet")) {
  } else {
    console.error(error); // Only show other errors
  }
});

module.exports = { virtualConsole };
