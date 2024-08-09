const { SudAkt } = require("../../../models/SudAkt");
const { CleanCitySession } = require("../../../requires");
const {
  getCleanCityPageByNavigation,
} = require("../helpers/getCleanCityPageByNavigation");

async function sudQaroruChiqorildiStatusigaUtkazish(process_id) {
  const session = await CleanCitySession.findOne({ type: "dxsh" });
  if (!session.path.statusAlmashtirish) {
    const sudJarayonlarPage = await getCleanCityPageByNavigation({
      navigation_text: "Суд жараёнлари",
      session: session,
    });
    let statusAlmashtirish = sudJarayonlarPage
      .match(/ds\?xenc=([^']{93})VDA"/g)[0]
      .split("'")[0];
    console.log(statusAlmashtirish);
    session.path.statusAlmashtirish = statusAlmashtirish;
    await session.save();
    await SudAkt.updateOne(
      { sud_process_id_billing: process_id },
      { $set: { sudQaroriBillinggaYuklandi: true } }
    );
    return await sudQaroruChiqorildiStatusigaUtkazish(process_id);
  }
}

module.exports = { sudQaroruChiqorildiStatusigaUtkazish };
