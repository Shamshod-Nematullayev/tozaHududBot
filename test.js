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
