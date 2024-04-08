// bismillah

const cc = `https://cleancity.uz/`;
const { JSDOM } = require("jsdom");

const { CleanCitySession } = require("../models/CleanCitySession");
const { SudMaterial } = require("../models/SudMaterial");

async function enterMaterialTOBilling(file_path, kod) {
  const session = await CleanCitySession.findOne({ type: "dxsh" });
  if (session.path.saveFileLink && session.path.findSudProccessPath) {
    return;
  }
  const startpage = await fetch(cc + "startpage", {
    headers: { Cookie: session.cookie },
  });
  const startpageText = await startpage.text();
  const startpageDoc = new JSDOM(startpageText).window.document;
  const elements = startpageDoc.querySelectorAll("a");
  let toSudActionsPage = "";
  elements.forEach(function (element) {
    // Check if the text content matches "hello world"
    if (element.textContent.trim() === "Суд жараёнлари") {
      // Found the element, do something with it
      toSudActionsPage = element.href;
    }
  });
  const res1 = await fetch(
    `https://cleancity.uz/dashboard/${toSudActionsPage}`,
    { headers: { Cookie: session.cookie } }
  );
  const res2 = await fetch(res1.url, {
    headers: {
      Cookie: session.cookie,
    },
  });
  const res2Text = await res2.text();
  let findSudProccessPath = res2Text.match(
    /rownumbers:true,url:"ds\?xenc=([^']+)VDA"/g
  );
  findSudProccessPath = findSudProccessPath[0].split('"')[1];
  let saveFileLink = res2Text.match(/dsmmf\?xenc=([^']+)id='/g);
  saveFileLink = saveFileLink[0].split("'")[0];
  console.log(saveFileLink);
  await CleanCitySession.updateOne(
    { type: "dxsh" },
    {
      $set: {
        "path.findSudProccessPath": findSudProccessPath,
        "path.saveFileLink": saveFileLink,
      },
    }
  );
  return await enterMaterialTOBilling(file_path, kod);
}

enterMaterialTOBilling();

// ariza va ilovalarni billing bazasiga yuklaydigan dastur.
async function importSudMaterialsToBilling(pachka_id) {
  try {
    const pachka = await SudMaterial.findById(pachka_id);
  } catch (error) {
    console.error(error);
  }
}
