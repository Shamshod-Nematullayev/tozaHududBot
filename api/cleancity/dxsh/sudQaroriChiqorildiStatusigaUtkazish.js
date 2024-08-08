const { SudAkt } = require("../../../models/SudAkt");
const { CleanCitySession } = require("../../../requires");

async function sudQaroruChiqorildiStatusigaUtkazish(process_id) {
  const session = new CleanCitySession({ type: "dxsh" });
  if (!session.path.save_desined_file) {
    const sudJarayonlarPage = await getCleanCityPageByNavigation({
      navigation_text: "Суд жараёнлари",
      session: session,
    });
    let save_desined_file = sudJarayonlarPage.match(
      /dsmmf\?xenc=([^']+)id='/g
    )[1];
    session.path.save_desined_file = save_desined_file;
    await session.save();
    await SudAkt.updateOne(
      { sud_process_id_billing: process_id },
      { $set: { sudQaroriBillinggaYuklandi: true } }
    );
    return await sudQaroruChiqorildiStatusigaUtkazish(process_id);
  }
}

module.exports = { sudQaroruChiqorildiStatusigaUtkazish };
