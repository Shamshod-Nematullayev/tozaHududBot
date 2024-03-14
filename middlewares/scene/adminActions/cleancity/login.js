const fs = require("fs");
const { Scenes } = require("telegraf");
const nodeFetch = require("node-fetch");
const { JSDOM } = require("jsdom");
const { CleanCitySession } = require("../../../../models/CleanCitySession");

const enteredCallback = async (ctx) => {
  ctx.reply(`CleanCity tizimidagi loginingizni kiriting`);
};
const loginCleanCityScene = new Scenes.WizardScene(
  "login_clean_city",
  (ctx) => {
    try {
      ctx.wizard.state.username = ctx.message.text;
      ctx.reply("Endi password kiriting");
      ctx.wizard.next();
    } catch (err) {
      ctx.reply(`Error in step 1`);
      console.log(err);
    }
  },
  async (ctx) => {
    try {
      ctx.wizard.state.password = ctx.message.text;
      const resHomePage = await fetch("https://cleancity.uz/home");
      ctx.wizard.state.cookie = resHomePage.headers.get("set-cookie");
      if (ctx.wizard.state.cookie == null) return console.log("Xatolik");
      ctx.reply("Cookie: <code>" + ctx.wizard.state.cookie + "</code>", {
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
            Cookie: ctx.wizard.state.cookie,
          },
        }
      );
      const textLoginPage = await resLoginPage.text();
      const loginpage = new JSDOM(textLoginPage).window.document;
      ctx.wizard.state.loginpath = loginpage
        .getElementById("submit_btn")
        .getAttribute("onclick")
        .split("'")[3];
      ctx.reply(`<code>${ctx.wizard.state.loginpath}</code>`, {
        parse_mode: "HTML",
      });
      const captchaImg = await nodeFetch(
        `https://cleancity.uz/home/${loginpage.querySelector(".captcha").src}`,
        {
          headers: {
            Cookie: ctx.wizard.state.cookie,
          },
        }
      );
      captchaImg.body.pipe(
        fs.createWriteStream("./captcha.png").on("finish", () => {
          ctx
            .replyWithPhoto(
              { source: "./captcha.png" },
              { caption: "Rasmdagi belgilarni kiriting" }
            )
            .then(() => {
              fs.unlink("./captcha.png");
            });
          ctx.wizard.next();
        })
      );
    } catch (err) {
      ctx.reply(`Error in step 2`);
      console.log(err);
    }
  },
  async (ctx) => {
    try {
      const resLogin = await fetch(
        "https://cleancity.uz/startpage" +
          ctx.wizard.state.loginpath +
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
            cookie: ctx.wizard.state.cookie,
          },
          body: `SignInForm_hf_0=&username=${ctx.wizard.state.username}&password=${ctx.wizard.state.password}&security_code=${ctx.message.text}&signin_submit=1`,
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
              Cookie: ctx.wizard.state.cookie,
            },
          }
        );
        captchaImg.body.pipe(
          fs.createWriteStream("./captcha.png").on("finish", () => {
            return ctx
              .replyWithPhoto(
                { source: "./captcha.png" },
                {
                  caption: resDoc.querySelector(".feedbackPanelERROR")
                    .textContent,
                }
              )
              .then(() => {
                fs.unlink("./captcha.png");
              });
          })
        );
      }
      await CleanCitySession.create({
        user_id: ctx.from.id,
        cookie: ctx.wizard.state.cookie,
        login: ctx.wizard.state.username,
        password: ctx.wizard.state.password,
        active: true,
      });
      ctx.reply("Muvaffaqqiyatli login qilindi");
      ctx.scene.leave();
    } catch (err) {
      console.log(err);
      ctx.reply("error in step 3");
    }
  }
);

loginCleanCityScene.enter(enteredCallback);

module.exports = { loginCleanCityScene };
