const { tozaMakonApi } = require("./api/tozaMakon");
const { EtkKodRequest } = require("./models/EtkKodRequest");
const { Abonent, Nazoratchi } = require("./requires");
(async () => {
  const sorovlar = await EtkKodRequest.find();
  let counter = 0;
  async function loop() {
    if (counter === sorovlar.length) return console.log("Jarayon yakunlandi");
    console.log(counter);
    const surov = sorovlar[counter];
    const res = await tozaMakonApi.patch(
      "/user-service/residents/" + surov.abonent_id,
      {
        electricityAccountNumber: surov.etk_kod,
        electricityCoato: "18214",
        id: surov.abonent_id,
      }
    );
    const inspector = await Nazoratchi.findOne({ id: surov.inspector_id });
    if (res.status === 200) {
      await Abonent.updateOne(
        { licshet: surov.licshet },
        {
          $set: {
            ekt_kod_tasdiqlandi: {
              confirm: true,
              inspector_id: surov.inspector_id,
              inspector_name: inspector?.name,
              updated_at: new Date(),
            },
            energy_licshet: surov.etk_kod,
          },
        }
      );
      counter++;
      loop();
    }
  }
  loop();
})();
