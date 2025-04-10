const { Company } = require("../requires");
const { createAktPack } = require("./createAktPack");
const { sendKunlikPinflReports } = require("./kunlikPinflReports");
const { lastPayReportInspectors } = require("./lastPayReportInspectors");
const { nazoratchilarKunlikTushum } = require("./nazoratchilarKunlikTushum");
const { sendEtkMfyReport } = require("./sendEtkMfyReport");
const { sendMFYIncomeReport } = require("./sendMFYIncomeReport");
const { sendPinflMfyReport } = require("./sendPinflMfyReport");
const { addUpdateArizaAktTask } = require("./updateArizaAkt");
const alarm = (times, callback) => {
  if (!Array.isArray(times)) {
    times = [times]; // Agar bitta vaqt yuborilgan bo'lsa, uni arrayga o'raymiz
  }

  setInterval(() => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
    const currentDate = `${String(now.getDate()).padStart(2, "0")}.${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
    const currentYear = `${String(now.getDate()).padStart(2, "0")}.${String(
      now.getMonth() + 1
    ).padStart(2, "0")}.${now.getFullYear()}`;

    times.forEach((time) => {
      const [timePart, datePart] = time.split(" ");

      if (datePart) {
        // Sana bor (masalan, "01.02")
        if (
          datePart.length === 5 &&
          datePart === currentDate // Oyda bir marta
        ) {
          if (timePart === currentTime) {
            callback();
          }
        }
      } else {
        // Faqat vaqt (masalan, "14:00")
        if (timePart === currentTime) {
          callback();
        }
      }
    });
  }, 60 * 1000); // Har daqiqada tekshiramiz
};
alarm(["09:01"], createAktPack);

alarm(["09:00", "12:00", "17:00"], async () => {
  const companies = await Company.find();
  companies.forEach((company) => {
    sendMFYIncomeReport(company.id);
  });
});
// alarm(
//   [
//     "09:00",
//     "10:00",
//     "11:00",
//     "12:00",
//     "13:00",
//     "14:00",
//     "15:00",
//     "16:00",
//     "17:00",
//     "18:00",
//     "19:00",
//     "20:00",
//     "21:00",
//   ],
//   sendKunlikPinflReports
// );
alarm(
  [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
  ],
  sendPinflMfyReport
);
// alarm(
//   [
//     "09:00",
//     "10:00",
//     "11:00",
//     "12:00",
//     "13:00",
//     "14:00",
//     "15:00",
//     "16:00",
//     "17:00",
//     "18:00",
//     "19:00",
//     "20:00",
//     "21:00",
//   ],
//   lastPayReportInspectors
// );
alarm(
  [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ],
  sendEtkMfyReport
);
alarm(
  [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
  ],
  async () => {
    const companies = await Company.find();
    companies.forEach((company) => {
      nazoratchilarKunlikTushum(company.id);
    });
  }
);
