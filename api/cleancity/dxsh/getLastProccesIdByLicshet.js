const { CleanCitySession } = require("../../../requires");
const {
  getCleanCityPageByNavigation,
} = require("../helpers/getCleanCityPageByNavigation");
const { cleancity } = require("./domen");

async function getLastProccesIdByLicshet({ mail, session }) {
  try {
    if (!session.path.getSudProcesses) {
      session.path = await recoverPath(session);
    }
    const res = await fetch(cleancity + session.path.getSudProcesses, {
      headers: {
        accept: "application/json",
        cookie: session.cookie,
      },
      body: `page=1&rows=20&sort=id&order=desc&licshet=${mail.licshet}`,
    });
    const sud_process = (await res.json()).rows[0];

    await mail.updateOne({
      $set: {
        sud_process_id_billing: sud_process.id,
      },
    });
    return sud_process.id;
  } catch (error) {
    throw error;
  }
}

async function recoverPath(session) {
  if (!session) {
    session = await CleanCitySession.findOne({ type: "dxsh" });
  }
  const sudJarayonlarPage = await getCleanCityPageByNavigation({
    navigation_text: "Суд жараёнлари",
    session: session,
  });

  const matched = sudJarayonlarPage.match(/ds\?xenc=([^']{93})VDA/g);
  if (!matched) return { success: false, message: "Session has expired." };
  const path = matched[0];
  await session.updateOne({
    $set: {
      "path.getSudProcesses": path,
    },
  });
  return { getSudProcesses: path };
}

module.exports = { getLastProccesIdByLicshet };
