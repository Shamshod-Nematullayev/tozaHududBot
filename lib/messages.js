const { kirillga } = require("../middlewares/smallFunctions/lotinKiril");
const messages = {
  lotin: {
    startGreeting: `Assalomu alaykum 👋 Yangi abonent ochish botiga hush kelibsiz. Bu yerda abonent pasport ma'lumotlarini qoldirishingiz mumkin. Texnik jamoamiz uni tez orada o'rganib chiqib sizga javobini yetkazadi`,
    haveNotUsername:
      "Kechirasiz! Botimizdan foydalanish uchun sizda telegram username bo'lishi shart. Username qanday olishni bilmasangiz @oliy_ong_leader ga murojaat qilishingiz mumkin",
    enterFISH: "Abonentning Familiya Ism Sharifini kiriting! Kirill harflarida",
    enterYashovchiSoni: "Yashovchi sonini raqamda kiriting!",
    enterMahalla: "Abonent istiqomat qiluvchi ** MAHALLA ** ni kiriting!",
    enterKocha: "Ko'cha yoki  qishloqni kiriting",
    enterPasport1: "Pasport seriyasi va raqamini kiriting! Masalan: AB1234567",
    enterPasport2: "Pasport pinfil raqamini kiriting!",
    enterReallyPinfl:
      "Pinfl noto'g'ri kiritildi. 14 xonali son kiritishingiz kerak. Tushunmasangiz @oliy_ong_leader ga murojaat qiling",
    accepted: "Qabul qilindi! Tez orada sizga javobini yetkazamiz",
    notFoundData: "Ma'lumot topilmadi",
    enterYourLogin: "Login kiriting",
    enterYourPassword: "Parolni kiriting",
    adminDone:
      "Siz adminga aylandingiz. Vazifangizni vijdonan ado etishingizni so'rab qolgan bo'lardim",
    youAreNotAdmin: "Siz bunday huquqga ega emassiz!!",
    sended: "Yuborildi",
    enterAbonentKod: "Abonent raqamini kiriting",
    kodOchilmadi: "Kod ochilmadi",
    noAbonent: "Siz hali tizimga abonent kiritmagansiz",
    izlashUsuliTanlash: "Izlash turini tanlang!",
    enterLitsavoy: "Litsavoy kodni kiriting",
    enterOnlyNumber: "Faqat son kiriting!",
    enterFullNamber: "Litsavoy kod 12 ta raqamdan iborat bo'lishi kerak",
    ogohlantirishKiriting:
      "Nima uchun ushbu so'rov bekor qilinyapti? Ogohlantirish bo'lsa marhamat",
    errorOccured: "Xatolik kuzatildi",
    enterPicture: "Guvohnomani rasm ko'rinishida yuboring",
    chooseEditType: "Tahrirlash turini tanlang",
    enterComment: "Ushbu haqida izoh qoldiring !!!!",
    biggierMaxLength:
      "Izohdagi belgilar soni 300 ta dan oshib ketdi qisqaroq izoh kiriting!!",
    chooseMenu: "O'zingizga kerakli bo'limni tanlang!",
    chooseLanguage: "O'zingizga qulay alifboni tanlang",
    choosedLang: "Til tanlandi",
    heyAdmin: "Hush kelibsiz hukmdor. Nima vazifani bazarish kerak",
    chooseIncomeType: "Hisobot turini tanlang!",
    notExcelFile: "Bu excel fayl emas",
    enterExcelFile:
      "Hisobot faylini yuboring! Excelda billing tizimidan chiqgan faylni o'zgartirmasdan yuboring",
  },
  kiril: {},
};

for (let i in messages.lotin) {
  messages.kiril[i] = kirillga(messages.lotin[i]);
}
module.exports = { messages };
