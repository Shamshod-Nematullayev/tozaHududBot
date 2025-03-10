const { tozaMakonApi } = require("../api/tozaMakon");
const { Mahalla } = require("../models/Mahalla");
const { XatlovDocument } = require("../models/XatlovDocument");
const { MultiplyRequest } = require("../models/MultiplyRequest");
const { uploadAsBlob } = require("../middlewares/multer");
const FormData = require("form-data");
const { Company } = require("../requires");

const router = require("express").Router();

router.post("/", async (req, res) => {
  try {
    const { request_ids, mahallaId } = req.body;
    if (!mahallaId) {
      return res.status(400).json({ message: "mahallaId is required" });
    }
    const countDocuments = await XatlovDocument.countDocuments();
    const document = await XatlovDocument.create({
      request_ids,
      mahallaId,
      date: new Date(),
      documentNumber: countDocuments + 1,
    });
    const mahalla = await Mahalla.findOne({ id: parseInt(mahallaId) });
    for (let _id of request_ids) {
      await MultiplyRequest.findByIdAndUpdate(_id, {
        $set: { document_id: document._id },
      });
    }
    res.status(201).json({ ok: true, data: document, mahalla });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Internal Server Error" });
    console.error(error);
  }
});
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortField = "date",
      sortDirection = "asc",
      ...filters
    } = req.query;
    const skip = (parseInt(page) - 1) * limit; // Nechta elementni o'tkazib yuborish
    const sortOptions = {};
    sortOptions[sortField] = sortDirection === "asc" ? 1 : -1;
    const data = await MultiplyRequest.find({
      ...filters,
      document_id: { $exists: false },
      confirm: false,
    }) // Filtrlash
      .sort(sortOptions)
      .skip(skip) // Paging
      .limit(parseInt(limit)) // Limit
      .lean(); // Faqatgina "plain" obyekt qaytarish uchun (performance uchun yaxshi)
    const totalCount = await MultiplyRequest.countDocuments({
      ...filters,
      document_id: { $exists: false },
      confirm: false,
    }); // Toplam sonliqni o'qish

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
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

router.get("/mahallas", async (req, res) => {
  try {
    const { filters } = req.query;
    const mahallas = await MultiplyRequest.aggregate([
      { $match: { ...filters } },
      {
        $group: {
          _id: "$mahallaId", // Guruhlash uchun kalit
          mahallaId: { $first: "$mahallaId" }, // Birinchi qiymatni oling
          mahallaName: { $first: "$mahallaName" }, // Birinchi qiymatni oling
        },
      },
      {
        $project: {
          _id: 0,
          mahallaId: 1,
          mahallaName: 1,
        },
      },
    ]);
    res.status(200).json({ ok: true, data: mahallas });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
    console.error(error);
  }
});

router.patch("/update-from-tozamakon/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const { abonentId } = req.body;
    const { data } = await tozaMakonApi.get(
      "/user-service/residents/" + abonentId
    );
    const result = await MultiplyRequest.findByIdAndUpdate(_id, {
      $set: {
        fio: data.fullName,
        currentInhabitantCount: data.house.inhabitantCnt,
      },
    });
    if (!result) {
      return res.status(404).json({ ok: false, message: "Not Found" });
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.put("/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const result = await MultiplyRequest.findByIdAndUpdate(_id, {
      $set: req.body,
    });
    if (!result) {
      return res.status(404).json({ ok: false, message: "Not Found" });
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Internal Server Error" });
  }
});

router.get("/get-one-dalolatnoma", async (req, res) => {
  try {
    const dalolatnoma = await XatlovDocument.findOne(req.query);
    if (!dalolatnoma)
      return res.status(404).json({ ok: false, message: "Not found" });
    res.json({ ok: true, data: dalolatnoma });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

router.put("/confirm/:_id", uploadAsBlob.single("file"), async (req, res) => {
  try {
    const { _id } = req.params;
    const date = new Date();
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
    const request = await MultiplyRequest.findById(_id);
    if (!request) {
      return res.status(404).json({ ok: false, message: "Not Found" });
    }
    const packId = (await Company.findOne({ id: req.user.companyId }))
      .akt_pachka_ids.odam_soni.id;
    const responseAkt = await tozaMakonApi.post("/billing-service/acts", {
      actPackId: packId,
      actType: "DEBIT",
      amount: 0,
      amountWithQQS: 0,
      amountWithoutQQS: 0,
      description: `${request.from.first_name} ma'lumotiga asosan`,
      endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
      fileId:
        fileUploadResponse.data.fileName + "*" + fileUploadResponse.data.fileId,
      kSaldo: (
        await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
          params: {
            amount: 0,
            residentId: request.abonentId,
            actPackId: packId,
            actType: "DEBIT",
            inhabitantCount: request.YASHOVCHILAR,
          },
        })
      ).data,
      residentId: request.abonentId,
      inhabitantCount: request.YASHOVCHILAR,
    });
    if (responseAkt.status !== 201) {
      console.error("Failed to create act:", res.data);
      return res
        .status(500)
        .json({ ok: false, message: "Failed to create act" });
    }
    await request.updateOne({ $set: { actId: responseAkt.data.id } });
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Internal Server Error" });
    console.error(error);
  }
});

router.get("/get-rows-by-ids", async (req, res) => {
  try {
    const { request_ids } = req.query;
    const rows = await MultiplyRequest.find({ _id: { $in: request_ids } });
    if (!rows.length)
      return res.status(404).json({ ok: false, message: "No records found" });
    res.json({ ok: true, data: rows });
  } catch (error) {
    res.status(500).json({ ok: false, message: "Internal server error" });
  }
});

module.exports = router;
