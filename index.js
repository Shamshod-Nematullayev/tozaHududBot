require("dotenv").config();
const { default: mongoose } = require("mongoose");
// const express = require("express");
// const app = express();
// const cors = require("cors");

// App middlewares
// app.use(express.urlencoded());
// app.use(express.json());
// app.use(cors());

// // use routers
// app.use("/api/auth", require("./routers/auth"));
// app.use("/api/sudAkts", require("./routers/sudRouter"));
// app.use("/api/bildirgilar", require("./routers/bildirgilarRouter"));
// app.use("/api/forma1lar", require("./routers/forma1Router"));
// app.use("/api/fetchTelegram", require("./routers/fetchTelegramRouter"));
// app.use("/api/pachkalar", require("./routers/aktPachka"));
// app.use("/api/documents", require("./routers/kiruvchiXujjatlar"));
// app.use("/api/inspectors", require("./routers/inspectorsRouter"));

const PORT = process.env.PORT || 5000;
// app.listen(PORT, async () => {
//   console.log(`Server listening port: ${PORT}`);
// });

require("./core/bot");
require("./middlewares");
require("./actions");
mongoose
  .connect(process.env.MONGO)
  .then(async () => {
    console.log(`Ma'lumotlar bazasiga ulandi`);
  })
  .catch((err) => {
    throw err;
  });
