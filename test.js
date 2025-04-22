const { tozaMakonApi } = require("./api/tozaMakon");
const { Ariza } = require("./models/Ariza");
const { SudAkt } = require("./models/SudAkt");
const { Abonent } = require("./requires");

const func = async () => {
  const sudAktlari = await SudAkt.find({
    companyId: 1144,
  }).lean();
  console.log(sudAktlari.length);
  for (let akt of sudAktlari) {
    try {
      const month = 0;
      const year = 2024;
      const abonent = await Abonent.findOne({ licshet: akt.licshet });
      const rows = (
        await tozaMakonApi.get("/billing-service/resident-balances/dhsh", {
          params: {
            residentId: abonent.id,
            page: 0,
            size: 30,
          },
        })
      ).data.content;
      const rows2 = rows.filter(
        (row) => row.god > year || (row.god === year && row.mes > month)
      );
      let allPayments = 0;
      let allActs = 0;
      rows2.forEach((row) => {
        allPayments += row.allPaymentsSum;
        allActs += row.actAmount;
      });
      await SudAkt.findByIdAndUpdate(akt._id, {
        $set: { tushum: allPayments, akt: allActs },
      });
      console.log(allPayments, akt.licshet);
    } catch (error) {
      console.error(akt, "xato");
      console.error(error);
    }
  }
  console.log("Jarayon yakullandi");
};
// func();

const updateTM = async () => {
  const accNumbers = require("./main.json");
  let counter = 0;
  for (let licshet of accNumbers) {
    const abonent = await Abonent.findOne({ licshet });
    try {
      counter++;
      console.log(counter);
      const pasportData = await tozaMakonApi.get("/user-service/citizens", {
        params: {
          passport: abonent.passport_number
            ? abonent.passport_number.split("-").join("")
            : "",
          pinfl: abonent.pinfl,
        },
      });
      const abonentDatasResponse = await tozaMakonApi.get(
        `/user-service/residents/${abonent.id}?include=translates`
      );
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
          citizen: {
            ...pasportData.data,
            phone: data.citizen.phone,
          },
          house: {
            ...data.house,
            cadastralNumber: data.house.cadastralNumber
              ? data.house.cadastralNumber
              : null,
          },
        }
      );
      await tozaMakonApi.patch("/user-service/residents/identified", {
        identified: true,
        residentIds: [abonent.id],
      });
    } catch (error) {
      console.log(error.message);
    }
  }
};
// updateTM();
