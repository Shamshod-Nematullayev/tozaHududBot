const { tozaMakonApi } = require("./api/tozaMakon");
const { EtkKodRequest } = require("./models/EtkKodRequest");
const { Abonent, Nazoratchi, MultiplyRequest } = require("./requires");

async () => {
  const abonents = await EtkKodRequest.find();

  let counter = 0;
  let updated = 0;
  async function loop() {
    if (counter == abonents.length)
      return console.log("Jarayon yakunlandi. Updated: " + updated);
    const abonent = abonents[counter];
    console.log("Counter:", counter);

    const abo = await Abonent.findOne({ licshet: abonent.licshet });

    const pasportResponse = await tozaMakonApi.patch(
      "/user-service/residents/" + abonent.abonent_id,
      {
        electricityAccountNumber: abonent.etk_kod,
        electricityCoato: abonent.etk_saoto,
        id: abonent.id,
      }
    );
    if (!pasportResponse || pasportResponse.status !== 200) {
      throw new Error(
        `Passport API Error: Status ${
          pasportResponse ? pasportResponse.status : "undefined"
        }`
      );
    }
    if (abo.ekt_kod_tasdiqlandi?.confirm) {
      const inspector = await Nazoratchi.findOne({ id: abonent.inspector_id });
      await abo.updateOne({
        $set: {
          ekt_kod_tasdiqlandi: {
            confirm: true,
            inspector_id: inspector.id,
            inspector_name: inspector.name,
            updated_at: new Date(),
          },
          energy_licshet: abonent.etk_kod,
        },
      });
      updated++;
    }
    counter++;
    loop();
  }
  loop();
}; //();

async () => {
  const datas = await MultiplyRequest.find();
  for (const [i, data] of datas.entries()) {
    // for...of bilan navbatma-navbat ishlash
    if (data.YASHOVCHILAR <= data.currentInhabitantCount) {
      console.log(i);
      await data.deleteOne(); // Asinxron operatsiya
    }
  }
}; //();
