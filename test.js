const { tozaMakonApi, createTozaMakonApi } = require("./api/tozaMakon");
const {
  extractBirthDateString,
} = require("./helpers/extractBirthDateFromPinfl");
const { Ariza } = require("./models/Ariza");
const { SudAkt } = require("./models/SudAkt");
const { Abonent, Company } = require("./requires");

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

async function getFrozenAbonents() {
  try {
    const rows = [];
    console.log("Jarayon boshlandi");
    for (let i = 0; i < 185; i++) {
      const { data } = await tozaMakonApi.get(
        `/user-service/residents?districtId=47&sort=id,DESC&page=${i}&size=300&companyId=1144`
      );
      rows.push(
        ...data.content
          .filter((row) => row.isFrozen == true)
          .map((row) => row.accountNumber)
      );
      console.log(i);
    }
    require("fs").writeFileSync("./main.json", JSON.stringify(rows));
    console.log("Jarayon yakullandi");
  } catch (error) {
    console.log(error.message);
  }
}

// getFrozenAbonents();
//{
//   "homeNum": "79",
//   "pinfl": "33003633920039",
//   "cadastr": "14:05:01:01:16:0085",
//   "accountNumber": "105120550078",
//   "id": "12530657"
// }[] // this is on main.json
async function updateFrozenAbonentsToIdentied() {
  console.log(
    "Muzlatilgan abonentlarni identifikatsiya qilish jarayoni boshlandi"
  );
  const rows = require("./main.json");
  const errors = [];
  let i = rows.length;
  let operationsCount = 1;
  const tozaMakonApi = createTozaMakonApi(1144);
  for (const row of rows) {
    console.log(i, row.accountNumber);
    // if (i == rows.length - operationsCount) break;
    i--;
    try {
      const pasportData = (
        await tozaMakonApi.get("/user-service/citizens", {
          params: {
            pinfl: row.pinfl,
            birthdate: extractBirthDateString(row.pinfl),
          },
        })
      ).data;
      const currentAbonentData = (
        await tozaMakonApi.get(
          `/user-service/residents/${row.id}?include=translates`
        )
      ).data;

      await tozaMakonApi.put("/user-service/residents/" + row.id, {
        id: row.id,
        accountNumber: row.accountNumber,
        residentType: "INDIVIDUAL",
        electricityAccountNumber: currentAbonentData.electricityAccountNumber,
        electricityCoato: currentAbonentData.electricityCoato,
        companyId: currentAbonentData.companyId,
        streetId: 461764,
        mahallaId: 61552,
        contractNumber: currentAbonentData.contractNumber,
        contractDate: currentAbonentData.contractDate,
        homePhone: null,
        active: currentAbonentData.active,
        description: `Fake id for delete on future`,
        citizen: {
          ...pasportData,
          phone: currentAbonentData.citizen.phone,
        },
        house: {
          ...currentAbonentData.house,
          homeIndex: "del",
          cadastralNumber: row.cadastr,
        },
      });
      await tozaMakonApi.patch("/user-service/residents/identified", {
        identified: true,
        residentIds: [row.id],
      });
    } catch (error) {
      errors.push({ row, message: error.message });
    }
  }
  console.error(errors);
  console.log("Jarayon yakullandi");
}
// updateFrozenAbonentsToIdentied();

async function aktPachkasiniChange() {
  const idList = ["67fde7c3a6357f6e37606905"];
  const date = new Date();
  const company = await Company.findOne({ id: 1144 });
  const tozaMakonApi = createTozaMakonApi(1144);
  for (let id of idList) {
    const ariza = await Ariza.findById(id);
    const abonent = await Abonent.findOne({ licshet: ariza.licshet });
    console.log(id);
    let next_inhabitant_count = ariza.next_prescribed_cnt;
    const inhabitantCounts = { inhabitantCount: next_inhabitant_count };

    const calculateKSaldo = (
      await tozaMakonApi.get("/billing-service/acts/calculate-k-saldo", {
        params: {
          amount: ariza.aktInfo.amount,
          residentId: abonent.id,
          actPackId: company.akt_pachka_ids[ariza.document_type].id,
          actType: ariza.aktInfo.actType,
        },
      })
    ).data;
    const aktResponseData = (
      await tozaMakonApi.post("/billing-service/acts", {
        actPackId: company.akt_pachka_ids[ariza.document_type].id,
        actType: ariza.aktInfo.actType,
        amount: ariza.aktInfo.amount,
        amountWithQQS: ariza.aktInfo.amountWithQQS,
        amountWithoutQQS: ariza.aktInfo.amountWithoutQQS,
        description: ariza.aktInfo.description,
        endPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        startPeriod: `${date.getMonth() + 1}.${date.getFullYear()}`,
        fileId: ariza.aktInfo.fileId,
        kSaldo: calculateKSaldo,
        residentId: abonent.id,
        ...inhabitantCounts,
      })
    ).data;
    await Ariza.findByIdAndUpdate(ariza._id, {
      $set: {
        akt_pachka_id: aktResponseData.actPackId,
        akt_id: aktResponseData.id,
        aktInfo: {
          ...aktResponseData,
        },
        akt_date: aktResponseData.createdAt,
      },
    });

    await tozaMakonApi.delete("/billing-service/acts/" + ariza.akt_id);
  }
  console.log("Yakullandi");
}
// aktPachkasiniChange();

async function getAllFrozenAbonents() {
  const tozaMakonApi = createTozaMakonApi(1144);
  let page = 0;
  const result = [];
  for (let i = 0; i < 100; i++) {
    const rows = (
      await tozaMakonApi.get("/user-service/residents", {
        params: {
          page: page,
          size: 300,
        },
      })
    ).data.content;
    for (let row of rows) {
      if (row.isFrozen) result.push(row.accountNumber);
    }
    page++;
    console.log(page);
  }
  console.log(result, result.length);
}

getAllFrozenAbonents();
