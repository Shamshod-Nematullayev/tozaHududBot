const {
  getAktsFromPacket,
} = require("../api/cleancity/dxsh/getAktsFromPacket");
const { Ariza } = require("../models/Ariza");

setInterval(async () => {
  const now = new Date();
  function isThisTime(minut) {
    const currentHour = now.getHours();
    const currentMinut = now.getMinutes();
    return currentMinut == minut;
  }
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (isThisTime(15) || isThisTime(45)) {
    const arizalar = await Ariza.find({
      status: "tasdiqlangan",
      akt_date: {
        $gte: startOfMonth,
        $lt: now,
      },
      is_canceled: false,
    });
    const pachka_ids = [];
    arizalar.forEach((ariza) => {
      pachka_ids.includes(ariza.akt_pachka_id)
        ? null
        : pachka_ids.push(ariza.akt_pachka_id);
    });
    let counter = 0;
    const loop = async () => {
      if (counter == pachka_ids.length) return;
      const arizalarBillingdagi = await getAktsFromPacket();
    };
    loop();
  }
}, 1000 * 60);
