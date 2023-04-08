const { default: mongoose } = require("mongoose");

require("dotenv").config();

require("./core/bot");
require("./middlewares");
require("./actions");
mongoose
  .connect(process.env.MONGO)
  .then(() => {
    console.log(`Ma'lumotlar bazasiga ulandi`);
  })
  .catch((err) => {
    throw err;
  });
