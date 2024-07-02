// node modules
const fs = require("fs");
const https = require("https");
const path = require("path");
const xlsx = require("json-as-xlsx");
const htmlPDF = require("html-pdf");
const ejs = require("ejs");

// required functions
const { drawAndSendTushum } = require("./middlewares/drawTushum");
const {
  fetchEcopayTushum,
  fetchEcoTranzaksiyalar,
} = require("./middlewares/fetchEcopay");
const { find_address_by_pinfil_from_mvd } = require("./api/mvd-pinfil");
const {
  getAbonentCardHtml,
  getAbonentSaldoData,
  getAbonentDXJ,
} = require("./api/cleancity/dxsh");
const {
  drawDebitViloyat,
} = require("./middlewares/scene/adminActions/cleancity/viloyat/toSendDebitorReport");
const {
  yashovchiSoniKopaytirish,
} = require("./middlewares/scene/adminActions/cleancity/dxsh/yashovchiSoniKopaytirish");
const {
  changeAbonentDates,
} = require("./middlewares/scene/adminActions/cleancity/dxsh/abonentMalumotlariniOzgartirish");

// telegraf resources
const { Composer } = require("telegraf");
const { bot } = require("./core/bot");
const { keyboards } = require("./lib/keyboards");
const { messages } = require("./lib/messages");

// mongo models
const { Admin } = require("./models/Admin");
const { CleanCitySession } = require("./models/CleanCitySession");
const { Counter } = require("./models/Counter");
const { Guvohnoma } = require("./models/Guvohnoma");
const { Abonent } = require("./models/Abonent");
const { Bildirishnoma } = require("./models/SudBildirishnoma");
const { MultiplyRequest } = require("./models/MultiplyRequest");
const { CustomDataRequest } = require("./models/CustomDataRequest");
const { Nazoratchi } = require("./models/Nazoratchi");

module.exports = {
  // node modules
  fs,
  https,
  path,
  xlsx,
  htmlPDF,
  ejs,
  // required functions
  drawAndSendTushum,
  fetchEcopayTushum,
  fetchEcoTranzaksiyalar,
  drawDebitViloyat,
  yashovchiSoniKopaytirish,
  find_address_by_pinfil_from_mvd,
  getAbonentCardHtml,
  getAbonentSaldoData,
  changeAbonentDates,
  // telegraf resourses
  Composer,
  bot,
  keyboards,
  messages,
  // mongo models
  Admin,
  CleanCitySession,
  Counter,
  Guvohnoma,
  Abonent,
  Bildirishnoma,
  MultiplyRequest,
  CustomDataRequest,
  Nazoratchi,
};
