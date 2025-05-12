const { createTozaMakonApi } = require("../api/tozaMakon");
const { queueNames } = require("../constants");
const { LastUpdate } = require("../models/LastUpdate");
const { Abonent, Company } = require("../requires");
const XLSX = require("xlsx");

const BATCH_SIZE = 1000;

module.exports = (agenda) => {
  agenda.define(queueNames.updateAbonents, async (job, done) => {
    const data = job.attrs.data || {}; // fallback bo‘sh obyekt
    const { companyId, page = 0 } = data;

    try {
      if (!companyId) throw new Error("companyId not found");

      const tozaMakonApi = createTozaMakonApi(companyId);
      const company = await Company.findOne({ id: companyId });
      if (!company) throw new Error("Company not found");

      // faqat birinchi safar
      if (page === 0) {
        console.log("Downloading excel...");
        const now = new Date();
        const { data } = await tozaMakonApi.get(
          "/user-service/residents/excel",
          {
            params: {
              regionId: company.regionId,
              districtId: company.districtId,
              companyId: company.id,
              period: `${now.getMonth() + 1}.${now.getFullYear()}`,
            },
            responseType: "arraybuffer",
          }
        );

        console.log("Parsing excel...");
        const rows = getNeededRowsFromExcel(data).slice(1);

        await LastUpdate.findOneAndUpdate(
          { key: `abonents-temp-${companyId}` },
          { $set: { rows, last_update: new Date() } },
          { upsert: true }
        );
      }

      const state = await LastUpdate.findOne({
        key: `abonents-temp-${companyId}`,
      });
      if (!state || !Array.isArray(state.rows)) {
        throw new Error("Temporary data not found");
      }

      const rows = state.rows;
      const chunk = rows.slice(page * BATCH_SIZE, (page + 1) * BATCH_SIZE);
      if (chunk.length === 0) {
        // finished
        await LastUpdate.findOneAndUpdate(
          { key: `abonents-update-${companyId}` },
          { $set: { last_update: new Date() } },
          { upsert: true }
        );
        await LastUpdate.deleteOne({ key: `abonents-temp-${companyId}` });
        console.log("✅ All abonents updated");
        return done();
      }

      const ids = chunk.map((r) => r.id);
      const existing = await Abonent.find({ id: { $in: ids } }).select("id");
      const existingIds = new Set(existing.map((a) => a.id));

      const bulkOps = chunk
        .filter((r) => existingIds.has(r.id))
        .map((r) => ({
          updateOne: {
            filter: { id: r.id, companyId },
            update: { $set: { ksaldo: r.ksaldo } },
            upsert: false,
          },
        }));

      if (bulkOps.length > 0) {
        const result = await Abonent.bulkWrite(bulkOps);
        console.log(
          `Updated ${result.modifiedCount} abonents in batch ${page}`
        );
      }

      await LastUpdate.findOneAndUpdate(
        { key: `abonents-last-page-${companyId}` },
        { $set: { page: page + 1 } },
        { upsert: true }
      );

      // queue next batch
      await agenda.now(queueNames.updateAbonents, {
        companyId,
        page: page + 1,
      });

      done();
    } catch (err) {
      console.error("❌ Job failed", err);

      // qayta urinib ko'rish uchun
      await agenda.schedule("in 1 minute", queueNames.updateAbonents, {
        companyId,
        page,
      });

      done(err);
    }
  });
};
function getNeededRowsFromExcel(buffer) {
  const workBook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workBook.Sheets[workBook.SheetNames[0]];
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  range.s.r = 3;
  sheet["!ref"] = XLSX.utils.encode_range(range);

  const allRows = XLSX.utils.sheet_to_json(sheet, { header: "A" });
  return allRows
    .map((row) => ({
      id: row["A"],
      ksaldo: row["W"],
    }))
    .filter((row) => row.id && row.ksaldo != null);
}
