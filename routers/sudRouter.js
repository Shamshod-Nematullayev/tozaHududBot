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

// get all dates   GET
router.get("/", getAllAkts);
// get one data    GET
router.get("/:id", getAktById);
// create new data POST
router.post("/", createNewAkt);
// update one data PUT
router.put("/:id", updateAktById);
// update one without id PUT
router.put("/", updateAktByKod);
// delete one data DELETE
router.delete("/:id", deleteById);

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
