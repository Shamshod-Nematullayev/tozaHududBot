import Agenda from "agenda";
const agenda = new Agenda({
  db: { address: process.env.MONGO, collection: "agendaJobs" },
  processEvery: "10 seconds",
  maxConcurrency: 1,
});

import("../intervals/updateAbonentsFromTozamakon.js").then((module) =>
  module.default(agenda)
);

export { agenda };
