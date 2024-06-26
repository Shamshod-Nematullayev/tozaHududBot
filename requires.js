// requires.js
const { Composer } = require("telegraf");
const { bot } = require("./core/bot");
const { keyboards } = require("./lib/keyboards");
const { messages } = require("./lib/messages");
const { Admin } = require("./models/Admin");
const { drawAndSendTushum } = require("./middlewares/drawTushum");
const {
  fetchEcopayTushum,
  fetchEcoTranzaksiyalar,
} = require("./middlewares/fetchEcopay");
const { CleanCitySession } = require("./models/CleanCitySession");
const {
  drawDebitViloyat,
} = require("./middlewares/scene/adminActions/cleancity/viloyat/toSendDebitorReport");
const {
  yashovchiSoniKopaytirish,
} = require("./middlewares/scene/adminActions/cleancity/dxsh/yashovchiSoniKopaytirish");
const { Counter } = require("./models/Counter");
const { Guvohnoma } = require("./models/Guvohnoma");
const { MultiplyRequest } = require("./models/MultiplyRequest");
const { find_address_by_pinfil_from_mvd } = require("./api/mvd-pinfil");
const { Abonent } = require("./models/Abonent");
const fs = require("fs");
const path = require("path");
const xlsx = require("json-as-xlsx");
const { Bildirishnoma } = require("./models/SudBildirishnoma");
const {
  getAbonentCardHtml,
} = require("./api/cleancity/dxsh/getAbonentCardHTML");
const htmlPDF = require("html-pdf");
const { getAbonentDXJ } = require("./api/cleancity/dxsh/getAbonentDXJ");
const {
  getAbonentSaldoData,
} = require("./api/cleancity/dxsh/getAbonentSaldoData");

module.exports = {
  Composer,
  bot,
  keyboards,
  messages,
  drawAndSendTushum,
  fetchEcopayTushum,
  fetchEcoTranzaksiyalar,
  drawDebitViloyat,
  yashovchiSoniKopaytirish,
  find_address_by_pinfil_from_mvd,
  fs,
  path,
  xlsx,
  getAbonentCardHtml,
  htmlPDF,
  getAbonentDXJ,
  getAbonentSaldoData,
  Admin,
  CleanCitySession,
  Counter,
  Guvohnoma,
  MultiplyRequest,
  Abonent,
  Bildirishnoma,
};
