const { default: axios } = require("axios");
const { tozaMakonApi } = require("../../api/tozaMakon");
const { akt_pachka_id } = require("../../constants");
const { Ariza } = require("../../models/Ariza");
const { Abonent, bot } = require("../../requires");
const { PDFDocument } = require("pdf-lib");
const PDFMerger = require("pdf-merger-js");
const FormData = require("form-data");

module.exports.getArizalar = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortField = "sana",
      sortDirection = "asc",
      document_type,
      document_number,
      account_number,
      dublicat_account_number,
      created_from_date,
      created_to_date,
      act_from_date,
      act_to_date,
      act_amount_from,
      act_amount_to,
      ariza_status,
      act_status,
    } = req.query;

    const sortOptions = {};
    sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;

    const skip = (parseInt(page) - 1) * limit; // Nechta elementni o'tkazib yuborish

    // Filtrni dinamik shakllantirish
    const filters = {};
    if (document_type) filters.document_type = document_type;
    if (document_number) filters.document_number = document_number;
    if (account_number) filters.licshet = account_number;
    if (dublicat_account_number)
      filters.ikkilamchi_licshet = dublicat_account_number;
    if (created_from_date) filters.sana = { $gte: new Date(created_from_date) };
    if (created_to_date)
      filters.sana = {
        ...filters.sana,
        $lte: new Date(created_to_date),
      };
    if (act_from_date) filters.akt_date = { $gte: new Date(act_from_date) };
    if (act_to_date)
      filters.akt_date = { ...filters.akt_date, $lte: new Date(act_to_date) };
    if (act_amount_from)
      filters.aktSummasi = { $gte: parseFloat(act_amount_from) };
    if (act_amount_to)
      filters.aktSummasi = {
        ...filters.aktSummasi,
        $lte: parseFloat(act_amount_to),
      };
    if (ariza_status) filters.status = ariza_status;
    if (act_status) filters.actStatus = act_status;

    // Ma'lumotlarni qidirish
    const data = await Ariza.find(filters)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Plain obyekt

    const totalCount = await Ariza.countDocuments(filters);

    res.status(200).json({
      ok: true,
      data: data,
      meta: {
        total: totalCount,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, message: `internal error: ${error.message}` });
  }
};

