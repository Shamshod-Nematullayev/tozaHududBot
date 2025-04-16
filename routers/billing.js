const { uploadAsBlob } = require("../middlewares/multer");
const { Mahalla } = require("../models/Mahalla");
const { Counter } = require("../models/Counter");
const { bot } = require("../core/bot");
const { Abonent } = require("../requires");
const { tozaMakonApi } = require("../api/tozaMakon");
const {
  downloadFileFromBilling,
  getAbonentDHJByAbonentId,
  getAbonentActs,
  createFullAct,
  createDublicateActByAriza,
  getAbonentsByMfyId,
  createDublicateAct,
  getActiveMfy,
  sendAbonentsListToTelegram,
} = require("./controllers/billing.controller");

const router = require("express").Router();
router.get("/next-incoming-document-number", async (req, res) => {
  const counter = await Counter.findOne({ name: "incoming_document_number" });

  if (!counter)
    return res.json({ ok: false, message: "Internal server error" });
  res.json({ ok: true, value: counter.value + 1 });
});

router.get("/get-file/", downloadFileFromBilling);

router.post("/create-full-akt", uploadAsBlob.single("file"), createFullAct);

router.post(
  "/create-dvaynik-akt-by-ariza",
  uploadAsBlob.single("file"),
  createDublicateActByAriza
);

router.post(
  "/create-dvaynik-akt",
  uploadAsBlob.single("file"),
  createDublicateAct
);

router.get(`/get-abonent-dxj-by-id/:abonent_id`, getAbonentDHJByAbonentId);
router.get(`/get-abonent-dxj-by-licshet/:licshet`, async (req, res) => {
  try {
    const abonent = await Abonent.findOne({ licshet: req.params.licshet });
    const { data } = await tozaMakonApi.get(
      `/billing-service/resident-balances/dhsh?residentId=${abonent.id}&page=0&size=100`
    );

    res.json({
      ok: true,
      message: data.msg,
      rows: data.content,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.get("/get-abonent-data-by-licshet/:licshet", async (req, res) => {
  try {
    // const abonentData = await getAbonentDataByLicshet({
    //   licshet: req.params.licshet,
    // });
    const abonentData = await Abonent.findOne({ licshet: req.params.licshet });
    if (!abonentData) {
      return res.status(404).json({
        ok: false,
        message: "Abonent mongodbda mavjud emas",
      });
    }

    const response = await tozaMakonApi.get(
      "/user-service/residents/" + abonentData.id
    );
    if (response.status !== 200) {
      return response.json({
        ok: false,
        message: "Abonent dastlabki ma'lumotlarini oliishda xatolik",
      });
    }
    res.json({
      ok: true,
      abonentData: response.data,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.get("/get-abonents-by-mfy-id/:mfy_id", getAbonentsByMfyId);

router.get("/get-all-active-mfy", getActiveMfy);

router.put("/abarotka-berildi/:mfy_id", async (req, res) => {
  try {
    console.log(req.params.mfy_id);
    const result = await Mahalla.updateOne(
      { id: req.params.mfy_id },
      { $set: { abarotka_berildi: true } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ ok: false, message: "Mahalla topilmadi" });
    }
    res.json({ ok: true, message: "Updated" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.put("/abarotka-berilmadi/:mfy_id", async (req, res) => {
  try {
    const result = await Mahalla.updateOne(
      { id: req.params.mfy_id },
      { $set: { abarotka_berildi: false } }
    );
    if (!result.modifiedCount) {
      return res.status(404).json({ ok: false, message: "Mahalla topilmadi" });
    }
    res.json({ ok: true, message: "Updated" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.put("/barchasiga-abarotka-berilmadi", async (req, res) => {
  try {
    await Mahalla.updateMany(
      { reja: { $gt: 0 } },
      { $set: { abarotka_berildi: false } }
    );
    res.json({ ok: true, message: "Updated" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.post(
  "/send-abonents-list-to-telegram/",
  uploadAsBlob.any(),
  sendAbonentsListToTelegram
);

router.post(
  "/send-abonents-list-to-telegram-as-pdf",
  uploadAsBlob.single("file"),
  (req, res) => {
    try {
      // TODO: PDF yaratish
      bot.telegram.sendDocument(process.env.ME, { source: req.file.buffer });
    } catch (error) {
      console.error("Xatolik yuz berdi:", error.message);
      res.status(500).json({
        ok: false,
        message: "Internal server error 500",
      });
    }
  }
);

router.get("/get-mfy-by-id/:mfy_id", async (req, res) => {
  try {
    const mahalla = await Mahalla.findOne({ id: req.params.mfy_id });
    if (!mahalla) return res.json({ ok: false, message: "MFY not found" });

    res.json({ ok: true, data: mahalla });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.get("/get-abonent-acts/:abonentId", getAbonentActs);

module.exports = router;
