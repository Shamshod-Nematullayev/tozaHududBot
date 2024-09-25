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
      .split(`"`)[0];
    console.log({ statusAlmashtirish });
    await CleanCitySession.updateOne(
      { _id: session._id },
      { $set: { "path.statusAlmashtirish": statusAlmashtirish } }
    );
    return await sudQaroruChiqorildiStatusigaUtkazish(process_id);
  }
  const res = await fetch(
    "https://cleancity.uz/" + session.path.save_desined_file + "/",
    {
      headers: { Cookie: session.cookie },
    }
  );
  const result = await res.json();
  if (result.success)
    await SudAkt.updateOne(
      { sud_process_id_billing: process_id },
      { $set: { sudQaroriBillinggaYuklandi: true } }
    );

  return result;
}

module.exports = { sudQaroruChiqorildiStatusigaUtkazish };
