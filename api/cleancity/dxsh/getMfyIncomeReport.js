const { CleanCitySession } = require("../../../requires");

async function getMfyIncomeReport(ctx = false) {
  try {
    // session holatini tekshirish
    const session = await CleanCitySession.findOne({ type: "dxsh" });
  } catch (err) {
    console.error(new Error(err));
  }
}
