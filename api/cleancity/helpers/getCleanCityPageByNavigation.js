const { JSDOM } = require("jsdom");
const getCleanCityPageByNavigation = async ({ navigation_text, session }) => {
  try {
    const startpage = await fetch(process.env.CLEAN_CITY_DOMEN + "startpage", {
      headers: { Cookie: session.cookie },
    });
    const startpageText = await startpage.text();
    const startpageDoc = new JSDOM(startpageText).window.document;
    const elements = startpageDoc.querySelectorAll("a");
    let hrefToPage = "";
    elements.forEach(function (element) {
      if (element.textContent.trim() === navigation_text) {
        // Found the element, do something with it
        hrefToPage = element.href;
      }
    });
    const res1 = await fetch(`https://cleancity.uz/dashboard/${hrefToPage}`, {
      headers: { Cookie: session.cookie },
    });
    const res2 = await fetch(res1.url, {
      headers: {
        Cookie: session.cookie,
      },
    });
    const res2Text = await res2.text();
    return res2Text;
  } catch (error) {
    throw error;
  }
};

module.exports = { getCleanCityPageByNavigation };
