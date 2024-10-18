const { CleanCitySession } = require("../../../../../models/CleanCitySession");
const { JSDOM } = require("jsdom");
const { Abonent } = require("../../../../../models/Abonent");
const {
  virtualConsole,
} = require("../../../../../api/cleancity/helpers/virtualConsole");
const cc = `https://cleancity.uz/`;

async function changeAbonentDates({
  abonent_id,
  abo_data = {
    fio: undefined,
    streets_id: undefined,
    inn: undefined,
    house: undefined,
    kadastr_number: undefined,
    contract_number: undefined,
    phone: undefined,
    email: undefined,
    energy_licshet: undefined,
    energy_coato: undefined,
    home_phone: undefined,
    house_type_id: undefined,
    description: undefined,
    passport_location: undefined,
    passport_number: undefined,
    brith_date: undefined,
    passport_given_date: undefined,
    passport_expire_date: undefined,
    pinfl: undefined,
  },
}) {
  for (let key in abo_data) {
    if (abo_data[key] === undefined) {
      delete abo_data[key];
    }
  }
  const session = await CleanCitySession.findOne({ type: "dxsh" });
  if(!session.path.updateAboDataUrl || !session.path.getAboDataUrl){
    session.path = await recoverPath(session, abonent_id)
  }
  if (session.path.updateAboDataUrl && session.path.getAboDataUrl) {
    let abonent_data = await fetch(
      "https://cleancity.uz/" + session.path.getAboDataUrl,
      {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "uz",
          "content-type": "application/x-www-form-urlencoded",          Cookie: session.cookie,
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `abonents_id=${abonent_id}&module_name=AbonentCardModule`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    );

    abonent_data = await abonent_data.json();
    abonent_data = { ...abonent_data.rows[0], ...abo_data };
    for (let key in abonent_data) {
      if (abonent_data[key] === null) {
        abonent_data[key] = "";
      }
    }
    // abonent ma'lumotlarini yangilash url mavjud bo'lganida
    const res = await fetch(
      "https://cleancity.uz/" + session.path.updateAboDataUrl,
      {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "uz",
          "content-type": "application/x-www-form-urlencoded",
          Cookie: session.cookie,
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `id=${abonent_id}&fio=${abonent_data.fio}&streets_id=${abonent_data.streets_id}&inn=${abonent_data.inn}&house=${abonent_data.house}&ind=&flat=&kadastr_number=${abonent_data.kadastr_number}&contract_number=${abonent_data.contract_number}&phone=${abonent_data.phone}&email=${abonent_data.email}&energy_licshet=${abonent_data.energy_licshet}&energy_coato=${abonent_data.energy_coato}&home_phone=${abonent_data.home_phone}&house_type_id=${abonent_data.house_type_id}&description=${abonent_data.description}&passport_location=${abonent_data.passport_location}&passport_number=${abonent_data.passport_number}&brith_date=${abonent_data.brith_date}&passport_given_date=${abonent_data.passport_given_date}&passport_expire_date=${abonent_data.passport_expire_date}&pinfl=${abonent_data.pinfl}`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    );
    return await res.json();
  }
}
async function recoverPath(session, abonent_id){
  const startpage = await fetch(cc + "startpage", {
      headers: { Cookie: session.cookie },
    });
    const startpageText = await startpage.text();
    const startpageDoc = new JSDOM(startpageText, {
      virtualConsole: virtualConsole
    });
    let toCardAboUrl = startpageDoc
      .getElementById("to_card_abo")
      .getAttribute("action");

    const abonentCardPage = await fetch(
      "https://cleancity.uz/dashboard" + toCardAboUrl,
      {
        headers: {
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,uz;q=0.7",
          "cache-control": "max-age=0",
          "content-type": "application/x-www-form-urlencoded",
          Cookie: session.cookie,
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: `to_card_abo_hf_0=&id=${abonent_id}&companies_id=1144`,
        method: "POST",
        mode: "cors",
        credentials: "include",
      }
    );
    const responseText = await abonentCardPage.text();
    const updateAboDataUrl = responseText
      .match(/url_upd\s*=\s*'([^']*)'/g)[0]
      .split("'")[1];

    const getAboDataUrl = responseText
      .match(/ds\?xenc=([^']*)'/g)[2]
      .split("'")[0];
    await session.updateOne({
      $set: {
        "path.updateAboDataUrl": updateAboDataUrl,
        "path.getAboDataUrl": getAboDataUrl,
        "path.toCardAboUrl": toCardAboUrl
      },
    });
    return {
      updateAboDataUrl,
      getAboDataUrl,
      toCardAboUrl
    }
}

module.exports = { changeAbonentDates };
