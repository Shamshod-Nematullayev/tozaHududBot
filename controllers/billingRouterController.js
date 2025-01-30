const { tozaMakonApi } = require("../api/tozaMakon");

module.exports.downloadFileFromBilling = async (req, res) => {
  try {
    const { file_id } = req.params;

    // Server 2 ga so‘rov yuborish
    const response = await tozaMakonApi.get("/file-service/buckets/download", {
      params: { file: file_id },
      responseType: "stream",
    });

    // Fayl nomini olish
    let fileName = "downloaded_file";
    const contentDisposition = response.headers["content-disposition"];
    if (contentDisposition && contentDisposition.includes("filename=")) {
      fileName = contentDisposition
        .split("filename=")[1]
        .replace(/"/g, "")
        .trim();
    }

    // Headerlarni o‘rnatish
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader(
      "Content-Type",
      response.headers["content-type"] || "application/octet-stream"
    );

    // Stream orqali yuborish
    response.data.pipe(res);
  } catch (error) {
    console.error("Error downloading file:", error);

    // Xato xabarlarini yaxshiroq chiqarish
    const errorMessage =
      error.response?.data || error.message || "Internal server error";

    res.status(500).json({ ok: false, message: errorMessage });
  }
};
