const router = require("express").Router();
const ejs = require("ejs");
const { HybridMail } = require("../models/HybridMail");
const { htmlPDF } = require("../requires");
const { uploadAsBlob, isLimitFileSize } = require("../middlewares/multer");
const { hybridPochtaApi } = require("../api/hybridPochta");
const PDFMerger = require("pdf-merger-js");
const { tozaMakonApi } = require("../api/tozaMakon");
const FormData = require("form-data");
const {
  getSudAkts,
  getCourtCaseBySudAktId,
  getOneSudAkt,
  searchByLicshetSudakt,
  createSudAriza,
  createManySudAriza,
  uploadSudArizaFile,
} = require("./controllers/sud.controller");

router.get("/", getSudAkts);

router.get("/court-case-by-id/:_id", getCourtCaseBySudAktId);

router.get("/find-one", getOneSudAkt);

router.get("/search-by-licshet", searchByLicshetSudakt);

router.put("/create-ariza/:_id", createSudAriza);

router.put("/create-many-ariza", createManySudAriza);

router.post(
  "/upload-ariza-file",
  uploadAsBlob.single("file"),
  uploadSudArizaFile,
  isLimitFileSize
);

router.get("/hybrid-mails", async (req, res) => {
  try {
    let {
      page = 1,
      limit = 10,
      sortField = "createdOn",
      sortDirection = "asc",
      fromDate,
      toDate,
      ...filters
    } = req.query;
    limit = parseInt(limit);

    const sortOptions = {};
    sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    if (!fromDate || !toDate) {
      return res.json({
        ok: false,
        message: "fromDate and toDate fields are required",
      });
    }

    fromDate = new Date(fromDate);
    toDate = new Date(toDate);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return res
        .status(400)
        .json({ ok: false, message: "Invalid date format" });
    }
    const startDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1); // JavaScript oylari 0-indeksli
    const endDate = new Date(
      toDate.getFullYear(),
      toDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    ); // Oy oxiri

    // ma'lumotlarni olish
    const mails = await HybridMail.find({
      createdOn: {
        $gt: startDate,
        $lt: endDate,
      },
      ...filters,
    })
      .limit(limit)
      .skip(skip)
      .sort(sortOptions);

    const total = await HybridMail.countDocuments({
      createdOn: {
        $gte: startDate,
        $lte: endDate,
      },
      ...filters,
    });
    res.json({
      ok: true,
      rows: mails,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.json({ ok: false, message: error.message });
    console.error(error);
  }
});

router.get("/hybrid-mails/:mail_id", async (req, res) => {
  try {
    const mail = await HybridMail.findById(req.params.mail_id);
    if (!mail)
      return res.status(400).json({ ok: false, message: "Mail not found" });
    res.json({ ok: true, row: mail });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
// update one mail by id
router.patch("/hybrid-mails/:mail_id", async (req, res) => {
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

router.put(
  "/hybrid-mails/upload-cash-to-billing/:mail_id",
  async (req, res) => {
    try {
      const row = await HybridMail.findById(req.params.mail_id);
      if (!row) {
        return res.status(400).json({ ok: false, message: "Mail not found" });
      }
      const pdf = await hybridPochtaApi.get(`/PdfMail/` + row.hybridMailId, {
        responseType: "arraybuffer",
      });
      const warningLetterPDF = Buffer.from(pdf.data);
      const mail = (
        await hybridPochtaApi.get("/mail", {
          params: {
            id: row.hybridMailId,
          },
        })
      ).data;
      ejs.renderFile(
        "./views/hybridPochtaCash.ejs",
        { mail },
        (err, result) => {
          if (err) throw err;
          htmlPDF
            .create(result, { format: "A4", orientation: "portrait" })
            .toBuffer(async (err, cashPDF) => {
              if (err) throw err;
              let merger = new PDFMerger();
              await merger.add(warningLetterPDF);
              await merger.add(cashPDF);
              await merger.setMetadata({
                producer: "oliy ong",
                author: "Shamshod Nematullayev",
                creator: "Toza Hudud bot",
                title: "Ogohlantirish xati",
              });
              const bufferWarningWithCash = await merger.saveAsBuffer();
              const formData = new FormData();
              formData.append(
                "file",
                bufferWarningWithCash,
                row.hybridMailId + `.pdf`
              );
              // billingdan sudAktini topish
              const courtWarning = (
                await tozaMakonApi.get(
                  `/user-service/court-warnings?accountNumber=${row.licshet}&status=NEW`
                )
              ).data.content[0];
              if (!courtWarning) {
                return res
                  .status(400)
                  .json({ ok: false, message: "Sud akti billingda topilmadi" });
              }

              const fileUploadBilling = (
                await tozaMakonApi.post(
                  "/file-service/buckets/upload",
                  formData,
                  {
                    params: {
                      folderType: "SUD_PROCESS",
                    },
                    headers: { "Content-Type": "multipart/form-data" },
                  }
                )
              ).data;
              await tozaMakonApi.post(
                "/user-service/court-processes/" +
                  courtWarning.id +
                  "/add-file",
                {
                  description: `warning letter by hybrid`,
                  fileName: `${fileUploadBilling.fileName}*${fileUploadBilling.fileId}`,
                  fileType: "WARNING_FILE",
                }
              );

              const content = await row.updateOne(
                {
                  $set: {
                    isSavedBilling: true,
                    sud_process_id_billing: courtWarning.id,
                  },
                },
                { new: true }
              );
              res.status(200).json({ ok: true, content });
            });
        }
      );
    } catch (error) {
      res.status(500).json({ ok: false, message: "Internal server error" });
      console.error(error);
    }
  }
);

router.put("/hybrid-mails/update-mail-status/:mail_id", async (req, res) => {
  try {
    const mail = await HybridMail.findById(req.params.mail_id);
    if (!mail) {
      return res.status(400).json({ ok: false, message: "Mail not found" });
    }
    const hybridMail = (await hybridPochtaApi.get("/mail/" + mail.hybridMailId))
      .data;
    const content = await mail.updateOne({
      $set: {
        isSent: hybridMail.IsSent && hybridMail.Perform.Type === 0,
        sentOn: hybridMail.Perform.PerformedOn,
      },
    });
    res.status(200).json({ ok: true, content });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Internal server error" });
    console.error(error);
  }
});

module.exports = router;
