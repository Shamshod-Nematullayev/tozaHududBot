const { NOTIFICATIONS_CHANNEL_ID } = require("../constants");
const { HybridMail } = require("../models/HybridMail");
const { Notification } = require("../models/Notification");
const { SudAkt } = require("../models/SudAkt");
const { getAbonentSaldoData, bot } = require("../requires");

const checkMails = async () => {
  try {
      const date = new Date(Date.now() - 1000 * 60 * 60 * 24 * 15); // 15 kun oldingi sana
  const mails = await HybridMail.find({
    $or: [{ sud_akt_id: "" }, { sud_akt_id: { $exists: false } }],
    warning_date_billing: { $lt: date },
  });
  let counter = 0;
  async function loop() {
    if (counter === mails.length) {
      console.log("Ogohlantirish xatlari holati tekshirib chiqildi");
      const yangiAktlar = await SudAkt.countDocuments({status: 'yangi'});
      if(yangiAktlar > 50){
        bot.telegram.sendMessage(NOTIFICATIONS_CHANNEL_ID, `Prokratura arizasini yaratish kerak bo'lgan aktlar soni <b>${yangiAktlar}</b> ga yetdi`, {parse_mode: "HTML" })
      }
      return;
    }
    const mail = mails[counter];
    const abonentData = await getAbonentSaldoData(mail.licshet);
    if (+(abonentData.saldo_k) > 200000) {
      const akt = await SudAkt.create({
        licshet: mail.licshet,
        createdAt: new Date(),
        davo_summa: parseInt(abonentData.saldo_k),
        fio: mail.receiver,
        pinfl: abonentData.pinfl,
        sud_process_id_billing: mail.sud_process_id_billing,
        warningDate: mail.warning_date_billing,
      });
      await mail.updateOne({$set: {
        sud_akt_id: akt._id.toString(),
      }})
    }
  }
  loop();
  } catch (err) {
    console.error(err);
    console.log("error occured that check mail expires")
  }
};

setInterval(() => {
  const now = new Date();
  const hour = now.getHours();
  const minut = now.getMinutes();

  if(hour == 14 && minut == 30){
    checkMails();
  }
}, 1000 * 60)