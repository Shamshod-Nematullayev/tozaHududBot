const router = require("express").Router();
const {
  sudXujjatlariBiriktirish,
} = require("../api/cleancity/dxsh/sudXujjatlariBiriktirish");
const {
  getAllAkts,
  getAktById,
  createNewAkt,
  updateAktById,
  deleteById,
  updateAktByKod,
} = require("../controllers/sudAktController");
const { CaseDocument } = require("../models/CaseDocuments");
const { SudAkt } = require("../models/SudAkt");
const { HybridMail } = require("../models/HybridMail");
const { Counter } = require("../requires");

// get all dates   GET
// router.get("/", getAllAkts);
// // get one data    GET
// router.get("/:id", getAktById);
// // create new data POST
// router.post("/", createNewAkt);
// // update one data PUT
// router.put("/:id", updateAktById);
// // update one without id PUT
// router.put("/", updateAktByKod);
// // delete one data DELETE
// router.delete("/:id", deleteById);

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.pageSize) || 10;
    const { sortField = "createdAt", sortDirection = "asc" } = req.query;
    const sortOptions = {};
    sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    console.log("Filter:", filter);
    const sudAkts = await SudAkt.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    const total = await SudAkt.countDocuments(filter);
    res.json({
      ok: true,
      rows: sudAkts,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.put("/create-ariza/:_id", async (req, res) => {
  try {
    const sudAkt = await SudAkt.findById(req.params._id);
    if (!sudAkt) {
      return res.json({ ok: false, message: "SudAkt topilmadi" });
    }

    const { ariza_date, ariza_type } = req.body;
    if (!ariza_date || !ariza_type) {
      return res.json({
        ok: false,
        message: "Ariza tartib raqami yoki turi kiritilmadi",
      });
    }
    const counter = await Counter.findOne({
      name: "sudga_ariza_tartib_raqami",
    });
    await sudAkt.updateOne({
      $set: {
        ariza_order_num: counter.value + 1,
        ariza_date,
        ariza_type,
        status: "ariza_yaratildi",
      },
    });
    await counter.updateOne({ $set: { value: counter.value + 1 } });
    res.json({
      ok: true,
      sudAkt,
      ariza_order_num: counter.value,
      message: "Ariza tartib raqami qo'shildi",
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.get("/hybrid-mails", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { sortField = "createdAt", sortDirection = "asc" } = req.query;
    const sortOptions = {};
    sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;

    const skip = (page - 1) * limit;

    const mails = await HybridMail.find()
      .limit(limit)
      .skip(skip)
      .sort(sortOptions);

    const total = await HybridMail.countDocuments();
    res.json({
      ok: true,
      rows: mails,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
// update one mail by id
router.put("/hybrid-mails/:mail_id", async (req, res) => {
  try {
    const mail = await HybridMail.findByIdAndUpdate(req.params.mail_id, {
      $set: { warning_amount: req.body.warning_amount },
    });
    if (!mail) return res.json({ ok: false, message: "Mail not found" });
    res.json({ ok: true, message: "Yangilandi" });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});

router.put("/update-case-documents-to-billing/:case_id", async (req, res) => {
  try {
    const case_documents = await CaseDocument.find({
      case_id: req.params.case_id,
    });
    let counter = 0;
    let uploadedCounter;
    async function loop() {
      if (counter === case_documents.length) return;

      const document = case_documents[counter];
      const sudAkt = await SudAkt.findById(document.sudAktId);
      if (document.isSavedBilling) {
        counter++;
        return await loop();
      }
      const documentBuffer = await fetch(
        "https://cabinetapi.sud.uz/api/cabinet/case/download_as_buffer/" +
          document.file_id,
        {
          headers: {
            accept: "application/json, text/plain, */*",
            "content-type": "application/json",
            responsetype: "arraybuffer",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            "x-auth-token": process.env.CABINET_SUD_X_TOKEN,
          },
          referrer: "https://cabinet.sud.uz/",
          referrerPolicy: "strict-origin-when-cross-origin",
          body: null,
          method: "GET",
          mode: "cors",
          credentials: "omit",
        }
      );
      const res = await sudXujjatlariBiriktirish({
        process_id: sudAkt.sud_process_id_billing,
        file_name: documentBuffer.name,
        file_buffer: documentBuffer,
        file_type_id:
          document.owner_name == "GULMIRA DJUMAYEVA TADJIYEVNA" ? "1" : "3",
      });
      if (!res.success) {
        console.error(res.msg);
        return "Xatolik kuzatildi";
      }
      uploadedCounter++;
      counter++;
      await loop();
    }
    await loop();
    res.json({
      ok: true,
      message: `${uploadedCounter} files has uploaded to billing`,
    });
  } catch (error) {
    console.error(error);
    res.json({
      ok: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
