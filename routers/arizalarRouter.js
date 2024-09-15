const { Ariza } = require("../models/Ariza");
const { Counter } = require("../models/Counter");
const { convert } = require("pdf-poppler");
const Jimp = require("jimp");
const jsqr = require("jsqr");
const path = require("path");
const fs = require("fs");
const { upload } = require("../middlewares/multer");

const router = require("express").Router();

router.get("/get-ariza-by-id/:_id", async (req, res) => {
  try {
    const ariza = await Ariza.findById(req.params._id);
    if (!ariza)
      return res.json({
        ok: false,
        message: "Ariza topilmadi",
      });
    res.json({ ok: true, ariza });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});

router.post("/cancel-ariza-by-id", async (req, res) => {
  try {
    const ariza = await Ariza.findByIdAndUpdate(req.body._id, {
      $set: {
        status: "bekor qilindi",
        canceling_description: req.body.canceling_description,
        is_canceled: true,
      },
    });
    if (!ariza)
      return res.json({
        ok: false,
        message: "Ariza topilmadi",
      });
    res.json({ ok: true, message: "Ariza bekor qilindi" });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});

router.post("/create", async (req, res) => {
  try {
    // validate the request
    if (!req.body.licshet)
      return res.json({ ok: false, message: "Licshet not found" });
    if (
      req.body.document_type !== "dvaynik" &&
      req.body.document_type !== "viza" &&
      req.body.document_type !== "odam_soni"
    )
      return res.json({ ok: false, message: "Noma'lum xujjat turi kiritildi" });
    if (
      (req.body.document_type === "viza" && !req.body.aktSummasi) ||
      (req.body.document_type === "viza" && req.body.aktSummasi === 0)
    )
      return res.json({
        ok: false,
        message: "Viza arizalariga akt summasi kiritish majburiy!",
      });

    if (req.body.document_type === "dvaynik" && !req.body.ikkilamchi_licshet)
      return res.json({
        ok: false,
        message: "Ikkilamchi aktlarda dvaynik kod kiritilishi majburiy!",
      });
    if (req.body.document_type === "odam_soni") {
      if (!req.body.current_prescribed_cnt || !req.body.next_prescribed_cnt)
        return res.json({
          ok: false,
          message:
            "Odam soni hozirgi kundagi va keyin bo'lishi kerak bo'lgan odam soni kiritilishi majburiy!",
        });
    }

    const counter = await Counter.findOne({ name: "ariza_tartib_raqami" });
    const newAriza = await Ariza.create({
      licshet: req.body.licshet,
      ikkilamchi_licshet: req.body.ikkilamchi_licshet,
      asosiy_licshet: req.body.asosiy_licshet,
      document_number: counter.value + 1,
      document_type: req.body.document_type,
      comment: req.body.comment,
      current_prescribed_cnt: req.body.current_prescribed_cnt,
      next_prescribed_cnt: req.body.next_prescribed_cnt,
      aktSummasi: parseInt(req.body.aktSummasi),
      sana: Date.now(),
    });
    await counter.updateOne({ $set: { value: counter.value + 1 } });
    res.json({ ok: true, ariza: newAriza });
  } catch (error) {
    console.error(error);
    res.json({ ok: false, message: `internal error: ${error.message}` });
  }
});

router.post("/scan_ariza_qr", upload.single("file"), async (req, res) => {
  try {
    const filePath = "./uploads/" + req.file.filename;
    const outputDir = "./uploads/converted_images/"; // Directory for converted images
    const imagePath = path.join(outputDir, "page-1.png"); // Path for the converted image

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    // Define options for PDF to image conversion
    const options = {
      format: "png",
      out_dir: outputDir,
      out_prefix: "page",
      page: 1, // Convert the first page
    };

    // Convert PDF to image
    await convert(filePath, options);

    // Read and process the image
    const image = await Jimp.read(imagePath);
    image.greyscale(); // Convert to grayscale for better processing

    // Convert image to raw data
    const { data, width, height } = image.bitmap;
    const imageData = new Uint8ClampedArray(data);

    // Decode the QR code
    const code = jsqr(imageData, width, height);

    // Clean up temporary files
    fs.unlinkSync(filePath); // Remove the uploaded file
    fs.unlinkSync(imagePath); // Remove the converted image

    // Send response
    if (code) {
      res.json({ ok: true, result: code.data });
    } else {
      res.json({ ok: false, result: "No QR code found." });
    }
  } catch (error) {
    console.error("Error processing QR code:", error);
    res.status(500).json({ error: "Error processing QR code." });
  }
});
module.exports = router;
