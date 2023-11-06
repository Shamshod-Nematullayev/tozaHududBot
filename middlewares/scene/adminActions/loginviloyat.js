const { Scenes } = require("telegraf");
const { JSDOM } = require("jsdom");
const https = require("https");
const fs = require("fs");
const nodeFetch = require("node-fetch");

const enterFunction = (ctx) => ctx.reply("loginni kiriting");

const loginviloyat = new Scenes.WizardScene(
  "viloyatlogintest",
  async (ctx) => {
    if (ctx.message.text == "👨‍💻 Ish maydoni") ctx.scene.leave();
    ctx.wizard.state.LOGIN = ctx.message.text;
    ctx.reply("parolni kiriting!");
    ctx.wizard.next();
  },
  async (ctx) => {
    // return ctx.scene.leave();
    ctx.wizard.state.PASSWORD = ctx.message.text;
    // saytga kirish
    const res = await fetch("https://cleancity.uz/home");
    ctx.wizard.state.COOKIE = res.headers.get("set-cookie");
    const html = new JSDOM(await res.text());
    const loginbtn = html.window.document.querySelector(
      "div.f-right div.login-button"
    );
    const loginPath = loginbtn.querySelector("a").href;
    // login formaga o'tish
    const res2 = await fetch("https://cleancity.uz/home" + loginPath, {
      headers: { Cookie: ctx.wizard.state.COOKIE },
    });
    // fs.writeFile("form.html", await res2.text(), (err) => console.log(err));
    const html2 = new JSDOM(await res2.text());

    ctx.wizard.state.LOGIN_PATH = html2.window.document
      .querySelector("#submit_btn")
      .getAttribute("onclick")
      .split("'")[3];

    // html2.window.document.querySelector(".btn.btn-lg.btn-block.main-bg.shape")
    //   .innerHTML
    // ();
    // return;

    const res3 = await nodeFetch(
      "https://cleancity.uz/home" +
        `${html2.window.document.querySelector(".captcha").src}`,
      {
        headers: { Cookie: ctx.wizard.state.COOKIE },
      }
    );
    res3.body.pipe(
      fs.createWriteStream("catpcha.png").on("finish", () => {
        ctx.replyWithPhoto(
          { source: "catpcha.png" },
          { caption: "Xavfsizlik kodini kiriting!" }
        );
      })
    );
    ctx.wizard.next();
  },
  async (ctx) => {
    return ctx.scene.leave();
    const res = await fetch(
      `https://cleancity.uz/home${ctx.wizard.state.LOGIN_PATH}&random=0.7638408575038682`,
      {
        headers: {
          accept: "text/xml",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "content-type": "application/x-www-form-urlencoded",
          "sec-ch-ua":
            '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "wicket-ajax": "true",
          "wicket-focusedelementid": "submit_btn",
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `SignInForm_hf_0=&username=dxsh24107&password=9999&security_code=${ctx.message.text}&signin_submit=1`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    );
    ctx.scene.leave();
    console.log(await res.text());
  }
);
loginviloyat.enter(enterFunction);

module.exports = { loginviloyat };
