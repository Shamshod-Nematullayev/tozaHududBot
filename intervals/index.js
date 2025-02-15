const { fetchEcoTranzaksiyalar } = require("../requires");
const { sendKunlikPinflReports } = require("./kunlikPinflReports");
const { sendEtkMfyReport } = require("./sendEtkMfyReport");
const { sendMFYIncomeReport } = require("./sendMFYIncomeReport");
const { sendPinflMfyReport } = require("./sendPinflMfyReport");
const { addUpdateArizaAktTask } = require("./updateArizaAkt");

const timer = (times, callback) => {
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
        // Sana bor (masalan, "01.02" yoki "01.02.2025")
        if (
          (datePart.length === 5 && datePart === currentDate) || // Oyda bir marta
          (datePart.length === 10 && datePart === currentYear) // Yilda bir marta
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

timer(["09:00", "12:00", "17:00"], sendMFYIncomeReport);
timer(
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
  sendKunlikPinflReports
);
timer(
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
  sendPinflMfyReport
);
timer(
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
  fetchEcoTranzaksiyalar
);
timer(
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

timer("15:31", addUpdateArizaAktTask);
// require("./yuqoriQarzdorliklar");
// require("./cleanCitySessionSaver");
// require("./updateArizalarStatus");
// require("./kunlikEtkReports");
// require("./nazoratchilarKunlikTushum");
// require("./checkMailExpires");
