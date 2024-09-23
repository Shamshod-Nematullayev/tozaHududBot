// Bismillah
require("dotenv").config();
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
const { default: mongoose } = require("mongoose");
const express = require("express");
const app = express();
const cors = require("cors");

// App middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

// use routers
app.use("/api/auth", require("./routers/auth"));
app.use("/api/sudAkts", require("./routers/sudRouter"));
app.use("/api/bildirgilar", require("./routers/bildirgilarRouter"));
app.use("/api/forma1lar", require("./routers/forma1Router"));
app.use("/api/fetchTelegram", require("./routers/fetchTelegramRouter"));
app.use("/api/pachkalar", require("./routers/aktPachka"));
app.use("/api/documents", require("./routers/kiruvchiXujjatlar"));
app.use("/api/inspectors", require("./routers/inspectorsRouter"));
app.use("/api/abonents", require("./routers/abonentsRouter"));
app.use("/api/billing", require("./routers/billing"));
app.use("/api/arizalar", require("./routers/arizalarRouter"));
process.on("warning", (warning) => {
  console.warn(warning.stack);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server listening port: ${PORT}`);
});

require("./core/bot");
require("./middlewares");
require("./actions");
require("./intervals");

mongoose
  .connect(process.env.MONGO)
  .then(async () => {
    console.log(`Ma'lumotlar bazasiga ulandi`);
  })
  .catch((err) => {
    throw err;
  });
