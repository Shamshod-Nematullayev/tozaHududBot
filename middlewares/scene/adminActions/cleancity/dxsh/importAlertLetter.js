const { CleanCitySession } = require("../../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const cc = `https://cleancity.uz/`;

async function importAlertLetter() {
  //   let obj = {
  //     abonent_id,
  //     file_name,
  //     alert_summ,
  //     alert_date,
  //   };
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    if (session.path.enterAlertLetterPath) {
    } else {
      const startpage = await fetch(cc + "startpage", {
        headers: { Cookie: session.cookie },
      });
      const startpageText = await startpage.text();
      const startpageDoc = new JSDOM(startpageText).window.document;
      const elements = startpageDoc.querySelectorAll("a");
      let toAlertLettersPage = "";
      elements.forEach(function (element) {
        // Check if the text content matches "hello world"
        if (element.textContent.trim() === "Суд огоҳлантириш") {
          // Found the element, do something with it
          toAlertLettersPage = element.href;
        }
      });
      console.log(toAlertLettersPage);
      const res1 = await fetch(
        `https://cleancity.uz/dashboard${toAlertLettersPage}`,
        { Cookie: session.cookie }
      );
      console.log(res1.url);
    }
  } catch (err) {
    console.log(err);
  }
}

module.exports = { importAlertLetter };
