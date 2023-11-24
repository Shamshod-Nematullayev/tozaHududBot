const cc = `https://cleancity.uz/`;
const { CleanCitySession } = require("../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");

// ========================================================================

const yashovchiSoniKopaytirish = async (litsavoy, yashovchiSoni) => {
  try {
    const session = await CleanCitySession.findOne({ type: "dxsh" });
    const startpage = await fetch(cc + "startpage", {
      headers: { Cookie: session.cookie },
    });
    const startpageText = await startpage.text();

    function extractDsXencValue(input) {
      // Define the regex pattern to match the ds?xenc parameter
      var regex = /url:\s*'ds\?xenc=([^']+)'/;

      // Use the exec method to extract the value
      var match = regex.exec(input);

      // Check if there is a match and return the value
      if (match && match[1]) {
        return match[1];
      } else {
        return null; // Return null if no match is found
      }
    }

    // Example usage for initAboGrid
    var urlValueAboGrid = extractDsXencValue(startpageText);
    console.log(urlValueAboGrid);

    let url = startpageText.match(/url:\s*'ds\?xenc=([^']+)'/g);
    console.log(url);
    const res = await fetch(cc + `${url[1].split("'")[1]}`, {
      method: "POST",
      headers: {
        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "sec-ch-ua":
          '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-requested-with": "XMLHttpRequest",
        Cookie: session.cookie,
      },
      referrer: "https://cleancity.uz/startpage",
      referrerPolicy: "strict-origin-when-cross-origin",
      body: `companies_id=1144&licshet=${litsavoy}&module_name=StaffBottomHeader&page=1&rows=20&sort=licshet&order=asc`,
      mode: "cors",
      credentials: "include",
    });
    console.log(await res.json());
    // const startpageDoc = new JSDOM(await startpage.text());
  } catch (err) {
    console.log(err);
  }
};
// yashovchiSoniKopaytirish(105120390245);
module.exports = { yashovchiSoniKopaytirish };
