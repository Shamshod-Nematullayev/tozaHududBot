const Agenda = require("agenda");
const agenda = new Agenda({
  db: { address: process.env.MONGO, collection: "agendaJobs" },
  processEvery: "10 seconds",
  maxConcurrency: 1,
});

require("../intervals/updateAbonentsFromTozamakon")(agenda);

module.exports = { agenda };
