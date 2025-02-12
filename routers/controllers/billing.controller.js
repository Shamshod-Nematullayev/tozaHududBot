const PDFMerger = require("pdf-merger-js");
const { tozaMakonApi } = require("../../api/tozaMakon");
const { Abonent } = require("../../models/Abonent");
const { Counter } = require("../../models/Counter");
const { IncomingDocument } = require("../../models/IncomingDocument");
const { Ariza } = require("../../models/Ariza");
const { akt_pachka_id } = require("../../constants");
const { bot } = require("../../requires");
const FormData = require("form-data");

module.exports.downloadFileFromBilling = async (req, res) => {
  try {
    const { file_id } = req.query;
    if (!file_id) {
      return res
        .status(400)
        .json({ ok: false, message: "Fayl ID talab qilinadi." });
    }

    const cleanFileId = file_id.split("*").pop(); // Oxirgi qismni olish

    // Server 2 ga so‘rov yuborish
    const response = await tozaMakonApi.get("/file-service/buckets/download", {
      params: { file: cleanFileId },
      responseType: "arraybuffer",
    });
    // Faylni Base64 ga o'tkazish
    const base64Data = Buffer.from(response.data).toString("base64");
    const contentType = "application/pdf";

    res.json({
      ok: true,
      file: `data:${contentType};base64,${base64Data}`,
    });
  } catch (error) {
    console.error("Error downloading file:", error);

    res.status(500).json({
      ok: false,
      message: error.response?.data || error.message || "Internal server error",
    });
  }
};

module.exports.getAbonentDHJByAbonentId = async (req, res) => {
  try {
    const { page = 0, limit = 100 } = req.query;
    const { data } = await tozaMakonApi.get(
      `/billing-service/resident-balances/dhsh`,
      {
        params: {
          residentId: req.params.abonent_id,
          page: page,
          size: limit,
        },
      }
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
};

module.exports.getAbonentActs = async (req, res) => {
  try {
    const { page = 0, limit = 100 } = req.query;
    const { data } = await tozaMakonApi.get(`/billing-service/acts`, {
      params: {
        residentId: req.params.abonentId,
        page: page,
        size: limit,
      },
    });
    res.json({
      ok: true,
      rows: data.content,
    });
  } catch (error) {
    res.json({ ok: false, message: "Internal server error 500" });
    console.error(error);
  }
};

module.exports.createFullAct = async (req, res) => {
  try {
    const {
      next_inhabitant_count,
      akt_sum,
      licshet,
      amountWithoutQQS,
      document_type,
      description,
      ariza_id,
      photos,
    } = req.body;
    if (isNaN(next_inhabitant_count) && isNaN(akt_sum)) {
      return res.status(400).json({
        ok: false,
        message: "yashovchi soni yoki akt summasi bo'lishi kerak",
      });
    }
    const abonent = await Abonent.findOne({ licshet });
    if (!abonent)
      return res.status(404).json({
        ok: false,
        message: "Abonent mavjud emas",
      });
    let counter = await Counter.findOne({ name: "incoming_document_number" });

    if (photos?.length > 0) {
      // endi pdf va rasmlarni birlashtirish kodi kerak
      const photosBuffer = [];
      for (let file_id of photos) {
        const file = await bot.telegram.getFile(file_id);
        const photoBuffer = await bot.telegram.getFileLink(file.file_id);
        const response = await axios.get(photoBuffer, {
          responseType: "arraybuffer",
        });
        photosBuffer.push(response.data);
      }
      const pdfDoc = await PDFDocument.create();
      for (let photoBuffer of photosBuffer) {
        const image = await pdfDoc.embedPng(photoBuffer);
        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });
      }
      let pdfBuffer = await pdfDoc.save();
      const merger = new PDFMerger();
      await merger.add(req.file.buffer);
      pdfBuffer = Buffer.from(pdfBuffer);
      console.log(Buffer.isBuffer(pdfBuffer));
      await merger.add(pdfBuffer);
      const bufferAktFile = await merger.saveAsBuffer();
      req.file.buffer = bufferAktFile;
    }
    // akt faylini telegram bazaga saqlash
    const documentOnTelegram = await bot.telegram.sendDocument(
      process.env.TEST_BASE_CHANNEL_ID,
      {
        source: req.file.buffer,
        filename: req.file.originalname,
      }
    );
    await IncomingDocument.create({
      abonent: licshet,
      doc_type: document_type,
      file_id: documentOnTelegram.document.file_id,
      file_name: req.file.originalname,
      comment: description,
      date: Date.now(),
      doc_num: counter.value + 1,
    });
    await counter.updateOne({
      $set: {
        value: counter.value + 1,
        last_update: Date.now(),
      },
    });

    // akt faylini tozaMakon ga saqlash
    const formData = new FormData();
    formData.append("file", req.file.buffer, req.file.originalname);

    const fileUploadResponse = await tozaMakonApi.post(
      "/file-service/buckets/upload?folderType=SPECIFIC_ACT",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    if (!isNaN(akt_sum)) {
      const calculateKSaldo = (
        await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
          params: {
            amount: Math.abs(akt_sum),
            residentId: abonent.id,
            actPackId: document_type
              ? akt_pachka_id[document_type]
              : akt_pachka_id.boshqa,
            actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
          },
        })
      ).data;

      const inhabitantCounts =
        next_inhabitant_count && "undefined" != next_inhabitant_count
          ? { inhabitantCount: next_inhabitant_count }
          : {};
      const date = new Date();
      const aktResponse = await tozaMakonApi.post("/billing-service/acts", {
        actPackId: document_type
          ? akt_pachka_id[document_type]
          : akt_pachka_id.boshqa,
        actType: akt_sum < 0 ? "DEBIT" : "CREDIT",
        amount: Number(akt_sum),
        amountWithQQS: Number(akt_sum) - (Number(amountWithoutQQS) || 0),
        amountWithoutQQS: Number(amountWithoutQQS) || 0,
        description,
        endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        fileId:
          fileUploadResponse.data.fileName +
          "*" +
          fileUploadResponse.data.fileId,
        kSaldo: calculateKSaldo,
        residentId: abonent.id,
        ...inhabitantCounts,
      });

      if (aktResponse.status !== 201) {
        console.error(
          "Billing tizimiga akt kiritib bo'lmadi",
          aktResponse.data
        );
        return res.status(500).json({
          ok: false,
          message: "Billing tizimiga akt kiritib bo'lmadi",
        });
      }
      if (ariza_id) {
        const ariza = await Ariza.findByIdAndUpdate(ariza_id, {
          $set: {
            status: "akt_kiritilgan",
            akt_pachka_id: aktResponse.data.actPackId,
            akt_id: aktResponse.data.id,
            aktInfo: {
              ...aktResponse.data,
            },
            akt_date: aktResponse.data.createdAt,
          },
        });
      }
      return res.json({
        ok: true,
        message: "Akt muvaffaqqiyatli qo'shildi",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Internal server error 500" });
  }
};
