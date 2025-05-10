const { createTozaMakonApi } = require("../api/tozaMakon");
const { Abonent } = require("../requires");

async function findAndUpdate(data) {
  await Abonent.findOneAndUpdate(
    {
      id: data.id,
    },
    {
      $set: {
        mahallas_id: data.mahallaId,
        ksaldo: data.ksaldo,
        mahalla_name: data.mahallaName,
      },
    }
  );
}

async function updateAbonentsFromTozamakon(companyId) {
  if (!companyId) throw "companyId not found";
  const tozaMakonApi = createTozaMakonApi(companyId);

  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const { data } = await tozaMakonApi.get("/user-service/residents", {
      params: {
        page,
        size: 300,
      },
    });

    await Promise.all(data.content.map(findAndUpdate));

    if (page === 0) {
      totalPages = Math.ceil(data.totalElements / 300);
    }

    console.log(`Page ${page + 1}/${totalPages} done`);
    page++;
  }

  await LastUpdate.findOneAndUpdate(
    { key: "abonent-update-" + companyId },
    { $set: { value: new Date() } },
    { upsert: true }
  );
}

module.exports.updateAbonentsFromTozamakon = updateAbonentsFromTozamakon;
