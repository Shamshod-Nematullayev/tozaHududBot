const { defineScript } = require("redis");
const { tozaMakonApi } = require("../api/tozaMakon");
const { Company, Admin } = require("../requires");
const { Notification } = require("../models/Notification");

const packNames = {
  viza: "PASSPORT VIZA",
  odam_soni: "ODAM SONI",
  dvaynik: "IKKILAMCHI KODLAR",
  pul_kuchirish: "PUL KO'CHIRISH",
  death: "O'LIM GUVOHNOMA",
  gps: "GPS XULOSA",
};
const packTypes = {
  viza: "SERVICE_NOT_PROVIDED",
  odam_soni: "INVENTORY",
  dvaynik: "CANCEL_CONTRACT",
  pul_kuchirish: "SIMPLE",
  death: "INVENTORY",
  gps: "INVENTORY",
};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function checkPackExist(pack, company) {
  console.log("GO");
  const date = new Date();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const package = company.akt_pachka_ids[pack];
  if (package.month == month && package.year == year) {
    return true;
  }
  return false;
}
async function createAktPack() {
  try {
    const companies = await Company.find({ active: true }).lean();
    let createdCount = 0;
    for (let company of companies) {
      const users = await Admin.find({
        companyId: company.id,
        roles: "billing",
      });
      try {
        for (let pack in company.akt_pachka_ids) {
          if (!checkPackExist(pack, company)) {
            const response = await tozaMakonApi.post(
              "/billing-service/act-packs",
              {
                companyId: company.id,
                createdDate: formatDate(new Date()),
                description: `added by th-dashboard`,
                isActive: true,
                isSpecialPack: false,
                name: company.akt_pachka_ids[pack].name || packNames[pack],
                packType: company.akt_pachka_ids[pack].type || packTypes[pack],
              }
            );
            const packId = response.data;
            await Company.findByIdAndUpdate(company._id, {
              $set: {
                [`akt_pachka_ids.${pack}.id`]: packId,
                [`akt_pachka_ids.${pack}.month`]: new Date().getMonth() + 1,
                [`akt_pachka_ids.${pack}.year`]: new Date().getFullYear(),
                [`akt_pachka_ids.${pack}.type`]:
                  company.akt_pachka_ids[pack].type || packTypes[pack],
              },
            });
            createdCount++;
          }
        }
        if (createdCount) {
          users.forEach(async (user) => {
            await Notification.create({
              message: "Joriy oy aktlari uchun pachkalar yaratildi",
              type: "info",
              sender: {
                id: "system",
              },
              receiver: {
                id: user._id,
              },
            });
          });
        }
      } catch (error) {
        users.forEach(async (user) => {
          await Notification.create({
            message:
              "Joriy oy uchun pachkalar yaratilmadi. Sabab: " + error.message,
            type: "alert",
            sender: {
              id: "system",
            },
            receiver: {
              id: user._id,
            },
          });
        });
      }
    }
  } catch (error) {
    console.error(error);
  }
}

module.exports = { createAktPack };
