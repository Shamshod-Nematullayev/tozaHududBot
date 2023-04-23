const { Scenes } = require("telegraf");
const { keyboards } = require("../../../lib/keyboards");
const { messages } = require("../../../lib/messages");

const addNotification = new Scenes.WizardScene("add_notification", (ctx) => {});

addNotification.enter(async (ctx) => {
  const inspectors = await Ispektor.find();
  inspectors.forEach((inpector) => {});
  ctx.reply(messages.lotin.chooseInspector, keyboards.lotin);
});

module.exports = { addNotification };
