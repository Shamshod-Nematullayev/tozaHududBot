const Queue = require("bull");
const { Ariza } = require("../models/Ariza");
const { tozaMakonApi } = require("../api/tozaMakon");

const updateArizalarAkt = new Queue(
  "updateArizalarAkt",
  "redis://127.0.0.1:6379"
);

const addUpdateArizaAktTask = async () => {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const arizalar = await Ariza.find({
    akt_date: { $gte: date },
  });
  for (const ariza of arizalar) {
    updateArizalarAkt.add({ ariza });
  }
};

let errors = [];
let confirmed = 0;
updateArizalarAkt.process(async (job) => {
  const { ariza } = job.data;

  const today = new Date();
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(today.getDate() - 5);

  try {
    const act = (
      await tozaMakonApi.get("/billing-service/acts/" + ariza.akt_id)
    ).data;
    if (ariza.akt_date < fiveDaysAgo && act.actStatus === "NEW") {
      errors.push({
        act,
        ariza,
        type: "5-kundan-ortiq",
      });
    }
    if (ariza.actStatus != act.actStatus && act.actStatus != "CONFIRMED") {
      errors.push({
        act,
        ariza,
        type: "changed",
      });
      await Ariza.findByIdAndUpdate(ariza._id, {
        $set: {
          actStatus: act.actStatus,
          aktInfo: act,
        },
      });
    }
    if (ariza.actStatus != act.actStatus && act.actStatus == "CONFIRMED") {
      await Ariza.findByIdAndUpdate(ariza._id, {
        $set: {
          actStatus: act.actStatus,
          aktInfo: act,
          status: "tasdiqlangan",
        },
      });
      confirmed++;
    }
  } catch (error) {
    console.error(
      `Ariza ${ariza.document_number} qayta ishlashda xatolik:`,
      error
    );
  }
});

// Xatolarni kuzatish
updateArizalarAkt.on("failed", (job, err) => {
  console.log(`Job ${job.id} failed with error:`, err.message);
});

// Tugallangan vazifani kuzatish
updateArizalarAkt.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully.`);
  console.log(`Tasdiqlangan arizalar: ${confirmed}`);
});

module.exports = { addUpdateArizaAktTask };
