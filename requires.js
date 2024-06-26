// node modules
const fs = require("fs");
const path = require("path");
const xlsx = require("json-as-xlsx");
const htmlPDF = require("html-pdf");

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

module.exports = {
  // node modules
  fs,
  path,
  xlsx,
  htmlPDF,
  // required functions
  drawAndSendTushum,
  fetchEcopayTushum,
  fetchEcoTranzaksiyalar,
  drawDebitViloyat,
  yashovchiSoniKopaytirish,
  find_address_by_pinfil_from_mvd,
  getAbonentCardHtml,
  getAbonentSaldoData,
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
};
