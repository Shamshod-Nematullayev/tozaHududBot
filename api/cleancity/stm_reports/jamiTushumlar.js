const { CleanCitySession } = require("../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const { virtualConsole } = require("../helpers/virtualConsole");

async function viloyatJamiTushumlar(mes, god, from_day, to_day) {
  try {
    const cc = "https://cleancity.uz/";
    const session = await CleanCitySession.findOne({ type: "stm_reports" });

    if (!session.path.getJamiTushumlarTahlili) {
      const res = await fetch(cc + "/startpage", {
        headers: {
          Cookie: session.cookie,
        },
      });
      const startpage = new JSDOM(await res.text(), {
        virtualConsole: virtualConsole,
      }).window.document;
      if (
        startpage.querySelector(
          "#g_acccordion > div > div > ul > li:nth-child(1) > a"
        ) == undefined
      ) {
        return { ok: false, message: "Session has expired" };
      }
      const elements = startpage.querySelectorAll("a");
      let hisobotlarPage = "";
      elements.forEach(function (element) {
        // Check if the text content matches "hello world"

        if (element.textContent.trim() === "МФА-16. Жами тушумлар таҳлили") {
          // Found the element, do something with it
          hisobotlarPage = element.href;
        }
      });
      const res1 = await fetch(
        `https://cleancity.uz/dashboard/${hisobotlarPage}`,
        { headers: { Cookie: session.cookie } }
      );
      const res2 = await fetch(res1.url, {
        headers: {
          Cookie: session.cookie,
        },
      });
      const res2Text = await res2.text();
      let getJamiTushumlarTahlili = res2Text
        .match(/url:\s*'ds\?xenc([^']+)'/g)[1]
        .split("'")[1];
      await session.updateOne({
        $set: { "path.getJamiTushumlarTahlili": getJamiTushumlarTahlili },
      });
      return await viloyatJamiTushumlar(arguments);
    } else {
      let data = await fetch(cc + session.path.getJamiTushumlarTahlili, {
        headers: {
          accept: "application/json, text/javascript, */*; q=0.01",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7,ru;q=0.6",
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          "sec-ch-ua":
            '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          Cookie: session.cookie,
        },

        body: `mes=${mes}&god=${god}&from_day=${from_day}&to_day=${to_day}&gov_level=1&sort=id&order=asc`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      });
      return (await data.json()).rows;
    }
  } catch (error) {
    throw error;
  }
}

module.exports = { viloyatJamiTushumlar };
