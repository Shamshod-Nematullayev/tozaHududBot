const { HybridMail } = require("../models/HybridMail");
const { SudAkt } = require("../models/SudAkt");
const { getAbonentSaldoData } = require("../requires");

const checkMail = async () => {
  const date = new Date(Date.now() - 1000 * 60 * 60 * 24 * 15); // 15 kun oldingi sana
  const mails = await HybridMail.find({
    $or: [{ sud_akt_id: "" }, { sud_akt_id: { $exists: false } }],
    warning_date_billing: { $lt: date },
  });
  let counter = 0;
  async function loop() {
    if (counter === mails.length) {
      console.log("jarayon yakunlandi");
      // Bu yerda hali yangi holatda turgan arizalar bo'lsa adminga xabar yuboriladigan funksiya chaqiriladi
      return;
    }
    const mail = mails[counter];
    const abonentData = await getAbonentSaldoData(mail.licshet);
    if (parseInt(abonentData.saldo_k) > 200000) {
      await SudAkt.create({
        licshet: mail.licshet,
        createdAt: new Date(),
        davo_summa: parseInt(abonentData.saldo_k),
        fio: mail.receiver,
        pinfl: abonentData.pinfl,
        sud_process_id_billing: mail.sud_process_id_billing,
        warningDate: mail.warning_date_billing,
      });
    }
  }
  loop();
};
