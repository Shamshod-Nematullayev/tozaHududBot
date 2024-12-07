const { tozaMakonApi } = require("./api/tozaMakon");
const { lotinga } = require("./middlewares/smallFunctions/lotinKiril");
const { EtkKodRequest } = require("./models/EtkKodRequest");
const { Mahalla } = require("./models/Mahalla");
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
// {
//   accountNumber: data.accountNumber,
//   residentType: data.residentType,
//   electricityAccountNumber: null,
//   electricityCoato: null,
//   companyId: 1144,
//   streetId: data.streetId,
//   mahallaId: data.mahallaId,
//   contractNumber: null,
//   contractDate: null,
//   isCreditor: "false",
//   nSaldo: 0,
//   homePhone: null,
//   active: true,
//   description: null,
//   citizen: {
//     firstName: lotinga(data.firstName),
//     lastName: lotinga(data.lastName),
//     foreignCitizen: false,
//     patronymic: data.patronymic ? lotinga(data.patronymic) : "",
//     inn: null,
//     pnfl: data.pnfl,
//     passport: data.passport,
//     birthDate: data.birthDate,
//     passportGivenDate: data.passportGivenDate,
//     passportIssuer: data.passportIssuer,
//     passportExpireDate: data.passportExpireDate,
//     phone: null,
//     email: null,
//     photo: null,
//   },
//   house: {
//     cadastralNumber: data.cadastralNumber,
//     temporaryCadastralNumber: null,
//     type: "HOUSE",
//     flatNumber: null,
//     homeNumber: 0,
//     homeIndex: null,
//     inhabitantCnt: data.inhabitantCnt + "",
//   },
// }

async () => {
  const datas = require("./main.json");
  for (let data of datas) {
    let newAbonent = await tozaMakonApi.post("/user-service/residents", {
      accountNumber: data.accountNumber,
      residentType: "INDIVIDUAL",
      electricityAccountNumber: null,
      electricityCoato: null,
      companyId: 1144,
      streetId: data.streetId,
      mahallaId: data.mahallaId,
      contractNumber: null,
      contractDate: null,
      isCreditor: "false",
      nSaldo: 0,
      homePhone: null,
      active: true,
      description: null,
      citizen: {
        firstName: data.firstName,
        lastName: data.lastName,
        foreignCitizen: false,
        patronymic: data.patronymic,
        inn: null,
        pnfl: "12345678912345",
        passport: "AA1234567",
        birthDate: "1976-04-30",
        passportGivenDate: "2013-11-08",
        passportIssuer: "SAMARQAND VILOYATI KATTAQO‘RG‘ON TUMANI IIB",
        passportExpireDate: "2023-11-07",
        phone: null,
        email: null,
        photo: null,
      },
      house: {
        cadastralNumber: "00:00:00:00:00:0000",
        temporaryCadastralNumber: null,
        type: "HOUSE",
        flatNumber: null,
        homeNumber: "0",
        homeIndex: null,
        inhabitantCnt: data.inhabitantCnt,
      },
    });
    if (newAbonent.status !== 201) {
      throw new Error("Abonent qo'shishda xatolik yuz berdi");
    }
    newAbonent = newAbonent.data;
    const abonent = await Abonent.create({
      createdAt: new Date(),
      fio: data.lastName + " " + data.firstName + " " + data.patronymic,
      licshet: data.accountNumber,
      mahallas_id: data.mahallaId,
      prescribed_cnt: data.inhabitantCnt,
      id: newAbonent,
      kadastr_number: data.cadastralNumber,
      pinfl: data.pnfl,
      mahalla_name: (await Mahalla.findOne({ id: data.mahallaId })).name,
      passport_number: data.passport,
      streets_id: data.streetId,
      shaxsi_tasdiqlandi: {
        confirm: false,
        comment: "Mahalla bergan ro'yxat asosida",
      },
    });
    console.log(abonent);
  }
}; //();

(async () => {
  const datas = require("./main.json");
  let counter = 0;
  async function loop() {
    if (counter == datas.length) return console.log("Jarayon yakunlandi");
    const data = await Abonent.findOne({
      licshet: datas[counter].accountNumber,
    });
    const abonentData = (
      await tozaMakonApi.get("/user-service/residents/" + data.id)
    ).data;
    const citizen = abonentData.citizen;
    citizen.firstName = datas[counter].firstName;
    citizen.lastName = datas[counter].lastName;
    citizen.patronymic = datas[counter].patronymic;
    await tozaMakonApi.put("/user-service/residents/" + data.id, {
      accountNumber: data.licshet,
      active: true,
      citizen,
      companyId: 1144,
      contractDate: null,
      contractNumber: null,
      description: null,
      electricityAccountNumber: null,
      electricityCoato: null,
      homePhone: null,
      house: abonentData.house,
      id: data.id,
      mahallaId: data.mahallas_id,
      streetId: data.streets_id,
    });
  }
  loop();
  console.log(datas.length);
})();
