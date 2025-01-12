const router = require("express").Router();
const ejs = require("ejs");
const { SudAkt } = require("../models/SudAkt");
const { HybridMail } = require("../models/HybridMail");
const { Counter, bot, htmlPDF } = require("../requires");
const { uploadAsBlob, isLimitFileSize } = require("../middlewares/multer");
const { hybridPochtaApi } = require("../api/hybridPochta");
const PDFMerger = require("pdf-merger-js");
const { tozaMakonApi } = require("../api/tozaMakon");
const FormData = require("form-data");

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

router.get("/search-by-licshet", async (req, res) => {
  try {
    const { licshet } = req.query;
    if (!licshet) {
      return res.json({ ok: false, message: "Licshet kiritilmadi" });
    }
    const results = await SudAkt.countDocuments({
      licshet: new RegExp(licshet),
      $or: [{ status: "yangi" }, { status: "ariza_yaratildi" }],
    });
    if (results > 30) {
      return res.json({ ok: false, message: "Juda ko'p natijalar aniqlandi" });
    }
    const sudAkts = await SudAkt.find({
      licshet: new RegExp(licshet),
      $or: [{ status: "yangi" }, { status: "ariza_yaratildi" }],
    });
    res.json({ ok: true, rows: sudAkts });
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
router.put("/create-many-ariza", async (req, res) => {
  try {
    const { sudAktIds, ariza_date, ariza_type } = req.body;
    if (!sudAktIds || sudAktIds.length === 0) {
      return res.json({ ok: false, message: "SudAkt idlari kiritilmadi" });
    }

    if (!ariza_date || !ariza_type) {
      return res.json({
        ok: false,
        message: "Ariza sanasi yoki turi kiritilmadi",
      });
    }
    if (!SudAkt.schema.paths.ariza_type.options.enum.includes(ariza_type)) {
      return res.json({
        ok: false,
        message: "Ariza turi mavjud emas",
      });
    }
    const sudAkts = await SudAkt.find({ _id: { $in: sudAktIds } });
    if (sudAkts.length !== sudAktIds.length) {
      return res.json({ ok: false, message: "SudAkt topilmadi" });
    }
    const counter = await Counter.findOne({
      name: "sudga_ariza_tartib_raqami",
    });
    const updatedSudAkts = [];
    for (const sudAkt of sudAkts) {
      if (sudAkt.status === "yangi") {
        const newOrderNum = counter.value + updatedSudAkts.length + 1;
        await sudAkt.updateOne({
          $set: {
            ariza_order_num: newOrderNum,
            ariza_date: ariza_date,
            ariza_type: ariza_type,
            status: "ariza_yaratildi",
          },
        });
        updatedSudAkts.push({
          ...sudAkt.toObject(),
          ariza_order_num: newOrderNum,
          status: "ariza_yaratildi",
        });
        await counter.updateOne({ $set: { value: newOrderNum } });
      } else {
        updatedSudAkts.push(sudAkt.toObject());
      }
    }
    console.log("Updated SudAkts:", updatedSudAkts);
    return res.json({ ok: true, rows: updatedSudAkts });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
});
router.post(
  "/upload-ariza-file",
  uploadAsBlob.single("file"),
  async (req, res) => {
    try {
      const { file } = req;
      const { sud_akt_id } = req.body;
      if (!file) {
        return res.json({ ok: false, message: "File not found" });
      }
      if (!file.mimetype.startsWith("application/pdf")) {
        return res.json({
          ok: false,
          message: "Invalid file format. Please upload a PDF file",
        });
      }
      if (!sud_akt_id) {
        return res.json({ ok: false, message: "SudAkt id not found" });
      }
      const sud_akt = await SudAkt.findById(sud_akt_id);
      const blobName = `ariza-file-${Date.now()}-${file.originalname}`;
      const telegram_res = await bot.telegram.sendDocument(
        process.env.TEST_BASE_CHANNEL_ID,
        {
          source: file.buffer,
          filename: blobName,
        }
      );
      await sud_akt.updateOne({
        $set: {
          ariza_file_id: telegram_res.document.file_id,
          ariza_file_name: blobName,
          status: "ariza_imzolandi",
        },
      });

      res.json({ ok: true, message: "Muvaffaqqiyatli yuklandi" });
    } catch (err) {
      res.json({ ok: false, message: "Internal server error 500" });
      console.error(err);
    }
  },
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

// router.put("/update-case-documents-to-billing/:case_id", async (req, res) => {
//   try {
//     const case_documents = await CaseDocument.find({
//       case_id: req.params.case_id,
//     });
//     let counter = 0;
//     let uploadedCounter;
//     async function loop() {
//       if (counter === case_documents.length) return;

//       const document = case_documents[counter];
//       const sudAkt = await SudAkt.findById(document.sudAktId);
//       if (document.isSavedBilling) {
//         counter++;
//         return await loop();
//       }
//       const documentBuffer = await fetch(
//         "https://cabinetapi.sud.uz/api/cabinet/case/download_as_buffer/" +
//           document.file_id,
//         {
//           headers: {
//             accept: "application/json, text/plain, */*",
//             "content-type": "application/json",
//             responsetype: "arraybuffer",
//             "sec-fetch-dest": "empty",
//             "sec-fetch-mode": "cors",
//             "sec-fetch-site": "same-site",
//             "x-auth-token": process.env.CABINET_SUD_X_TOKEN,
//           },
//           referrer: "https://cabinet.sud.uz/",
//           referrerPolicy: "strict-origin-when-cross-origin",
//           body: null,
//           method: "GET",
//           mode: "cors",
//           credentials: "omit",
//         }
//       );
//       const res = await sudXujjatlariBiriktirish({
//         process_id: sudAkt.sud_process_id_billing,
//         file_name: documentBuffer.name,
//         file_buffer: documentBuffer,
//         file_type_id:
//           document.owner_name == "GULMIRA DJUMAYEVA TADJIYEVNA" ? "1" : "3",
//       });
//       if (!res.success) {
//         console.error(res.msg);
//         return "Xatolik kuzatildi";
//       }
//       uploadedCounter++;
//       counter++;
//       await loop();
//     }
//     await loop();
//     res.json({
//       ok: true,
//       message: `${uploadedCounter} files has uploaded to billing`,
//     });
//   } catch (error) {
//     console.error(error);
//     res.json({
//       ok: false,
//       message: "Internal server error",
//     });
//   }
// });

module.exports = router;
