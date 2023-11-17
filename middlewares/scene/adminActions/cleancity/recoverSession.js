const { Scenes } = require("telegraf");
const { CleanCitySession } = require("../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const nodeFetch = require("node-fetch");
const fs = require("fs");

const recoverCleanCitySession = new Scenes.WizardScene(
  "recover_clean_city_session",
  async (ctx) => {
    try {
      const session = await CleanCitySession.findOne({
        type: ctx.session.session_type,
      });
      const resLogin = await fetch(
        "https://cleancity.uz/startpage" +
          ctx.session.loginpath +
          "&random=0.6418139989154257",
        {
          headers: {
            accept: "text/xml",
            "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
            "content-type": "application/x-www-form-urlencoded",
            "sec-ch-ua":
              '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "wicket-focusedelementid": "submit_btn",
            cookie: ctx.session.cookie,
          },
          body: `SignInForm_hf_0=&username=${session.login}&password=${session.password}&security_code=${ctx.message.text}&signin_submit=1`,
          method: "POST",
        }
      );
      const textLoginResponse = await resLogin.text();
      const resDoc = new JSDOM(textLoginResponse).window.document;
      //   fs.writeFile("./startpage.html", textLoginResponse, () => {});
      if (resDoc.querySelector(".feedbackPanelERROR")?.textContent) {
        const captchaImg = await nodeFetch(
          `https://cleancity.uz/home/${resDoc.querySelector(".captcha").src}`,
          {
            headers: {
              Cookie: ctx.session.cookie,
            },
          }
        );
        captchaImg.body.pipe(
          fs.createWriteStream("./captcha.png").on("finish", () => {
            return ctx.replyWithPhoto(
              { source: "./captcha.png" },
              {
                caption: resDoc.querySelector(".feedbackPanelERROR")
                  .textContent,
              }
            );
          })
        );
      }
      await session.updateOne({
        user_id: ctx.from.id,
        cookie: ctx.session.cookie,
        login: session.login,
        password: session.password,
        active: true,
      });
      ctx.reply("Muvaffaqqiyatli login qilindi");
      ctx.scene.leave();
    } catch (err) {
      ctx.reply("error step 1, recover_clean_city_session");
      console.log(err);
    }
  }
);

recoverCleanCitySession.enter(async (ctx) => {
  try {
    const resHomePage = await fetch("https://cleancity.uz/home");
    ctx.session.cookie = resHomePage.headers.get("set-cookie");
    if (ctx.session.cookie == null) return console.log("Xatolik");
    ctx.reply("Cookie: <code>" + ctx.session.cookie + "</code>", {
      parse_mode: "HTML",
    });
    const textHomePage = await resHomePage.text();
    const homepage = new JSDOM(textHomePage);

    const resLoginPage = await fetch(
      `https://cleancity.uz/home/${
        homepage.window.document.querySelector(".login-button a").href
      }`,
      {
        headers: {
          Cookie: ctx.session.cookie,
        },
      }
    );
    const textLoginPage = await resLoginPage.text();
    const loginpage = new JSDOM(textLoginPage).window.document;
    ctx.session.loginpath = loginpage
      .getElementById("submit_btn")
      .getAttribute("onclick")
      .split("'")[3];
    ctx.reply(`<code>${ctx.session.loginpath}</code>`, {
      parse_mode: "HTML",
    });
    const captchaImg = await nodeFetch(
      `https://cleancity.uz/home/${loginpage.querySelector(".captcha").src}`,
      {
        headers: {
          Cookie: ctx.session.cookie,
        },
      }
    );
    captchaImg.body.pipe(
      fs.createWriteStream("./captcha.png").on("finish", () => {
        ctx.replyWithPhoto(
          { source: "./captcha.png" },
          { caption: "Rasmdagi belgilarni kiriting" }
        );
      })
    );
  } catch (error) {
    ctx.reply("error on entery, recover_clean_city_session");
    console.log(error);
  }
});

module.exports = { recoverCleanCitySession };
