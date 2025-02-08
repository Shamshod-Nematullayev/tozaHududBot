const { tozaMakonApi } = require("../../api/tozaMakon");

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