module.exports.getArizaById = async (req, res) => {
  try {
    const ariza = await Ariza.findById(req.params._id).lean();
    const abonent = await Abonent.findOne({ licshet: ariza.licshet });
    if (!ariza)
      return res.status(404).json({
        ok: false,
        message: "Ariza topilmadi",
      });
    ariza.fio = abonent.fio;
    ariza.abonentId = abonent.id;
    res.json({
      ok: true,
      ariza,
    });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
};

module.exports.updateArizaFromBillingById = async (req, res) => {
  try {
    const ariza = await Ariza.findById(req.params.ariza_id);
    if (!ariza)
      return res.status(404).json({
        ok: false,
        message: "Ariza topilmadi",
      });
    const abonent = await Abonent.findOne({ licshet: ariza.licshet });
    const acts = (
      await tozaMakonApi.get("/billing-service/acts", {
        params: {
          residentId: abonent.id,
        },
      })
    ).data.content;
    const act = acts.find((a) => a.id == ariza.akt_id);
    const updates = {
      actStatus: act.actStatus,
      aktInfo: act,
    };
    if (act.actStatus === "CONFIRMED") updates.status = "tasdiqlangan";
    const updatedAriza = await Ariza.findByIdAndUpdate(
      ariza._id,
      {
        $set: updates,
      },
      { new: true }
    );
    res.json({
      ok: true,
      ariza: updatedAriza,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ ok: false, message: `internal error: ${error.message}` });
  }
};

module.exports.changeArizaAct = async (req, res) => {
  try {
    const { ariza_id } = req.params;
    const {
      allAmount,
      inhabitantCount,
      amountWithQQS,
      amountWithoutQQS,
      description,
      photos,
    } = req.body;
    if (!allAmount || !amountWithQQS || !amountWithoutQQS || !description) {
      return res.status(400).json({
        ok: false,
        message: "All fields are required",
      });
    }
    const file = req.file;
    const ariza = await Ariza.findById(ariza_id);
    if (!ariza)
      return res.status(404).json({
        ok: false,
        message: "Ariza topilmadi",
      });

    if (photos?.length > 0) {
      // endi pdf va rasmlarni birlashtirish kodi kerak
      let imgs = photos.split(",");
      const photosBuffer = [];
      for (let file_id of imgs) {
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
      if (req.file?.buffer) {
        await merger.add(req.file.buffer);
      } else {
        const response = await tozaMakonApi.get(
          "/file-service/buckets/download",
          {
            params: { file: ariza.aktInfo.fileId },
            responseType: "arraybuffer",
          }
        );
        await merger.add(response.data);
      }
      pdfBuffer = Buffer.from(pdfBuffer);
      await merger.add(pdfBuffer);
      const bufferAktFile = await merger.saveAsBuffer();
      req.file.buffer = bufferAktFile;
    }
    let fileId = ariza.aktInfo.fileId;
    if (file) {
      const formData = new FormData();
      formData.append("file", file.buffer, file.originalname);
      const fileData = (
        await tozaMakonApi.post("/file-service/buckets/upload", formData, {
          params: { folderType: "ACT" },
        })
      ).data;
      fileId = ariza.document_number + "*" + fileData.id;
    }
    let act;
    if (ariza.actStatus === "WARNED" || ariza.actStatus === "NEW") {
      const kSaldo = (
        await tozaMakonApi.get("billing-service/acts/calculate-k-saldo", {
          params: {
            amount: allAmount,
            residentId: ariza.aktInfo.residentId,
            actPackId: ariza.aktInfo.actPackId,
            actType: Number(allAmount) > 0 ? "CREDIT" : "DEBIT",
            inhabitantCount,
            fileId,
          },
        })
      ).data;
      act = await tozaMakonApi.put("/billing-service/acts", {
        actType: Number(allAmount) > 0 ? "CREDIT" : "DEBIT",
        amount: allAmount,
        amountWithQQS,
        amountWithoutQQS,
        description,
        id: ariza.akt_id,
        inhabitantCount,
        kSaldo,
        residentId: ariza.aktInfo.residentId,
      });
    } else {
      const kSaldo = (
        await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
          params: {
            amount: allAmount,
            residentId: ariza.aktInfo.residentId,
            actPackId: akt_pachka_id[ariza.document_type],
            actType: Number(allAmount) < 0 ? "DEBIT" : "CREDIT",
          },
        })
      ).data;
      const date = new Date();
      const body = {
        actPackId: akt_pachka_id[ariza.document_type],
        actType: Number(allAmount) < 0 ? "DEBIT" : "CREDIT",
        amount: allAmount,
        amountWithQQS: amountWithQQS,
        amountWithoutQQS: amountWithoutQQS,
        description,
        endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        fileId,
        kSaldo,
        residentId: ariza.aktInfo.residentId,
      };
      if (inhabitantCount) body.inhabitantCount = inhabitantCount;
      act = (await tozaMakonApi.post("/billing-service/acts", body)).data;
    }
    if (!act)
      return res
        .status(500)
        .json({ ok: false, message: "Internal server error" });
    const updatedAriza = await Ariza.findByIdAndUpdate(
      ariza._id,
      {
        $set: {
          status: "qayta_akt_kiritilgan",
          actStatus: "NEW",
          akt_pachka_id: act.actPackId,
          akt_id: act.id,
          aktInfo: {
            ...act,
          },
          akt_date: act.createdAt,
        },
        $push: { actHistory: ariza.aktInfo },
      },
      {
        new: true,
      }
    );
    res.json({
      ok: true,
      ariza: updatedAriza,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
};
