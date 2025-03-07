const { Company } = require("../requires");

async function checkPackExist() {}
async function createAktPack() {
  try {
    const companies = await Company.find({ active: true });
    for (let company of companies) {
      for (let pack in company.akt_pachka_ids) {
        console.log(pack);
      }
    }
  } catch (error) {
    console.error(error);
  }
}

module.exports = { createAktPack };
