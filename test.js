const { tozaMakonApi } = require("./api/tozaMakon");
const { Abonent } = require("./requires");

(async () => {
  const abonents = await Abonent.find({
    "shaxsi_tasdiqlandi.confirm": true,
  });

  let counter = 6189;
  async function loop() {
    if (counter == abonents.length) return console.log("Jarayon yakunlandi");
    try {
      const abonent = abonents[counter];
      console.log("Counter:", counter);

      const pasportResponse = await tozaMakonApi.get("/user-service/citizens", {
        params: {
          passport: abonent.passport_number.replace("-", ""),
          pinfl: abonent.pinfl,
          birthdate: `${Number(String(abonent.pinfl)[0]) > 4 ? 20 : 19}${String(
            abonent.pinfl
          ).slice(5, 7)}-${String(abonent.pinfl).slice(3, 5)}-${String(
            abonent.pinfl
          ).slice(1, 3)}`,
        },
      });
      if (!pasportResponse || pasportResponse.status !== 200) {
        throw new Error(
          `Passport API Error: Status ${
            pasportResponse ? pasportResponse.status : "undefined"
          }`
        );
      }

      const abonentDatasResponse = await tozaMakonApi.get(
        `/user-service/residents/${abonent.id}?include=translates&withPhoto=true`
      );
      if (!abonentDatasResponse || abonentDatasResponse.status !== 200) {
        throw new Error(
          `Resident API Error: Status ${
            abonentDatasResponse ? abonentDatasResponse.status : "undefined"
          }`
        );
      }

      const data = abonentDatasResponse.data;
      const updateResponse = await tozaMakonApi.put(
        "/user-service/residents/" + abonent.id,
        {
          id: abonent.id,
          accountNumber: abonent.licshet,
          residentType: "INDIVIDUAL",
          electricityAccountNumber: data.electricityAccountNumber,
          electricityCoato: data.electricityCoato,
          companyId: data.companyId,
          streetId: data.streetId,
          mahallaId: data.mahallaId,
          contractNumber: data.contractNumber,
          contractDate: data.contractDate,
          homePhone: null,
          active: data.active,
          description: data.description,
          citizen: pasportResponse.data,
          house: data.house,
        }
      );
      if (!updateResponse || updateResponse.status !== 200) {
        throw new Error(
          `Update API Error: Status ${
            updateResponse ? updateResponse.status : "undefined"
          }`
        );
      }

      await abonent.updateOne({
        $set: {
          passport_number: pasportResponse.data.passport,
          fio: `${pasportResponse.data.lastName} ${pasportResponse.data.firstName} ${pasportResponse.data.patronymic}`,
          first_name: pasportResponse.data.firstName,
          last_name: pasportResponse.data.lastName,
          middle_name: pasportResponse.data.patronymic,
        },
      });

      counter++;
      loop();
    } catch (error) {
      await abonents[counter].updateOne({ $set: { bumadi: true } });
      counter++;
      loop();
      console.log(abonents[counter]);
      console.error("Error:", error.message || error);
    }
  }
  loop();
})//();
